import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../../app/providers/I18nProvider';
import { useTheme } from '../../../shared/styles/ThemeProvider';

export const TransactionsScreen: React.FC = () => {
  const { t, tText } = useI18n();
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState<'toutes' | 'entrees' | 'sorties'>('toutes');

  const transactions = [
    { 
      id: '1', 
      title: 'Virement reçu - MOUPEPIDI', 
      amount: '+50 000 XAF', 
      date: '22 ext.',
      type: 'entree'
    },
    { 
      id: '2', 
      title: 'Retrait ATM - Agence 2', 
      amount: '-25 000 XAF', 
      date: '22 ext.',
      type: 'sortie'
    },
    { 
      id: '3', 
      title: 'Paiement facture ENEO', 
      amount: '-15 000 XAF', 
      date: '21 oct.',
      type: 'sortie'
    },
    { 
      id: '4', 
      title: 'Salaire mensuel', 
      amount: '+350 000 XAF', 
      date: '20 oct.',
      type: 'entree'
    },
    { 
      id: '5', 
      title: 'Achat supermarché casino', 
      amount: '-35 000 XAF', 
      date: '19 oct.',
      type: 'sortie'
    },
    { 
      id: '6', 
      title: 'Transfert vers épargne', 
      amount: '-100 000 XAF', 
      date: '18 oct.',
      type: 'sortie'
    },
    { 
      id: '7', 
      title: 'Virement reçu - DERLY', 
      amount: '+75 000 XAF', 
      date: '17 ext.',
      type: 'entree'
    },
  ];

  const totalEntrees = 475000;
  const totalSorties = 193500;

  // Filtrer les transactions selon le filtre actif
  const filteredTransactions = transactions.filter(transaction => {
    if (activeFilter === 'toutes') return true;
    if (activeFilter === 'entrees') return transaction.type === 'entree';
    if (activeFilter === 'sorties') return transaction.type === 'sortie';
    return true;
  });

  const translateTitle = (title: string) => {
    let result = title;
    result = result.replace('Virement reçu', t('transactions.title.receivedTransfer'));
    result = result.replace('Retrait ATM', t('transactions.title.atmWithdrawal'));
    result = result.replace('Paiement facture', t('transactions.title.billPayment'));
    result = result.replace('Salaire mensuel', t('transactions.title.salary'));
    result = result.replace('Achat supermarché', t('transactions.title.groceryPurchase'));
    result = result.replace('Transfert vers épargne', t('transactions.title.transferToSavings'));
    return result;
  };

  const styles = getStyles(colors);
  return (
    <SafeAreaView style={styles.container}>
      

      {/* Résumé des transactions */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
            <View style={styles.summaryHeader}>
            <Ionicons name="trending-up" size={16} color={colors.success} />
            <Text style={styles.summaryLabel}>{t('transactions.summary.in')}</Text>
            </View>
            <Text style={styles.entreeAmount}>{totalEntrees.toLocaleString()} XAF</Text>
        </View>
        <View style={styles.summarySeparator} />
        <View style={styles.summaryItem}>
            <View style={styles.summaryHeader}>
            <Ionicons name="trending-down" size={16} color={colors.error} />
            <Text style={styles.summaryLabel}>{t('transactions.summary.out')}</Text>
            </View>
            <Text style={styles.sortieAmount}>{totalSorties.toLocaleString()} XAF</Text>
        </View>
        </View>

      {/* Filtres - Les trois boutons côte à côte à droite */}
      <View style={styles.filterMainContainer}>
        <View style={styles.filterButtonsContainer}>
          <TouchableOpacity 
            style={[
              styles.filterButton,
              activeFilter === 'toutes' && styles.filterButtonActive
            ]}
            onPress={() => setActiveFilter('toutes')}
          >
            <Text style={[
              styles.filterButtonText,
              activeFilter === 'toutes' && styles.filterButtonTextActive
            ]}>
              {t('transactions.filter.all')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton,
              activeFilter === 'entrees' && styles.filterButtonActive
            ]}
            onPress={() => setActiveFilter('entrees')}
          >
            <View style={styles.filterButtonContent}>
              <Ionicons name="trending-up" size={14} color={activeFilter === 'entrees' ? 'white' : colors.success} />
              <Text style={[
                styles.filterButtonText,
                activeFilter === 'entrees' && styles.filterButtonTextActive
              ]}>
                {t('transactions.filter.in')}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={14} color={activeFilter === 'entrees' ? 'white' : colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton,
              activeFilter === 'sorties' && styles.filterButtonActive
            ]}
            onPress={() => setActiveFilter('sorties')}
          >
            <View style={styles.filterButtonContent}>
              <Ionicons name="trending-down" size={14} color={activeFilter === 'sorties' ? 'white' : colors.error} />
              <Text style={[
                styles.filterButtonText,
                activeFilter === 'sorties' && styles.filterButtonTextActive
              ]}>
                {t('transactions.filter.out')}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={14} color={activeFilter === 'sorties' ? 'white' : colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste des transactions filtrées */}
      <ScrollView style={styles.content}>
        {filteredTransactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionCard}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionTitle}>{translateTitle(transaction.title)}</Text>
              <Text style={styles.transactionDate}>{transaction.date}</Text>
            </View>
            <Text style={[
              styles.amountText,
              transaction.type === 'entree' ? styles.positive : styles.negative
            ]}>
              {transaction.amount}
            </Text>
          </View>
        ))}
        
        {filteredTransactions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {t('transactions.empty.none')} {activeFilter === 'entrees' ? t('transactions.empty.inSuffix') : activeFilter === 'sorties' ? t('transactions.empty.outSuffix') : ''}
            </Text>
          </View>
        )}
      </ScrollView>

      
    </SafeAreaView>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.border,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  
  
  
 summarySeparator: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 10,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  // Les styles existants modifiés pour les boutons de filtre
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  // Les autres styles restent les mêmes...
  summaryLabel: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  entreeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
  },
  sortieAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.error,
  },
  
  // Nouveaux styles pour la disposition correcte des filtres
  filterMainContainer: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'flex-start', // Aligne les boutons à droite
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positive: {
    color: colors.success,
  },
  negative: {
    color: colors.error,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    marginTop: 4,
  },
  navTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
