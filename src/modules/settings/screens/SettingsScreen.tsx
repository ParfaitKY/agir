import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../app/hooks/useAuth';
import { useNavigation } from '@react-navigation/native';

export const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const settingsSections = [
    {
      title: 'COMPTE',
      items: [
        {
          icon: 'person-outline',
          iconColor: '#0066CC',
          title: 'Mon Profil',
          onPress: () => console.log('Profil'),
          showChevron: true,
        },
        {
          icon: 'lock-closed-outline',
          iconColor: '#0066CC',
          title: 'Changer le code PIN',
          onPress: () => console.log('PIN'),
          showChevron: true,
        },
        {
          icon: 'key-outline',
          iconColor: '#0066CC',
          title: 'Changer le mot de passe',
          onPress: () => navigation.navigate('ChangePassword' as never),
          showChevron: true,
        },
      ],
    },
    {
      title: 'SERVICES FINANCIERS',
      items: [
        {
          icon: 'wallet-outline',
          iconColor: '#0066CC',
          title: 'Mon Wallet',
          onPress: () => console.log('Wallet'),
          showChevron: true,
        },
        {
          icon: 'card-outline',
          iconColor: '#0066CC',
          title: 'Gérer mes comptes',
          onPress: () => console.log('Comptes'),
          showChevron: true,
        },
        {
          icon: 'people-outline',
          iconColor: '#0066CC',
          title: 'Mes bénéficiaires',
          onPress: () => console.log('Bénéficiaires'),
          showChevron: true,
        },
        {
          icon: 'grid-outline',
          iconColor: '#0066CC',
          title: 'Mes produits',
          onPress: () => console.log('Produits'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'PRÉFÉRENCES',
      items: [
        {
          icon: 'notifications-outline',
          iconColor: '#0066CC',
          title: 'Notifications',
          rightElement: (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#E0E0E0', true: '#0066CC' }}
              thumbColor="#fff"
            />
          ),
        },
        {
          icon: 'language-outline',
          iconColor: '#0066CC',
          title: 'Langue',
          onPress: () => console.log('Langue'),
          showChevron: true,
        },
        {
          icon: 'moon-outline',
          iconColor: '#0066CC',
          title: 'Mode sombre',
          rightElement: (
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#E0E0E0', true: '#0066CC' }}
              thumbColor="#fff"
            />
          ),
        },
      ],
    },
    {
      title: 'SÉCURITÉ',
      items: [
        {
          icon: 'finger-print-outline',
          iconColor: '#0066CC',
          title: 'Authentification biométrique',
          rightElement: (
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: '#E0E0E0', true: '#0066CC' }}
              thumbColor="#fff"
            />
          ),
        },
        {
          icon: 'shield-checkmark-outline',
          iconColor: '#0066CC',
          title: 'Confidentialité',
          onPress: () => console.log('Confidentialité'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'SUPPORT',
      items: [
        {
          icon: 'headset-outline',
          iconColor: '#0066CC',
          title: 'Service client',
          onPress: () => console.log('Service client'),
          showChevron: true,
        },
        {
          icon: 'chatbubble-outline',
          iconColor: '#0066CC',
          title: 'Chat en ligne',
          onPress: () => console.log('Chat'),
          showChevron: true,
        },
        {
          icon: 'mail-outline',
          iconColor: '#0066CC',
          title: 'Envoyer un email',
          onPress: () => console.log('Email'),
          showChevron: true,
        },
        {
          icon: 'help-circle-outline',
          iconColor: '#0066CC',
          title: "Centre d'aide / FAQ",
          onPress: () => console.log('FAQ'),
          showChevron: true,
        },
        {
          icon: 'warning-outline',
          iconColor: '#0066CC',
          title: 'Signaler un problème',
          onPress: () => console.log('Signaler'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'APPLICATION',
      items: [
        {
          icon: 'information-circle-outline',
          iconColor: '#0066CC',
          title: 'À propos',
          onPress: () => console.log('À propos'),
          showChevron: true,
        },
        {
          icon: 'document-text-outline',
          iconColor: '#0066CC',
          title: "Conditions d'utilisation",
          onPress: () => console.log('Conditions'),
          showChevron: true,
        },
        {
          icon: 'shield-outline',
          iconColor: '#0066CC',
          title: 'Politique de confidentialité',
          onPress: () => console.log('Politique'),
          showChevron: true,
        },
        {
          icon: 'star-outline',
          iconColor: '#0066CC',
          title: "Évaluer l'application",
          onPress: () => console.log('Évaluer'),
          showChevron: true,
        },
        {
          icon: 'share-social-outline',
          iconColor: '#0066CC',
          title: "Partager l'application",
          onPress: () => console.log('Partager'),
          showChevron: true,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.settingItemLast
                  ]}
                  onPress={item.onPress}
                  disabled={!item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={22} 
                      color={item.iconColor} 
                    />
                    <Text style={styles.settingTitle}>{item.title}</Text>
                  </View>
                  {item.rightElement || (
                    item.showChevron && (
                      <Ionicons 
                        name="chevron-forward" 
                        size={20} 
                        color="#C0C0C0" 
                      />
                    )
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Déconnexion Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DÉCONNEXION</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity 
              style={[styles.settingItem, styles.settingItemLast]} 
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
                <Text style={[styles.settingTitle, styles.logoutText]}>
                  Se déconnecter
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C0C0C0" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Version Info */}
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
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
    marginLeft: 20,
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#fff',
    marginHorizontal: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000',
    marginLeft: 16,
  },
  logoutText: {
    color: '#FF3B30',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 32,
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