import React, { useState, useEffect } from "react";
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
} from "react-native";
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

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { logout, fullLogout, user } = useAuth();
  const { colors } = useTheme();
  const { preference, isDark, setPreference } = useThemeMode();
  const { t } = useI18n();
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
    const email = "support@cedaici.com";
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
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>

          {/* Back button inside hero */}
          <TouchableOpacity
            onPress={() => (navigation as any).goBack()}
            style={styles.heroBack}
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

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { icon: "mail",     iconBg: colors.primary + "18", iconColor: colors.primary,  label: t("profile.labels.email"),   value: emailValue,   copyable: true  },
              { icon: "call",     iconBg: colors.success + "18", iconColor: colors.success,  label: t("profile.labels.phone"),   value: phoneValue,   copyable: true  },
              { icon: "location", iconBg: colors.warning + "18", iconColor: colors.warning,  label: t("profile.labels.address"), value: addressValue, copyable: false },
            ].map((row, i, arr) => (
              <View key={row.label}>
                <View style={styles.infoRow}>
                  <View style={[styles.infoIconBg, { backgroundColor: row.iconBg }]}>
                    <Ionicons name={row.icon as any} size={18} color={row.iconColor} />
                  </View>
                  <View style={styles.infoTexts}>
                    <Text style={[styles.infoLabel, { color: colors.text + "50" }]}>{row.label}</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>{row.value}</Text>
                  </View>
                  {row.value !== "—" && (
                    <View style={[styles.infoStatusDot, { backgroundColor: colors.success }]} />
                  )}
                </View>
                {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </View>
            ))}
          </View>
        </View>

        {/* ── Documents ── */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, { color: colors.text + "55" }]}>
            {t("profile.section.documents").toUpperCase()}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              {
                icon: "document-text-outline",
                iconBg: colors.primary + "18",
                iconColor: colors.primary,
                label: t("profile.docs.statements"),
                sub: "Relevés mensuels",
                onPress: () => navigation.navigate("Statements" as never),
              },
              {
                icon: "time-outline",
                iconBg: colors.success + "18",
                iconColor: colors.success,
                label: t("profile.docs.history"),
                sub: "Toutes vos opérations",
                onPress: () => setTxVisible(true),
              },
              {
                icon: "download-outline",
                iconBg: "#8B5CF618",
                iconColor: "#8B5CF6",
                label: t("profile.docs.downloads"),
                sub: "Fichiers téléchargés",
                onPress: () => {},
              },
            ].map((item, i, arr) => (
              <View key={item.label}>
                <TouchableOpacity style={styles.docItem} activeOpacity={0.75} onPress={item.onPress}>
                  <View style={[styles.docIconWrap, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
                  </View>
                  <View style={styles.docTexts}>
                    <Text style={[styles.docTitle, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{item.label}</Text>
                    <Text style={[styles.docSub, { color: colors.text + "50" }]} numberOfLines={1}>{item.sub}</Text>
                  </View>
                  <View style={[styles.docChevronWrap, { backgroundColor: colors.border + "50" }]}>
                    <Ionicons name="chevron-forward" size={14} color={colors.text + "60"} />
                  </View>
                </TouchableOpacity>
                {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </View>
            ))}
          </View>
        </View>

        {/* ── Apparence ── */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, { color: colors.text + "55" }]}>APPARENCE</Text>
          <View style={styles.themeRow}>
            {([
              { key: "light",  icon: "sunny",          label: "Clair",   accent: "#F59E0B" },
              { key: "dark",   icon: "moon",            label: "Sombre",  accent: "#6366F1" },
              { key: "system", icon: "phone-portrait",  label: "Système", accent: colors.primary },
            ] as const).map((opt) => {
              const active = preference === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: active ? opt.accent + "18" : colors.card,
                      borderColor: active ? opt.accent : colors.border,
                      borderWidth: active ? 2 : 1,
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => setPreference(opt.key)}
                >
                  <View style={[styles.themeIconWrap, { backgroundColor: active ? opt.accent + "25" : colors.border + "50" }]}>
                    <Ionicons name={opt.icon as any} size={22} color={active ? opt.accent : colors.text + "50"} />
                  </View>
                  <Text style={[styles.themeLabel, { color: active ? opt.accent : colors.text + "70", fontWeight: active ? "700" : "500" }]}>
                    {opt.label}
                  </Text>
                  {active && (
                    <View style={[styles.themeCheck, { backgroundColor: opt.accent }]}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
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
        animationType="fade"
        onRequestClose={() => setTxVisible(false)}
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
              onPress={() => setTxVisible(false)}
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
              {t("transactions.history.title")}
            </Text>

            {/* Boutons d'action */}
            <View style={styles.txActionsRow}>
              <TouchableOpacity
                style={[
                  styles.actionBtnOutline,
                  { borderColor: colors.border, backgroundColor: colors.card },
                ]}
                activeOpacity={0.8}
                onPress={() => setDateInfoVisible(true)}
              >
                <Ionicons name="calendar" size={18} color={colors.primary} />
                <Text
                  style={[styles.actionTextPrimary, { color: colors.primary }]}
                >
                  {t("transactions.filterByDate")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.txActionBtn,
                  { backgroundColor: colors.primary },
                ]}
                activeOpacity={0.8}
                onPress={handleExportTransactionsPdf}
              >
                <Ionicons name="download" size={18} color="#fff" />
                <Text style={styles.actionTextLight}>
                  {t("transactions.exportPdf")}
                </Text>
              </TouchableOpacity>
            </View>

            {txLoading && (
              <Text style={[styles.infoLabel, { color: colors.text }]}>
                {t("analytics.loading")}
              </Text>
            )}
            {!!txError && (
              <Text style={[styles.infoLabel, { color: colors.error }]}>
                {txError}
              </Text>
            )}

            {/* Liste des transactions */}
            <ScrollView style={{ maxHeight: 300 }}>
              <View style={styles.txList}>
                {txData.map((t) => (
                  <View
                    key={t.id}
                    style={[styles.txItem, { backgroundColor: colors.card }]}
                  >
                    <View style={styles.txLeft}>
                      <View
                        style={[
                          styles.txIconBg,
                          {
                            backgroundColor:
                              t.type === "entree"
                                ? isDark
                                  ? "#1a3d2e"
                                  : "#E9FFF3"
                                : isDark
                                  ? "#4a1a1a"
                                  : "#FFECEC",
                          },
                        ]}
                      >
                        <Ionicons
                          name={t.type === "entree" ? "arrow-down" : "arrow-up"}
                          size={18}
                          color={
                            t.type === "entree" ? colors.success : colors.error
                          }
                        />
                      </View>
                      <View>
                        <Text style={[styles.txTitle, { color: colors.text }]}>
                          {t.title}
                        </Text>
                        <Text
                          style={[styles.txDate, { color: colors.text + "60" }]}
                        >
                          {t.date}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.txAmount,
                        {
                          color:
                            t.type === "entree" ? colors.success : colors.error,
                        },
                      ]}
                    >
                      {t.amount}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
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
    paddingTop: 56,
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

  // ── Info rows ──
  infoRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  infoIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoTexts: { marginLeft: 12, flex: 1 },
  infoLabel: { fontSize: 11, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: "600" },
  infoStatusDot: { width: 7, height: 7, borderRadius: 4, marginLeft: 8 },
  divider: { height: 1, marginHorizontal: 16 },

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

  // ── Doc items ──
  docItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  docIconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  docTexts: { flex: 1, flexShrink: 1, minWidth: 0 },
  docTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  docSub: { fontSize: 11 },
  docChevronWrap: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },

  // ── Theme cards ──
  themeRow: { flexDirection: "row", gap: 10 },
  themeCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 18,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  themeIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  themeLabel: { fontSize: 12, textAlign: "center" },
  themeCheck: { position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },

  // ── Theme check (legacy) ──
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
