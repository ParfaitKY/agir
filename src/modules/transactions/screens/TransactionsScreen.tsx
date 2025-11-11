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

export const TransactionsScreen: React.FC = () => {
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

  return (
    <SafeAreaView style={styles.container}>
      

      {/* Résumé des transactions */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
            <View style={styles.summaryHeader}>
            <Ionicons name="trending-up" size={16} color="#27ae60" />
            <Text style={styles.summaryLabel}>Entrées</Text>
            </View>
            <Text style={styles.entreeAmount}>{totalEntrees.toLocaleString()} XAF</Text>
        </View>
        <View style={styles.summarySeparator} />
        <View style={styles.summaryItem}>
            <View style={styles.summaryHeader}>
            <Ionicons name="trending-down" size={16} color="#e74c3c" />
            <Text style={styles.summaryLabel}>Sorties</Text>
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
              Toutes
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
              <Ionicons name="trending-up" size={14} color={activeFilter === 'entrees' ? 'white' : '#27ae60'} />
              <Text style={[
                styles.filterButtonText,
                activeFilter === 'entrees' && styles.filterButtonTextActive
              ]}>
                Entrées
              </Text>
            </View>
            <Ionicons name="chevron-down" size={14} color={activeFilter === 'entrees' ? 'white' : '#7f8c8d'} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton,
              activeFilter === 'sorties' && styles.filterButtonActive
            ]}
            onPress={() => setActiveFilter('sorties')}
          >
            <View style={styles.filterButtonContent}>
              <Ionicons name="trending-down" size={14} color={activeFilter === 'sorties' ? 'white' : '#e74c3c'} />
              <Text style={[
                styles.filterButtonText,
                activeFilter === 'sorties' && styles.filterButtonTextActive
              ]}>
                Sorties
              </Text>
            </View>
            <Ionicons name="chevron-down" size={14} color={activeFilter === 'sorties' ? 'white' : '#7f8c8d'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste des transactions filtrées */}
      <ScrollView style={styles.content}>
        {filteredTransactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionCard}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionTitle}>{transaction.title}</Text>
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
              Aucune transaction {activeFilter === 'entrees' ? 'd\'entrée' : activeFilter === 'sorties' ? 'de sortie' : ''}
            </Text>
          </View>
        )}
      </ScrollView>

      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
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
    backgroundColor: '#e0e0e0',
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
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 4,
  },
  // Les autres styles restent les mêmes...
  summaryLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  entreeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  sortieAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  
  // Nouveaux styles pour la disposition correcte des filtres
  filterMainContainer: {
    backgroundColor: 'white',
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
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#7f8c8d',
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
    backgroundColor: 'white',
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
    color: '#2c3e50',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positive: {
    color: '#27ae60',
  },
  negative: {
    color: '#e74c3c',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  navTextActive: {
    color: '#3498db',
    fontWeight: '600',
  },
});
