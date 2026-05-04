import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useCompteStatistiques } from "../../../domain/compte/useCompteStatistiques";
import { secureSetItem } from "../../../shared/utils/secureStorage";

// Pays en dur — liste UEMOA + pays courants
const PAYS_DATA = [
  { code: "CI", label: "Cote d'Ivoire" },
  { code: "BF", label: "Burkina Faso" },
  { code: "ML", label: "Mali" },
  { code: "SN", label: "Senegal" },
  { code: "BJ", label: "Benin" },
  { code: "TG", label: "Togo" },
  { code: "GN", label: "Guinee" },
  { code: "NE", label: "Niger" },
  { code: "CM", label: "Cameroun" },
  { code: "GA", label: "Gabon" },
  { code: "FR", label: "France" },
  { code: "BE", label: "Belgique" },
  { code: "CA", label: "Canada" },
];

const WalletMobileSubscribeScreen: React.FC = () => {
  const { colors } = useTheme();
  const { data: compteStats, fetchData, isLoading: loadingComptes } = useCompteStatistiques();

  const [submitting, setSubmitting] = useState(false);
  const [modalPays, setModalPays] = useState(false);
  const [modalCompte, setModalCompte] = useState(false);

  const [form, setForm] = useState<{
    compte?: string;
    compteLabel?: string;
    pays: string;
    paysLabel: string;
    telephone: string;
    email: string;
    localisation: string;
  }>({
    pays: "CI",
    paysLabel: "Cote d'Ivoire",
    telephone: "",
    email: "",
    localisation: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger les comptes reels au montage
  useEffect(() => {
    fetchData();
  }, []);

  // Pre-remplir le premier compte quand les donnees arrivent
  useEffect(() => {
    const comptes = compteStats?.COMPTES || [];
    if (comptes.length > 0 && !form.compte) {
      const first = comptes[0];
      const num = String(first.NUMEROCOMPTE || first.CO_CODECOMPTE || "");
      setForm(f => ({ ...f, compte: num, compteLabel: num }));
    }
  }, [compteStats]);

  const comptes = (compteStats?.COMPTES || []).map(c => ({
    code: String(c.NUMEROCOMPTE || c.CO_CODECOMPTE || ""),
    label: String(c.NUMEROCOMPTE || c.CO_CODECOMPTE || ""),
    solde: Number(c.SOLDE || 0),
    type: String(c.CO_INTITULECOMPTE || c.PD_LIBELLE || "Compte"),
  }));

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

  function validate() {
    const next: Record<string, string> = {};
    const tel = form.telephone.trim();
    const mail = form.email.trim();
    const loc = form.localisation.trim();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.compte) next.compte = "Le compte est obligatoire.";
    if (!tel) next.telephone = "Le telephone est obligatoire.";
    else if (!/^\d{8,15}$/.test(tel)) next.telephone = "Numero de telephone invalide (8 a 15 chiffres).";
    if (!mail) next.email = "L'email est obligatoire.";
    else if (!emailRe.test(mail)) next.email = "Adresse email invalide.";
    if (!loc) next.localisation = "La localisation est obligatoire.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Simulation d'un traitement (pas d'appel API)
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Sauvegarder localement
      await secureSetItem("wallet_subscribed_phone", form.telephone);
      await secureSetItem("wallet_subscribed_compte", form.compte || "");

      Alert.alert(
        "Demande enregistree",
        "Votre demande de souscription au Mobile Banking a ete enregistree avec succes. Votre agence vous contactera pour finaliser l'activation.",
        [{
          text: "OK",
          onPress: () => {
            setForm({
              pays: "CI",
              paysLabel: "Cote d'Ivoire",
              telephone: "",
              email: "",
              localisation: "",
            });
            setErrors({});
          },
        }]
      );
    } catch {
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez reessayer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.header, { color: colors.text }]}>Souscription</Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Compte mobile</Text>

        {/* Compte */}
        <Text style={[styles.label, { color: colors.text }]}>Compte</Text>
        {loadingComptes ? (
          <View style={[styles.select, { borderColor: colors.border, backgroundColor: colors.background, justifyContent: "center" }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <Pressable
            style={[styles.select, { borderColor: errors.compte ? "#ff6b6b" : colors.border, backgroundColor: colors.background }]}
            onPress={() => setModalCompte(true)}
          >
            <Text style={[styles.selectText, { color: form.compte ? colors.text : colors.text + "50" }]}>
              {form.compte || "Selectionner un compte (obligatoire)"}
            </Text>
          </Pressable>
        )}
        {errors.compte ? <Text style={styles.error}>{errors.compte}</Text> : null}

        {/* Pays */}
        <Text style={[styles.label, { color: colors.text }]}>Pays</Text>
        <Pressable
          style={[styles.select, { borderColor: colors.border, backgroundColor: colors.background }]}
          onPress={() => setModalPays(true)}
        >
          <Text style={[styles.selectText, { color: colors.text }]}>{form.paysLabel}</Text>
        </Pressable>

        {/* Telephone */}
        <Text style={[styles.label, { color: colors.text }]}>Telephone</Text>
        <TextInput
          style={[styles.input, {
            borderColor: errors.telephone ? "#ff6b6b" : colors.border,
            backgroundColor: colors.background,
            color: colors.text,
          }]}
          keyboardType="phone-pad"
          placeholder="Ex : 0102030405 (obligatoire)"
          placeholderTextColor={colors.text + "50"}
          value={form.telephone}
          onChangeText={t => setForm(f => ({ ...f, telephone: t.replace(/\D/g, "") }))}
        />
        {errors.telephone ? <Text style={styles.error}>{errors.telephone}</Text> : null}

        {/* Email */}
        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
        <TextInput
          style={[styles.input, {
            borderColor: errors.email ? "#ff6b6b" : colors.border,
            backgroundColor: colors.background,
            color: colors.text,
          }]}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Votre adresse email (obligatoire)"
          placeholderTextColor={colors.text + "50"}
          value={form.email}
          onChangeText={t => setForm(f => ({ ...f, email: t }))}
        />
        {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

        {/* Localisation */}
        <Text style={[styles.label, { color: colors.text }]}>Localisation</Text>
        <TextInput
          style={[styles.input, {
            borderColor: errors.localisation ? "#ff6b6b" : colors.border,
            backgroundColor: colors.background,
            color: colors.text,
          }]}
          placeholder="Votre adresse / localisation (obligatoire)"
          placeholderTextColor={colors.text + "50"}
          value={form.localisation}
          onChangeText={t => setForm(f => ({ ...f, localisation: t }))}
        />
        {errors.localisation ? <Text style={styles.error}>{errors.localisation}</Text> : null}

        {/* Bouton */}
        <Pressable
          style={[styles.button, { backgroundColor: colors.primary }, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.buttonText}>VALIDER</Text>
          }
        </Pressable>
      </View>

      {/* Modal Pays */}
      <Modal visible={modalPays} transparent animationType="slide" onRequestClose={() => setModalPays(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Selectionner un pays</Text>
            <FlatList
              data={PAYS_DATA}
              keyExtractor={i => i.code}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.sheetItem, { borderBottomColor: colors.border },
                    item.code === form.pays && { backgroundColor: colors.primary + "12" }]}
                  onPress={() => {
                    setForm(f => ({ ...f, pays: item.code, paysLabel: item.label }));
                    setModalPays(false);
                  }}
                >
                  <Text style={[styles.sheetItemText, { color: item.code === form.pays ? colors.primary : colors.text }]}>
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
            <Pressable style={[styles.closeBtn, { backgroundColor: colors.border }]} onPress={() => setModalPays(false)}>
              <Text style={[styles.closeBtnText, { color: colors.text }]}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal Compte */}
      <Modal visible={modalCompte} transparent animationType="slide" onRequestClose={() => setModalCompte(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Selectionner un compte</Text>
            {comptes.length === 0 ? (
              <View style={{ padding: 24, alignItems: "center" }}>
                <Text style={[styles.sheetItemText, { color: colors.text + "60" }]}>
                  Aucun compte disponible
                </Text>
              </View>
            ) : (
              <FlatList
                data={comptes}
                keyExtractor={i => i.code}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.sheetItem, { borderBottomColor: colors.border },
                      item.code === form.compte && { backgroundColor: colors.primary + "12" }]}
                    onPress={() => {
                      setForm(f => ({ ...f, compte: item.code, compteLabel: item.label }));
                      setModalCompte(false);
                    }}
                  >
                    <Text style={[styles.sheetItemText, { color: item.code === form.compte ? colors.primary : colors.text }]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.sheetItemSub, { color: colors.text + "60" }]}>
                      {item.type} — {fmt(item.solde)} XOF
                    </Text>
                  </Pressable>
                )}
              />
            )}
            <Pressable style={[styles.closeBtn, { backgroundColor: colors.border }]} onPress={() => setModalCompte(false)}>
              <Text style={[styles.closeBtnText, { color: colors.text }]}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  header: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  card: { borderRadius: 16, padding: 16, marginBottom: 24 },
  cardTitle: { fontSize: 17, fontWeight: "700", marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "600", marginTop: 12, marginBottom: 6 },
  select: {
    borderWidth: 1.5, borderRadius: 10, padding: 12, minHeight: 44,
    justifyContent: "center",
  },
  selectText: { fontSize: 14 },
  input: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 12, height: 44, fontSize: 14,
  },
  error: { color: "#ff6b6b", fontSize: 12, marginTop: 4 },
  button: {
    borderRadius: 12, paddingVertical: 14, marginTop: 20,
    alignItems: "center", justifyContent: "center", minHeight: 50,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 1 },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "70%" },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetTitle: { fontSize: 17, fontWeight: "700", marginBottom: 12 },
  sheetItem: {
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  sheetItemText: { fontSize: 15, fontWeight: "500" },
  sheetItemSub: { fontSize: 12, marginTop: 3 },
  closeBtn: { marginTop: 12, padding: 12, borderRadius: 10, alignItems: "center" },
  closeBtnText: { fontSize: 14, fontWeight: "600" },
});

export default WalletMobileSubscribeScreen;
