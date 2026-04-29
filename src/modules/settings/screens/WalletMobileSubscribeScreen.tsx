import React, { useState } from "react";
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
} from "react-native";
import { useTheme } from "../../../shared/styles/ThemeProvider";

// Données en dur
const PAYS_DATA = [
  { PY_CODEPAYS: "0001", PY_LIBELLE: "CÔTE D'IVOIRE" },
  { PY_CODEPAYS: "0002", PY_LIBELLE: "BURKINA FASO" },
  { PY_CODEPAYS: "0003", PY_LIBELLE: "MALI" },
  { PY_CODEPAYS: "0004", PY_LIBELLE: "SÉNÉGAL" },
  { PY_CODEPAYS: "0005", PY_LIBELLE: "BÉNIN" },
  { PY_CODEPAYS: "0006", PY_LIBELLE: "TOGO" },
];

const COMPTES_DATA = [
  { CO_CODECOMPTE: "001", NUMEROCOMPTE: "1000COC00007919001", SOLDE: "2 212 500 FCFA" },
  { CO_CODECOMPTE: "002", NUMEROCOMPTE: "1000COC00007919002", SOLDE: "500 000 FCFA" },
  { CO_CODECOMPTE: "003", NUMEROCOMPTE: "1000COC00007919003", SOLDE: "1 000 000 FCFA" },
];

