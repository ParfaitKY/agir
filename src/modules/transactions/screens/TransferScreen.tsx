import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const TransferScreen: React.FC = () => {
  const [type, setType] = useState<'interne' | 'externe'>('interne');
  const [sourceAccount, setSourceAccount] = useState('');
  const [destinationAccount, setDestinationAccount] = useState('');
  const [amount, setAmount] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header visuel */}
        <View style={styles.headerIconWrapper}>
          <View style={styles.headerIconCircle}>
            <Ionicons name="swap-horizontal" size={28} color="#007AFF" />
          </View>
        </View>
        <Text style={styles.headerTitle}>Nouveau virement</Text>
        <Text style={styles.headerSubtitle}>
          Transférez de l'argent rapidement et en toute sécurité
        </Text>

        {/* Type de virement */}
        <Text style={styles.sectionLabel}>TYPE DE VIREMENT</Text>

        <TouchableOpacity
          style={[styles.typeCard, type === 'interne' && styles.typeCardActive]}
          onPress={() => setType('interne')}
          activeOpacity={0.8}
        >
          <View style={styles.typeLeft}>
            <View style={[styles.typeIconCircle, type === 'interne' && styles.typeIconCircleActive]}>
              <Ionicons name="swap-horizontal" size={22} color={type === 'interne' ? '#fff' : '#007AFF'} />
            </View>
            <View>
              <Text style={[styles.typeTitle, type === 'interne' && styles.typeTitleActive]}>Compte à compte interne</Text>
              <Text style={[styles.typeSubtitle, type === 'interne' && styles.typeSubtitleActive]}>Entre vos comptes</Text>
            </View>
          </View>
          <View style={[styles.checkCircle, type === 'interne' && styles.checkCircleActive]}>
            {type === 'interne' && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeCard, type === 'externe' && styles.typeCardActive]}
          onPress={() => setType('externe')}
          activeOpacity={0.8}
        >
          <View style={styles.typeLeft}>
            <View style={[
              styles.typeIconCircle,
              styles.typeIconCircleAlt,
              type === 'externe' && styles.typeIconCircleActive
            ]}>
              <Ionicons name="send-outline" size={20} color={type === 'externe' ? '#fff' : '#007AFF'} />
            </View>
            <View>
              <Text style={[styles.typeTitle, type === 'externe' && styles.typeTitleActive]}>Compte à compte externe</Text>
              <Text style={[styles.typeSubtitle, type === 'externe' && styles.typeSubtitleActive]}>Vers un autre bénéficiaire</Text>
            </View>
          </View>
          <View style={[styles.checkCircle, type === 'externe' && styles.checkCircleActive]}>
            {type === 'externe' && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
        </TouchableOpacity>

        {/* Formulaire de virement interne */}
        {type === 'interne' && (
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>Virement interne</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Compte source</Text>
              <TextInput
                style={styles.input}
                placeholder="Numéro de compte source"
                value={sourceAccount}
                onChangeText={setSourceAccount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Compte bénéficiaire</Text>
              <TextInput
                style={styles.input}
                placeholder="Numéro de compte destinataire"
                value={destinationAccount}
                onChangeText={setDestinationAccount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Montant</Text>
              <View style={styles.amountInputContainer}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                <Text style={styles.amountCurrency}>XAF</Text>
              </View>
            </View>
          </View>
        )}

        {/* Formulaire de virement externe (même structure) */}
        {type === 'externe' && (
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>Virement externe</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Compte source</Text>
              <TextInput
                style={styles.input}
                placeholder="Numéro de compte source"
                value={sourceAccount}
                onChangeText={setSourceAccount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Compte destinataire</Text>
              <TextInput
                style={styles.input}
                placeholder="Code client ou IBAN"
                value={destinationAccount}
                onChangeText={setDestinationAccount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Montant</Text>
              <View style={styles.amountInputContainer}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                <Text style={styles.amountCurrency}>XAF</Text>
              </View>
            </View>
          </View>
        )}

        {/* Bouton d'action */}
        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Effectuer le virement</Text>
        </TouchableOpacity>

        {/* Note de sécurité */}
        <View style={styles.secureNote}>
          <Ionicons name="shield-checkmark" size={16} color="#34C759" />
          <Text style={styles.secureNoteText}>Vos transactions sont sécurisées et cryptées</Text>
        </View>
      </ScrollView>
      {/* Espace en bas pour la navigation (comme Dashboard) */}
      <View style={styles.bottomSpace} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerIconWrapper: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  headerIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 14,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7F8C8D',
    marginBottom: 10,
  },
  typeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeCardActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIconCircleActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  typeIconCircleAlt: {
    backgroundColor: '#EEF6FF',
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  typeSubtitle: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  typeTitleActive: {
    color: '#fff',
  },
  typeSubtitleActive: {
    color: '#E6F0FF',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D0D6DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkCircleActive: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  formSection: {
    marginTop: 20,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A1A',
  },
  // Champ Montant stylé (comme le mockup)
  amountInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#BBD7FF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#007AFF',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '700',
    color: '#5A5A5A',
    paddingVertical: 0,
  },
  amountCurrency: {
    marginLeft: 12,
    fontSize: 22,
    fontWeight: '700',
    color: '#6D6D6D',
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: '#8E8E93',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secureNote: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secureNoteText: {
    fontSize: 13,
    color: '#6B7280',
  },
  // Espace en bas pour éviter le chevauchement avec la barre de navigation
  bottomSpace: {
    height: 30,
  },
});

export default TransferScreen;

