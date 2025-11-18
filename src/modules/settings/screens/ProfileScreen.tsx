import React, { useState } from 'react';
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
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../app/hooks/useAuth';
import { useTheme, useThemeMode } from '../../../shared/styles/ThemeProvider';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { logout, user } = useAuth();
  const { colors } = useTheme();
  const { preference, isDark, setPreference } = useThemeMode();
  const [editVisible, setEditVisible] = useState(false);
  const [txVisible, setTxVisible] = useState(false);
  const [dateInfoVisible, setDateInfoVisible] = useState(false);

  // Données d'exemple pour le modal des transactions (mêmes éléments que l'écran Transactions)
  const txData = [
    { id: '1', title: 'Virement reçu - MOUPEPIDI', amount: '+50 000 XAF', date: '23/10/2025', type: 'entree' },
    { id: '2', title: 'Retrait ATM - Agence 2', amount: '-25 000 XAF', date: '22/10/2025', type: 'sortie' },
    { id: '3', title: 'Paiement facture ENEO', amount: '-15 000 XAF', date: '21/10/2025', type: 'sortie' },
    { id: '4', title: 'Salaire mensuel', amount: '+350 000 XAF', date: '20/10/2025', type: 'entree' },
  ];

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
                console.log('=== GUEST LOGOUT CONFIRMED ===');
                // Pour le mode invité : tout effacer et rediriger vers InitialSetupScreen
                await logout(); // Efface les données d'authentification
                
                // Rediriger vers InitialSetupScreen
                try {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'InitialSetup' as never }],
                  });
                } catch (error) {
                  // Fallback si reset n'est pas disponible
                  console.log('Navigation reset failed, trying navigate...');
                  navigation.navigate('InitialSetup' as never);
                }
                
                console.log('Guest user logged out and redirected to InitialSetupScreen');
              }
            }
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
                console.log('Regular user logged out');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleCall = () => {
    const phone = '+24177683855';
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = () => {
    const email = 'support@lapeyrie-emf.com';
    const subject = encodeURIComponent('Demande de modification de profil');
    const body = encodeURIComponent("Bonjour,\n\nJe souhaite mettre à jour mes informations personnelles. Pourriez-vous m'indiquer la procédure ?\n\nMerci.");
    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  // Génération HTML du reçu des transactions
  const generateTransactionsHtml = () => {
    const itemsHtml = txData.map(t => {
      const isEntree = t.type === 'entree';
      const color = isEntree ? '#27AE60' : '#EB5757';
      const iconBg = isEntree ? '#E9FFF3' : '#FFECEC';
      const arrow = isEntree ? '↓' : '↑';
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
    }).join('');

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
      const fileName = `Transactions_${new Date().toISOString().slice(0,10)}.pdf`;
      // Partage natif si disponible
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf' });
      } else {
        // Fallback web: ouvrir le fichier
        // @ts-ignore
        if (typeof window !== 'undefined') window.open(uri, '_blank');
      }
    } catch (e) {
      console.log('Export PDF transactions error', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header card with avatar and basic info */}
        <View style={styles.headerCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>DM</Text>
            </View>
            <View style={styles.avatarCamera}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </View>
          <Text style={styles.profileName}>Derly MOUPEPIDI</Text>
          <Text style={styles.profileCode}>Code: LPO01354</Text>
          <View style={styles.memberBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#2BBE6A" />
            <Text style={styles.memberText}>Membre depuis Octobre 2025</Text>
          </View>
        </View>

        {/* Contact information card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIconBg, { backgroundColor: '#E7F1FF' }]}> 
              <Ionicons name="mail" size={18} color="#0066CC" />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>derly.moupepidibis-afrique.tech</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={[styles.infoIconBg, { backgroundColor: '#E9FFF3' }]}> 
              <Ionicons name="call" size={18} color="#2BBE6A" />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Téléphone</Text>
              <Text style={styles.infoValue}>+241 77 68 38 55</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={[styles.infoIconBg, { backgroundColor: '#FFF8E7' }]}> 
              <Ionicons name="location" size={18} color="#F5A623" />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Adresse</Text>
              <Text style={styles.infoValue}>Nzend Ayoong, Nouvelle cité\nLibreville, Gabon</Text>
              <Text style={styles.infoLabel}>Libreville, Gabon</Text>
            </View>
          </View>
        </View>

        {/* Personal section with edit button */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <TouchableOpacity style={styles.editRow} activeOpacity={0.8} onPress={() => setEditVisible(true)}>
            <View style={styles.editRowLeft}>
              <View style={[styles.infoIconBg, { backgroundColor: '#E7F1FF' }]}> 
                <Ionicons name="person" size={18} color="#0066CC" />
              </View>
              <Text style={styles.editRowText}>Modifier le profil</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
          </TouchableOpacity>
        </View>

        {/* Documents section */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Documents</Text>
          <View style={styles.docCard}>
            <TouchableOpacity style={styles.docItem} activeOpacity={0.7} onPress={() => navigation.navigate('Statements' as never)}>
              <View style={styles.docLeft}>
                <View style={[styles.infoIconBg, { backgroundColor: '#E7F1FF' }]}> 
                  <Ionicons name="document-text-outline" size={18} color="#0066CC" />
                </View>
                <Text style={styles.docTitle}>Relevés de compte</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.docItem} activeOpacity={0.7} onPress={() => setTxVisible(true)}>
              <View style={styles.docLeft}>
                <View style={[styles.infoIconBg, { backgroundColor: '#E7F1FF' }]}> 
                  <Ionicons name="list-outline" size={18} color="#0066CC" />
                </View>
                <Text style={styles.docTitle}>Historique des transactions</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={[styles.docItem, styles.docItemLast]} activeOpacity={0.7} onPress={() => console.log('Téléchargements')}>
              <View style={styles.docLeft}>
                <View style={[styles.infoIconBg, { backgroundColor: '#E7F1FF' }]}> 
                  <Ionicons name="download-outline" size={18} color="#0066CC" />
                </View>
                <Text style={styles.docTitle}>Téléchargements</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout card */}
        <View style={styles.sectionBlock}>
          <TouchableOpacity 
            style={[styles.logoutCard, { backgroundColor: colors.error + '10', borderColor: colors.error + '30' }]} 
            activeOpacity={0.8} 
            onPress={handleLogout}
          >
            <View style={styles.docLeft}>
              <View style={[styles.infoIconBg, { backgroundColor: colors.error + '20' }]}> 
                <Ionicons name="log-out-outline" size={18} color={colors.error} />
              </View>
              <Text style={[styles.logoutText, { color: colors.error }]}>
                {user?.username === "invite" ? "Quitter le mode invité" : "Se déconnecter"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Version info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2025 La Pepite EMF</Text>
        </View>
      </ScrollView>

      {/* Modal Modifier le profil */}
      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setEditVisible(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Modifier le profil</Text>
            <Text style={styles.modalText}>
              Pour modifier vos informations personnelles, veuillez contacter votre agence ou le service client.
            </Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} activeOpacity={0.8} onPress={handleCall}>
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.actionTextLight}>Appeler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.emailBtn]} activeOpacity={0.8} onPress={handleEmail}>
                <Ionicons name="mail" size={20} color="#fff" />
                <Text style={styles.actionTextLight}>Email</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Historique des transactions */}
      <Modal visible={txVisible} transparent animationType="fade" onRequestClose={() => setTxVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setTxVisible(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Historique des transactions</Text>

            {/* Boutons d'action */}
            <View style={styles.txActionsRow}>
              <TouchableOpacity style={[styles.actionBtnOutline]} activeOpacity={0.8} onPress={() => setDateInfoVisible(true)}>
                <Ionicons name="calendar" size={18} color="#0066CC" />
                <Text style={styles.actionTextPrimary}>Filtrer par date</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.txActionBtn, styles.exportBtn]} activeOpacity={0.8} onPress={handleExportTransactionsPdf}>
                <Ionicons name="download" size={18} color="#fff" />
                <Text style={styles.actionTextLight}>Exporter PDF</Text>
              </TouchableOpacity>
            </View>

            {/* Liste des transactions */}
            <View style={styles.txList}>
              {txData.map((t) => (
                <View key={t.id} style={styles.txItem}>
                  <View style={styles.txLeft}>
                    <View style={[styles.txIconBg, { backgroundColor: t.type === 'entree' ? '#E9FFF3' : '#FFECEC' }]}> 
                      <Ionicons name={t.type === 'entree' ? 'arrow-down' : 'arrow-up'} size={18} color={t.type === 'entree' ? '#2BBE6A' : '#EB5757'} />
                    </View>
                    <View>
                      <Text style={styles.txTitle}>{t.title}</Text>
                      <Text style={styles.txDate}>{t.date}</Text>
                    </View>
                  </View>
                  <Text style={[styles.txAmount, t.type === 'entree' ? styles.txAmountPositive : styles.txAmountNegative]}>{t.amount}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Info filtre par date */}
      <Modal visible={dateInfoVisible} transparent animationType="fade" onRequestClose={() => setDateInfoVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setDateInfoVisible(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Informations</Text>
            <Text style={styles.modalText}>La sélection de date sera disponible prochainement.</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} activeOpacity={0.8} onPress={() => setDateInfoVisible(false)}>
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
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
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
    backgroundColor: '#2F80ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },
  avatarCamera: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2BBE6A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginTop: 6,
  },
  profileCode: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#EAF8F0',
    marginTop: 10,
    gap: 6,
  },
  memberText: {
    fontSize: 12,
    color: '#2BBE6A',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTexts: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  sectionBlock: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  editRow: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editRowText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#000',
  },
  docCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  docItemLast: {
    borderBottomWidth: 0,
  },
  docLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  docTitle: {
    marginLeft: 12,
    fontSize: 15,
    color: '#000',
  },
  logoutCard: {
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#CCC',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalBox: {
    width: '92%',
    maxWidth: 640,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  modalClose: {
    position: 'absolute',
    right: 16,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHandle: {
    width: 56,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EAEAEA',
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#000',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  callBtn: {
    backgroundColor: '#2F80ED',
  },
  emailBtn: {
    backgroundColor: '#2BBE6A',
  },
  actionTextLight: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  // Transactions modal styles
  txActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D6E6FF',
    backgroundColor: '#fff',
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 48,
  },
  actionTextPrimary: {
    color: '#0066CC',
    fontSize: 16,
    fontWeight: '700',
  },
  exportBtn: {
    backgroundColor: '#2F80ED',
  },
  txActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 48,
  },
  txList: {
    marginTop: 4,
    gap: 10,
    paddingBottom: 8,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    flexShrink: 1,
  },
  txIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 15,
    color: '#000',
    marginBottom: 2,
    flexShrink: 1,
    maxWidth: '72%',
  },
  txDate: {
    fontSize: 12,
    color: '#777',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
    flexShrink: 0,
    textAlign: 'right',
  },
  txAmountPositive: {
    color: '#2BBE6A',
  },
  txAmountNegative: {
    color: '#EB5757',
  },
});

export default ProfileScreen;