const WalletMobileSubscribeScreen: React.FC = () => {
  const { colors } = useTheme();
  const [title] = useState("Souscription");

  // États
  const [submitting, setSubmitting] = useState(false);
  const [modalPays, setModalPays] = useState(false);
  const [modalCompte, setModalCompte] = useState(false);
  
  const [form, setForm] = useState<{
    cmb_compte?: string;
    cmb_pays?: string;
    chp_telephone?: string;
    chp_email?: string;
    chp_localisation?: string;
  }>({ cmb_pays: "0001" });
  
  const [errors, setErrors] = useState<{
    email?: string;
    telephone?: string;
    compte?: string;
    pays?: string;
    localisation?: string;
  }>({});

  const accent = colors.primary;

  // Trouver le pays sélectionné
  const selectedCountry = PAYS_DATA.find((p) => p.PY_CODEPAYS === form.cmb_pays);
  const selectedCountryLabel = selectedCountry?.PY_LIBELLE || "CÔTE D'IVOIRE";

  // Trouver le compte sélectionné
  const selectedCompte = COMPTES_DATA.find((c) => c.CO_CODECOMPTE === form.cmb_compte);
  const selectedCompteLabel = selectedCompte 
    ? `${selectedCompte.NUMEROCOMPTE} • ${selectedCompte.SOLDE}` 
    : "Compte (obligatoire)";

  // Validation
  function validate() {
    const next: any = {};
    const tel = String(form.chp_telephone || "").trim();
    const mail = String(form.chp_email || "").trim();
    const loc = String(form.chp_localisation || "").trim();
    const compte = String(form.cmb_compte || "").trim();
    const pays = String(form.cmb_pays || "").trim();
    const emailRegex =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    
    if (!compte) next.compte = "Le compte est obligatoire.";
    if (!pays) next.pays = "Le pays est obligatoire.";
    if (!tel || tel.length < 10 || tel.length > 15 || !/^[\d]{6,15}$/.test(tel))
      next.telephone = "Veuillez renseigner un numéro de téléphone correct.";
    if (tel && tel.length < 10)
      next.telephone = "La taille minimum valable de saisie est 10.";
    if (!loc) next.localisation = "La localisation est obligatoire.";
    if (!mail) next.email = "Le champ Email est obligatoire.";
    if (mail && !emailRegex.test(mail))
      next.email = "Veuillez renseigner un email correct.";
    
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // Soumission
  async function handleSubmit() {
    if (!validate()) return;
    
    try {
      setSubmitting(true);
      
      // Simuler un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Sauvegarder le numéro de téléphone souscrit
      try {
        const { secureSetItem } = await import("../../../shared/utils/secureStorage");
        await secureSetItem("wallet_subscribed_phone", form.chp_telephone || "");
      } catch (e) {
        console.error("Error saving subscribed phone:", e);
      }
      
      // Afficher un message de succès
      Alert.alert(
        "Demande enregistrée", 
        "Votre demande de souscription au Mobile Banking a été enregistrée. Vous serez contacté par votre agence pour finaliser l'activation.",
        [
          {
            text: "OK",
            onPress: () => {
              // Réinitialiser le formulaire
              setForm({ cmb_pays: "0001" });
              setErrors({});
            }
          }
        ]
      );
    } catch (e: any) {
      Alert.alert("Erreur", "Une erreur est survenue lors de l'enregistrement de votre demande.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Compte mobile
        </Text>
        
        <Text style={[styles.label, { color: colors.text }]}>Compte</Text>
        <Pressable
          style={[
            styles.select,
            {
              borderColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
          onPress={() => setModalCompte(true)}
        >
          <Text style={[styles.placeholder, form.cmb_compte && { color: colors.text }]}>
            {selectedCompteLabel}
          </Text>
        </Pressable>
        {errors.compte ? (
          <Text style={styles.error}>{errors.compte}</Text>
        ) : null}

        <Text style={[styles.label, { color: colors.text }]}>Pays</Text>
        <Pressable
          style={[
            styles.select,
            {
              borderColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
          onPress={() => setModalPays(true)}
        >
          <Text style={[styles.placeholder, { color: colors.text }]}>
            {selectedCountryLabel}
          </Text>
        </Pressable>
        {errors.pays ? <Text style={styles.error}>{errors.pays}</Text> : null}

        <Text style={[styles.label, { color: colors.text }]}>Téléphone</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.background,
              color: colors.text,
            },
          ]}
          keyboardType="number-pad"
          placeholder="Téléphone • Ex.: 0123456789 (obligatoire)"
          placeholderTextColor={colors.text + "60"}
          value={form.chp_telephone || ""}
          onChangeText={(t) => setForm({ ...form, chp_telephone: t })}
        />
        {errors.telephone ? (
          <Text style={styles.error}>{errors.telephone}</Text>
        ) : null}

        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.background,
              color: colors.text,
            },
          ]}
          keyboardType="email-address"
          placeholder="Votre adresse email (obligatoire)"
          placeholderTextColor={colors.text + "60"}
          value={form.chp_email || ""}
          onChangeText={(t) => setForm({ ...form, chp_email: t })}
        />
        {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

        <Text style={[styles.label, { color: colors.text }]}>Localisation</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.background,
              color: colors.text,
            },
          ]}
          placeholder="Localisation (obligatoire)"
          placeholderTextColor={colors.text + "60"}
          value={form.chp_localisation || ""}
          onChangeText={(t) => setForm({ ...form, chp_localisation: t })}
        />
        {errors.localisation ? (
          <Text style={styles.error}>{errors.localisation}</Text>
        ) : null}

        <Pressable
          style={[
            styles.button,
            { backgroundColor: accent },
            submitting && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>
            {submitting ? "TRAITEMENT..." : "VALIDER"}
          </Text>
        </Pressable>
      </View>

      {/* Modal Pays */}
      <Modal visible={modalPays} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Sélectionner un pays
            </Text>
            <FlatList
              data={PAYS_DATA}
              keyExtractor={(item) => item.PY_CODEPAYS}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.modalItem,
                    { 
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => {
                    setForm({ ...form, cmb_pays: item.PY_CODEPAYS });
                    setModalPays(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }]}>
                    {item.PY_LIBELLE}
                  </Text>
                </Pressable>
              )}
            />
            <Pressable
              style={[styles.closeButton, { backgroundColor: colors.border }]}
              onPress={() => setModalPays(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>
                Fermer
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal Compte */}
      <Modal visible={modalCompte} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Sélectionner un compte
            </Text>
            <FlatList
              data={COMPTES_DATA}
              keyExtractor={(item) => item.CO_CODECOMPTE}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.modalItem,
                    { 
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => {
                    setForm({ ...form, cmb_compte: item.CO_CODECOMPTE });
                    setModalCompte(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }]}>
                    {item.NUMEROCOMPTE}
                  </Text>
                  <Text style={[styles.modalItemSubtext, { color: colors.text + "80" }]}>
                    Solde: {item.SOLDE}
                  </Text>
                </Pressable>
              )}
            />
            <Pressable
              style={[styles.closeButton, { backgroundColor: colors.border }]}
              onPress={() => setModalCompte(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>
                Fermer
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  header: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  card: { borderRadius: 12, padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  label: { fontSize: 12, marginTop: 10, marginBottom: 6 },
  select: { borderWidth: 1, borderRadius: 10, padding: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 6,
  },
  placeholder: { color: "#9AA0A6" },
  error: { color: "#ff6b6b", fontSize: 12, marginTop: 4 },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 16,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", letterSpacing: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  modalItem: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalItemSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  closeButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default WalletMobileSubscribeScreen;
