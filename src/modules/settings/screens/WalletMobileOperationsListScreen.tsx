import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useI18n } from "../../../app/providers/I18nProvider";
import {
  useWalletTransactions,
  WalletTransaction,
} from "../../../domain/wallet/useWalletTransactions";

const WalletMobileOperationsListScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useI18n();

  const { transactions, loading, error, feedbackMessage, search } =
    useWalletTransactions();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selecting, setSelecting] = useState<"from" | "to">("from");

  const now = new Date();
  const [pickerMonth, setPickerMonth] = useState(now.getMonth());
  const [pickerYear, setPickerYear] = useState(now.getFullYear());

  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  const format = (d: Date) =>
    `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  const daysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const monthLabel = (m: number, y: number) => {
    const names = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];
    return `${names[m]} ${y}`;
  };

  const openPicker = (target: "from" | "to") => {
    setSelecting(target);
    setPickerVisible(true);
  };

  const onPickDate = (day: number) => {
    const d = new Date(pickerYear, pickerMonth, day);
    const v = format(d);
    if (selecting === "from") setFromDate(v);
    else setToDate(v);
    setPickerVisible(false);
  };

  const handleSearch = () => {
    if (!fromDate || !toDate) {
      Alert.alert(t("common.info"), t("common.requiredFields"));
      return;
    }
    search(fromDate, toDate);
  };

  const renderItem = ({ item }: { item: WalletTransaction }) => (
    <View
      style={[
        styles.txCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: item.type === "CREDIT" ? "#E8F5E9" : "#FFEBEE" },
        ]}
      >
        <Ionicons
          name={
            item.type === "CREDIT" ? "arrow-down-outline" : "arrow-up-outline"
          }
          size={20}
          color={item.type === "CREDIT" ? "#4CAF50" : "#F44336"}
        />
      </View>
      <View style={styles.txContent}>
        <Text
          style={[styles.txTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
        <Text style={styles.txDate}>{item.date}</Text>
      </View>
      <View style={styles.txRight}>
        <Text
          style={[
            styles.txAmount,
            { color: item.type === "CREDIT" ? "#4CAF50" : colors.text },
          ]}
        >
          {item.type === "DEBIT" ? "-" : "+"} {item.amount.toLocaleString()} F
        </Text>
        <Text
          style={[
            styles.txStatus,
            { color: item.status === "SUCCESS" ? "#4CAF50" : "#FFC107" },
          ]}
        >
          {item.status}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Zone de Recherche */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, shadowColor: colors.text },
        ]}
      >
        <Text style={[styles.label, { color: colors.text }]}>
          {t("dates.start")}
        </Text>
        <TouchableOpacity
          style={[
            styles.input,
            {
              borderColor: fromDate ? colors.border : colors.error,
              backgroundColor: colors.background,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => openPicker("from")}
        >
          <Text style={{ color: fromDate ? colors.text : colors.text + "60" }}>
            {fromDate || `${t("dates.start")} (${t("common.required")})`}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.label, { color: colors.text }]}>
          {t("dates.end")}
        </Text>
        <TouchableOpacity
          style={[
            styles.input,
            {
              borderColor: toDate ? colors.border : colors.error,
              backgroundColor: colors.background,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => openPicker("to")}
        >
          <Text style={{ color: toDate ? colors.text : colors.text + "60" }}>
            {toDate || `${t("dates.end")} (${t("common.required")})`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.searchBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="search" size={22} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Gestion des états (Erreur, Info, Liste vide) */}
      {error && (
        <View style={styles.card}>
          <View style={[styles.noticeRow, { backgroundColor: "#FFEBEE" }]}>
            <View style={[styles.noticeLeft, { backgroundColor: "#FFCDD2" }]}>
              <Ionicons name="alert-circle" size={24} color="#D32F2F" />
            </View>
            <Text style={[styles.noticeText, { color: "#D32F2F" }]}>
              {error}
            </Text>
          </View>
        </View>
      )}

      {/* Liste des Résultats */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={[styles.noticeRow, { backgroundColor: "#4A90E2" }]}>
                <View
                  style={[styles.noticeLeft, { backgroundColor: "#3A78BF" }]}
                >
                  <Ionicons name="information" size={20} color="#fff" />
                </View>
                <Text style={styles.noticeText}>
                  {feedbackMessage ||
                    t("wallet.operations.welcome") ||
                    "Bienvenue, consultez vos opérations."}
                </Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Modal Calendrier */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.calendarOverlay}>
          <View style={[styles.calendarCard, { backgroundColor: colors.card }]}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={() => {
                  const m = pickerMonth === 0 ? 11 : pickerMonth - 1;
                  const y = pickerMonth === 0 ? pickerYear - 1 : pickerYear;
                  setPickerMonth(m);
                  setPickerYear(y);
                }}
                style={styles.chevBtn}
              >
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.monthText, { color: colors.text }]}>
                {monthLabel(pickerMonth, pickerYear)}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const m = pickerMonth === 11 ? 0 : pickerMonth + 1;
                  const y = pickerMonth === 11 ? pickerYear + 1 : pickerYear;
                  setPickerMonth(m);
                  setPickerYear(y);
                }}
                style={styles.chevBtn}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarGrid}>
              {Array.from({ length: daysInMonth(pickerMonth, pickerYear) }).map(
                (_, i) => {
                  const day = i + 1;
                  return (
                    <TouchableOpacity
                      key={day}
                      style={styles.calendarDay}
                      onPress={() => onPickDate(day)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.calendarDayText, { color: colors.text }]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    marginBottom: 16,
  },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    marginTop: 6,
  },
  noticeRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    overflow: "hidden",
  },
  noticeLeft: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeText: {
    color: "#fff",
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 12,
    flex: 1,
  },

  // Styles pour la liste des transactions
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    elevation: 1,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txContent: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  txDate: { fontSize: 12, color: "#888" },
  txRight: { alignItems: "flex-end" },
  txAmount: { fontSize: 14, fontWeight: "700" },
  txStatus: { fontSize: 10, fontWeight: "600", marginTop: 2 },

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    justifyContent: "center",
  },
  errorText: { marginLeft: 8, fontSize: 14, fontWeight: "600" },

  calendarOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  calendarCard: { width: "90%", borderRadius: 16, padding: 12 },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  chevBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  monthText: { fontSize: 16, fontWeight: "700" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarDay: {
    width: `${100 / 7}%`,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayText: { fontSize: 14, fontWeight: "600" },
});

export default WalletMobileOperationsListScreen;
