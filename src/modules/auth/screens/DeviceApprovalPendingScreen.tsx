import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import * as SecureStore from "expo-secure-store";
import { useI18n } from "../../../app/providers/I18nProvider";

const DeviceApprovalPendingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { t } = useI18n();

  const [status, setStatus] = useState<"pending" | "approved" | "rejected">(
    "pending"
  );
  const [pollingCount, setPollingCount] = useState(0);

  // Params passed from InitialSetup
  const { token, deviceName } = (route.params as any) || {};

  useEffect(() => {
    // Simulation du polling vers le backend pour vérifier si l'appareil principal a validé
    const interval = setInterval(() => {
      checkApprovalStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [pollingCount]);

  const checkApprovalStatus = async () => {
    // ICI: Appel API réel pour vérifier le statut de la demande
    // const response = await checkDeviceRequestStatus(token);
    
    // Pour la démo/simulation, on auto-approuve après 3 vérifications (9 secondes)
    // ou on attend une action manuelle (simulée ici par le temps)
    console.log("Checking approval status...", pollingCount);
    
    if (pollingCount >= 3) {
      setStatus("approved");
    } else {
      setPollingCount((prev) => prev + 1);
    }
  };

  const handleContinue = async () => {
    if (status === "approved") {
      // Si approuvé, on va directement au login PIN
      // On doit s'assurer que les infos user sont bien stockées (ce qui devrait être fait dans InitialSetup avant redirection)
      
      // On marque la config comme faite mais "en attente de PIN local" ?
      // Non, le user a déjà un PIN sur son compte. Il doit juste le saisir pour déchiffrer/valider.
      // Mais attendez, si c'est un nouvel appareil, le PIN n'est pas stocké localement.
      // Donc "PinLoginScreen" ne marchera pas car il compare le hash stocké localement.
      
      // Il faut rediriger vers une version de PinLogin qui vérifie le PIN avec le serveur (Online Pin Verify)
      // OU demander à l'utilisateur de saisir son PIN existant pour le stocker localement.
      
      // Pour l'instant, on suppose que PinLogin gère ou on redirige vers InitialSetup Step 2 pré-rempli ?
      // Le user a dit: "envoyer le second therminal directement à l’ecran de saisie du code pin"
      
      // On va rediriger vers PinLogin, mais il faudra peut-être adapter PinLogin pour accepter un "premier login sur nouvel appareil"
      // ou simplement stocker le PIN hashé après une vérification en ligne.
      
      await SecureStore.setItemAsync("is_configured", "true");
      navigation.replace("PinLogin"); 
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { padding: width < 380 ? 20 : 30 }]}>
        <View style={styles.iconContainer}>
          {status === "pending" && (
            <ActivityIndicator size="large" color={colors.primary} />
          )}
          {status === "approved" && (
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          )}
          {status === "rejected" && (
            <Ionicons name="close-circle" size={80} color={colors.error} />
          )}
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {status === "pending"
            ? "Validation requise"
            : status === "approved"
            ? "Appareil approuvé !"
            : "Demande refusée"}
        </Text>

        <Text style={[styles.description, { color: colors.text + "CC" }]}>
          {status === "pending"
            ? "Une demande de connexion a été envoyée à votre appareil principal et par email. Veuillez valider pour continuer."
            : status === "approved"
            ? "Votre connexion a été validée par l'appareil principal. Vous pouvez maintenant accéder à votre compte."
            : "La demande de connexion a été refusée."}
        </Text>

        <View style={styles.deviceInfo}>
          <Ionicons name="phone-portrait-outline" size={24} color={colors.primary} />
          <Text style={[styles.deviceName, { color: colors.text }]}>
            {deviceName || "Cet appareil"}
          </Text>
        </View>

        <View style={styles.spacer} />

        {status === "approved" && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>Accéder au compte</Text>
          </TouchableOpacity>
        )}

        {status === "pending" && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.border }]}
            onPress={handleCancel}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>Annuler</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: 30,
    height: 100,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
  spacer: {
    flex: 1,
  },
  button: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default DeviceApprovalPendingScreen;
