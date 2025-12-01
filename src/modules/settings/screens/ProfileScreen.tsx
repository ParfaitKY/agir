import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Linking,
  Alert,
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../../app/hooks/useAuth";
import { useTheme, useThemeMode } from "../../../shared/styles/ThemeProvider";
import { secureGetItem } from "../../../shared/utils/secureStorage";
import { getDerniereTransaction } from "../../../services/compte/derniereTransaction";
import useClientByCompte from "../../../domain/auth/useClientByCompte";

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { logout, user } = useAuth();
  const { colors } = useTheme();
  const { preference, isDark, setPreference } = useThemeMode();
  const [editVisible, setEditVisible] = useState(false);
  const [txVisible, setTxVisible] = useState(false);
  const [dateInfoVisible, setDateInfoVisible] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [addressValue, setAddressValue] = useState("");
  const [initials, setInitials] = useState("--");

  const loadProfile = async () => {
    const fn = (await secureGetItem("user_firstname")) || "";
    const ln = (await secureGetItem("user_lastname")) || "";
    const login =
      (await secureGetItem("user_login")) || (user as any)?.username || "";
    const email = (user as any)?.email || "";
    let phone = (await secureGetItem("user_phone")) || "";
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

  useEffect(() => {
    const run = async () => {
      if (!txVisible) return;
      setTxError(null);
      setTxLoading(true);
      try {
        const clientId = await secureGetItem("client_id");
        const token = await secureGetItem("auth_token");
        const loginSaved = await secureGetItem("user_login");
        const agency = (await secureGetItem("user_agency")) || "";
        const account = (await secureGetItem("user_account_number")) || "";
        if (!token || !clientId || !account) {
          setTxError("Identifiants manquants");
          return;
        }
        const headers: any = {
          Authorization: `Bearer ${token}`,
          "X-CLIENT-ID": clientId,
          ...(loginSaved ? { "X-LOGIN": loginSaved } : {}),
        };
        const payload = {
          AG_CODEAGENCE: String(agency || ""),
          CO_CODECOMPTE: String(account),
          CODECRYPTAGE: "Y}@128eVIXfoi7",
        } as any;
        const result: any = await getDerniereTransaction(payload, headers);
        if (result?.error) {
          const err: any = result.error;
          const server = err?.response?.data;
          const msg =
            server?.message || err?.message || "Erreur de récupération";
          setTxError(msg);
          return;
        }
        const raw = result?.data;
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
        const item = normalize(raw);
        const title =
          pick(item, [
            "LIBELLEOPERATION",
            "LIBELLE",
            "INTITULE",
            "MOTIF",
            "DETAILS",
          ]) || "Dernière opération";
        const amountNum =
          pick(item, ["MONTANTOPERATION", "MONTANT", "MONTANT_TOTAL"]) ?? 0;
        const sens =
          pick(item, ["TYPEOPERATION", "SENS", "TYPE", "NATURE"]) || "";
        const isCredit =
          String(sens).toLowerCase().includes("credit") ||
          Number(amountNum) > 0;
        const amountAbs = Math.abs(Number(amountNum) || 0);
        const amount = `${isCredit ? "+" : "-"}${amountAbs.toLocaleString(
          "fr-FR"
        )} XAF`;
        const date =
          pick(item, ["DATEOPERATION", "DATE", "DATEVALEUR", "OP_DATE"]) ||
          new Date().toLocaleDateString("fr-FR");
        const id = String(
          pick(item, ["IDOPERATION", "REFERENCE", "ID"]) || Date.now()
        );
        setTxData([
          { id, title, amount, date, type: isCredit ? "entree" : "sortie" },
        ]);
      } catch (e: any) {
        setTxError(e?.message || "Erreur réseau");
      } finally {
        setTxLoading(false);
      }
    };
    run();
  }, [txVisible]);

  const handleLogout = async () => {
    try {
      // Vérifier si nous sommes en mode invité
      const isGuestMode = user?.username === "invite";

      if (isGuestMode) {
        // Confirmation spécifique pour le mode invité
        Alert.alert(
          "Quitter le mode invité",
          "Êtes-vous sûr de vouloir quitter le mode invité ? Cela effacera toutes les données temporaires.",
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Quitter",
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
                  "Guest user logged out and redirected to InitialSetupScreen"
                );
              },
            },
          ]
        );
      } else {
        // Pour les utilisateurs normaux : déconnexion standard avec confirmation
        Alert.alert(
          "Déconnexion",
          "Êtes-vous sûr de vouloir vous déconnecter ?",
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Se déconnecter",
              style: "destructive",
              onPress: async () => {
                await logout();
                console.log("Regular user logged out");
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
          ]
        );
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleCall = () => {
    const phone = "+24177683855";
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = () => {
    const email = "support@lapeyrie-emf.com";
    const subject = encodeURIComponent("Demande de modification de profil");
    const body = encodeURIComponent(
      "Bonjour,\n\nJe souhaite mettre à jour mes informations personnelles. Pourriez-vous m'indiquer la procédure ?\n\nMerci."
    );
    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  // Génération HTML du reçu des transactions
  const generateTransactionsHtml = () => {
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
            <h1 style="margin:0;font-size:26px;color:#000;">Historique des transactions</h1>
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header card with avatar and basic info */}
        <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
          <View style={styles.avatarWrap}>
            <View
              style={[styles.avatarCircle, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.avatarInitials, { color: "#fff" }]}>
                {initials}
              </Text>
            </View>
            <View
              style={[styles.avatarCamera, { backgroundColor: colors.success }]}
            >
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {displayName}
          </Text>
          <Text style={[styles.profileCode, { color: colors.text + "60" }]}>
            Login: {loginCode || "—"}
          </Text>
          <View
            style={[
              styles.memberBadge,
              {
                backgroundColor: isDark
                  ? colors.success + "20"
                  : colors.success + "10",
              },
            ]}
          >
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={colors.success}
            />
            <Text style={[styles.memberText, { color: colors.success }]}>
              Membre depuis Octobre 2025
            </Text>
          </View>
        </View>

        {/* Contact information card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <View
              style={[
                styles.infoIconBg,
                {
                  backgroundColor: isDark
                    ? colors.primary + "20"
                    : colors.primary + "10",
                },
              ]}
            >
              <Ionicons name="mail" size={18} color={colors.primary} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={[styles.infoLabel, { color: colors.text + "60" }]}>
                Email
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {emailValue}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.divider,
              { backgroundColor: isDark ? colors.border : "#E5E5EA" },
            ]}
          />
          <View style={styles.infoRow}>
            <View
              style={[
                styles.infoIconBg,
                {
                  backgroundColor: isDark
                    ? colors.success + "20"
                    : colors.success + "10",
                },
              ]}
            >
              <Ionicons name="call" size={18} color={colors.success} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={[styles.infoLabel, { color: colors.text + "60" }]}>
                Téléphone
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {phoneValue}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.divider,
              { backgroundColor: isDark ? "#333" : "#F0F0F0" },
            ]}
          />
          <View style={styles.infoRow}>
            <View
              style={[
                styles.infoIconBg,
                {
                  backgroundColor: isDark
                    ? colors.warning + "20"
                    : colors.warning + "10",
                },
              ]}
            >
              <Ionicons name="location" size={18} color={colors.warning} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={[styles.infoLabel, { color: colors.text + "60" }]}>
                Adresse
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {addressValue}
              </Text>
            </View>
          </View>
        </View>

        {/* Personal section with edit button */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: colors.text + "80" }]}>
            Informations personnelles
          </Text>
          <TouchableOpacity
            style={[styles.editRow, { backgroundColor: colors.card }]}
            activeOpacity={0.8}
            onPress={() => setEditVisible(true)}
          >
            <View style={styles.editRowLeft}>
              <View
                style={[
                  styles.infoIconBg,
                  {
                    backgroundColor: isDark
                      ? colors.primary + "20"
                      : colors.primary + "10",
                  },
                ]}
              >
                <Ionicons name="person" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.editRowText, { color: colors.text }]}>
                Modifier le profil
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={isDark ? "#666" : "#C0C0C0"}
            />
          </TouchableOpacity>
        </View>

        {/* Documents section */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: colors.text + "80" }]}>
            Documents
          </Text>
          <View style={[styles.docCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.docItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate("Statements" as never)}
            >
              <View style={styles.docLeft}>
                <View
                  style={[
                    styles.infoIconBg,
                    {
                      backgroundColor: isDark
                        ? colors.primary + "20"
                        : colors.primary + "10",
                    },
                  ]}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.docTitle, { color: colors.text }]}>
                  Relevés de compte
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={isDark ? "#666" : "#C0C0C0"}
              />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.docItem}
              activeOpacity={0.7}
              onPress={() => setTxVisible(true)}
            >
              <View style={styles.docLeft}>
                <View
                  style={[
                    styles.infoIconBg,
                    {
                      backgroundColor: isDark
                        ? colors.primary + "20"
                        : colors.primary + "10",
                    },
                  ]}
                >
                  <Ionicons
                    name="list-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.docTitle, { color: colors.text }]}>
                  Historique des transactions
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={isDark ? "#666" : "#C0C0C0"}
              />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={[styles.docItem, styles.docItemLast]}
              activeOpacity={0.7}
              onPress={() => console.log("Téléchargements")}
            >
              <View style={styles.docLeft}>
                <View
                  style={[
                    styles.infoIconBg,
                    {
                      backgroundColor: isDark
                        ? colors.primary + "20"
                        : colors.primary + "10",
                    },
                  ]}
                >
                  <Ionicons
                    name="download-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.docTitle, { color: colors.text }]}>
                  Téléchargements
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={isDark ? "#666" : "#C0C0C0"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout card */}
        <View style={styles.sectionBlock}>
          <TouchableOpacity
            style={[
              styles.logoutCard,
              {
                backgroundColor: colors.error + "10",
                borderColor: colors.error + "30",
              },
            ]}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <View style={styles.docLeft}>
              <View
                style={[
                  styles.infoIconBg,
                  { backgroundColor: colors.error + "20" },
                ]}
              >
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color={colors.error}
                />
              </View>
              <Text style={[styles.logoutText, { color: colors.error }]}>
                {user?.username === "invite"
                  ? "Quitter le mode invité"
                  : "Se déconnecter"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Version info */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.text + "60" }]}>
            Version 1.0.0
          </Text>
          <Text style={[styles.copyrightText, { color: colors.text + "40" }]}>
            © 2025 La Pepite EMF
          </Text>
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
              Modifier le profil
            </Text>
            <Text
              style={[styles.modalText, { color: isDark ? "#ccc" : "#777" }]}
            >
              Pour modifier vos informations personnelles, veuillez contacter
              votre agence ou le service client.
            </Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={handleCall}
              >
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.actionTextLight}>Appeler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.success }]}
                activeOpacity={0.8}
                onPress={handleEmail}
              >
                <Ionicons name="mail" size={20} color="#fff" />
                <Text style={styles.actionTextLight}>Email</Text>
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
              Historique des transactions
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
                  Filtrer par date
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
                <Text style={styles.actionTextLight}>Exporter PDF</Text>
              </TouchableOpacity>
            </View>

            {txLoading && (
              <Text style={[styles.infoLabel, { color: colors.text }]}>
                Chargement…
              </Text>
            )}
            {!!txError && (
              <Text style={[styles.infoLabel, { color: colors.error }]}>
                {txError}
              </Text>
            )}

            {/* Liste des transactions */}
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
          </View>
        </View>
      </Modal>

      {/* Modal Info filtre par date */}
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
              Informations
            </Text>
            <Text
              style={[styles.modalText, { color: isDark ? "#ccc" : "#777" }]}
            >
              La sélection de date sera disponible prochainement.
            </Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={() => setDateInfoVisible(false)}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.actionTextLight}>Compris</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrap: {
    marginBottom: 12,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: "700",
  },
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
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 6,
  },
  profileCode: {
    fontSize: 12,
    marginTop: 2,
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
    gap: 6,
  },
  memberText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTexts: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  sectionBlock: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  editRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  editRowText: {
    marginLeft: 12,
    fontSize: 15,
  },
  docCard: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  docItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  docItemLast: {
    borderBottomWidth: 0,
  },
  docLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  docTitle: {
    marginLeft: 12,
    fontSize: 15,
  },
  logoutCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 13,
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
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
  modalClose: {
    position: "absolute",
    right: 16,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalHandle: {
    width: 56,
    height: 6,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
  },
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
  actionTextLight: {
    fontSize: 18,
    fontWeight: "700",
  },
  // Transactions modal styles
  txActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  actionBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 48,
  },
  actionTextPrimary: {
    fontSize: 16,
    fontWeight: "700",
  },
  txActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 48,
  },
  txList: {
    marginTop: 4,
    gap: 10,
    paddingBottom: 8,
  },
  txItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    flexShrink: 1,
  },
  txIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  txTitle: {
    fontSize: 15,
    marginBottom: 2,
    flexShrink: 1,
    maxWidth: "72%",
  },
  txDate: {
    fontSize: 12,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
    flexShrink: 0,
    textAlign: "right",
  },
});

export default ProfileScreen;
const { fetchClientInfo, clientData } = useClientByCompte();
