import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { secureGetItem } from "../../../shared/utils/secureStorage";
import { dernieresOperationsClient } from "../../../services/compte/dernieresOperationsClient";

const formatDate = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const useRecentStatements = (count: number = 6) => {
  const [items, setItems] = React.useState<
    Array<{ month: string; range: string; size: string }>
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const list: Array<{ month: string; range: string; size: string }> = [];
    for (let i = 0; i < count; i++) {
      const ref = new Date();
      ref.setHours(0, 0, 0, 0);
      ref.setMonth(ref.getMonth() - i);
      const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
      const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
      const monthLabel =
        capitalize(start.toLocaleDateString("fr-FR", { month: "long" })) +
        ` ${start.getFullYear()}`;
      const range = `${formatDate(start)} - ${formatDate(end)}`;
      list.push({ month: monthLabel, range, size: "—" });
    }
    setItems(list);
    setLoading(false);
  }, [count]);
  return { items, loading };
};

export const StatementsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { items: statements, loading } = useRecentStatements();

  const generateHtml = async (item: { month: string; range: string }) => {
    const company = {
      name: "CEDAICI SA",
      city: "Abidjan, Côte d'Ivoire",
      phone: "+225 27 22 22 22 22",
    };
    const number = (await secureGetItem("user_account_number")) || "";
    const fn = (await secureGetItem("user_firstname")) || "";
    const ln = (await secureGetItem("user_lastname")) || "";
    const holder =
      `${fn} ${ln}`.trim() || (await secureGetItem("user_login")) || "";
    const token = await secureGetItem("auth_token");
    const clientId = await secureGetItem("client_id");
    const login = await secureGetItem("user_login");
    const agency = (await secureGetItem("user_agency")) || "";
    const headers: any =
      token && clientId
        ? {
            Authorization: `Bearer ${token}`,
            "X-CLIENT-ID": clientId,
            ...(login ? { "X-LOGIN": login } : {}),
          }
        : {};

    const [dateDebut, dateFin] = item.range.split(" - ");
    // La variable dateDebut et dateFin étaient redondantes ou mal utilisées par rapport à l'item.range
    // On s'assure d'utiliser les variables définies plus bas ou directement item.range.
    // Suppression de cette ligne pour éviter la confusion, on utilisera item.range directement dans le payload.

    const payload: any = {
      AG_CODEAGENCE: String(agency || ""),
      CO_CODECOMPTE: String(number || ""),
      CODECRYPTAGE: "Y}@128eVIXfoi7",
      DateDebut: dateDebut,
      DateFin: dateFin,
      Nombretransactions: "1000",
    };

    let rows: any[] = [];

    try {
      const result: any = await dernieresOperationsClient(payload, headers);
      const dataPayload = result?.data;

      const ops =
        dataPayload?.operations || dataPayload?.data?.operations || [];

      rows = (Array.isArray(ops) ? ops : []).map((op: any) => {
        const debit = Number(op.MC_MONTANTDEBIT || 0);
        const credit = Number(op.MC_MONTANTCREDIT || 0);
        const balance = 0;

        return {
          date: op.MC_DATESAISIE || op.MC_DATEPIECE || op.DateOperation || "",
          desc: op.MC_LIBELLEOPERATION || op.LibelleOperation || "Opération",
          debit,
          credit,
          balance,
        };
      });
    } catch (e) {
      console.error("Error generating PDF rows", e);
    }

    // Si aucune donnée, on met une ligne vide pour ne pas avoir un tableau cassé
    if (rows.length === 0) {
      rows.push({
        date: "—",
        desc: "Aucune opération sur cette période",
        debit: 0,
        credit: 0,
        balance: 0,
      });
    }

    const totalCredit = rows.reduce((s, r) => s + Number(r.credit || 0), 0);
    const totalDebit = rows.reduce((s, r) => s + Number(r.debit || 0), 0);
    const variation = totalCredit - totalDebit;

    const currency = (n: number) => `${n.toLocaleString("fr-FR")} XOF`;

    return `
      <!doctype html>
      <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Relevé de compte - ${item.month}</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; color:#000; margin: 24px; }
          .title { text-align:center; }
          .brand { color:#2F80ED; font-weight:800; font-size:28px; margin-bottom:6px; }
          .doc { font-size:20px; font-weight:700; margin-bottom:14px; }
          .divider { height:2px; background:#2F80ED; margin:10px 0 20px; }
          .summary { border:1px solid #E5EAF0; border-radius:8px; padding:14px; }
          .summary .label { color:#777; }
          .summary .right { float:right; text-align:right; }
          .table { width:100%; border-collapse:collapse; margin-top:16px; }
          .table th { background:#2F80ED; color:#fff; font-weight:700; padding:10px; font-size:12px; }
          .table td { border-bottom:1px solid #EEE; padding:10px; font-size:12px; }
          .section-title { font-weight:700; font-size:12px; padding:10px; }
          .totals { border:1px solid #E5EAF0; border-radius:8px; padding:16px; margin-top:20px; }
          .totals .credit { color:#27AE60; font-weight:700; }
          .totals .debit { color:#EB5757; font-weight:700; }
          .totals .variation { color:#2F80ED; font-weight:800; }
          .footer { text-align:center; color:#888; font-size:10px; margin-top:24px; }
        </style>
      </head>
      <body>
        <div class="title">
          <div class="brand">${company.name}</div>
          <div class="doc">RELEVÉ DE COMPTE</div>
        </div>
        <div class="divider"></div>
        <div class="summary">
          <div>Période: <span class="right">${item.month}</span></div>
          <div>Dates: <span class="right">${item.range}</span></div>
          <div>Numéro de compte: <span class="right">${number}</span></div>
          <div>Titulaire: <span class="right">${holder}</span></div>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th style="width:16%">Date</th>
              <th style="width:40%">Description</th>
              <th style="width:14%">Débit</th>
              <th style="width:14%">Crédit</th>
              <th style="width:16%">Solde</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colspan="5" class="section-title">Solde d'ouverture</td></tr>
            ${rows
              .map(
                (r) => `
              <tr>
                <td>${r.date}</td>
                <td>${r.desc}</td>
                <td style="color:${Number(r.debit) > 0 ? "#EB5757" : "#777"}">${
                  Number(r.debit) > 0 ? currency(Number(r.debit)) : "-"
                }</td>
                <td style="color:${
                  Number(r.credit) > 0 ? "#27AE60" : "#777"
                }">${
                  Number(r.credit) > 0 ? currency(Number(r.credit)) : "-"
                }</td>
                <td>${currency(r.balance)}</td>
              </tr>
            `,
              )
              .join("")}
            <tr><td colspan="5" class="section-title">Solde de clôture</td></tr>
          </tbody>
        </table>
        <div class="totals">
          <div>Total des crédits: <span class="credit">+${currency(
            totalCredit,
          )}</span></div>
          <div>Total des débits: <span class="debit">-${currency(
            totalDebit,
          )}</span></div>
          <div>Variation: <span class="variation">${currency(
            variation,
          )}</span></div>
        </div>
        <div class="footer">
          Document généré le ${new Date().toLocaleString("fr-FR")}<br/>
          ${company.name} - ${company.city} - Tél ${company.phone}<br/>
          Ce document est généré automatiquement et ne nécessite pas de signature
        </div>
      </body>
      </html>
    `;
  };

  const handleDownload = async (item: { month: string; range: string }) => {
    const html = await generateHtml(item);
    if (Platform.OS === "web") {
      await Print.printAsync({ html });
      return;
    }
    const file = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Relevés de compte</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
        <Text style={styles.subTitle}>Sélectionnez une période</Text>

        {statements.map((item, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.iconBg}>
                <Ionicons name="document-text" size={22} color="#2F80ED" />
              </View>
              <View style={styles.cardTexts}>
                <Text style={styles.cardTitle}>{item.month}</Text>
                <Text style={styles.cardRange}>{item.range}</Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.sizeText}>{item.size}</Text>
              <TouchableOpacity
                style={styles.downloadBtn}
                activeOpacity={0.7}
                onPress={() => handleDownload(item)}
              >
                <Ionicons name="download-outline" size={20} color="#2F80ED" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#F8F8F8",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F0F7FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardTexts: {
    flex: 1,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  cardRange: {
    fontSize: 12,
    color: "#888",
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  sizeText: {
    fontSize: 12,
    color: "#888",
    marginRight: 12,
  },
  downloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8F8F8",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default StatementsScreen;
