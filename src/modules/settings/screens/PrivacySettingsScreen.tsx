import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../shared/styles/ThemeProvider";

export const PrivacySettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  // Simulation des états (normalement liés aux permissions réelles)
  const [permissions, setPermissions] = useState({
    camera: true,
    location: true,
    notifications: true,
    contacts: false,
    microphone: false,
    photos: true,
  });

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions(prev => ({
        ...prev,
        [key]: !prev[key]
    }));
  };

  const permissionItems = [
    {
      key: "camera",
      title: "Appareil photo",
      description: "Nécessaire pour scanner les QR codes et documents.",
      icon: "camera",
    },
    {
      key: "location",
      title: "Localisation",
      description: "Utilisé pour trouver les agences proches et sécuriser les transactions.",
      icon: "location",
    },
    {
      key: "notifications",
      title: "Notifications",
      description: "Pour vous alerter des transactions et offres importantes.",
      icon: "notifications",
    },
    {
      key: "contacts",
      title: "Contacts",
      description: "Facilite l'envoi d'argent à vos amis.",
      icon: "people",
    },
    {
      key: "microphone",
      title: "Microphone",
      description: "Requis pour certaines fonctionnalités vocales.",
      icon: "mic",
    },
    {
      key: "photos",
      title: "Photos et stockage",
      description: "Pour enregistrer vos reçus et télécharger des documents.",
      icon: "images",
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Confidentialité</Text>
          <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
            Gérez les autorisations accordées à l'application pour protéger votre vie privée.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Autorisations système</Text>
          <View style={[styles.list, { borderColor: colors.border }]}>
            {permissionItems.map((item) => (
              <View 
                key={item.key} 
                style={[
                    styles.item, 
                    { borderBottomColor: colors.border }
                ]}
              >
                <View style={styles.itemHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
                        <Ionicons 
                            name={item.icon as any} 
                            size={22} 
                            color={colors.text} 
                        />
                    </View>
                    <View style={styles.itemTextContent}>
                        <Text style={[styles.itemTitle, { color: colors.text }]}>
                            {item.title}
                        </Text>
                        <Text style={[styles.itemDescription, { color: colors.text + "70" }]}>
                            {item.description}
                        </Text>
                    </View>
                    <Switch
                        value={permissions[item.key as keyof typeof permissions]}
                        onValueChange={() => togglePermission(item.key as keyof typeof permissions)}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor="#fff"
                    />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
                Vos données sont cryptées et stockées de manière sécurisée. Nous ne partageons jamais vos informations personnelles sans votre consentement.
            </Text>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  list: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  itemTextContent: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.03)",
    gap: 16,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.8,
  },
});
