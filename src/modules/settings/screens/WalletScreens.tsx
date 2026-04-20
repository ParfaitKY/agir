import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Modal, FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useCompteStatistiques } from "../../../domain/compte/useCompteStatistiques";

const WalletScreens: React.FC = () => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [transferType, setTransferType] = useState<"walletToBank" | "bankToWallet">("walletToBank");
  const [walletNumber, setWalletNumber] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [amount, setAmount] = useState(0);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"wallet" | "bank">("bank");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { data: compteStats, fetchData } = useCompteStatistiques();
  useEffect(() => { fetchData(); }, []);
  const accounts = compteStats?.COMPTES || [];

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: { backgroundColor: colors.card, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 8, width: 38, height: 38, borderRadius: 19, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
      ),
      headerTitle: () => (
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text + "45", letterSpacing: 1.5, textTransform: "uppercase" }}>Services</Text>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text, letterSpacing: -0.3 }}>Mon Wallet</Text>
        </View>
      ),
    });
  }, [navigation, colors]);

  const isWalletToBank = transferType === "walletToBank";
  const accentColor = isWalletToBank ? colors.primary : colors.success;

  const Field = ({ label, icon, value, onChange, placeholder, editable = true, onPickerPress }: any) => (
    <View style={[ws.field, { backgroundColor: colors.card, borderColor: focusedField === label ? accentColor : (value ? accentColor + "50" : colors.border) }]}>
      <View style={[ws.fieldIcon, { backgroundColor: accentColor + "15" }]}>
        <Ionicons name={icon} size={17} color={accentColor} />
      </View>
      <View style={ws.fieldBody}>
        <Text style={[ws.fieldLabel, { color: colors.text + "50" }]}>{label}</Text>
        {onPickerPress ? (
          <TouchableOpacity onPress={onPickerPress} style={{ paddingVertical: 2 }}>
            <Text style={[ws.fieldInput, { color: value ? colors.text : colors.text + "35" }]}>
              {value || "Sélectionner un compte…"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TextInput
            style={[ws.fieldInput, { color: editable ? colors.text : colors.text + "70" }]}
            placeholder={placeholder}
            placeholderTextColor={colors.text + "30"}
            value={value}
            onChangeText={onChange}
            editable={editable}
            onFocus={() => setFocusedField(label)}
            onBlur={() => setFocusedField(null)}
          />
        )}
      </View>
      {onPickerPress && <Ionicons name="chevron-down" size={16} color={colors.text + "40"} style={{ marginRight: 14 }} />}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={[ws.root, { backgroundColor: colors.background }]} contentContainerStyle={ws.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Type selector ── */}
        <View style={ws.typeRow}>
          {([
            { key: "walletToBank", icon: "arrow-up-circle", title: t("wallet.type.walletToBank.title"), sub: t("wallet.type.walletToBank.subtitle"), color: colors.primary },
            { key: "bankToWallet", icon: "arrow-down-circle", title: t("wallet.type.bankToWallet.title"), sub: t("wallet.type.bankToWallet.subtitle"), color: colors.success },
          ] as const).map((opt) => {
            const active = transferType === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[ws.typeCard, { backgroundColor: active ? opt.color : colors.card, borderColor: active ? opt.color : colors.border }]}
                onPress={() => setTransferType(opt.key)}
                activeOpacity={0.85}
              >
                <View style={[ws.typeIconWrap, { backgroundColor: active ? "rgba(255,255,255,0.2)" : opt.color + "15" }]}>
                  <Ionicons name={opt.icon as any} size={24} color={active ? "#fff" : opt.color} />
                </View>
                <Text style={[ws.typeTitle, { color: active ? "#fff" : colors.text }]}>{opt.title}</Text>
                <Text style={[ws.typeSub, { color: active ? "rgba(255,255,255,0.7)" : colors.text + "55" }]}>{opt.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Direction indicator ── */}
        <View style={ws.dirRow}>
          <View style={[ws.dirLine, { backgroundColor: colors.border }]} />
          <View style={[ws.dirCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name={isWalletToBank ? "arrow-forward" : "arrow-back"} size={14} color={accentColor} />
          </View>
          <View style={[ws.dirLine, { backgroundColor: colors.border }]} />
        </View>

        {/* ── Form ── */}
        {isWalletToBank ? (
          <>
            <Field
              label={t("wallet.form.walletSource.label")} icon="wallet-outline"
              value={walletNumber} placeholder="Sélectionner…"
              onPickerPress={() => { setPickerTarget("wallet"); setShowAccountPicker(true); }}
            />
            <Field
              label={t("wallet.form.bankDest.label")} icon="business-outline"
              value={bankAccount} onChange={setBankAccount}
              placeholder={t("wallet.form.bankDest.placeholder") || "Compte bancaire"}
            />
          </>
        ) : (
          <>
            <Field
              label={t("wallet.form.bankSource.label")} icon="business-outline"
              value={bankAccount} placeholder="Sélectionner…"
              onPickerPress={() => { setPickerTarget("bank"); setShowAccountPicker(true); }}
            />
            <Field
              label={t("wallet.form.walletDest.label")} icon="phone-portrait-outline"
              value={walletNumber} onChange={setWalletNumber}
              placeholder={t("wallet.form.walletDest.placeholder") || "Numéro Wallet"}
            />
          </>
        )}

        {/* ── Amount ── */}
        <View style={[ws.amountWrap, { backgroundColor: colors.card, borderColor: focusedField === "amount" ? accentColor : (amount > 0 ? accentColor + "50" : colors.border) }]}>
          <View style={[ws.fieldIcon, { backgroundColor: accentColor + "15" }]}>
            <Ionicons name="cash-outline" size={17} color={accentColor} />
          </View>
          <View style={ws.fieldBody}>
            <Text style={[ws.fieldLabel, { color: colors.text + "50" }]}>{t("wallet.form.amount.label")}</Text>
            <TextInput
              style={[ws.amountInput, { color: colors.text }]}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.text + "25"}
              value={amount > 0 ? String(amount) : ""}
              onChangeText={(v) => setAmount(Number(v) || 0)}
              onFocus={() => setFocusedField("amount")}
              onBlur={() => setFocusedField(null)}
            />
          </View>
          <Text style={[ws.amountCurrency, { color: accentColor }]}>XOF</Text>
        </View>

        {/* ── Quick amounts ── */}
        <View style={ws.quickRow}>
          {[10000, 25000, 50000, 100000].map((val) => (
            <TouchableOpacity
              key={val}
              style={[ws.quickBtn, { backgroundColor: accentColor + "12", borderColor: accentColor + "30" }]}
              onPress={() => setAmount(val)}
            >
              <Text style={[ws.quickText, { color: accentColor }]}>{val / 1000}k</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[ws.btn, { backgroundColor: accentColor }]}
          onPress={() => alert(`Transfert de ${amount} XOF`)}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={ws.btnText}>{t("wallet.action.submit")}</Text>
        </TouchableOpacity>

        {/* ── Secure note ── */}
        <View style={ws.secureRow}>
          <Ionicons name="shield-checkmark" size={13} color={colors.success} />
          <Text style={[ws.secureText, { color: colors.text + "45" }]}>{t("wallet.note.secure")}</Text>
        </View>
      </ScrollView>

      {/* ── Account picker ── */}
      <Modal visible={showAccountPicker} transparent animationType="slide" onRequestClose={() => setShowAccountPicker(false)}>
        <View style={ws.modalOverlay}>
          <View style={[ws.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[ws.modalHandle, { backgroundColor: colors.border }]} />
            <View style={ws.modalHeader}>
              <Text style={[ws.modalTitle, { color: colors.text }]}>Choisir un compte</Text>
              <TouchableOpacity onPress={() => setShowAccountPicker(false)}>
                <Ionicons name="close" size={22} color={colors.text + "80"} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={accounts}
              keyExtractor={(item, i) => String(item.id || i)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const num = String(item.NUMEROCOMPTE || "");
                const isSelected = pickerTarget === "wallet" ? walletNumber === num : bankAccount === num;
                return (
                  <TouchableOpacity
                    style={[ws.accountRow, { borderBottomColor: colors.border }, isSelected && { backgroundColor: accentColor + "08" }]}
                    onPress={() => {
                      if (pickerTarget === "wallet") setWalletNumber(num);
                      else setBankAccount(num);
                      setShowAccountPicker(false);
                    }}
                  >
                    <View style={[ws.accountIcon, { backgroundColor: accentColor + "15" }]}>
                      <Ionicons name="wallet-outline" size={18} color={accentColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[ws.accountName, { color: colors.text }]}>{item.CO_INTITULECOMPTE || "Compte"}</Text>
                      <Text style={[ws.accountNum, { color: colors.text + "55" }]}>{num}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={accentColor} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const ws = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 60 },

  // Type selector
  typeRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  typeCard: { flex: 1, borderRadius: 18, padding: 16, borderWidth: 1.5, alignItems: "center", gap: 6, shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 },
  typeIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  typeTitle: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  typeSub: { fontSize: 11, textAlign: "center" },

  // Direction
  dirRow: { flexDirection: "row", alignItems: "center", marginVertical: 14 },
  dirLine: { flex: 1, height: 1 },
  dirCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, justifyContent: "center", alignItems: "center", marginHorizontal: 12 },

  // Fields
  field: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 16, marginBottom: 12, overflow: "hidden" },
  fieldIcon: { width: 50, alignSelf: "stretch", justifyContent: "center", alignItems: "center" },
  fieldBody: { flex: 1, paddingHorizontal: 12, paddingVertical: 11 },
  fieldLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 3 },
  fieldInput: { fontSize: 15, fontWeight: "500", padding: 0 },

  // Amount
  amountWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 16, marginBottom: 12, overflow: "hidden" },
  amountInput: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5, padding: 0 },
  amountCurrency: { fontSize: 16, fontWeight: "700", paddingRight: 16 },

  // Quick amounts
  quickRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  quickBtn: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center", borderWidth: 1 },
  quickText: { fontSize: 13, fontWeight: "700" },

  // Button
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 18, paddingVertical: 17, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 4 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // Secure
  secureRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  secureText: { fontSize: 12 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: "75%", paddingBottom: 36 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  accountRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  accountIcon: { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center" },
  accountName: { fontSize: 14, fontWeight: "600" },
  accountNum: { fontSize: 12, marginTop: 1 },
});

export default WalletScreens;
