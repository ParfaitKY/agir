import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  useWindowDimensions,
  ActivityIndicator,
  useColorScheme,
  Animated,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { secureSetItem } from "../../../shared/utils/secureStorage";
import { usePreventScreenCapture } from "expo-screen-capture";
import { useAuth } from "../../../app/hooks/useAuth";

const InitialSetupScreen: React.FC = () => {
  usePreventScreenCapture();
  const { width, height } = useWindowDimensions();
  const { user, markConfigured, login } = useAuth() as any;
  const navigation = useNavigation() as any;
  const [step, setStep] = useState<1 | 2>(1);
  const [accountNumber, setAccountNumber] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  const [loginReadonly, setLoginReadonly] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [defaultPin, setDefaultPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showDefaultPin, setShowDefaultPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [savingPin, setSavingPin] = useState(false);
  // Scanner QR retiré pour corriger les erreurs de build sur web
  // Gestion d’un logo distant avec fallback
  const [logoError, setLogoError] = useState(false);

  const accountNumberRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);

  // Paramètres responsives UI - AMÉLIORÉS POUR TOUS LES ÉCRANS
  const avatarSize = Math.max(48, Math.min(72, width * 0.12));
  const logoBoxHeight = Math.min(Math.max(60, width * 0.15), 140);
  const logoBoxWidth = Math.min(Math.max(120, width * 0.4), 300);
  
  // Tailles de police adaptatives
  const headingFontSize =
    width >= 1200 ? 24 :    // Grands écrans
    width >= 1024 ? 22 :    // Tablettes grandes
    width >= 768 ? 20 :     // Tablettes
    width >= 420 ? 18 :     // Grands téléphones
    width >= 375 ? 17 :     // Téléphones moyens
    16;                     // Petits téléphones
    
  const subtitleFontSize = 
    width >= 1024 ? 14 : 
    width >= 768 ? 13 : 
    12;
    
  // Padding et espacement adaptatifs
  const containerPadding = 
    width >= 1024 ? 32 :    // Grands écrans
    width >= 768 ? 24 :     // Tablettes
    width >= 420 ? 20 :     // Grands téléphones
    16;                     // Petits téléphones
    
  const cardPadding = 
    width >= 1024 ? 32 :
    width >= 768 ? 24 :
    width >= 420 ? 20 :
    16;
    
  // Largeur maximale du conteneur
  const maxContainerWidth = 
    width >= 1400 ? 800 :   // Très grands écrans
    width >= 1200 ? 700 :   // Grands écrans
    width >= 1024 ? 600 :   // Tablettes grandes
    width >= 768 ? 500 :    // Tablettes
    width >= 420 ? 380 :    // Grands téléphones
    340;                   // Petits téléphones

  // Thème (dark / light)
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const palette = {
    bg: isDark ? "#0B1220" : "#F1F5F9",
    card: isDark ? "#111827" : "#FFFFFF",
    textMain: isDark ? "#E5E7EB" : "#0F172A",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#374151" : "#E5E7EB",
    primary: "#0066CC",
  };

  // Animation de transition - AMÉLIORÉE
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    // Animation d'entrée plus fluide
    fadeAnim.setValue(0);
    slideAnim.setValue(width >= 768 ? 30 : 20);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  useEffect(() => {
    if (step === 1) {
      accountNumberRef.current?.focus();
    } else {
      lastNameRef.current?.focus();
    }
  }, [step]);
  // closeScanner retiré avec le scanner QR

  // Écriture sécurisée avec fallback Web
  const securePut = async (key: string, value: string) => {
    try {
      const available = await SecureStore.isAvailableAsync();
      if (available) {
        await SecureStore.setItemAsync(key, value);
      } else if (Platform.OS === "web") {
        // Fallback Web: localStorage
        try {
          // @ts-ignore
          window?.localStorage?.setItem(key, value);
        } catch {}
      } else {
        // Essayer quand même sur plateformes natives
        await SecureStore.setItemAsync(key, value);
      }
    } catch (err) {
      if (Platform.OS === "web") {
        try {
          // @ts-ignore
          window?.localStorage?.setItem(key, value);
          return;
        } catch {}
      }
      throw err;
    }
  };

  const handleVerifyAccountNumber = async () => {
    setVerifyError(null);
    if (!accountNumber || accountNumber.length < 8) {
      setVerifyError("Numéro de compte invalide. Vérifiez et réessayez.");
      return;
    }
    try {
      setLoadingVerify(true);
      // Simulation de vérification serveur
      await new Promise((res) => setTimeout(res, 800));
      const clientName = "Client";
      const fetchedUser = {
        id: accountNumber,
        login: `user_${accountNumber.substring(0, 8)}`,
        name: clientName,
        agency: "Agence Principale",
      };
      // Affiche message de succès puis transition
      setVerifySuccess(true);
      setLoginReadonly(fetchedUser.login);
      setTimeout(() => {
        setStep(2);
        setVerifySuccess(false);
      }, 600);
      // Stockage en arrière-plan (ne bloque pas la navigation entre sections)
      SecureStore.setItemAsync("user_data", JSON.stringify(fetchedUser)).catch(
        () => {
          // En cas d'échec de stockage, on laisse quand même l'utilisateur poursuivre
        }
      );
    } catch (e) {
      setVerifyError("Erreur lors de la vérification. Réessayez.");
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleGuestMode = async () => {
    try {
      await login({ username: "invite", password: "invite" });
      if (markConfigured) await markConfigured(true);
      // Rediriger directement vers l'accueil (Dashboard) dans les onglets principaux
      if (navigation?.navigate) {
        (navigation as any).navigate("Main", { screen: "Dashboard" });
      } else if (navigation?.replace) {
        (navigation as any).replace("Main");
      }
    } catch (e) {
      setVerifyError("Impossible d’activer le mode invité.");
    }
  };

  const handleSavePin = async () => {
    setPinError(null);
    // Validations de base
    const minLen = 4;
    if (!firstName || !lastName || !loginReadonly || !newPin || !confirmPin || !secretKey) {
      setPinError("Tous les champs sont requis.");
      return;
    }
    if (newPin.length < minLen) {
      setPinError(`Le code PIN doit contenir au moins ${minLen} chiffres.`);
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("Le code PIN et sa confirmation ne correspondent pas.");
      return;
    }
    if (secretKey.length < 3) {
      setPinError("La clé secrète doit contenir au moins 3 caractères.");
      return;
    }
    try {
      setSavingPin(true);
      // Hachage et stockage sécurisé du PIN utilisateur
      const hashedUserPin = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        newPin
      );
      await secureSetItem("pin_user", hashedUserPin);
      // Stocker les informations utilisateur
      await secureSetItem("user_firstname", firstName);
      await secureSetItem("user_lastname", lastName);
      await secureSetItem("user_login", loginReadonly);
      await secureSetItem("user_secret_key", secretKey);
      await secureSetItem("is_configured", "true");
      // Marquer l’app comme configurée et rediriger via provider
      if (markConfigured) await markConfigured(true);
      // Redirection immédiate vers l'écran de connexion par PIN
      if (navigation?.replace) {
        navigation.replace("PinLogin");
      } else if (navigation?.navigate) {
        navigation.navigate("PinLogin");
      }
    } catch (e) {
      setPinError("Échec de l'enregistrement. Réessayez.");
    } finally {
      setSavingPin(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg, paddingTop: containerPadding + 30, paddingHorizontal: containerPadding }]}>
      <View style={styles.backgroundDecor} pointerEvents="none">
        <View
          style={[
            styles.ring,
            {
              top: 60,
              left: -20,
              width: Math.min(width * 0.35, 200),
              height: Math.min(width * 0.35, 200),
              borderRadius: Math.min(width * 0.35, 200) / 2,
            },
          ]}
        />
        <View
          style={[
            styles.ring,
            {
              top: 40,
              right: -40,
              width: Math.min(width * 0.4, 250),
              height: Math.min(width * 0.4, 250),
              borderRadius: Math.min(width * 0.4, 250) / 2,
            },
          ]}
        />
        <View
          style={[
            styles.ring,
            {
              bottom: 80,
              left: 0,
              width: Math.min(width * 0.6, 400),
              height: Math.min(width * 0.6, 400),
              borderRadius: Math.min(width * 0.6, 400) / 2,
            },
          ]}
        />
      </View>
      <View style={styles.content}>
        <View
          style={[
            styles.stack,
            {
              maxWidth: maxContainerWidth,
              width: '100%',
              paddingHorizontal: width >= 768 ? 16 : 8,
            },
          ]}
        >
          <View style={[styles.topCard, { backgroundColor: palette.card, padding: cardPadding }]}>
            <View
              style={[
                styles.logoBox,
                { width: logoBoxWidth, height: logoBoxHeight },
              ]}
            >
              <Image
                source={
                  logoError
                    ? require("../../../../assets/icon.png")
                    : { uri: "https://lapeyrie-emf.ga/logo.png" }
                }
                style={styles.logo}
                resizeMode="contain"
                onError={() => setLogoError(true)}
                accessibilityLabel="Logo de l’application"
              />
            </View>
            <Text
              style={[
                styles.welcomeText,
                { 
                  fontSize: headingFontSize * 0.9, 
                  color: palette.textMain,
                  lineHeight: headingFontSize * 1.3,
                  marginBottom: width >= 768 ? 2 : 1,
                },
              ]}
            >
              {step === 1
                ? "Bienvenue ! Vérifions votre identité"
                : "Configuration du PIN"}
            </Text>
            {step === 2 && loginReadonly && (
              <Text
                style={[
                  styles.clientName,
                  { 
                    fontSize: headingFontSize * 0.7, 
                    color: palette.primary,
                    marginBottom: width >= 768 ? 2 : 1,
                    fontWeight: "600",
                  },
                ]}
              >
                {loginReadonly.split('_')[0].charAt(0).toUpperCase() + loginReadonly.split('_')[0].slice(1)}
              </Text>
            )}
            <View style={styles.stepPill}>
              <Text style={styles.stepPillText}>
                {step === 1 ? "Étape 1/2" : "Étape 2/2"}
              </Text>
            </View>
            <Text
              style={[
                styles.topSubtitle,
                { 
                  fontSize: subtitleFontSize, 
                  color: palette.textSub,
                  lineHeight: subtitleFontSize * 1.5,
                  marginTop: width >= 768 ? 8 : 4,
                },
              ]}
            >
              {step === 1 ? "Configuration initiale de votre appareil" : "Configuration du code PIN"}
            </Text>
          </View>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            bounces={true}
            alwaysBounceVertical={true}
            scrollEnabled={true}
            nestedScrollEnabled={true}
          >
            <Animated.View style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}>
              {step === 1 && (
                <View style={[styles.card, { padding: cardPadding }]}>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons
                      name="verified-user"
                      size={18}
                      color={palette.textMain}
                    />
                    <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
                      Vérification de l'identité
                    </Text>
                  </View>
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.label}>Numéro de compte</Text>
                  <TextInput
                    placeholder="Saisir votre numéro de compte"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    style={styles.input}
                    autoCapitalize="none"
                    autoFocus
                    ref={accountNumberRef}
                    keyboardType="number-pad"
                    maxLength={12}
                  />
                  </View>
                  <Text style={[styles.hint, { color: palette.textSub }]}>
                    Entrez votre numéro de compte reçu par mail ou SMS.
                  </Text>
                  <View style={[styles.actionsRow, { 
                    flexDirection: width >= 420 ? 'row' : 'column',
                    gap: width >= 420 ? 8 : 12,
                  }]}>
                    <View style={{ marginTop: 24 }}>
                      <TouchableOpacity
                        style={[
                          styles.secondaryButton,
                          {
                            flex: width >= 420 ? 1 : undefined,
                            width: width >= 420 ? 'auto' : '100%',
                            backgroundColor: isDark ? "#111827" : "#F1F5F9",
                            borderColor: palette.border,
                            paddingVertical: width >= 768 ? 14 : 12,
                          },
                        ]}
                        onPress={() =>
                          setVerifyError(
                            "Scan QR indisponible sur ce périphérique. Saisissez le numéro de compte manuellement."
                          )
                        }
                      >
                        <MaterialIcons
                          name="qr-code-scanner"
                          size={18}
                          color={palette.textMain}
                        />
                        <Text
                          style={[
                            styles.secondaryButtonText,
                            { color: palette.textMain },
                          ]}
                        >
                          Scanner Code
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        {
                          flex: width >= 420 ? 1 : undefined,
                          width: width >= 420 ? 'auto' : '100%',
                          marginLeft: width >= 420 ? 8 : 0,
                          marginTop: width >= 420 ? 0 : 12,
                          opacity: accountNumber.length >= 8 ? 1 : 0.6,
                          paddingVertical: width >= 768 ? 14 : 12,
                        },
                      ]}
                      onPress={handleVerifyAccountNumber}
                      disabled={loadingVerify || accountNumber.length < 8}
                    >
                      <View style={styles.buttonContent}>
                        <Text style={styles.buttonText}>
                          {loadingVerify ? "Vérification..." : "Vérifier"}
                        </Text>
                        {loadingVerify ? (
                          <ActivityIndicator
                            size="small"
                            color="#FFFFFF"
                            style={{ marginLeft: 8 }}
                          />
                        ) : (
                          <MaterialIcons
                            name="arrow-forward"
                            size={18}
                            color="#FFFFFF"
                            style={{ marginLeft: 6 }}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                  {!!verifyError && (
                    <Text style={styles.error}>{verifyError}</Text>
                  )}
                  {!!verifySuccess && (
                    <View style={{ marginTop: 16 }}>
                      <Text style={styles.successHint}>
                        Identifiant vérifié avec succès 🎉
                      </Text>
                    </View>
                  )}
                  <Text style={styles.hint}>
                    Astuce: entrez le numéro de compte tel qu'indiqué sur votre carte client.
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.secondaryButton,
                      {
                        marginTop: width >= 768 ? 16 : 12,
                        backgroundColor: isDark ? "#111827" : "#F1F5F9",
                        borderColor: palette.border,
                        paddingVertical: width >= 768 ? 14 : 12,
                        width: '100%',
                      },
                    ]}
                    onPress={handleGuestMode}
                  >
                    <MaterialIcons
                      name="person-outline"
                      size={18}
                      color={palette.textMain}
                    />
                    <Text
                      style={[
                        styles.secondaryButtonText,
                        { color: palette.textMain },
                      ]}
                    >
                      Continuer en mode invité
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {step === 2 && (
                <View style={[styles.card, { backgroundColor: palette.card, padding: cardPadding, marginTop: 20 }]}>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons
                      name="vpn-key"
                      size={22}
                      color={palette.primary}
                    />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { marginLeft: 12, color: palette.textMain },
                      ]}
                    >
                      Configuration du code PIN
                    </Text>
                  </View>
                  
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.label}>Nom</Text>
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    style={styles.input}
                    placeholder="Votre nom"
                    autoCapitalize="words"
                    ref={lastNameRef}
                  />
                  </View>
                  
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.label}>Prénom</Text>
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    style={styles.input}
                    placeholder="Votre prénom"
                    autoCapitalize="words"
                  />
                  </View>
                  
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.label}>Login</Text>
                  <TextInput
                    value={loginReadonly}
                    onChangeText={setLoginReadonly}
                    style={styles.input}
                    placeholder="Choisissez votre nom d'utilisateur"
                    autoCapitalize="none"
                    />
                  </View>
                  
                  <View style={{ marginTop: 16 }}>
                    <Text style={styles.label}>Code PIN</Text>
                    <View style={styles.pinRow}>
                      <TextInput
                        value={newPin}
                        onChangeText={setNewPin}
                        style={[styles.input, { flex: 1 }]}
                        secureTextEntry={!showNewPin}
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholder="Nouveau code PIN"
                      />
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => setShowNewPin((s) => !s)}
                      >
                        <MaterialIcons
                          name={showNewPin ? "visibility-off" : "visibility"}
                          size={18}
                          color={palette.textMain}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.label}>Confirmation du code PIN</Text>
                    <View style={styles.pinRow}>
                      <TextInput
                        value={confirmPin}
                        onChangeText={setConfirmPin}
                        style={[styles.input, { flex: 1 }]}
                        secureTextEntry={!showConfirmPin}
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholder="Confirmez votre code PIN"
                      />
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => setShowConfirmPin((s) => !s)}
                      >
                        <MaterialIcons
                          name={showConfirmPin ? "visibility-off" : "visibility"}
                          size={18}
                          color={palette.textMain}
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.label}>Clé secrète</Text>
                    <View style={styles.pinRow}>
                      <TextInput
                        value={secretKey}
                        onChangeText={setSecretKey}
                        style={[styles.input, { flex: 1 }]}
                        secureTextEntry={!showSecretKey}
                        placeholder="Votre clé secrète personnelle"
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => setShowSecretKey((s) => !s)}
                      >
                        <MaterialIcons
                          name={showSecretKey ? "visibility-off" : "visibility"}
                          size={18}
                          color={palette.textMain}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {!!pinError && (
                    <View style={{ marginTop: 16 }}>
                      <Text style={styles.error}>{pinError}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.button,
                      {
                        opacity:
                          newPin.length >= 4 && newPin === confirmPin && secretKey.length >= 3 ? 1 : 0.6,
                      },
                    ]}
                    onPress={handleSavePin}
                    disabled={
                      savingPin || newPin.length < 4 || newPin !== confirmPin || secretKey.length < 3
                    }
                  >
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>
                        {savingPin ? "Enregistrement..." : "Enregistrer"}
                      </Text>
                      {!savingPin && (
                        <MaterialIcons
                          name="check-circle"
                          size={16}
                          color="#FFFFFF"
                          style={{ marginLeft: 6 }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.successHint}>
                    Après succès, vous serez redirigé vers la connexion par PIN.
                  </Text>
                  </View>
                  {/* Espace supplémentaire pour s'assurer que tout le contenu est visible sur petits écrans */}
                  <View style={{ height: 100 }} />
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </View>
      </View>
      {/* Overlay scanner QR retiré */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F1F5F9" 
  },
  content: { 
    flex: 1, 
    justifyContent: "flex-start", 
    alignItems: "center",
    minHeight: '110%', // Ajouté pour garantir suffisamment d'espace vertical
    paddingHorizontal: 8,
    paddingTop: 20,
  },
  stack: { 
    width: "100%",
    maxWidth: 800,
  },
  backgroundDecor: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ring: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: "#94A3B8",
    opacity: 0.12,
  },
  topCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    zIndex: 2,
    marginBottom: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  stepPill: {
    marginTop: 8,
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  stepPillText: { 
    fontSize: 13, 
    fontWeight: "700", 
    color: "#0F172A",
    textAlign: "center",
  },
  topSubtitle: { 
    fontSize: 14, 
    color: "#64748B", 
    marginTop: 8,
    textAlign: "center",
  },
  clientName: {
    textAlign: "center",
  },
  // Conteneur du logo pour un rendu propre et centré
  logoBox: {
    width: 180,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  logo: { 
    width: "100%", 
    height: "100%",
    resizeMode: "contain",
  },
  // Ancien avatar (non utilisé)
  avatar: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    marginBottom: 12 
  },
  welcomeText: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#0F172A",
    textAlign: "center",
  },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 16 
  },
  title: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#0F172A" 
  },
  subtitle: { 
    fontSize: 14, 
    color: "#64748B" 
  },
  scrollContent: { 
    paddingBottom: 300, // Augmenté de 200 à 300 pour petits écrans
    paddingTop: 30,
    flexGrow: 1, 
    justifyContent: "flex-start",
    minHeight: '120%', // Augmenté pour s'assurer que tout le contenu est accessible
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 500,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 0,
    color: "#111827",
    letterSpacing: -0.5,
  },
  actionsRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginTop: 8,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    color: "#1F2937",
  },
  readonly: { 
    color: "#6B7280",
    backgroundColor: "#F9FAFB",
  },
  label: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#374151", 
    marginBottom: 10,
    marginTop: 8,
  },
  pinRow: { 
    flexDirection: "row", 
    alignItems: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#0066CC",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#0066CC",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 16,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  secondaryButtonText: { 
    marginLeft: 8, 
    color: "#0F172A", 
    fontWeight: "600",
    fontSize: 13,
  },
  iconButton: {
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#F9FAFB",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  buttonText: { 
    color: "#FFFFFF", 
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  error: { 
    color: "#DC2626", 
    marginBottom: 16,
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  hint: { 
    fontSize: 13, 
    color: "#6B7280", 
    marginTop: 10,
    marginBottom: 16,
    lineHeight: 18,
    fontWeight: "500",
  },
  successHint: { 
    fontSize: 13, 
    color: "#059669", 
    marginTop: 16,
    fontWeight: "600",
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    textAlign: "center",
  },
  // Styles du scanner retirés
});

export default InitialSetupScreen;
