import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { secureGetItem } from "../../../shared/utils/secureStorage";
import { dernieresOperationsClient } from "../../../services/compte/dernieresOperationsClient";

const formatDate = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
};
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const useRecentStatements = (count = 6) => {
  const [items, setItems] = React.useState<Array<{ month: string; range: string; size: string }>>([]);
  React.useEffect(() => {
    const list = [];
    for (let i = 0; i < count; i++) {
      const ref = new Date();
      ref.setMonth(ref.getMonth() - i);
      const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
      const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
      list.push({
        month: capitalize(start.toLocaleDateString("fr-FR", { month: "long" })) + ` ${start.getFullYear()}`,
        range: `${formatDate(start)} - ${formatDate(end)}`,
        size: "—",
      });
    }
    setItems(list);
  }, [count]);
  return items;
};

export const StatementsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const statements = useRecentStatements();
  const [downloading, setDownloading] = React.useState<number | null>(null);

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
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text + "45", letterSpacing: 1.5, textTransform: "uppercase" }}>Compte</Text>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text, letterSpacing: -0.3 }}>Relevés</Text>
        </View>
      ),
    });
  }, [navigation, colors]);

  const generateHtml = async (item: { month: string; range: string }) => {
    const number = (await secureGetItem("user_account_number")) || "";
    const fn = (await secureGetItem("user_firstname")) || "";
    const ln = (await secureGetItem("user_lastname")) || "";
    const holder = `${fn} ${ln}`.trim() || (await secureGetItem("user_login")) || "";
    const token = await secureGetItem("auth_token");
    const clientId = await secureGetItem("client_id");
    const login = await secureGetItem("user_login");
    const agency = (await secureGetItem("user_agency")) || "";
    const headers: any = token && clientId ? { Authorization: `Bearer ${token}`, "X-CLIENT-ID": clientId, ...(login ? { "X-LOGIN": login } : {}) } : {};
    const [dateDebut, dateFin] = item.range.split(" - ");
    const payload: any = { AG_CODEAGENCE: agency, CO_CODECOMPTE: number, CODECRYPTAGE: "Y}@128eVIXfoi7", DateDebut: dateDebut, DateFin: dateFin, Nombretransactions: "1000" };
    let rows: any[] = [];
    try {
      const result: any = await dernieresOperationsClient(payload, headers);
      const ops = result?.data?.operations || result?.data?.data?.operations || [];
      const unique = (Array.isArray(ops) ? ops : []).filter((item: any, idx: number, self: any[]) =>
        idx === self.findIndex((t) =>
          String(t.MC_LIBELLEOPERATION || "").trim() === String(item.MC_LIBELLEOPERATION || "").trim() &&
          String(t.MC_DATESAISIE || t.MC_DATEPIECE || "") === String(item.MC_DATESAISIE || item.MC_DATEPIECE || "") &&
          Math.max(Number(t.MC_MONTANTDEBIT || 0), Number(t.MC_MONTANTCREDIT || 0)) === Math.max(Number(item.MC_MONTANTDEBIT || 0), Number(item.MC_MONTANTCREDIT || 0))
        )
      );
      rows = unique.map((op: any) => {
        let debit = Number(op.MC_MONTANTDEBIT || 0);
        let credit = Number(op.MC_MONTANTCREDIT || 0);
        const desc = String(op.MC_LIBELLEOPERATION || "Opération");
        if (desc.toUpperCase().includes("OUVERTURE") && credit > 0 && debit === 0) { debit = credit; credit = 0; }
        return { date: op.MC_DATESAISIE || op.MC_DATEPIECE || "", desc, debit, credit, balance: 0 };
      });
    } catch {}
    if (!rows.length) rows.push({ date: "—", desc: "Aucune opération sur cette période", debit: 0, credit: 0, balance: 0 });
    const totalCredit = rows.reduce((s, r) => s + Number(r.credit || 0), 0);
    const totalDebit = rows.reduce((s, r) => s + Number(r.debit || 0), 0);
    const currency = (n: number) => `${n.toLocaleString("fr-FR")} XOF`;
    return `<!doctype html><html lang="fr"><head><meta charset="utf-8"/><title>Relevé - ${item.month}</title>
    <style>body{font-family:Arial,sans-serif;color:#000;margin:24px}.brand{color:#2F80ED;font-weight:800;font-size:28px}.divider{height:2px;background:#2F80ED;margin:10px 0 20px}.table{width:100%;border-collapse:collapse;margin-top:16px}.table th{background:#2F80ED;color:#fff;padding:10px;font-size:12px}.table td{border-bottom:1px solid #EEE;padding:10px;font-size:12px}.footer{text-align:center;color:#888;font-size:10px;margin-top:24px}</style>
    </head><body><div style="text-align:center"><div class="brand">CEDAICI SA</div><div style="font-size:20px;font-weight:700">RELEVÉ DE COMPTE</div></div><div class="divider"></div>
    <div style="border:1px solid #E5EAF0;border-radius:8px;padding:14px"><div>Période: <span style="float:right">${item.month}</span></div><div>Dates: <span style="float:right">${item.range}</span></div><div>Compte: <span style="float:right">${number}</span></div><div>Titulaire: <span style="float:right">${holder}</span></div></div>
    <table class="table"><thead><tr><th>Date</th><th>Description</th><th>Débit</th><th>Crédit</th><th>Solde</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td>${r.date}</td><td>${r.desc}</td><td style="color:${Number(r.debit)>0?"#EB5757":"#777"}">${Number(r.debit)>0?currency(Number(r.debit)):"-"}</td><td style="color:${Number(r.credit)>0?"#27AE60":"#777"}">${Number(r.credit)>0?currency(Number(r.credit)):"-"}</td><td>${currency(r.balance)}</td></tr>`).join("")}
    </tbody></table>
    <div style="border:1px solid #E5EAF0;border-radius:8px;padding:16px;margin-top:20px"><div>Total crédits: <span style="color:#27AE60;font-weight:700">+${currency(totalCredit)}</span></div><div>Total débits: <span style="color:#EB5757;font-weight:700">-${currency(totalDebit)}</span></div></div>
    <div class="footer">Généré le ${new Date().toLocaleString("fr-FR")} · CEDAICI SA · Abidjan, Côte d'Ivoire</div></body></html>`;
  };

  const handleDownload = async (item: { month: string; range: string }, idx: number) => {
    setDownloading(idx);
    try {
      const html = await generateHtml(item);
      if (Platform.OS === "web") { await Print.printAsync({ html }); return; }
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri);
    } finally { setDownloading(null); }
  };

  const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Info banner */}
        <View style={[s.banner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "25" }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={[s.bannerText, { color: colors.text + "80" }]}>
            Téléchargez vos relevés mensuels au format PDF
          </Text>
        </View>

        <Text style={[s.sectionLabel, { color: colors.text + "50" }]}>6 DERNIERS MOIS</Text>

        {statements.map((item, idx) => {
          const monthShort = MONTHS[new Date().getMonth() - idx < 0 ? 12 + (new Date().getMonth() - idx) : new Date().getMonth() - idx] ?? "—";
          const isLoading = downloading === idx;
          return (
            <View key={idx} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Month badge */}
              <View style={[s.monthBadge, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[s.monthBadgeText, { color: colors.primary }]}>{monthShort}</Text>
              </View>

              <View style={s.cardBody}>
                <Text style={[s.cardTitle, { color: colors.text }]}>{item.month}</Text>
                <Text style={[s.cardRange, { color: colors.text + "50" }]}>{item.range}</Text>
              </View>

              <TouchableOpacity
                style={[s.dlBtn, { backgroundColor: isLoading ? colors.border : colors.primary }]}
                onPress={() => handleDownload(item, idx)}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Ionicons name={isLoading ? "hourglass-outline" : "download-outline"} size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  banner: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 20 },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 18 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 12 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
  },
  monthBadge: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  monthBadgeText: { fontSize: 12, fontWeight: "800" },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardRange: { fontSize: 12, marginTop: 2 },
  dlBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
});

export default StatementsScreen;
