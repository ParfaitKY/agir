import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { EmptyState } from "../../../shared/components/EmptyState";

export const CardsScreen: React.FC = () => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const stats = [
    {
      id: 1,
      value: "2",
      label: t("cards.stats.cards"),
      icon: "card-outline",
      iconBg: "#EAF2FF",
      iconColor: "#007AFF",
    },
    {
      id: 2,
      value: "228k",
      label: t("cards.stats.totalBalance"),
      icon: "wallet-outline",
      iconBg: "#EAF7EA",
      iconColor: "#34C759",
    },
    {
      id: 3,
      value: "8",
      label: t("cards.stats.transactions"),
      icon: "flash-outline",
      iconBg: "#FFF5E5",
      iconColor: "#FFCC00",
    },
  ];

  const cards = [
    {
      id: 1,
      bank: "ORABANK",
      number: "6011 **** **** 1234",
      fullNumber: "6011 9823 7441 1234",
      cvv: "418",
      holder: "DERLY MOUPEPIDI",
      expiry: "12/25",
      bg: "#242424",
      statusBg: "#2E2E2E",
    },
    {
      id: 2,
      bank: "UBA",
      number: "5020 **** **** 5678",
      fullNumber: "5020 1034 8640 5678",
      cvv: "952",
      holder: "DERLY MOUPEPIDI",
      expiry: "08/26",
      bg: "#D7261D",
      statusBg: "#7F1D1D",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [showCVV, setShowCVV] = useState(false);
  const [showNewCardModal, setShowNewCardModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [detailsY, setDetailsY] = useState(0);
  const [limitsY, setLimitsY] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const cardWidth = Dimensions.get("window").width - 32; // largeur page = écran - padding
  const viewabilityConfigRef = useRef({ viewAreaCoveragePercentThreshold: 60 });
  const onViewableItemsChanged = useRef((info: any) => {
    const idx = info?.viewableItems?.[0]?.index ?? 0;
    setActiveIndex(idx);
  }).current;
  const transactions = [
    {
      id: 1,
      name: "Amazon",
      time: t("dashboard.date.today"),
      amount: -15000,
      icon: "bag-handle-outline",
      iconBg: "#FDF3F3",
    },
    {
      id: 2,
      name: "Restaurant",
      time: t("dashboard.date.yesterday"),
      amount: -8500,
      icon: "close-circle-outline",
      iconBg: "#FFF4F4",
    },
    {
      id: 3,
      name: "Station service",
      time: t("dashboard.date.3days"),
      amount: -12000,
      icon: "car-sport-outline",
      iconBg: "#FDF7F0",
    },
  ];

  const hexToRgb = (hex: string) => {
    const clean = hex.replace("#", "");
    const full =
      clean.length === 3
        ? clean
            .split("")
            .map((c) => c + c)
            .join("")
        : clean;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return { r, g, b };
  };

  const isDarkHex = (hex: string) => {
    try {
      const { r, g, b } = hexToRgb(hex);
      const rl = r / 255,
        gl = g / 255,
        bl = b / 255;
      const lum = 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
      return lum < 0.5;
    } catch {
      return false;
    }
  };

  const handleCopyNumber = async () => {
    const full = cards[activeIndex]?.fullNumber ?? cards[activeIndex].number;
    try {
      if (
        typeof navigator !== "undefined" &&
        (navigator as any).clipboard?.writeText
      ) {
        await (navigator as any).clipboard.writeText(full);
      }
      Alert.alert(t("cards.alert.copy.title"), t("cards.alert.copy.body"));
    } catch (e) {
      Alert.alert(t("cards.alert.error.title"), t("cards.alert.copy.error"));
    }
  };

  const handleConfirmNewCard = () => {
    setShowNewCardModal(false);
    Alert.alert(
      t("cards.alert.confirmation.title"),
      t("cards.alert.newCardSaved")
    );
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Action sheet (Bloquer / PIN / Renouveler) */}
      <Modal
        transparent
        visible={showActionsModal}
        animationType="fade"
        onRequestClose={() => setShowActionsModal(false)}
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t("cards.sheet.title")}</Text>

            {/* Bloquer */}
            <TouchableOpacity
              style={styles.sheetItem}
              activeOpacity={0.85}
              onPress={() => {
                setShowActionsModal(false);
                Alert.alert(
                  t("cards.sheet.block.title"),
                  t("cards.sheet.block.subtitle")
                );
              }}
            >
              <View
                style={[styles.sheetIconBg, { backgroundColor: "#F7F7F7" }]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color="#FF3B30"
                />
              </View>
              <View style={styles.sheetTexts}>
                <Text style={styles.sheetItemTitle}>
                  {t("cards.sheet.block.title")}
                </Text>
                <Text style={styles.sheetItemSub}>
                  {t("cards.sheet.block.subtitle")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
            </TouchableOpacity>

            {/* Modifier PIN */}
            <TouchableOpacity
              style={[styles.sheetItem, styles.sheetItemDivider]}
              activeOpacity={0.85}
              onPress={() => {
                setShowActionsModal(false);
                Alert.alert(
                  t("cards.sheet.pin.title"),
                  t("cards.sheet.pin.subtitle")
                );
              }}
            >
              <View
                style={[styles.sheetIconBg, { backgroundColor: "#F7F7F7" }]}
              >
                <Ionicons name="card-outline" size={22} color="#0A84FF" />
              </View>
              <View style={styles.sheetTexts}>
                <Text style={styles.sheetItemTitle}>
                  {t("cards.sheet.pin.title")}
                </Text>
                <Text style={styles.sheetItemSub}>
                  {t("cards.sheet.pin.subtitle")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
            </TouchableOpacity>

            {/* Renouveler */}
            <TouchableOpacity
              style={[styles.sheetItem, styles.sheetItemDivider]}
              activeOpacity={0.85}
              onPress={() => {
                setShowActionsModal(false);
                setShowNewCardModal(true);
              }}
            >
              <View
                style={[styles.sheetIconBg, { backgroundColor: "#F7F7F7" }]}
              >
                <Ionicons name="refresh-outline" size={22} color="#0A84FF" />
              </View>
              <View style={styles.sheetTexts}>
                <Text style={styles.sheetItemTitle}>
                  {t("cards.sheet.renew.title")}
                </Text>
                <Text style={styles.sheetItemSub}>
                  {t("cards.sheet.renew.subtitle")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCancelBtn}
              activeOpacity={0.85}
              onPress={() => setShowActionsModal(false)}
            >
              <Text style={styles.sheetCancelText}>{t("common.cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Modal d'information pour "Gérer" */}
      <Modal
        transparent
        visible={showInfoModal}
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View>
              <Text style={styles.modalTitle}>
                {t("cards.modal.info.title")}
              </Text>
              <Text style={styles.modalText}>{t("cards.modal.info.body")}</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowInfoModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalActionText}>{t("common.ok")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        transparent
        visible={showNewCardModal}
        animationType="fade"
        onRequestClose={() => setShowNewCardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View>
              <Text style={styles.modalTitle}>
                {t("cards.modal.newCard.title")}
              </Text>
              <Text style={styles.modalText}>
                {t("cards.modal.newCard.body")}
              </Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowNewCardModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalActionText}>
                  {t("common.cancel.upper")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmNewCard}
                activeOpacity={0.8}
              >
                <Text style={styles.modalActionText}>
                  {t("common.confirm.upper")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* En-tête section */}
      <View style={styles.headerCard}>
        <View>
          <Text style={styles.headerTitle}>{t("cards.header.title")}</Text>
          <Text style={styles.headerSub}>{t("cards.header.subtitle")}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.85}
          onPress={() => setShowNewCardModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Statistiques */}
      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.id} style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: s.iconBg }]}>
              <Ionicons name={s.icon as any} size={22} color={s.iconColor} />
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Cartes - Carrousel horizontal */}
      {cards.length > 0 ? (
        <FlatList
          horizontal
          pagingEnabled
          data={cards}
          keyExtractor={(item) => String(item.id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfigRef.current}
          renderItem={({ item, index }) => {
            const darkBg = isDarkHex(item.bg);
            const cardTextColor = darkBg ? "#FFFFFF" : colors.text;
            const cardSubColor = darkBg ? "#EDEDED" : colors.text;
            const statusTextColor = darkBg ? "#EDEDED" : colors.text;
            return (
              <View
                style={[
                  styles.paymentCard,
                  {
                    width: cardWidth,
                    backgroundColor: item.bg,
                    marginRight: index === cards.length - 1 ? 0 : 10,
                    marginLeft: index === 0 ? 2 : 0,
                  },
                ]}
              >
                <View style={styles.paymentCardTopRow}>
                  <View style={styles.bankChip}>
                    <Text style={styles.bankChipText}>{item.bank}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: item.statusBg },
                    ]}
                  >
                    <View style={styles.statusDot} />
                    <Text
                      style={[styles.statusText, { color: statusTextColor }]}
                    >
                      {t("cards.card.status.active")}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardIconCircle}>
                    <Ionicons
                      name="hardware-chip-outline"
                      size={26}
                      color="#EDEDED"
                    />
                  </View>
                  <Text style={[styles.cardNumber, { color: cardTextColor }]}>
                    {item.number}
                  </Text>

                  <View style={styles.cardMetaRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.metaLabel, { color: cardSubColor }]}>
                        {t("cards.card.meta.holderLabel")}
                      </Text>
                      <Text
                        style={[styles.metaValue, { color: cardTextColor }]}
                      >
                        {item.holder}
                      </Text>
                    </View>
                    <View style={{ width: 140 }}>
                      <Text style={[styles.metaLabel, { color: cardSubColor }]}>
                        {t("cards.card.meta.expiryLabel")}
                      </Text>
                      <Text
                        style={[styles.metaValue, { color: cardTextColor }]}
                      >
                        {item.expiry}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const index = Math.round(x / cardWidth);
            setActiveIndex(index);
          }}
          getItemLayout={(data, index) => ({
            length: cardWidth,
            offset: cardWidth * index,
            index,
          })}
        />
      ) : (
        <EmptyState
          type="empty"
          message="Aucune carte disponible"
          style={{ paddingVertical: 40 }}
        />
      )}

      {/* Indicateur pagination */}
      <View style={styles.paginationRow}>
        {cards.map((c, i) => (
          <View
            key={c.id}
            style={[
              styles.pageDot,
              i === activeIndex ? styles.pageDotBlue : styles.pageDotGray,
            ]}
          />
        ))}
      </View>

      {/* Actions rapides (placées avant détails) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("cards.quick.title")}</Text>

        <TouchableOpacity
          style={styles.quickItem}
          activeOpacity={0.85}
          onPress={() => setShowActionsModal(true)}
        >
          <View style={[styles.quickIconBg, { backgroundColor: "#EAF2FF" }]}>
            <Ionicons name="lock-closed-outline" size={22} color="#007AFF" />
          </View>
          <View style={styles.quickTexts}>
            <Text style={styles.quickTitle}>
              {t("cards.quick.block.title")}
            </Text>
            <Text style={styles.quickSub}>
              {t("cards.quick.block.subtitle")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickItem}
          activeOpacity={0.85}
          onPress={() => setShowInfoModal(true)}
        >
          <View style={[styles.quickIconBg, { backgroundColor: "#EAF7EA" }]}>
            <Ionicons name="settings-outline" size={22} color="#34C759" />
          </View>
          <View style={styles.quickTexts}>
            <Text style={styles.quickTitle}>
              {t("cards.quick.manage.title")}
            </Text>
            <Text style={styles.quickSub}>
              {t("cards.quick.manage.subtitle")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickItem}
          activeOpacity={0.85}
          onPress={() => setShowNewCardModal(true)}
        >
          <View style={[styles.quickIconBg, { backgroundColor: "#EAF2FF" }]}>
            <Ionicons name="add-circle-outline" size={22} color="#0A84FF" />
          </View>
          <View style={styles.quickTexts}>
            <Text style={styles.quickTitle}>
              {t("cards.quick.order.title")}
            </Text>
            <Text style={styles.quickSub}>
              {t("cards.quick.order.subtitle")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
        </TouchableOpacity>
      </View>

      {/* Détails de la carte */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>{t("cards.details.title")}</Text>
      </View>
      <View
        style={styles.detailBox}
        onLayout={(e) => setDetailsY(e.nativeEvent.layout.y)}
      >
        <View style={styles.detailRowFirst}>
          <Text style={styles.detailLabel}>
            {t("cards.details.fullNumber")}
          </Text>
          <View style={styles.detailRightRow}>
            <Text style={styles.detailValue}>{cards[activeIndex].number}</Text>
            <TouchableOpacity onPress={handleCopyNumber} activeOpacity={0.7}>
              <Ionicons
                name="copy-outline"
                size={18}
                color="#4A4A4A"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t("cards.details.cvv")}</Text>
          <View style={styles.detailRightRow}>
            <Text style={styles.detailValue}>
              {showCVV ? cards[activeIndex].cvv : "•••"}
            </Text>
            <TouchableOpacity
              onPress={() => setShowCVV((v) => !v)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showCVV ? "eye-off-outline" : "eye-outline"}
                size={18}
                color="#4A4A4A"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t("cards.details.expiry")}</Text>
          <Text style={styles.detailValue}>{cards[activeIndex].expiry}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t("cards.details.type")}</Text>
          <Text style={styles.detailValue}>{cards[activeIndex].bank}</Text>
        </View>
      </View>

      {/* Limites de dépenses */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>{t("cards.limits.title")}</Text>
        <TouchableOpacity activeOpacity={0.85}>
          <Text style={styles.sectionLink}>{t("cards.limits.edit")}</Text>
        </TouchableOpacity>
      </View>

      {/* Paiements quotidiens */}
      <View
        style={styles.limitCard}
        onLayout={(e) => setLimitsY(e.nativeEvent.layout.y)}
      >
        <View style={styles.limitTopRow}>
          <View style={[styles.limitIconBg, { backgroundColor: "#EAF2FF" }]}>
            <Ionicons name="card-outline" size={20} color="#0A84FF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.limitTitle}>
              {t("cards.limits.dailyPayments")}
            </Text>
            <Text style={styles.limitSub}>{t("cards.limits.today")}</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round((35500 / 100000) * 100)}%`,
                backgroundColor: "#0A84FF",
              },
            ]}
          />
        </View>
        <View style={styles.limitBottomRow}>
          <Text style={styles.limitAmount}>35 500 / 100 000 XAF</Text>
          <Text style={styles.limitUsed}>36% utilisé</Text>
        </View>
      </View>

      {/* Retraits mensuels */}
      <View style={styles.limitCard}>
        <View style={styles.limitTopRow}>
          <View style={[styles.limitIconBg, { backgroundColor: "#EAF2FF" }]}>
            <Ionicons name="cash-outline" size={20} color="#0A84FF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.limitTitle}>
              {t("cards.limits.monthlyWithdrawals")}
            </Text>
            <Text style={styles.limitSub}>{t("cards.limits.thisMonth")}</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round((125000 / 500000) * 100)}%`,
                backgroundColor: "#0A84FF",
              },
            ]}
          />
        </View>
        <View style={styles.limitBottomRow}>
          <Text style={styles.limitAmount}>125 000 / 500 000 XAF</Text>
          <Text style={styles.limitUsed}>25% utilisé</Text>
        </View>
      </View>

      {/* Transactions récentes */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>{t("cards.recent.title")}</Text>
        <TouchableOpacity activeOpacity={0.85}>
          <Text style={styles.sectionLink}>{t("cards.recent.seeAll")}</Text>
        </TouchableOpacity>
      </View>
      {transactions.length > 0 ? (
        transactions.map((t) => (
          <View key={t.id} style={styles.txCard}>
            <View style={[styles.txIconBg, { backgroundColor: t.iconBg }]}>
              <Ionicons name={t.icon as any} size={20} color="#FF3B30" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txTitle}>{t.name}</Text>
              <Text style={styles.txSub}>{t.time}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.txAmount}>
                {t.amount.toLocaleString("fr-FR")}{" "}
              </Text>
              <Text style={styles.txCurrency}>XAF</Text>
            </View>
          </View>
        ))
      ) : (
        <EmptyState
          type="empty"
          message={t("transactions.empty.none")}
          compact
          style={{ paddingVertical: 20 }}
        />
      )}

      {/* Bandeau sécurité */}
      <View style={styles.securityBanner}>
        <View style={styles.securityIconBg}>
          <View style={styles.securityIconInner}>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </View>
        </View>
        <Text style={styles.securityMessage}>
          {t("cards.security.message")}
        </Text>
      </View>
    </ScrollView>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerCard: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
    headerSub: { marginTop: 6, fontSize: 13, color: colors.text },
    addBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },

    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 18,
      paddingHorizontal: 16,
    },
    statCard: {
      backgroundColor: colors.card,
      width: "31%",
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
    },
    statIconBg: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
      backgroundColor: colors.background,
    },
    statValue: { fontSize: 18, fontWeight: "800", color: colors.text },
    statLabel: { marginTop: 4, fontSize: 12, color: colors.text },

    paymentCard: {
      backgroundColor: "#242424",
      marginTop: 18,
      borderRadius: 18,
      padding: 16,
    },
    paymentCardTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    bankChip: {
      backgroundColor: colors.card,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 14,
    },
    bankChipText: { color: colors.text, fontWeight: "700" },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#18281D",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.success,
      marginRight: 8,
    },
    statusText: { color: colors.text, fontWeight: "700" },
    cardBody: { marginTop: 24 },
    cardIconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    cardNumber: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: 1,
      marginBottom: 18,
    },
    cardMetaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    metaLabel: { color: colors.text, fontSize: 12 },
    metaValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
      marginTop: 4,
    },

    paginationRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 14,
    },
    pageDot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 6 },
    pageDotBlue: { backgroundColor: colors.primary },
    pageDotGray: { backgroundColor: colors.border },

    ctaCard: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: 18,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    ctaLeft: { flexDirection: "row", alignItems: "center" },
    ctaIconBg: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      backgroundColor: colors.background,
    },
    ctaTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
    ctaSub: { marginTop: 4, fontSize: 12, color: colors.text },

    sectionHeaderRow: {
      paddingHorizontal: 16,
      marginTop: 22,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionHeader: { fontSize: 18, fontWeight: "800", color: colors.text },
    sectionLink: { fontSize: 14, color: colors.primary, fontWeight: "700" },

    detailBox: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 6,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
    },
    detailRowFirst: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 16,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    detailLabel: { color: colors.text, fontSize: 13 },
    detailValue: { color: colors.text, fontSize: 13, fontWeight: "700" },
    detailRightRow: { flexDirection: "row", alignItems: "center" },

    limitCard: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
    },
    limitTopRow: { flexDirection: "row", alignItems: "center" },
    limitIconBg: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      backgroundColor: colors.background,
    },
    limitTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
    limitSub: { marginTop: 4, fontSize: 12, color: colors.text },
    progressTrack: {
      marginTop: 14,
      height: 10,
      borderRadius: 6,
      backgroundColor: colors.border,
      overflow: "hidden",
    },
    progressFill: { height: 10, borderRadius: 6 },
    limitBottomRow: {
      marginTop: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    limitAmount: { fontSize: 12, color: colors.text },
    limitUsed: { fontSize: 12, color: colors.primary },
    section: { paddingHorizontal: 16, marginTop: 12 },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 12,
    },
    quickItem: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
      marginBottom: 12,
    },
    quickIconBg: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      backgroundColor: colors.background,
    },
    quickTexts: { flex: 1 },
    quickTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
    quickSub: { marginTop: 4, fontSize: 12, color: colors.text },
    txCard: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
    },
    txIconBg: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      backgroundColor: colors.background,
    },
    txTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
    txSub: { marginTop: 4, fontSize: 12, color: colors.text },
    txAmount: { fontSize: 15, fontWeight: "700", color: colors.error },
    txCurrency: { marginTop: 2, fontSize: 10, color: colors.text },
    securityBanner: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: 14,
      marginBottom: 16,
      borderRadius: 28,
      paddingVertical: 18,
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    securityIconBg: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
      backgroundColor: colors.background,
    },
    securityIconInner: {
      width: 30,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.success,
      justifyContent: "center",
      alignItems: "center",
    },
    securityMessage: {
      flex: 1,
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
      flexWrap: "wrap",
      flexShrink: 1,
      paddingRight: 6,
      letterSpacing: 0.5,
    },
    // Action sheet styles
    sheetOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.25)",
      justifyContent: "flex-end",
    },
    sheetContainer: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 24,
    },
    sheetHandle: {
      alignSelf: "center",
      width: 72,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
      marginBottom: 12,
    },
    sheetTitle: {
      fontSize: 18,
      color: colors.text,
      fontWeight: "800",
      fontFamily: "monospace",
      marginBottom: 8,
    },
    sheetItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
    },
    sheetItemDivider: { borderTopWidth: 1, borderTopColor: colors.border },
    sheetIconBg: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      backgroundColor: colors.background,
    },
    sheetTexts: { flex: 1 },
    sheetItemTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
    sheetItemSub: { marginTop: 4, fontSize: 12, color: colors.text },
    sheetCancelBtn: {
      marginTop: 12,
      backgroundColor: colors.background,
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    sheetCancelText: {
      fontSize: 18,
      color: colors.text,
      fontWeight: "700",
      fontFamily: "monospace",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: "88%",
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    modalTitle: { color: colors.text, fontSize: 24, fontWeight: "800" },
    modalText: {
      marginTop: 16,
      color: colors.text,
      fontSize: 18,
      lineHeight: 28,
    },
    modalActions: {
      marginTop: 28,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    modalActionText: {
      color: colors.primary,
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: 1,
    },
  });

export default CardsScreen;
