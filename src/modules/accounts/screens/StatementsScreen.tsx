import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const statements = [
  { month: 'Octobre 2025', range: '01/10/2025 - 31/10/2025', size: '245 KB' },
  { month: 'Septembre 2025', range: '01/09/2025 - 30/09/2025', size: '312 KB' },
  { month: 'Août 2025', range: '01/08/2025 - 31/08/2025', size: '298 KB' },
  { month: 'Juillet 2025', range: '01/07/2025 - 31/07/2025', size: '276 KB' },
  { month: 'Juin 2025', range: '01/06/2025 - 30/06/2025', size: '270 KB' },
];

export const StatementsScreen: React.FC = () => {
  const navigation = useNavigation();

  const generateHtml = (item: { month: string; range: string }) => {
    const company = {
      name: 'LA PEYRIE EMF',
      city: 'Libreville, Gabon',
      phone: '+241 XX XX XX XX',
    };
    const account = {
      number: '1000CCHQ000000031001',
      holder: 'DERLY MOUPEPIDI',
      openingBalance: 1500000,
      closingBalance: 1850000,
    };
    const rows = [
      { date: '23/10/2025', desc: 'Virement reçu - MOUPEPIDI', debit: '', credit: 50000, balance: 1550000 },
      { date: '22/10/2025', desc: 'Retrait ATM - Agence 2', debit: 25000, credit: '', balance: 1525000 },
      { date: '21/10/2025', desc: 'Paiement facture ENEO', debit: 15000, credit: '', balance: 1510000 },
      { date: '20/10/2025', desc: 'Salaire mensuel', debit: '', credit: 350000, balance: 1860000 },
      { date: '19/10/2025', desc: 'Achat supermarché', debit: 35000, credit: '', balance: 1825000 },
      { date: '18/10/2025', desc: 'Transfert épargne', debit: 75000, credit: '', balance: 1750000 },
    ];
    const totalCredit = rows.reduce((s, r) => s + (r.credit || 0), 0);
    const totalDebit = rows.reduce((s, r) => s + (r.debit || 0), 0);
    const variation = totalCredit - totalDebit;

    const currency = (n: number) => `${n.toLocaleString('fr-FR')} XAF`;

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
          <div>Numéro de compte: <span class="right">${account.number}</span></div>
          <div>Titulaire: <span class="right">${account.holder}</span></div>
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
            ${rows.map(r => `
              <tr>
                <td>${r.date}</td>
                <td>${r.desc}</td>
                <td style="color:${r.debit? '#EB5757':'#777'}">${r.debit? currency(r.debit): '-'}</td>
                <td style="color:${r.credit? '#27AE60':'#777'}">${r.credit? currency(r.credit): '-'}</td>
                <td>${currency(r.balance)}</td>
              </tr>
            `).join('')}
            <tr><td colspan="5" class="section-title">Solde de clôture</td></tr>
          </tbody>
        </table>
        <div class="totals">
          <div>Total des crédits: <span class="credit">+${currency(totalCredit)}</span></div>
          <div>Total des débits: <span class="debit">-${currency(totalDebit)}</span></div>
          <div>Variation: <span class="variation">${currency(variation)}</span></div>
        </div>
        <div class="footer">
          Document généré le ${(new Date()).toLocaleString('fr-FR')}<br/>
          ${company.name} - ${company.city} - Tél ${company.phone}<br/>
          Ce document est généré automatiquement et ne nécessite pas de signature
        </div>
      </body>
      </html>
    `;
  };

  const handleDownload = async (item: { month: string; range: string }) => {
    const html = generateHtml(item);
    if (Platform.OS === 'web') {
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn} activeOpacity={0.7}>
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
              <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.7} onPress={() => handleDownload(item)}>
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
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#F8F8F8',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E7F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTexts: {
    marginLeft: 14,
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  cardRange: {
    fontSize: 14,
    color: '#777',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  sizeText: {
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
  },
  downloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E7F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StatementsScreen;
