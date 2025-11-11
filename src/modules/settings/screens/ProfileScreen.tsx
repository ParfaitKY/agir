import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../app/hooks/useAuth';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
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
          <TouchableOpacity style={styles.editRow} activeOpacity={0.8}>
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

            <TouchableOpacity style={styles.docItem} activeOpacity={0.7} onPress={() => navigation.navigate('Transactions' as never)}>
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
          <TouchableOpacity style={styles.logoutCard} activeOpacity={0.8} onPress={handleLogout}>
            <View style={styles.docLeft}>
              <View style={[styles.infoIconBg, { backgroundColor: '#FFECEC' }]}> 
                <Ionicons name="log-out-outline" size={18} color="#FF3B30" />
              </View>
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Version info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2025 La Pepite EMF</Text>
        </View>
      </ScrollView>
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
});

export default ProfileScreen;
