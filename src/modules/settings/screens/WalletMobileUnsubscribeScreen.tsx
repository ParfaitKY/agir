import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useWalletUnsubscribe } from "../../../domain/wallet/useWalletUnsubscribe";

const WalletMobileUnsubscribeScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useI18n();

  const {
    loading,
    submitting,
    comboComptes,
    form,
    errors,
    modalCompte,
    setForm,
    setModalCompte,
    loadAccounts,
    testAndSubmit,
  } = useWalletUnsubscribe();

  const canSubmit = [form.cmb_compte, form.chp_telephone].every(
    (v) => String(v || "").trim().length > 0
  );

  const selectedAccountLabel = comboComptes.find(
    (c) => c.CO_CODECOMPTE === form.cmb_compte
  )?.NUMEROCOMPTE;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]}>
      {loading && (
        <ActivityIndicator
          color={colors.primary}
          style={{ marginBottom: 10 }}
        />
      )}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, shadowColor: colors.text },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {t("wallet.mobile.accountTitle")}
        </Text>

        {/* Sélection du Compte */}
        <Text style={[styles.label, { color: colors.text }]}>
          {t("common.account")}
        </Text>
        <TouchableOpacity
          style={[
            styles.inputRow,
            { borderColor: colors.border, backgroundColor: colors.background },
          ]}
          onPress={async () => {
            if (!comboComptes || comboComptes.length === 0) {
              await loadAccounts();
            }
            setModalCompte(true);
          }}
        >
          <Text
            style={[
              styles.inputField,
              {
                color: selectedAccountLabel ? colors.text : colors.text + "60",
                paddingVertical: 12,
              },
            ]}
          >
            {selectedAccountLabel || t("placeholders.account")}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.border} />
        </TouchableOpacity>
        {errors.compte ? (
          <Text style={styles.error}>{errors.compte}</Text>
        ) : null}

        {/* Champ Téléphone */}
        <Text style={[styles.label, { color: colors.text }]}>
          {t("common.phone")}
        </Text>
        <View
          style={[
            styles.inputRow,
            { borderColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          <TextInput
            style={[styles.inputField, { color: colors.text }]}
            keyboardType="phone-pad"
            placeholder={t("placeholders.phone")}
            placeholderTextColor={colors.text + "60"}
            value={form.chp_telephone}
            onChangeText={(t) => setForm({ ...form, chp_telephone: t })}
          />
        </View>
        {errors.telephone ? (
          <Text style={styles.error}>{errors.telephone}</Text>
        ) : null}

        {/* Bouton Valider */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor: colors.primary,
              opacity: submitting || !canSubmit ? 0.6 : 1,
            },
          ]}
          activeOpacity={0.8}
          disabled={submitting || !canSubmit}
          onPress={testAndSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>{t("common.validate")}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de sélection de compte */}
      <Modal visible={modalCompte} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Sélectionnez un compte
            </Text>
            <FlatList
              data={comboComptes}
              keyExtractor={(item) => item.CO_CODECOMPTE}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.modalItem,
                    {
                      backgroundColor: pressed ? colors.border : "transparent",
                    },
                  ]}
                  onPress={() => {
                    setForm({ ...form, cmb_compte: item.CO_CODECOMPTE });
                    setModalCompte(false);
                  }}
                >
                  <Text style={{ color: colors.text }}>
                    {item.NUMEROCOMPTE} •• {item.SOLDE}
                  </Text>
                </Pressable>
              )}
            />
            <TouchableOpacity
              onPress={() => setModalCompte(false)}
              style={styles.closeBtn}
            >
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                Fermer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 25 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    minHeight: 44,
  },
  inputField: { flex: 1 },
  submitBtn: {
    marginTop: 8,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { color: "#fff", fontWeight: "700" },
  error: { color: "#ff6b6b", fontSize: 12, marginBottom: 8, marginTop: -8 },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  closeBtn: {
    marginTop: 15,
    alignItems: "center",
    padding: 10,
  },
});

export default WalletMobileUnsubscribeScreen;
