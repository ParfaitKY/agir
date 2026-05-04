import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
  Alert,
  Platform,
  Animated,
  Clipboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../../app/hooks/useAuth";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme, useThemeMode } from "../../../shared/styles/ThemeProvider";
import { secureGetItem } from "../../../shared/utils/secureStorage";
import { getDerniereTransaction } from "../../../services/compte/derniereTransaction";
import { dernieresOperationsClient } from "../../../services/compte/dernieresOperationsClient";
import useClientByCompte from "../../../domain/auth/useClientByCompte";

// ── ThemeOptionCard : carte de sélection de thème animée ──
type ThemeOpt = {
  key: "light" | "dark" | "system";
  icon: string;
  label: string;
  desc: string;
  accent: string;
  previewBg: string;
  previewBar: string;
};

const ThemeOptionCard: React.FC<{
  opt: ThemeOpt;
  active: boolean;
  colors: any;
  isDark: boolean;
  onPress: () => void;
}> = ({ opt, active, colors, isDark, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: active ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [active]);

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, opt.accent],
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            styles.themeOptionCard,
            {
              backgroundColor: active ? opt.accent + "0D" : colors.card,
              borderColor,
              borderWidth: active ? 2 : 1,
            },
          ]}
        >
          {/* Gauche : icône + textes */}
          <View style={[styles.themeOptionIconWrap, { backgroundColor: active ? opt.accent + "22" : colors.border + "50" }]}>
            <Ionicons name={opt.icon as any} size={24} color={active ? opt.accent : colors.text + "55"} />
          </View>

          <View style={styles.themeOptionTexts}>
            <Text style={[styles.themeOptionLabel, { color: active ? opt.accent : colors.text }]}>
              {opt.label}
            </Text>
            <Text style={[styles.themeOptionDesc, { color: colors.text + "50" }]}>
              {opt.desc}
            </Text>
          </View>

          {/* Droite : mini preview + check */}
          <View style={styles.themeOptionRight}>
            {/* Mini preview UI */}
            <View style={[styles.themePreview, { backgroundColor: opt.previewBg, borderColor: colors.border }]}>
              <View style={[styles.themePreviewBar, { backgroundColor: opt.previewBar }]} />
              <View style={styles.themePreviewLines}>
                <View style={[styles.themePreviewLine, { backgroundColor: opt.previewBar + "60", width: "70%" }]} />
                <View style={[styles.themePreviewLine, { backgroundColor: opt.previewBar + "30", width: "45%" }]} />
              </View>
            </View>

            {/* Check actif */}
            {active ? (
              <View style={[styles.themeOptionCheck, { backgroundColor: opt.accent }]}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            ) : (
              <View style={[styles.themeOptionCheckEmpty, { borderColor: colors.border }]} />
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── DocCard : carte document animée ──
type DocCardItem = {
  icon: string;
  gradient: string;
  label: string;
  sub: string;
  tag: string;
  tagColor: string;
  onPress: () => void;
};

const DocCard: React.FC<{ item: DocCardItem; colors: any; isDark: boolean }> = ({ item, colors, isDark }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 30 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  return (
    <Animated.View style={[styles.docCardWrap, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={item.onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.docCard2,
          {
            backgroundColor: colors.card,
            borderColor: item.gradient + "30",
          },
        ]}
      >
        {/* Fond décoratif */}
        <View style={[styles.docCardBg, { backgroundColor: item.gradient + "10" }]} />

        {/* Icône grande */}
        <View style={[styles.docCardIconCircle, { backgroundColor: item.gradient + "20" }]}>
          <Ionicons name={item.icon as any} size={28} color={item.gradient} />
        </View>

        {/* Textes */}
        <Text style={[styles.docCardTitle, { color: colors.text }]} numberOfLines={2}>
          {item.label}
        </Text>
        <Text style={[styles.docCardSub, { color: colors.text + "55" }]} numberOfLines={1}>
          {item.sub}
        </Text>

        {/* Tag action */}
        <View style={[styles.docCardTag, { backgroundColor: item.tagColor + "18" }]}>
          <Text style={[styles.docCardTagText, { color: item.tagColor }]}>{item.tag}</Text>
          <Ionicons name="arrow-forward" size={11} color={item.tagColor} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── InfoCard : carte individuelle animée pour les infos personnelles ──
type InfoCardField = {
  icon: string;
  iconBg: string;
  iconColor: string;
  accentColor: string;
  label: string;
  value: string;
  copyable: boolean;
  fullWidth: boolean;
};

const InfoCard: React.FC<{
  field: InfoCardField;
  colors: any;
  isDark: boolean;
  fullWidth: boolean;
}> = ({ field, colors, isDark, fullWidth }) => {
  const [copied, setCopied] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const hasValue = field.value && field.value !== "—";

  const handleCopy = () => {
    if (!field.copyable || !hasValue) return;
    Clipboard.setString(field.value);
    setCopied(true);
    // Animation pulse
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    // Fade in du badge "Copié"
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setCopied(false));
  };

  return (
    <Animated.View
      style={[
        styles.infoCardItem,
        fullWidth && styles.infoCardFull,
        {
          backgroundColor: colors.card,
          borderColor: hasValue ? field.accentColor + "30" : colors.border,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Accent bar top */}
      <View style={[styles.infoCardAccentBar, { backgroundColor: field.accentColor, opacity: hasValue ? 1 : 0.25 }]} />

      <View style={styles.infoCardInner}>
        {/* Icon */}
        <View style={[styles.infoCardIconWrap, { backgroundColor: field.iconBg }]}>
          <Ionicons name={field.icon as any} size={20} color={field.iconColor} />
        </View>

        {/* Textes */}
        <View style={styles.infoCardTexts}>
          <Text style={[styles.infoCardLabel, { color: colors.text + "55" }]}>{field.label}</Text>
          <Text
            style={[styles.infoCardValue, { color: hasValue ? colors.text : colors.text + "35" }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {field.value}
          </Text>
        </View>

        {/* Actions droite */}
        <View style={styles.infoCardActions}>
          {/* Badge statut */}
          <View style={[
            styles.infoCardBadge,
            { backgroundColor: hasValue ? field.accentColor + "18" : colors.border + "60" }
          ]}>
            <Ionicons
              name={hasValue ? "checkmark-circle" : "ellipse-outline"}
              size={12}
              color={hasValue ? field.accentColor : colors.text + "35"}
            />
            <Text style={[styles.infoCardBadgeText, { color: hasValue ? field.accentColor : colors.text + "35" }]}>
              {hasValue ? "Renseigné" : "Manquant"}
            </Text>
          </View>

          {/* Bouton copier */}
          {field.copyable && hasValue && (
            <TouchableOpacity
              onPress={handleCopy}
              style={[styles.infoCardCopyBtn, { backgroundColor: field.accentColor + "12" }]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={copied ? "checkmark" : "copy-outline"}
                size={14}
                color={field.accentColor}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Toast "Copié !" */}
      <Animated.View style={[styles.infoCardToast, { backgroundColor: field.accentColor, opacity: fadeAnim }]}>
        <Ionicons name="checkmark" size={11} color="#fff" />
        <Text style={styles.infoCardToastText}>Copié !</Text>
      </Animated.View>
    </Animated.View>
  );
};

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { logout, fullLogout, user } = useAuth();
  const { colors } = useTheme();
  const { preference, isDark, setPreference } = useThemeMode();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { fetchClientInfo, clientData } = useClientByCompte();
  const [editVisible, setEditVisible] = useState(false);
  const [txVisible, setTxVisible] = useState(false);
  const [dateInfoVisible, setDateInfoVisible] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<"start" | "end" | null>(null);

  // Hide native header — we render our own inside the hero
  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const CustomCalendar = ({
    onSelect,
    initialDate,
    onClose,
    minDate,
    maxDate,
  }: {
    onSelect: (date: Date) => void;
    initialDate?: Date;
    onClose: () => void;
    minDate?: Date | null;
    maxDate?: Date | null;
  }) => {
    // Utiliser la date du serveur (work_date) comme référence "Aujourd'hui"
    const today = startDate ?? new Date();
    const [viewDate, setViewDate] = useState(initialDate || today);
    const [selected, setSelected] = useState<Date | null>(initialDate || null);

    const getDaysInMonth = (year: number, month: number) => {
      return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
      return new Date(year, month, 1).getDay(); // 0 = Sunday
    };

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const monthNames = [
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

    const handlePrevMonth = () => {
      setViewDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
      setViewDate(new Date(year, month + 1, 1));
    };

    const isDateDisabled = (date: Date) => {
      if (minDate && date < new Date(minDate.setHours(0, 0, 0, 0))) return true;
      if (maxDate && date > new Date(maxDate.setHours(23, 59, 59, 999)))
        return true;
      return false;
    };

    // Auto-focus sur le mois courant (travail) si aucune date sélectionnée
    useEffect(() => {
      if (!initialDate) {
        setViewDate(today);
      }
    }, []);

    return (
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          width: "100%",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 8 }}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
            {monthNames[month]} {year}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={{ padding: 8 }}>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View
          style={{
            flexDirection: "row",
            marginBottom: 8,
            justifyContent: "space-around",
          }}
        >
          {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((d) => (
            <Text
              key={d}
              style={{
                width: 30,
                textAlign: "center",
                fontSize: 12,
                color: colors.text + "80",
              }}
            >
              {d}
            </Text>
          ))}
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "flex-start",
          }}
        >
          {days.map((date, idx) => {
            if (!date)
              return (
                <View key={idx} style={{ width: "14.28%", aspectRatio: 1 }} />
              );
            const isSelected =
              selected && date.toDateString() === selected.toDateString();
            const isToday = today.toDateString() === date.toDateString();
            const disabled = isDateDisabled(date);

            return (
              <TouchableOpacity
                key={idx}
                disabled={disabled}
                style={{
                  width: "14.28%",
                  aspectRatio: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isSelected
                    ? colors.primary
                    : isToday
                      ? colors.primary + "20"
                      : "transparent",
                  borderRadius: 20,
                  borderWidth: isToday && !isSelected ? 1 : 0,
                  borderColor: colors.primary,
                  opacity: disabled ? 0.3 : 1,
                }}
                onPress={() => {
                  setSelected(date);
                  onSelect(date);
                }}
              >
                <Text
                  style={{
                    color: isSelected
                      ? "#fff"
                      : isToday
                        ? colors.primary
                        : colors.text,
                    fontWeight: isSelected || isToday ? "700" : "400",
                  }}
                >
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={onClose}
          style={{ marginTop: 16, alignSelf: "center", paddingVertical: 8 }}
        >
          <Text style={{ color: colors.error }}>Fermer</Text>
        </TouchableOpacity>
      </View>
    );
  };
  const [loginCode, setLoginCode] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [addressValue, setAddressValue] = useState("");
  const [initials, setInitials] = useState("--");

  useEffect(() => {
    (async () => {
      const workDateStr = await secureGetItem("work_date");
      let serverDate: Date;
      if (workDateStr) {
        // Format attendu : DD/MM/YYYY
        const parts = workDateStr.split("/");
        if (parts.length === 3) {
          serverDate = new Date(
            Number(parts[2]),
            Number(parts[1]) - 1,
            Number(parts[0]),
          );
        } else {
          serverDate = new Date(workDateStr);
        }
        if (isNaN(serverDate.getTime())) serverDate = new Date();
      } else {
        serverDate = new Date();
      }
      setStartDate(serverDate);
      setEndDate(serverDate);
    })();
  }, []);

  const loadProfile = async () => {
    const fn = (await secureGetItem("user_firstname")) || "";
    const ln = (await secureGetItem("user_lastname")) || "";
    const login =
      (await secureGetItem("user_login")) || (user as any)?.username || "";
    const email = (user as any)?.email || "";
    let phone =
      (user as any)?.phone || (await secureGetItem("user_phone")) || "";

    // Tentative de récupération depuis user_data si user.phone est vide
    if (!phone) {
      try {
        const ud = await secureGetItem("user_data");
        if (ud) {
          const parsed = JSON.parse(ud);
          phone =
            parsed.phone ||
            parsed.PHONE ||
            parsed.telephone ||
            parsed.TELEPHONE ||
            "";
        }
      } catch {}
    }

    let address = (await secureGetItem("user_address")) || "";
    if (!phone || !address) {
      const access = await secureGetItem("access_data");
      try {
        const raw = access ? JSON.parse(access) : null;
        const normalize = (r: any) => {
          const d = r?.data ?? r;
          if (Array.isArray(d)) return d[0] ?? {};
          if (Array.isArray(d?.data)) return d.data[0] ?? {};
          if (Array.isArray(d?.result)) return d.result[0] ?? {};
          if (Array.isArray(d?.payload)) return d.payload[0] ?? {};
          if (d?.data && typeof d.data === "object") return d.data;
          return d ?? {};
        };
        const pick = (obj: any, patterns: string[]) => {
          if (!obj) return undefined;
          const keys = Object.keys(obj);
          for (const p of patterns) {
            const np = p.toLowerCase().replace(/_/g, "");
            for (const k of keys) {
              const nk = k.toLowerCase().replace(/_/g, "");
              if (nk === np) return obj[k];
            }
          }
          return undefined;
        };
        const block = normalize(raw);
        phone =
          phone ||
          pick(block, [
            "CL_TELEPHONE", // Ajouté en premier car le plus probable
            "CL_TELEPHONECLIENT",
            "CONTACTCLIENT",
            "TELEPHONE",
            "TEL",
            "PHONE",
            "MOBILE",
            "GSM",
            "CONTACT",
          ]) ||
          "";
        address =
          address ||
          pick(block, [
            "CL_ADRESSECLIENT",
            "ADRESSE",
            "ADDRESS",
            "LOCALISATION",
            "VILLE",
            "CITY",
            "LOCATION",
          ]) ||
          "";
      } catch {}
    }
    const name = ((user as any)?.name || `${fn} ${ln}`.trim() || login).trim();
    setDisplayName(name);
    setLoginCode(login);
    setEmailValue(email || "—");
    setPhoneValue(phone || "—");
    setAddressValue(address || "—");
    const parts = name.split(" ").filter(Boolean);
    const init = (parts[0]?.[0] || "-") + (parts[1]?.[0] || "-");
    setInitials(init.toUpperCase());
  };

  useEffect(() => {
    loadProfile();
  }, [user]);
  useEffect(() => {
    const unsub = (navigation as any)?.addListener?.("focus", loadProfile);
    return typeof unsub === "function" ? unsub : undefined;
  }, [navigation]);

  useEffect(() => {
    (async () => {
      if (
        phoneValue === "—" ||
        !phoneValue ||
        addressValue === "—" ||
        !addressValue
      ) {
        const acc = await secureGetItem("user_account_number");
        if (acc) await fetchClientInfo({ NUMCOMPTE: acc });
      }
    })();
  }, [phoneValue, addressValue]);

  useEffect(() => {
    if (clientData) {
      const ph = (clientData as any)?.phone || "";
      const addr = (clientData as any)?.address || "";
      if (ph) setPhoneValue(ph);
      if (addr) setAddressValue(addr);
    }
  }, [clientData]);

  type TxItem = {
    id: string;
    title: string;
    amount: string;
    date: string;
    type: "entree" | "sortie";
  };
  const [txData, setTxData] = useState<TxItem[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const fetchTransactions = async (start?: Date | null, end?: Date | null) => {
    setTxError(null);
    setTxLoading(true);
    try {
      const clientId = await secureGetItem("client_id");
      const token = await secureGetItem("auth_token");
      const loginSaved = await secureGetItem("user_login");
      const agency = (await secureGetItem("user_agency")) || "";
      const account = (await secureGetItem("user_account_number")) || "";
      if (!token) {
        setTxError(t("common.missingCredentials"));
        setTxLoading(false);
        return;
      }
      const headers: any = {
        Authorization: `Bearer ${token}`,
      };

      if (start && end) {
        // Validation : La plage ne doit pas dépasser 30 jours
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 30) {
          setTxError("La plage de dates ne doit pas dépasser 30 jours.");
          setTxLoading(false);
          return;
        }

        // Mode filtre par date
        const formatDate = (d: Date) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          // Format DD/MM/YYYY pour compatibilité SQL Server (nvarchar -> datetime)
          return `${day}/${month}/${year}`;
        };

        const payload = {
          CodeCryptage: "Y}@128eVIXfoi7",
          DateDebut: formatDate(start),
          DateFin: formatDate(end),
          Nombretransactions: "20",
          ...(clientId ? { CLIENT_ID: clientId } : {}),
          ...(account ? { CO_CODECOMPTE: String(account).replace(/\D/g, "") } : {}),
        };

        const result: any = await dernieresOperationsClient(payload, headers);
        if (result?.error) {
          const err: any = result.error;
          const server = err?.response?.data;
          const msg = server?.message || err?.message || t("common.fetchError");
          setTxError(msg);
          return;
        }

        // Adaptation pour structure imbriquée : result.data.data.operations
        const dataPayload = result?.data;
        const ops =
          dataPayload?.operations || dataPayload?.data?.operations || [];

        // Deduplication
        const uniqueOps = (Array.isArray(ops) ? ops : []).filter(
          (item: any, index: number, self: any[]) =>
            index ===
            self.findIndex((t) => {
              const titleMatch =
                String(t.MC_LIBELLEOPERATION || "").trim() ===
                String(item.MC_LIBELLEOPERATION || "").trim();
              const dateMatch =
                String(t.MC_DATESAISIE || t.MC_DATEPIECE || "") ===
                String(item.MC_DATESAISIE || item.MC_DATEPIECE || "");

              const tAmt = Math.max(
                Number(t.MC_MONTANTDEBIT || 0),
                Number(t.MC_MONTANTCREDIT || 0),
              );
              const itemAmt = Math.max(
                Number(item.MC_MONTANTDEBIT || 0),
                Number(item.MC_MONTANTCREDIT || 0),
              );
              const amtMatch = tAmt === itemAmt;

              return titleMatch && dateMatch && amtMatch;
            }),
        );

        const mapped = uniqueOps.map((op: any, index: number) => {
          let debit = Number(op.MC_MONTANTDEBIT || 0);
          let credit = Number(op.MC_MONTANTCREDIT || 0);
          const title = String(op.MC_LIBELLEOPERATION || "Opération");

          // FIX: Ouverture = Debit
          if (title.toUpperCase().includes("OUVERTURE")) {
            if (credit > 0 && debit === 0) {
              debit = credit;
              credit = 0;
            }
          }

          let isCredit = credit > 0;
          if (title.toUpperCase().includes("OUVERTURE")) isCredit = false;

          const amountVal = isCredit ? credit : debit;
          const amount = `${isCredit ? "+" : "-"}${amountVal.toLocaleString(
            "fr-FR",
          )} XOF`;

          return {
            id: String(index),
            title,
            amount,
            date: op.MC_DATESAISIE || op.DateOperation || "",
            type: isCredit ? "entree" : "sortie",
          } as TxItem;
        });
        setTxData(mapped);
      } else {
        // Mode défaut : Dernière transaction -> Remplacé par historique complet par défaut (sans date)
        // On utilise les dates par défaut (01/01/1900 à aujourd'hui) si aucune date n'est fournie,
        // ou on charge les X dernières transactions.

        // Pour correspondre à la requête fournie par l'utilisateur:
        const today = new Date();
        const formatDate = (d: Date) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          // Format DD/MM/YYYY
          return `${day}/${month}/${year}`;
        };

        const payload = {
          CodeCryptage: "Y}@128eVIXfoi7",
          DateDebut: "01/01/1900",
          DateFin: formatDate(today),
          Nombretransactions: "10",
          ...(clientId ? { CLIENT_ID: clientId } : {}),
          ...(account ? { CO_CODECOMPTE: String(account).replace(/\D/g, "") } : {}),
        };

        const result: any = await dernieresOperationsClient(payload, headers);

        if (result?.error) {
          // Fallback silencieux ou gestion d'erreur légère
          console.log(
            "Erreur chargement transactions par défaut",
            result.error,
          );
        }

        // Adaptation pour structure imbriquée
        const dataPayload = result?.data;
        const ops =
          dataPayload?.operations || dataPayload?.data?.operations || [];

        // Deduplication
        const uniqueOps = (Array.isArray(ops) ? ops : []).filter(
          (item: any, index: number, self: any[]) =>
            index ===
            self.findIndex((t) => {
              const titleMatch =
                String(t.MC_LIBELLEOPERATION || "").trim() ===
                String(item.MC_LIBELLEOPERATION || "").trim();
              const dateMatch =
                String(t.MC_DATESAISIE || t.MC_DATEPIECE || "") ===
                String(item.MC_DATESAISIE || item.MC_DATEPIECE || "");

              const tAmt = Math.max(
                Number(t.MC_MONTANTDEBIT || 0),
                Number(t.MC_MONTANTCREDIT || 0),
              );
              const itemAmt = Math.max(
                Number(item.MC_MONTANTDEBIT || 0),
                Number(item.MC_MONTANTCREDIT || 0),
              );
              const amtMatch = tAmt === itemAmt;

              return titleMatch && dateMatch && amtMatch;
            }),
        );

        const mapped = uniqueOps.map((op: any, index: number) => {
          let debit = Number(op.MC_MONTANTDEBIT || 0);
          let credit = Number(op.MC_MONTANTCREDIT || 0);
          const title = String(op.MC_LIBELLEOPERATION || "Opération");

          // FIX: Ouverture = Debit
          if (title.toUpperCase().includes("OUVERTURE")) {
            if (credit > 0 && debit === 0) {
              debit = credit;
              credit = 0;
            }
          }

          let isCredit = credit > 0;
          if (title.toUpperCase().includes("OUVERTURE")) isCredit = false;

          const amountVal = isCredit ? credit : debit;
          const amount = `${isCredit ? "+" : "-"}${amountVal.toLocaleString(
            "fr-FR",
          )} XOF`;

          return {
            id: String(index),
            title,
            amount,
            date: op.MC_DATESAISIE || op.MC_DATEPIECE || "",
            type: isCredit ? "entree" : "sortie",
          } as TxItem;
        });
        setTxData(mapped);
      }
    } catch (e: any) {
      setTxError(e?.message || t("common.networkError"));
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    if (txVisible) {
      fetchTransactions();
    }
  }, [txVisible]);

  const handleLogout = async () => {
    try {
      // Vérifier si nous sommes en mode invité
      const isGuestMode = user?.username === "invite";
      if (Platform.OS === "web") {
        await logout();
        try {
          (navigation as any).reset({
            index: 0,
            routes: [
              { name: (isGuestMode ? "InitialSetup" : "PinLogin") as never },
            ],
          });
        } catch (error) {
          (navigation as any).navigate(
            (isGuestMode ? "InitialSetup" : "PinLogin") as never,
          );
        }
        return;
      }

      if (isGuestMode) {
        Alert.alert(t("logout.guest.title"), t("logout.guest.message"), [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("logout.guest.confirm"),
            style: "destructive",
            onPress: async () => {
              console.log("=== GUEST LOGOUT CONFIRMED ===");
              // Pour le mode invité : tout effacer et rediriger vers InitialSetupScreen
              await logout(); // Efface les données d'authentification

              // Rediriger vers InitialSetupScreen
              try {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "InitialSetup" as never }],
                });
              } catch (error) {
                // Fallback si reset n'est pas disponible
                console.log("Navigation reset failed, trying navigate...");
                navigation.navigate("InitialSetup" as never);
              }

              console.log(
                "Guest user logged out and redirected to InitialSetupScreen",
              );
            },
          },
        ]);
      } else {
        Alert.alert(t("logout.title"), t("logout.message"), [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("settings.logout"),
            style: "destructive",
            onPress: async () => {
              // Soft Logout par défaut (conserve le PIN)
              await logout();
              console.log("Regular user logged out (Soft)");
              try {
                (navigation as any).reset({
                  index: 0,
                  routes: [{ name: "PinLogin" }],
                });
              } catch (error) {
                (navigation as any).navigate("PinLogin" as never);
              }
            },
          },
          // Option explicite pour suppression complète
          {
            text: "Déconnexion et suppression",
            style: "destructive",
            onPress: async () => {
              // Hard Logout (Full wipe)
              if (fullLogout) {
                await fullLogout();
              } else {
                // Fallback
                const {
                  secureDeleteItem,
                } = require("../../../shared/utils/secureStorage");
                await secureDeleteItem("is_configured");
                await secureDeleteItem("pin_user");
                await secureDeleteItem("user_login");
                await logout();
              }

              console.log("User logged out AND data wiped");
              try {
                // Redirection explicite vers l'écran de saisie de token (InitialSetup)
                // On passe le paramètre 'reset: true' pour forcer l'état initial
                (navigation as any).reset({
                  index: 0,
                  routes: [{ 
                    name: "InitialSetup",
                    params: { reset: true }
                  }],
                });
              } catch (error) {
                (navigation as any).navigate("InitialSetup", { reset: true });
              }
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleCall = () => {
    const phone = "+2250707070707";
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = () => {
    const email = "support@agirfinance.ci";
    const subject = encodeURIComponent("Demande de modification de profil");
    const body = encodeURIComponent(
      "Bonjour,\n\nJe souhaite mettre à jour mes informations personnelles. Pourriez-vous m'indiquer la procédure ?\n\nMerci.",
    );
    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  // Génération HTML du reçu des transactions
  const generateTransactionsHtml = () => {
    const titleTrans = t("transactions.history.title");
    const itemsHtml = txData
      .map((t) => {
        const isEntree = t.type === "entree";
        const color = isEntree ? "#27AE60" : "#EB5757";
        const iconBg = isEntree ? "#E9FFF3" : "#FFECEC";
        const arrow = isEntree ? "↓" : "↑";
        return `
        <div style="display:flex;align-items:center;justify-content:space-between;background:#F9FAFB;padding:12px;border-radius:12px;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:28px;height:28px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:${iconBg};color:${color};font-weight:700;">${arrow}</div>
            <div>
              <div style="font-size:15px;color:#000;margin-bottom:2px;">${t.title}</div>
              <div style="font-size:12px;color:#777;">${t.date}</div>
            </div>
          </div>
          <div style="font-size:15px;font-weight:600;color:${color};">${t.amount}</div>
        </div>
      `;
      })
      .join("");

    return `
      <html>
        <head>
          <meta charset="utf-8" />
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; padding:20px;">
          <div style="text-align:center;margin-bottom:12px;">
            <div style="width:56px;height:6px;border-radius:3px;background:#EAEAEA;margin:0 auto 8px;"></div>
            <h1 style="margin:0;font-size:26px;color:#000;">${titleTrans}</h1>
          </div>
          <div style="margin-top:10px;">
            ${itemsHtml}
          </div>
        </body>
      </html>
    `;
  };

  const handleExportTransactionsPdf = async () => {
    try {
      const html = generateTransactionsHtml();
      const { uri } = await Print.printToFileAsync({ html });
      const fileName = `Transactions_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      // Partage natif si disponible
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: "com.adobe.pdf",
          mimeType: "application/pdf",
        });
      } else {
        // Fallback web: ouvrir le fichier
        // @ts-ignore
        if (typeof window !== "undefined") window.open(uri, "_blank");
      }
    } catch (e) {
      console.log("Export PDF transactions error", e);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={[styles.hero, { backgroundColor: colors.primary, paddingTop: insets.top + 16 }]}>

          {/* Back button inside hero */}
          <TouchableOpacity
            onPress={() => (navigation as any).goBack()}
            style={[styles.heroBack, { top: insets.top + 8 }]}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={[styles.avatarCircle, { borderColor: "rgba(255,255,255,0.5)" }]}>
              <Text style={styles.avatarInitials}>{initials || "—"}</Text>
            </View>
            <View style={[styles.avatarCamera, { backgroundColor: colors.success }]}>
              <Ionicons name="camera" size={13} color="#fff" />
            </View>
          </View>

          <Text style={styles.heroName}>{displayName || "—"}</Text>
          <Text style={styles.heroLogin}>{loginCode || "—"}</Text>

          <View style={styles.heroBadge}>
            <Ionicons name="shield-checkmark" size={13} color="#fff" />
            <Text style={styles.heroBadgeText}>{t("profile.memberSince")}</Text>
          </View>

          {/* Quick stats */}
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Ionicons name="mail-outline" size={15} color="rgba(255,255,255,0.75)" />
              <Text style={styles.heroStatVal} numberOfLines={1}>{emailValue}</Text>
            </View>
            <View style={styles.heroStatSep} />
            <View style={styles.heroStat}>
              <Ionicons name="call-outline" size={15} color="rgba(255,255,255,0.75)" />
              <Text style={styles.heroStatVal} numberOfLines={1}>{phoneValue}</Text>
            </View>
          </View>
        </View>

        {/* ── Infos personnelles ── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionLabelRow}>
            <Text style={[styles.sectionLabel, { color: colors.text + "55" }]}>
              {t("profile.section.personalInfo").toUpperCase()}
            </Text>
            <TouchableOpacity
              onPress={() => setEditVisible(true)}
              style={[styles.sectionEditBtn, { backgroundColor: colors.primary + "15" }]}
            >
              <Ionicons name="create-outline" size={13} color={colors.primary} />
              <Text style={[styles.sectionEditText, { color: colors.primary }]}>Modifier</Text>
            </TouchableOpacity>
          </View>

          {/* Barre de complétion du profil */}
          {(() => {
            const fields = [emailValue, phoneValue, addressValue];
            const filled = fields.filter(v => v && v !== "—").length;
            const pct = Math.round((filled / fields.length) * 100);
            const barColor = pct === 100 ? colors.success : pct >= 66 ? colors.primary : colors.warning;
            return (
              <View style={[styles.completionWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.completionHeader}>
                  <View style={styles.completionLeft}>
                    <Ionicons
                      name={pct === 100 ? "checkmark-circle" : "person-circle-outline"}
                      size={18}
                      color={barColor}
                    />
                    <Text style={[styles.completionTitle, { color: colors.text }]}>
                      Profil {pct === 100 ? "complet" : `complété à ${pct}%`}
                    </Text>
                  </View>
                  <Text style={[styles.completionPct, { color: barColor }]}>{pct}%</Text>
                </View>
                <View style={[styles.completionTrack, { backgroundColor: colors.border }]}>
                  <View style={[styles.completionFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
                </View>
                {pct < 100 && (
                  <Text style={[styles.completionHint, { color: colors.text + "55" }]}>
                    Contactez le support pour compléter vos informations
                  </Text>
                )}
              </View>
            );
          })()}

          {/* Cartes individuelles */}
          <View style={styles.infoCardsGrid}>
            {[
              {
                icon: "mail",
                iconBg: colors.primary + "18",
                iconColor: colors.primary,
                accentColor: colors.primary,
                label: t("profile.labels.email"),
                value: emailValue,
                copyable: true,
                fullWidth: true,
              },
              {
                icon: "call",
                iconBg: colors.success + "18",
                iconColor: colors.success,
                accentColor: colors.success,
                label: t("profile.labels.phone"),
                value: phoneValue,
                copyable: true,
                fullWidth: true,
              },
              {
                icon: "location",
                iconBg: colors.warning + "18",
                iconColor: colors.warning,
                accentColor: colors.warning,
                label: t("profile.labels.address"),
                value: addressValue,
                copyable: false,
                fullWidth: true,
              },
            ].map((field) => (
              <InfoCard
                key={field.label}
                field={field}
                colors={colors}
                isDark={isDark}
                fullWidth={field.fullWidth}
              />
            ))}
          </View>
        </View>

        {/* ── Documents ── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionLabelRow}>
            <Text style={[styles.sectionLabel, { color: colors.text + "55" }]}>
              {t("profile.section.documents").toUpperCase()}
            </Text>
            <View style={[styles.docCountBadge, { backgroundColor: colors.primary + "15" }]}>
              <Text style={[styles.docCountText, { color: colors.primary }]}>3 services</Text>
            </View>
          </View>

          <View style={styles.docCardsGrid}>
            {[
              {
                icon: "document-text",
                gradient: colors.primary,
                label: t("profile.docs.statements"),
                sub: "Relevés mensuels",
                tag: "PDF",
                tagColor: colors.primary,
                onPress: () => navigation.navigate("Statements" as never),
              },
              {
                icon: "time",
                gradient: colors.success,
                label: t("profile.docs.history"),
                sub: "Toutes vos opérations",
                tag: "Voir",
                tagColor: colors.success,
                onPress: () => setTxVisible(true),
              },
              {
                icon: "cloud-download",
                gradient: "#8B5CF6",
                label: t("profile.docs.downloads"),
                sub: "Fichiers téléchargés",
                tag: "Bientôt",
                tagColor: "#8B5CF6",
                onPress: () => {},
              },
            ].map((item) => (
              <DocCard key={item.label} item={item} colors={colors} isDark={isDark} />
            ))}
          </View>
        </View>

        {/* ── Apparence ── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionLabelRow}>
            <Text style={[styles.sectionLabel, { color: colors.text + "55" }]}>APPARENCE</Text>
            <View style={[styles.docCountBadge, { backgroundColor: colors.primary + "15" }]}>
              <Text style={[styles.docCountText, { color: colors.primary }]}>
                {preference === "light" ? "Clair" : preference === "dark" ? "Sombre" : "Système"}
              </Text>
            </View>
          </View>

          <View style={styles.themeCardsCol}>
            {([
              {
                key: "light",
                icon: "sunny",
                label: "Mode Clair",
                desc: "Interface lumineuse, idéale en journée",
                accent: "#F59E0B",
                previewBg: "#FFF9F0",
                previewBar: "#F59E0B",
              },
              {
                key: "dark",
                icon: "moon",
                label: "Mode Sombre",
                desc: "Repose les yeux, parfait la nuit",
                accent: "#6366F1",
                previewBg: "#1E1E2E",
                previewBar: "#6366F1",
              },
              {
                key: "system",
                icon: "phone-portrait",
                label: "Système",
                desc: "Suit automatiquement votre téléphone",
                accent: colors.primary,
                previewBg: isDark ? "#1E1E2E" : "#FFF9F0",
                previewBar: colors.primary,
              },
            ] as const).map((opt) => {
              const active = preference === opt.key;
              return (
                <ThemeOptionCard
                  key={opt.key}
                  opt={opt}
                  active={active}
                  colors={colors}
                  isDark={isDark}
                  onPress={() => setPreference(opt.key)}
                />
              );
            })}
          </View>
        </View>

        {/* ── Déconnexion ── */}
        <View style={[styles.sectionBlock, { marginBottom: 8 }]}>
          <TouchableOpacity
            style={[styles.logoutCard, { backgroundColor: colors.error + "10", borderColor: colors.error + "30" }]}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <View style={[styles.infoIconBg, { backgroundColor: colors.error + "20" }]}>
              <Ionicons name="log-out-outline" size={18} color={colors.error} />
            </View>
            <Text style={[styles.logoutText, { color: colors.error }]}>
              {user?.username === "invite" ? t("logout.guest.button") : t("settings.logout")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Version ── */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.text + "50" }]}>{t("settings.version")} 1.0.0</Text>
          <Text style={[styles.copyrightText, { color: colors.text + "35" }]}>{t("settings.copyright")}</Text>
        </View>
      </ScrollView>

      {/* Modal Modifier le profil */}
      <Modal
        visible={editVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditVisible(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            {
              backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.35)",
            },
          ]}
        >
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[
                styles.modalClose,
                { backgroundColor: isDark ? "#333" : "#F7F7F7" },
              ]}
              onPress={() => setEditVisible(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <View
              style={[
                styles.modalHandle,
                { backgroundColor: isDark ? "#444" : "#EAEAEA" },
              ]}
            />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("profile.edit.modal.title")}
            </Text>
            <Text
              style={[styles.modalText, { color: isDark ? "#ccc" : "#777" }]}
            >
              {t("profile.edit.modal.note")}
            </Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={handleCall}
              >
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.actionTextLight}>
                  {t("profile.actions.call")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.success }]}
                activeOpacity={0.8}
                onPress={handleEmail}
              >
                <Ionicons name="mail" size={20} color="#fff" />
                <Text style={styles.actionTextLight}>
                  {t("profile.actions.email")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Historique des transactions */}
      <Modal
        visible={txVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTxVisible(false)}
      >
        <View style={styles.txModalOverlay}>
          <View style={[styles.txModalSheet, { backgroundColor: colors.background }]}>

            {/* Handle */}
            <View style={[styles.txModalHandle, { backgroundColor: colors.border }]} />

            {/* Header */}
            <View style={[styles.txModalHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.txModalTitle, { color: colors.text }]}>
                  {t("transactions.history.title")}
                </Text>
                {txData.length > 0 && (
                  <Text style={[styles.txModalSubtitle, { color: colors.text + "55" }]}>
                    {txData.length} opération{txData.length > 1 ? "s" : ""}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setTxVisible(false)}
                style={[styles.txModalCloseBtn, { backgroundColor: isDark ? "#333" : "#F0F0F0" }]}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Résumé entrées / sorties */}
            {txData.length > 0 && (() => {
              const totalIn  = txData.filter(x => x.type === "entree").reduce((acc, x) => {
                const n = parseFloat(x.amount.replace(/[^0-9,]/g, "").replace(",", ".")) || 0;
                return acc + n;
              }, 0);
              const totalOut = txData.filter(x => x.type === "sortie").reduce((acc, x) => {
                const n = parseFloat(x.amount.replace(/[^0-9,]/g, "").replace(",", ".")) || 0;
                return acc + n;
              }, 0);
              return (
                <View style={styles.txSummaryRow}>
                  <View style={[styles.txSummaryCard, { backgroundColor: colors.success + "12", borderColor: colors.success + "30" }]}>
                    <View style={[styles.txSummaryIcon, { backgroundColor: colors.success + "20" }]}>
                      <Ionicons name="arrow-down" size={16} color={colors.success} />
                    </View>
                    <View>
                      <Text style={[styles.txSummaryLabel, { color: colors.text + "55" }]}>Entrées</Text>
                      <Text style={[styles.txSummaryAmount, { color: colors.success }]}>
                        +{totalIn.toLocaleString("fr-FR")} XOF
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.txSummaryCard, { backgroundColor: colors.error + "12", borderColor: colors.error + "30" }]}>
                    <View style={[styles.txSummaryIcon, { backgroundColor: colors.error + "20" }]}>
                      <Ionicons name="arrow-up" size={16} color={colors.error} />
                    </View>
                    <View>
                      <Text style={[styles.txSummaryLabel, { color: colors.text + "55" }]}>Sorties</Text>
                      <Text style={[styles.txSummaryAmount, { color: colors.error }]}>
                        -{totalOut.toLocaleString("fr-FR")} XOF
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })()}

            {/* États chargement / erreur / vide */}
            {txLoading && (
              <View style={styles.txStateWrap}>
                <Ionicons name="hourglass-outline" size={40} color={colors.primary + "60"} />
                <Text style={[styles.txStateText, { color: colors.text + "55" }]}>{t("analytics.loading")}</Text>
              </View>
            )}
            {!txLoading && !!txError && (
              <View style={styles.txStateWrap}>
                <Ionicons name="alert-circle-outline" size={40} color={colors.error + "80"} />
                <Text style={[styles.txStateText, { color: colors.error }]}>{txError}</Text>
              </View>
            )}
            {!txLoading && !txError && txData.length === 0 && (
              <View style={styles.txStateWrap}>
                <Ionicons name="receipt-outline" size={48} color={colors.text + "25"} />
                <Text style={[styles.txStateText, { color: colors.text + "45" }]}>Aucune transaction trouvée</Text>
                <Text style={[styles.txStateHint, { color: colors.text + "30" }]}>Modifiez la plage de dates</Text>
              </View>
            )}

            {/* Liste */}
            {!txLoading && !txError && txData.length > 0 && (
              <ScrollView
                style={styles.txScrollList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                {txData.map((item, index) => {
                  const isEntree = item.type === "entree";
                  const showDateSep = index === 0 || txData[index - 1].date !== item.date;
                  return (
                    <View key={item.id}>
                      {showDateSep && item.date ? (
                        <View style={styles.txDateSep}>
                          <View style={[styles.txDateSepLine, { backgroundColor: colors.border }]} />
                          <Text style={[styles.txDateSepText, { color: colors.text + "45", backgroundColor: colors.background }]}>
                            {item.date}
                          </Text>
                          <View style={[styles.txDateSepLine, { backgroundColor: colors.border }]} />
                        </View>
                      ) : null}
                      <View style={[styles.txItemNew, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={[
                          styles.txItemIcon,
                          { backgroundColor: isEntree ? (isDark ? "#1a3d2e" : "#E9FFF3") : (isDark ? "#4a1a1a" : "#FFECEC") }
                        ]}>
                          <Ionicons
                            name={isEntree ? "arrow-down" : "arrow-up"}
                            size={18}
                            color={isEntree ? colors.success : colors.error}
                          />
                        </View>
                        <View style={styles.txItemTexts}>
                          <Text style={[styles.txItemTitle, { color: colors.text }]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={[styles.txItemDate, { color: colors.text + "50" }]}>
                            {item.date}
                          </Text>
                        </View>
                        <View style={styles.txItemRight}>
                          <Text style={[styles.txItemAmount, { color: isEntree ? colors.success : colors.error }]}>
                            {item.amount}
                          </Text>
                          <View style={[
                            styles.txItemTypeBadge,
                            { backgroundColor: isEntree ? colors.success + "15" : colors.error + "15" }
                          ]}>
                            <Text style={[styles.txItemTypeText, { color: isEntree ? colors.success : colors.error }]}>
                              {isEntree ? "Crédit" : "Débit"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {/* Barre d'actions fixe en bas */}
            <View style={[styles.txBottomBar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
              <TouchableOpacity
                style={[styles.txBottomBtn, { backgroundColor: isDark ? "#2a2a2a" : "#F5F5F5", borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() => setDateInfoVisible(true)}
              >
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text style={[styles.txBottomBtnText, { color: colors.primary }]}>
                  {t("transactions.filterByDate")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.txBottomBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={handleExportTransactionsPdf}
              >
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={[styles.txBottomBtnText, { color: "#fff" }]}>
                  {t("transactions.exportPdf")}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* Modal Info filtre par date (Maintenant selecteur de date) */}
      <Modal
        visible={dateInfoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDateInfoVisible(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            {
              backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.35)",
            },
          ]}
        >
          {showDatePicker ? (
            <CustomCalendar
              initialDate={
                showDatePicker === "start"
                  ? startDate || new Date()
                  : endDate || new Date()
              }
              minDate={
                showDatePicker === "end" && startDate ? startDate : undefined
              }
              maxDate={
                showDatePicker === "start"
                  ? (startDate ?? new Date()) // Impossible de sélectionner après la date serveur
                  : (() => {
                      const today = startDate ?? new Date();
                      if (startDate) {
                        const limit = new Date(startDate);
                        limit.setDate(limit.getDate() + 30);
                        return limit < today ? limit : today; // Limite à 30 jours et pas de futur
                      }
                      return today;
                    })()
              }
              onSelect={(date) => {
                if (showDatePicker === "start") {
                  setStartDate(date);
                  // Reset end date if it becomes invalid
                  if (endDate && date > endDate) {
                    setEndDate(null);
                  }
                } else {
                  setEndDate(date);
                }
                setShowDatePicker(null);
              }}
              onClose={() => setShowDatePicker(null)}
            />
          ) : (
            <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                style={[
                  styles.modalClose,
                  { backgroundColor: isDark ? "#333" : "#F7F7F7" },
                ]}
                onPress={() => setDateInfoVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.modalHandle} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Filtrer par date
              </Text>
              <Text
                style={[styles.modalText, { color: isDark ? "#ccc" : "#777" }]}
              >
                Sélectionnez une plage de dates pour filtrer vos transactions.
              </Text>

              <View style={{ gap: 12, width: "100%", marginBottom: 20 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 16,
                    backgroundColor: isDark ? "#333" : "#F5F5F5",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  onPress={() => setShowDatePicker("start")}
                >
                  <Text style={{ color: colors.text + "80" }}>Du :</Text>
                  <Text style={{ fontWeight: "600", color: colors.text }}>
                    {startDate
                      ? startDate.toLocaleDateString("fr-FR")
                      : "Sélectionner"}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 16,
                    backgroundColor: isDark ? "#333" : "#F5F5F5",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  onPress={() => setShowDatePicker("end")}
                >
                  <Text style={{ color: colors.text + "80" }}>Au :</Text>
                  <Text style={{ fontWeight: "600", color: colors.text }}>
                    {endDate
                      ? endDate.toLocaleDateString("fr-FR")
                      : "Sélectionner"}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: colors.primary,
                      flex: 1,
                      justifyContent: "center",
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    // Ici on appliquerait le filtre
                    setDateInfoVisible(false);
                    fetchTransactions(startDate, endDate);
                  }}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.actionTextLight}>Appliquer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: "transparent",
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setStartDate(null);
                    setEndDate(null);
                  }}
                >
                  <Text style={{ color: colors.text }}>Effacer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },

  // ── Hero ──
  hero: {
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 7,
  },
  heroBack: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarWrap: { marginBottom: 14, position: "relative" },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  avatarInitials: { fontSize: 30, fontWeight: "800", color: "#fff" },
  avatarCamera: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  heroName: { fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  heroLogin: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 3, marginBottom: 10 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 20,
  },
  heroBadgeText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "100%",
    gap: 8,
  },
  heroStat: { flex: 1, flexDirection: "row", alignItems: "center", gap: 7 },
  heroStatVal: { color: "#fff", fontSize: 12, fontWeight: "600", flex: 1 },
  heroStatSep: { width: 1, height: 24, backgroundColor: "rgba(255,255,255,0.3)" },

  // ── Sections ──
  sectionBlock: { marginTop: 20, marginHorizontal: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 8, marginLeft: 4 },
  sectionLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionEditBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  sectionEditText: { fontSize: 12, fontWeight: "600" },

  // ── Card ──
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 2,
  },

  // ── Info rows (legacy) ──
  infoRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  infoIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoTexts: { marginLeft: 12, flex: 1 },
  infoLabel: { fontSize: 11, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: "600" },
  infoStatusDot: { width: 7, height: 7, borderRadius: 4, marginLeft: 8 },
  divider: { height: 1, marginHorizontal: 16 },

  // ── Completion bar ──
  completionWrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  completionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  completionLeft: { flexDirection: "row", alignItems: "center", gap: 7 },
  completionTitle: { fontSize: 13, fontWeight: "600" },
  completionPct: { fontSize: 15, fontWeight: "800" },
  completionTrack: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  completionFill: { height: 6, borderRadius: 3 },
  completionHint: { fontSize: 11, textAlign: "center" },

  // ── Info cards grid ──
  infoCardsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  infoCardItem: {
    width: "47.5%",
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 2,
  },
  infoCardFull: { width: "100%" },
  infoCardAccentBar: { height: 3, width: "100%" },
  infoCardInner: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  infoCardIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  infoCardTexts: { flex: 1, minWidth: 0 },
  infoCardLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.5, marginBottom: 3, textTransform: "uppercase" },
  infoCardValue: { fontSize: 13, fontWeight: "700" },
  infoCardActions: { alignItems: "flex-end", gap: 6, flexShrink: 0 },
  infoCardBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  infoCardBadgeText: { fontSize: 10, fontWeight: "600" },
  infoCardCopyBtn: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  infoCardToast: {
    position: "absolute",
    bottom: 8,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  infoCardToastText: { fontSize: 11, fontWeight: "700", color: "#fff" },

  // ── Action row ──
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  actionRowText: { flex: 1, fontSize: 15, fontWeight: "600" },

  // ── Doc items (legacy) ──
  docItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  docIconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  docTexts: { flex: 1, flexShrink: 1, minWidth: 0 },
  docTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  docSub: { fontSize: 11 },
  docChevronWrap: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },

  // ── Doc cards grid ──
  docCountBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  docCountText: { fontSize: 11, fontWeight: "700" },
  docCardsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  docCardWrap: { width: "47.5%" },
  docCard2: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  docCardBg: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  docCardIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  docCardTitle: { fontSize: 14, fontWeight: "700", lineHeight: 19 },
  docCardSub: { fontSize: 11 },
  docCardTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 2,
  },
  docCardTagText: { fontSize: 11, fontWeight: "700" },

  // ── Theme option cards ──
  themeCardsCol: { gap: 10 },
  themeOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 20,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 2,
  },
  themeOptionIconWrap: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  themeOptionTexts: { flex: 1 },
  themeOptionLabel: { fontSize: 15, fontWeight: "700", marginBottom: 3 },
  themeOptionDesc: { fontSize: 12, lineHeight: 16 },
  themeOptionRight: { alignItems: "center", gap: 8, flexShrink: 0 },
  themePreview: {
    width: 52,
    height: 36,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
  },
  themePreviewBar: { height: 10, width: "100%" },
  themePreviewLines: { padding: 5, gap: 4 },
  themePreviewLine: { height: 4, borderRadius: 2 },
  themeOptionCheck: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  themeOptionCheckEmpty: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },

  // ── Theme cards (legacy) ──
  themeRow: { flexDirection: "row", gap: 10 },
  themeCard: { flex: 1, alignItems: "center", paddingVertical: 16, paddingHorizontal: 8, borderRadius: 18, gap: 8, position: "relative" },
  themeIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  themeLabel: { fontSize: 12, textAlign: "center" },
  themeCheck: { position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  activeCheck: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },

  // ── Logout ──
  logoutCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  logoutText: { fontSize: 16, fontWeight: "700" },

  // ── Version ──
  versionContainer: { alignItems: "center", paddingVertical: 24, paddingBottom: 48 },
  versionText: { fontSize: 13, marginBottom: 4 },
  copyrightText: { fontSize: 12 },

  // ── Modals ──
  modalOverlay: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  modalBox: {
    width: "92%",
    maxWidth: 640,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  modalClose: { position: "absolute", right: 16, top: 12, width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  modalHandle: { width: 56, height: 6, borderRadius: 3, alignSelf: "center", marginBottom: 8 },
  modalTitle: { fontSize: 26, fontWeight: "800", marginBottom: 12 },
  modalText: { fontSize: 16, textAlign: "center", lineHeight: 22, marginBottom: 20 },
  actionsRow: { flexDirection: "row", gap: 16, justifyContent: "center" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  actionTextLight: { fontSize: 18, fontWeight: "700", color: "#fff" },
  txActionsRow: { flexDirection: "row", flexWrap: "wrap", width: "100%", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  actionBtnOutline: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, flexBasis: "48%", flexGrow: 1, minHeight: 48 },
  actionTextPrimary: { fontSize: 16, fontWeight: "700" },
  txActionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3, flexBasis: "48%", flexGrow: 1, minHeight: 48 },
  txList: { marginTop: 4, gap: 10, paddingBottom: 8 },
  txItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12 },
  txLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, flexShrink: 1 },
  txIconBg: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  txTitle: { fontSize: 15, marginBottom: 2, flexShrink: 1, maxWidth: "72%" },
  txDate: { fontSize: 12 },
  txAmount: { fontSize: 15, fontWeight: "600", marginLeft: 8, flexShrink: 0, textAlign: "right" },

  // ── Tx modal bottom sheet ──
  txModalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  txModalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  txModalHandle: { width: 44, height: 5, borderRadius: 3, alignSelf: "center", marginBottom: 12 },
  txModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  txModalTitle: { fontSize: 20, fontWeight: "800" },
  txModalSubtitle: { fontSize: 12, marginTop: 2 },
  txModalCloseBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  txSummaryRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 14 },
  txSummaryCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  txSummaryIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  txSummaryLabel: { fontSize: 11, marginBottom: 2 },
  txSummaryAmount: { fontSize: 13, fontWeight: "800" },
  txStateWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 10 },
  txStateText: { fontSize: 15, fontWeight: "600" },
  txStateHint: { fontSize: 12 },
  txScrollList: { paddingHorizontal: 16 },
  txDateSep: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 10 },
  txDateSepLine: { flex: 1, height: 1 },
  txDateSepText: { fontSize: 11, fontWeight: "600", paddingHorizontal: 6 },
  txItemNew: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  txItemIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  txItemTexts: { flex: 1, minWidth: 0 },
  txItemTitle: { fontSize: 14, fontWeight: "600", marginBottom: 3 },
  txItemDate: { fontSize: 11 },
  txItemRight: { alignItems: "flex-end", gap: 4, flexShrink: 0 },
  txItemAmount: { fontSize: 14, fontWeight: "800" },
  txItemTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  txItemTypeText: { fontSize: 10, fontWeight: "700" },
  txBottomBar: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
  },
  txBottomBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  txBottomBtnText: { fontSize: 14, fontWeight: "700" },

  // kept for compat
  docItemLast: {},
  docLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  docCard: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  editRow: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  editRowLeft: { flexDirection: "row", alignItems: "center" },
  editRowText: { marginLeft: 12, fontSize: 15 },
  headerCard: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, paddingVertical: 20, paddingHorizontal: 16, alignItems: "center" },
  profileName: { fontSize: 18, fontWeight: "700", marginTop: 6 },
  profileCode: { fontSize: 12, marginTop: 2 },
  memberBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginTop: 10, gap: 6 },
  memberText: { fontSize: 12, fontWeight: "600" },
  infoCard: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "600", marginBottom: 8, marginLeft: 4, letterSpacing: 0.5 },
});

export default ProfileScreen;
