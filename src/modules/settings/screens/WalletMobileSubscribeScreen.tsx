import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
  ScrollView,
} from "react-native";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useWalletSubscribe } from "../../../domain/wallet/useWalletSubscribe";

const WalletMobileSubscribeScreen: React.FC = () => {
  const { colors } = useTheme();
  const [title] = useState("Souscription");

  const {
    loading,
    submitting,
    comboPays,
    comboComptes,
    form,
    errors,
    modalPays,
    modalCompte,
    setForm,
    setModalPays,
    setModalCompte,
    loadCountries,
    loadAccounts,
    testAndSubmit,
  } = useWalletSubscribe();

  const accent = colors.primary;

  const selectedCountryLabel = useMemo(() => {
    const c = comboPays.find((p) => p.PY_CODEPAYS === form.cmb_pays);
    return (
      c?.PY_LIBELLE || (form.cmb_pays ? String(form.cmb_pays) : "CÔTE D'IVOIRE")
    );
  }, [comboPays, form.cmb_pays]);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]}>
      {loading && <ActivityIndicator color={accent} />}
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
          onPress={async () => {
            if (!comboComptes || comboComptes.length === 0) {
              await loadAccounts();
            }
            setModalCompte(true);
          }}
        >
          <Text style={styles.placeholder}>
            {form.cmb_compte ? "Compte sélectionné" : "Compte (obligatoire)"}
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
          onPress={async () => {
            if (!comboPays || comboPays.length === 0) {
              await loadCountries();
            }
            setModalPays(true);
          }}
        >
          <Text style={styles.placeholder}>{selectedCountryLabel}</Text>
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
          placeholder="Téléphone • Ex.: 01XXXXXXXXX (obligatoire)"
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
          onPress={testAndSubmit}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>VALIDER</Text>
        </Pressable>
      </View>

      <Modal visible={modalPays} transparent animationType="slide">
        <View style={styles.modal}>
          <FlatList
            data={comboPays}
            keyExtractor={(item) => item.PY_CODEPAYS}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setForm({ ...form, cmb_pays: item.PY_CODEPAYS });
                  setModalPays(false);
                }}
              >
                <Text style={styles.modalItem}>{item.PY_LIBELLE}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
      <Modal visible={modalCompte} transparent animationType="slide">
        <View style={styles.modal}>
          <FlatList
            data={comboComptes}
            keyExtractor={(item) => item.CO_CODECOMPTE}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setForm({ ...form, cmb_compte: item.CO_CODECOMPTE });
                  setModalCompte(false);
                }}
              >
                <Text style={styles.modalItem}>
                  {item.NUMEROCOMPTE} •• {item.SOLDE}
                </Text>
              </Pressable>
            )}
          />
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
  modal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  modalItem: {
    backgroundColor: "#1c1c1c",
    color: "#fff",
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
});

export default WalletMobileSubscribeScreen;
