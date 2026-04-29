import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView, Modal, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useVirement } from "../../../domain/compte/useVirement";
import { useCompteStatistiques } from "../../../domain/compte/useCompteStatistiques";
import { useBeneficiaires } from "../../../domain/beneficiaires/useBeneficiaires";
import { secureGetItem } from "../../../shared/utils/secureStorage";

export const TransferScreen: React.FC = () => {
  const { t, tText } = useI18n();
  const { colors } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();

  const [sourceAccount, setSourceAccount] = useState("");
  const [destinationAccount, setDestinationAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { submit, isLoading, error } = useVirement();
  const { data: compteStats, fetchData: fetchAccounts } = useCompteStatistiques();
  const { recordTransfer } = useBeneficiaires();
  const [done, setDone] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const sanitize = (s: string) => s.replace(/\D/g, "");

  const handleDestinationAccountChange = (value: string) => {
    setDestinationAccount(sanitize(value));
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: colors.card,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 8, width: 38, height: 38, borderRadius: 19, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
      ),
      headerTitle: () => (
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text + "45", letterSpacing: 1.5, textTransform: "uppercase" }}>
            Transactions
          </Text>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text, letterSpacing: -0.3 }}>
            Virement
          </Text>
        </View>
      ),
      headerRight: () => (
        <View style={{ marginRight: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary + "15", justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
        </View>
      ),
    });
  }, [navigation, colors]);

  React.useEffect(() => { fetchAccounts(); }, []);

  React.useEffect(() => {
    const run = async () => {
      const params = route.params as any;
      
      // Si un bénéficiaire est passé en paramètre, pré-remplir le formulaire
      if (params?.beneficiary) {
        setDestinationAccount(sanitize(params.beneficiary.accountNumber || ""));
      }
      
      if (params?.account) {
        setSelectedAccount(params.account);
        setSourceAccount(sanitize(params.account.number));
        return;
      }
      if (compteStats?.COMPTES && compteStats.COMPTES.length > 0) {
        const first = compteStats.COMPTES[0];
        const number = String(first.NUMEROCOMPTE ?? first.CO_CODECOMPTE ?? "");
        const type = String(first.CO_INTITULECOMPTE ?? "");
        const balance = String(first.SOLDE ?? 0);
        setSelectedAccount({ type, number, balance, currency: "XOF" });
        setSourceAccount(sanitize(number));
        return;
      }
      const acc = (await secureGetItem("user_account_number")) || "";
      if (acc) setSourceAccount(sanitize(acc));
    };
    run();
  }, [route.params, compteStats]);

  const canSubmit =
    sanitize(sourceAccount).length > 0 &&
    sanitize(destinationAccount).length > 8 && // Au moins 8 chiffres
    Number(String(amount).replace(/[,\s]/g, "")) > 0;

  const fmtAmount = (v: string) => {
    const n = Number(v.replace(/\s/g, ""));
    return isNaN(n) || n === 0 ? "0" : n.toLocaleString("fr-FR");
  };

  const balance = selectedAccount?.balance
    ? Number(selectedAccount.balance).toLocaleString("fr-FR")
    : null;

  return (
    <SafeAreaView style={[st.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Source account card ── */}
        {sourceAccount ? (
          <View style={[st.accountCard, { backgroundColor: colors.primary }]}>
            <View style={st.accountCardTop}>
              <View style={st.accountCardLeft}>
                <Text style={st.accountCardEyebrow}>Compte source</Text>
                <Text style={st.accountCardNumber}>{sourceAccount}</Text>
                {selectedAccount?.type ? (
                  <Text style={st.accountCardType}>{selectedAccount.type}</Text>
                ) : null}
              </View>
              <View style={[st.accountCardIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <Ionicons name="wallet-outline" size={22} color="#fff" />
              </View>
            </View>
            {balance && (
              <View style={st.accountCardBalance}>
                <Text style={st.accountCardBalanceLabel}>Solde disponible</Text>
                <Text style={st.accountCardBalanceVal}>{balance} XOF</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[st.accountCardPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[st.accountCardPlaceholderText, { color: colors.text + "60" }]}>Chargement du compte…</Text>
          </View>
        )}

        {/* ── Multi-account selector ── */}
        {(compteStats?.COMPTES?.length ?? 0) > 1 && (
          <View style={[st.selectorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[st.selectorTitle, { color: colors.text + "55" }]}>CHOISIR UN COMPTE</Text>
            {(compteStats?.COMPTES ?? []).map((c: any, i: number) => {
              const num = sanitize(String(c.NUMEROCOMPTE ?? c.CO_CODECOMPTE ?? ""));
              const isSelected = sourceAccount === num;
              const comptes = compteStats?.COMPTES ?? [];
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => { setSourceAccount(num); setSelectedAccount(c); }}
                  style={[
                    st.selectorRow,
                    { borderBottomColor: colors.border, borderBottomWidth: i < comptes.length - 1 ? 1 : 0 },
                    isSelected && { backgroundColor: colors.primary + "08" },
                  ]}
                >
                  <View style={[st.selectorDot, { backgroundColor: isSelected ? colors.primary : colors.border }]}>
                    {isSelected && <Ionicons name="checkmark" size={10} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.selectorName, { color: colors.text }]}>{String(c.CO_INTITULECOMPTE ?? "Compte")}</Text>
                    <Text style={[st.selectorNum, { color: colors.text + "50" }]}>{num} · {Number(c.SOLDE ?? 0).toLocaleString("fr-FR")} XOF</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Transfer arrow ── */}
        <View style={st.arrowRow}>
          <View style={[st.arrowLine, { backgroundColor: colors.border }]} />
          <View style={[st.arrowCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="arrow-down" size={16} color={colors.primary} />
          </View>
          <View style={[st.arrowLine, { backgroundColor: colors.border }]} />
        </View>

        {/* ── Beneficiary field ── */}
        <View style={[
          st.field,
          { backgroundColor: colors.card, borderColor: focusedField === "benef" ? colors.primary : (destinationAccount ? colors.primary + "40" : colors.border) }
        ]}>
          <View style={[st.fieldIcon, { backgroundColor: colors.primary + "12" }]}>
            <Ionicons name="person-outline" size={17} color={colors.primary} />
          </View>
          <View style={st.fieldBody}>
            <Text style={[st.fieldLabel, { color: colors.text + "70" }]}>Compte bénéficiaire</Text>
            <TextInput
              style={[st.fieldInput, { color: colors.text }]}
              placeholder={t("transfer.form.beneficiary.placeholder.internal")}
              placeholderTextColor={colors.text + "55"}
              value={destinationAccount}
              onChangeText={handleDestinationAccountChange}
              keyboardType="numeric"
              onFocus={() => setFocusedField("benef")}
              onBlur={() => setFocusedField(null)}
            />
          </View>
        </View>

        {/* ── Warning message ── */}
        {destinationAccount.length > 0 && (
          <View style={[st.warningBox, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "20" }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={[st.warningText, { color: colors.primary }]}>
              Vérifiez attentivement le numéro de compte du bénéficiaire avant de continuer
            </Text>
          </View>
        )}

        {/* ── Amount field ── */}
        <View style={[
          st.amountField,
          { backgroundColor: colors.card, borderColor: focusedField === "amount" ? colors.primary : (amount ? colors.primary + "40" : colors.border) }
        ]}>
          <View style={[st.fieldIcon, { backgroundColor: colors.primary + "12" }]}>
            <Ionicons name="cash-outline" size={17} color={colors.primary} />
          </View>
          <View style={st.fieldBody}>
            <Text style={[st.fieldLabel, { color: colors.text + "70" }]}>Montant</Text>
            <TextInput
              style={[st.amountInput, { color: colors.text }]}
              placeholder="0"
              placeholderTextColor={colors.text + "50"}
              keyboardType="numeric"
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
              onFocus={() => setFocusedField("amount")}
              onBlur={() => setFocusedField(null)}
            />
          </View>
          <Text style={[st.amountCurrency, { color: colors.primary }]}>XOF</Text>
        </View>

        {/* ── Status ── */}
        {!!error && (
          <View style={[st.statusBox, { backgroundColor: colors.error + "12", borderColor: colors.error + "25" }]}>
            <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
            <Text style={[st.statusText, { color: colors.error }]}>{error}</Text>
          </View>
        )}
        {done && !error && (
          <View style={[st.statusBox, { backgroundColor: colors.success + "12", borderColor: colors.success + "25" }]}>
            <Ionicons name="checkmark-circle-outline" size={15} color={colors.success} />
            <Text style={[st.statusText, { color: colors.success }]}>Virement effectué avec succès</Text>
          </View>
        )}

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[st.btn, { backgroundColor: canSubmit ? colors.primary : colors.primary + "40" }]}
          activeOpacity={0.85}
          onPress={() => { if (canSubmit && !isLoading) setConfirmVisible(true); }}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={st.btnText}>{t("transfer.action.submit")}</Text>
              </>
          }
        </TouchableOpacity>

        {/* ── Secure note ── */}
        <View style={st.secureRow}>
          <Ionicons name="shield-checkmark" size={13} color={colors.success} />
          <Text style={[st.secureText, { color: colors.text + "45" }]}>{t("transfer.note.secure")}</Text>
        </View>

      </ScrollView>

      {/* ── Confirmation modal ── */}
      <Modal visible={confirmVisible} transparent animationType="slide" onRequestClose={() => setConfirmVisible(false)}>
        <View style={st.modalOverlay}>
          <View style={[st.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[st.modalHandle, { backgroundColor: colors.border }]} />

            <View style={[st.modalIconCircle, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="swap-horizontal" size={28} color={colors.primary} />
            </View>
            <Text style={[st.modalTitle, { color: colors.text }]}>Confirmer le virement</Text>
            <Text style={[st.modalSub, { color: colors.text + "50" }]}>Vérifiez les informations avant de valider</Text>

            <View style={[st.modalSummary, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {[
                { label: "Émetteur", value: sourceAccount, icon: "wallet-outline" as const },
                { 
                  label: "Compte destinataire", 
                  value: destinationAccount, 
                  icon: "card-outline" as const 
                },
              ].map((row, i, arr) => (
                <View key={i}>
                  <View style={st.modalRow}>
                    <View style={[st.modalRowIcon, { backgroundColor: colors.primary + "12" }]}>
                      <Ionicons name={row.icon} size={14} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[st.modalRowLabel, { color: colors.text + "50" }]}>{row.label}</Text>
                      <Text style={[st.modalRowValue, { color: colors.text }]}>{row.value}</Text>
                    </View>
                  </View>
                  {i < arr.length - 1 && <View style={[st.modalSep, { backgroundColor: colors.border }]} />}
                </View>
              ))}
            </View>

            <View style={[st.modalAmountBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "20" }]}>
              <Text style={[st.modalAmountLabel, { color: colors.primary + "90" }]}>Montant à transférer</Text>
              <Text style={[st.modalAmountVal, { color: colors.primary }]}>{fmtAmount(amount)}</Text>
              <Text style={[st.modalAmountCurrency, { color: colors.primary + "80" }]}>XOF</Text>
            </View>

            <View style={st.modalBtns}>
              <TouchableOpacity
                style={[st.modalBtnCancel, { borderColor: colors.border }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={[st.modalBtnCancelText, { color: colors.text }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.modalBtnConfirm, { backgroundColor: colors.primary }]}
                onPress={async () => {
                  setConfirmVisible(false);
                  setDone(false);
                  const ok = await submit({ emitter: sourceAccount, beneficiary: destinationAccount, amount });
                  setDone(ok);
                  
                  // Enregistrer le transfert dans les bénéficiaires si réussi
                  if (ok) {
                    const amountNum = Number(String(amount).replace(/[,\s]/g, ""));
                    await recordTransfer(destinationAccount, amountNum);
                  }
                }}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={st.modalBtnConfirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const st = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 60 },

  // Account card
  accountCard: {
    borderRadius: 22, padding: 22, marginBottom: 8,
    shadowColor: "#000", shadowOpacity: 0.18, shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 7,
  },
  accountCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  accountCardLeft: { flex: 1 },
  accountCardEyebrow: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  accountCardNumber: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: 1, marginTop: 6 },
  accountCardType: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 3 },
  accountCardIcon: { width: 46, height: 46, borderRadius: 23, justifyContent: "center", alignItems: "center" },
  accountCardBalance: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)" },
  accountCardBalanceLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11 },
  accountCardBalanceVal: { color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 },
  accountCardPlaceholder: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 8 },
  accountCardPlaceholderText: { fontSize: 14 },

  // Selector
  selectorCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 8 },
  selectorTitle: { fontSize: 10, fontWeight: "700", letterSpacing: 1, padding: 12, paddingBottom: 8 },
  selectorRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  selectorDot: { width: 22, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  selectorName: { fontSize: 14, fontWeight: "600" },
  selectorNum: { fontSize: 11, marginTop: 1 },

  // Arrow divider
  arrowRow: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
  arrowLine: { flex: 1, height: 1 },
  arrowCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, justifyContent: "center", alignItems: "center", marginHorizontal: 12 },

  // Fields
  field: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 16, marginBottom: 12, overflow: "hidden" },
  fieldIcon: { width: 50, alignSelf: "stretch", justifyContent: "center", alignItems: "center" },
  fieldBody: { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  fieldLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 3 },
  fieldInput: { fontSize: 15, fontWeight: "500", padding: 0 },

  // Warning box
  warningBox: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 12 },
  warningText: { fontSize: 12, flex: 1, lineHeight: 16 },

  // Amount
  amountField: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 16, marginBottom: 16, overflow: "hidden" },
  amountInput: { fontSize: 30, fontWeight: "800", letterSpacing: -0.5, padding: 0 },
  amountCurrency: { fontSize: 16, fontWeight: "700", paddingRight: 16 },

  // Status
  statusBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 12 },
  statusText: { fontSize: 13, flex: 1 },

  // Button
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderRadius: 18, paddingVertical: 17, marginBottom: 14,
    shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 4,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // Secure
  secureRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  secureText: { fontSize: 12 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalIconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 14 },
  modalTitle: { fontSize: 20, fontWeight: "800", textAlign: "center", letterSpacing: -0.3 },
  modalSub: { fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 20 },
  modalSummary: { borderRadius: 16, padding: 4, borderWidth: 1, marginBottom: 14 },
  modalRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  modalRowIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  modalRowLabel: { fontSize: 11, fontWeight: "600" },
  modalRowValue: { fontSize: 14, fontWeight: "600", marginTop: 1 },
  modalSep: { height: 1, marginHorizontal: 12 },
  modalAmountBox: { borderRadius: 16, padding: 18, borderWidth: 1, alignItems: "center", marginBottom: 20 },
  modalAmountLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  modalAmountVal: { fontSize: 36, fontWeight: "800", letterSpacing: -1, marginTop: 6 },
  modalAmountCurrency: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  modalBtns: { flexDirection: "row", gap: 12 },
  modalBtnCancel: { flex: 1, borderWidth: 1.5, borderRadius: 16, paddingVertical: 15, alignItems: "center" },
  modalBtnCancelText: { fontSize: 15, fontWeight: "600" },
  modalBtnConfirm: { flex: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 15 },
  modalBtnConfirmText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

export default TransferScreen;
