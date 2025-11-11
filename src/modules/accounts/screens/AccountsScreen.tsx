import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../../../app/providers/I18nProvider';

export const AccountsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [filter, setFilter] = useState<'tous' | 'cheque' | 'epargne'>('tous');
  const { t, tText } = useI18n();

  const stats = [
    { id: 1, label: '+12.5%', sub: t('accounts.stats.month'), icon: 'trending-up-outline', bg: '#F4F8FF' },
    { id: 2, label: '3', sub: t('accounts.stats.accounts'), icon: 'refresh-circle-outline', bg: '#F7FAFF' },
    { id: 3, label: '24', sub: t('accounts.stats.transactions'), icon: 'flash-outline', bg: '#FFF9F2' },
  ];

  const accounts = [
    {
      id: 1,
      type: 'Compte Chèque',
      number: '1000CCHQ000000031001',
      balance: '1 250 000',
      currency: 'XAF',
      progress: 0.63,
      active: true,
      color: '#007AFF',
    },
    {
      id: 2,
      type: 'Compte Épargne',
      number: '1000CEPG000000056123',
      balance: '3 750 000',
      currency: 'XAF',
      progress: 0.45,
      active: true,
      color: '#34C759',
    },
    {
      id: 3,
      type: 'Compte Courant',
      number: '1000COURO000000031003',
      balance: '850 000',
      currency: 'XAF',
      progress: 0.43,
      active: true,
      color: '#2F6F6B',
    },
  ];

  const renderStat = (s: any) => (
    <View key={s.id} style={[styles.statCard]}> 
      <View style={[styles.statIcon, { backgroundColor: s.bg }]}> 
        <Ionicons name={s.icon as any} size={20} color="#7F8C8D" />
      </View>
      <Text style={styles.statValue}>{s.label}</Text>
      <Text style={styles.statSub}>{s.sub}</Text>
    </View>
  );

  const renderFilter = (key: 'tous' | 'cheque' | 'epargne', label: string, icon?: any) => (
    <TouchableOpacity
      key={key}
      style={[styles.chip, filter === key && styles.chipActive]}
      onPress={() => setFilter(key)}
      activeOpacity={0.8}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={filter === key ? '#fff' : '#7F8C8D'}
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={[styles.chipText, filter === key && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      {/* Bande blanche avec Portfolio Total */}
      <View style={styles.whiteHeader}>
        <View>
          <Text style={styles.portfolioLabel}>{t('accounts.header.portfolioTotal')}</Text>
          <Text style={styles.portfolioValue}>5 850 000 XAF</Text>
        </View>
        <TouchableOpacity style={styles.notifyBtn}>
          <Ionicons name="notifications-outline" size={20} color="#007AFF" />
          <View style={styles.notifyDot} />
        </TouchableOpacity>
      </View>

      {/* Statistiques */}
      <View style={styles.statsRow}>{stats.map(renderStat)}</View>

      {/* Titre + Filtres */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('accounts.list')}</Text>
        <View style={styles.filtersRow}>
          {renderFilter('tous', t('accounts.filters.all'))}
          {renderFilter('cheque', t('accounts.filters.checking'), 'card-outline')}
          {renderFilter('epargne', t('accounts.filters.savings'), 'wallet-outline')}
        </View>
      </View>

      {/* Carte compte */}
      {accounts
        .filter(a =>
          filter === 'tous' ? true : filter === 'cheque' ? a.type.includes('Chèque') : a.type.includes('Épargne')
        )
        .map(a => (
          <TouchableOpacity key={a.id} style={styles.accountCard} activeOpacity={0.85}
            onPress={() => {
              // Ouvrir l’écran de détails pour tout type de compte
              navigation.navigate('AccountDetails' as never, { account: a } as never);
            }}
          >
            <View style={styles.accountTop}>
              <View style={[styles.accountIcon, { backgroundColor: '#E8F0FE' }]}> 
                <Ionicons name={(a.type.includes('Courant') ? 'briefcase' : 'wallet') as any} size={22} color={a.color} />
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountType}>{tText(a.type)}</Text>
                <Text style={styles.accountNumber}>{a.number}</Text>
              </View>
              <View style={styles.statusPill}>
                <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                <Text style={styles.statusText}>{t('accounts.status.active')}</Text>
              </View>
            </View>

            <View style={styles.accountBalanceRow}>
              <View>
                <Text style={styles.balanceLabel}>{t('accounts.balance.available')}</Text>
                <Text style={styles.balanceValue}>{a.balance} <Text style={styles.balanceCurrency}>{a.currency}</Text></Text>
              </View>
              <TouchableOpacity style={[styles.roundActionBtn, { backgroundColor: a.color }]}>
                <Ionicons name="swap-horizontal" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.progressBarWrapper}>
              <View style={styles.progressTrack} />
              <View style={[styles.progressFill, { width: `${Math.round(a.progress * 100)}%`, backgroundColor: a.color }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(a.progress * 100)}% de 2M XAF</Text>
          </TouchableOpacity>
        ))}

      {/* Floating add button */}
      <View style={styles.bottomSpacer} />
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  whiteHeader: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  portfolioLabel: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 6,
  },
  portfolioValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#007AFF',
  },
  notifyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notifyDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statSub: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 13,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  accountCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  accountTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountType: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  accountNumber: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F0FFF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '700',
  },
  accountBalanceRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 6,
  },
  balanceCurrency: {
    color: '#007AFF',
    fontWeight: '800',
  },
  roundActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  progressBarWrapper: {
    position: 'relative',
    marginTop: 12,
    height: 6,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F0F0F0',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
  },
  progressText: {
    marginTop: 6,
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'right',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  bottomSpacer: {
    height: 60,
  },
});

export default AccountsScreen;
