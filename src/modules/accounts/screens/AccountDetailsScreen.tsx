import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

export const AccountDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute() as any;
  const account = route?.params?.account ?? {
    type: 'Compte Chèque',
    number: '****31001',
    balance: '1 250 000',
    currency: 'XAF',
    color: '#0A84FF',
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      

      {/* Blue account card */}
      <View style={[styles.blueCard, { backgroundColor: '#0A84FF' }]}> 
        <View style={styles.blueCardHeader}>
          <View>
            <Text style={styles.blueCardType}>{account.type}</Text>
            <Text style={styles.blueCardNumber}>***1001</Text>
          </View>
          <View style={[styles.blueIconBg]}> 
            <Ionicons name="card" size={20} color="#fff" />
          </View>
        </View>
        <View style={styles.blueCardBalanceBlock}>
          <Text style={styles.blueCardLabel}>Solde disponible</Text>
          <Text style={styles.blueCardBalance}>{account.balance} XAF</Text>
        </View>
        <View style={styles.blueCardFooter}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar" size={14} color="#E3EEFF" />
            <Text style={styles.blueCardDate}>Ouvert le 15/03/2023</Text>
          </View>
          <View style={styles.secureRow}>
            <Ionicons name="shield-checkmark" size={14} color="#fff" />
            <Text style={styles.secureText}>Sécurisé</Text>
          </View>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.quickRow}>
        {[
          { icon: 'swap-horizontal', label: 'Virer', color: '#2196F3' },
          { icon: 'download-outline', label: 'Recharger', color: '#34C759' },
          { icon: 'document-text-outline', label: 'Relevé', color: '#FFCC00' },
          { icon: 'lock-closed-outline', label: 'Bloquer', color: '#FF3B30' },
        ].map((item) => (
          <View key={item.label} style={styles.quickItem}>
            <View style={[styles.quickIcon, { backgroundColor: '#F4F8FF' }]}> 
              <Ionicons name={item.icon as any} size={18} color={item.color} />
            </View>
            <Text style={styles.quickText}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Stats of the month */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Ionicons name="arrow-down" size={16} color="#34C759" />
          <Text style={[styles.statValue, { color: '#34C759' }]}>+125 000</Text>
          <Text style={styles.statLabel}>Entrées</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="arrow-up" size={16} color="#FF3B30" />
          <Text style={[styles.statValue, { color: '#FF3B30' }]}>-87 500</Text>
          <Text style={styles.statLabel}>Sorties</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="swap-horizontal" size={16} color="#0A84FF" />
          <Text style={styles.statValue}>23</Text>
          <Text style={styles.statLabel}> Transcations </Text>
        </View>
      </View>

      {/* Category expenses */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Dépenses par catégorie</Text>
          <TouchableOpacity><Text style={styles.link}>Détails</Text></TouchableOpacity>
        </View>
        <View style={styles.categoryCard}>
          {[
            { label: 'Alimentation', color: '#2196F3', amount: '35 000 XOF', percent: '40%' },
            { label: 'Transport', color: '#00C853', amount: '25 000 XOF', percent: '28%' },
            { label: 'Loisirs', color: '#FFC400', amount: '15 000 XOF', percent: '17%' },
            { label: 'Autres', color: '#26A69A', amount: '12 500 XOF', percent: '15%' },
          ].map((item, idx, arr) => (
            <React.Fragment key={item.label}>
              <View style={styles.categoryRow}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <Text style={styles.categoryLabel}>{item.label}</Text>
                <View style={styles.categoryRight}>
                  <Text style={styles.categoryAmount}>{item.amount}</Text>
                  <Text style={styles.categoryPercent}>{item.percent}</Text>
                </View>
              </View>
              {idx < arr.length - 1 && <View style={styles.categoryDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Limits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Limites et plafonds</Text>
        <View style={styles.limitBox}>
          <View style={styles.limitHeaderRow}>
            <Text style={styles.limitLabel}>Retrait quotidien</Text>
            <Text style={styles.limitAmount}>25 000 / 50 000 XOF</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '50%', backgroundColor: '#0A84FF' }]} />
          </View>
        </View>
        <View style={styles.limitBox}>
          <View style={styles.limitHeaderRow}>
            <Text style={styles.limitLabel}>Virement mensuel</Text>
            <Text style={styles.limitAmount}>87 500 / 200 000 XOF</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '44%', backgroundColor: '#34C759' }]} />
          </View>
        </View>
      </View>

      {/* Account information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations du compte</Text>
        <View style={styles.infoBox}>
          <View style={styles.infoRowFirst}><Text style={styles.infoLabel}>Numéro de compte</Text><Text style={styles.infoValue}>{account.number}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Type de compte</Text><Text style={styles.infoValue}>{account.type}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Devise</Text><Text style={styles.infoValue}>XOF (Franc CFA)</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Statut</Text><View style={styles.statusPill}><Text style={styles.statusPillText}>Actif</Text></View></View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, marginBottom: 8 },
  backBtn: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#1A1A1A' },

  blueCard: { marginHorizontal: 16, marginTop: 14, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 3 },
  blueCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  blueIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  blueCardType: { color: '#fff', fontSize: 14, fontWeight: '700' },
  blueCardNumber: { color: '#E3EEFF', fontSize: 12, marginTop: 2 },
  blueCardBalanceBlock: { marginTop: 16 },
  blueCardLabel: { color: '#E3EEFF', fontSize: 12 },
  blueCardBalance: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 },
  blueCardFooter: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  blueCardDate: { color: '#E3EEFF', fontSize: 12 },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secureText: { color: '#fff', fontSize: 12 },

  quickRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 14 },
  quickItem: { alignItems: 'center', width: '23%' },
  quickIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickText: { fontSize: 12, color: '#7F8C8D' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 18 },
  statBox: { backgroundColor: '#fff', borderRadius: 14, padding: 14, width: '32%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#7F8C8D', marginTop: 6 },

  section: { paddingHorizontal: 16, marginTop: 18 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  link: { fontSize: 12, color: '#0A84FF' },

  categoryCard: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 8, paddingHorizontal: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  categoryLabel: { flex: 1, color: '#1A1A1A', fontSize: 13 },
  categoryRight: { alignItems: 'flex-end' },
  categoryAmount: { color: '#1A1A1A', fontWeight: '700', fontSize: 13 },
  categoryPercent: { color: '#7F8C8D', fontSize: 12, marginTop: 2 },
  categoryDivider: { height: 1, backgroundColor: '#EDEDED', marginLeft: 24 },

  limitBox: { backgroundColor: '#fff', borderRadius: 22, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  limitHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  limitLabel: { fontSize: 13, color: '#1A1A1A', fontWeight: '700' },
  limitAmount: { fontSize: 12, color: '#7F8C8D' },
  progressTrack: { position: 'relative', height: 8, borderRadius: 4, backgroundColor: '#E0E0E0', marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  infoBox: { backgroundColor: '#fff', borderRadius: 22, paddingHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  infoRowFirst: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#EDEDED' },
  infoLabel: { color: '#7F8C8D', fontSize: 13 },
  infoValue: { color: '#1A1A1A', fontSize: 13, fontWeight: '700' },
  statusPill: { backgroundColor: '#E8F7EC', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  statusPillText: { color: '#34C759', fontSize: 13, fontWeight: '700' },
});

export default AccountDetailsScreen;
