import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useI18n } from "../../../app/providers/I18nProvider";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

// Reusing FormPicker for consistency (simplified version)
const FormPicker = ({
  label,
  value,
  options,
  onSelect,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  placeholder?: string;
  required?: boolean;
}) => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.pickerButton,
          { borderColor: colors.border, backgroundColor: colors.background },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={[
            styles.pickerText,
            { color: value ? colors.text : colors.text + "60" },
          ]}
        >
          {value || placeholder || "Sélectionner"}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.text + "60"} />
      </TouchableOpacity>
      {required && !value && (
        <Text style={[styles.mandatoryOverlay, { color: colors.error }]}>
          (obligatoire)
        </Text>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {label}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {options.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.modalItem,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }]}>
                    {item}
                  </Text>
                  {value === item && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export const AccountOpeningScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useI18n();

  const [step, setStep] = useState(1);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Form State
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [docImage, setDocImage] = useState<string | null>(null);

  const handleNext = () => {
    if (!lastName || !firstName || !phone || !email) {
      Alert.alert(t("common.error"), t("common.fillAllFields"));
      return;
    }
    setStep(2);
  };

  const handlePrevious = () => {
    setStep(1);
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      let result;
      if (useCamera) {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert("Permission requise", "L'accès à la caméra est nécessaire.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.7,
        });
      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert("Permission requise", "L'accès à la galerie est nécessaire.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.7,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDocImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la sélection de l'image.");
    }
  };

  const handleFinish = async () => {
    if (!idType || !idNumber) {
        Alert.alert(t("common.error"), t("common.fillAllFields"));
        return;
    }
    if (!docImage) {
        Alert.alert(t("common.error"), "Veuillez joindre une photo de votre pièce d'identité.");
        return;
    }

    // Simulate API call
    setTimeout(() => {
      setSuccessModalVisible(true);
    }, 1000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, { color: colors.text }]}>
            Ouverture de compte
          </Text>
          <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
            Remplissez les informations ci-dessous pour initier votre demande.
          </Text>

          {/* Stepper */}
          <View style={styles.stepperContainer}>
            <View
              style={[
                styles.stepCircle,
                { backgroundColor: step >= 1 ? colors.primary : colors.border },
              ]}
            >
              {step > 1 ? (
                <Ionicons name="checkmark" size={16} color="#fff" />
              ) : (
                <Text style={styles.stepText}>1</Text>
              )}
            </View>
            <View
              style={[
                styles.stepLine,
                { backgroundColor: step >= 2 ? colors.primary : colors.border },
              ]}
            />
            <View
              style={[
                styles.stepCircle,
                { backgroundColor: step >= 2 ? colors.primary : colors.border },
              ]}
            >
              <Text style={styles.stepText}>2</Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {step === 1 && (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Nom</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: colors.background,
                      },
                    ]}
                    placeholder="Votre nom"
                    placeholderTextColor={colors.text + "60"}
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Prénom</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: colors.background,
                      },
                    ]}
                    placeholder="Votre prénom"
                    placeholderTextColor={colors.text + "60"}
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Téléphone</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: colors.background,
                      },
                    ]}
                    placeholder="Numéro de téléphone"
                    placeholderTextColor={colors.text + "60"}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: colors.background,
                      },
                    ]}
                    placeholder="Adresse email"
                    placeholderTextColor={colors.text + "60"}
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary }]}
                  onPress={handleNext}
                >
                  <Text style={styles.buttonText}>{t("credit.request.next")}</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 2 && (
              <>
                <FormPicker
                  label="Type de pièce"
                  value={idType}
                  options={["CNI", "Passeport", "Permis de conduire"]}
                  onSelect={setIdType}
                  required
                />

                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Numéro de pièce
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: colors.background,
                      },
                    ]}
                    placeholder="Numéro de la pièce d'identité"
                    placeholderTextColor={colors.text + "60"}
                    value={idNumber}
                    onChangeText={setIdNumber}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Photo du document
                  </Text>
                  <View style={styles.imagePickerContainer}>
                    {docImage ? (
                      <View style={styles.imagePreview}>
                        <Image source={{ uri: docImage }} style={styles.image} />
                        <TouchableOpacity
                          style={[styles.removeImageBtn, { backgroundColor: colors.error }]}
                          onPress={() => setDocImage(null)}
                        >
                          <Ionicons name="trash" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.imageActions}>
                        <TouchableOpacity
                          style={[styles.actionBtn, { borderColor: colors.primary }]}
                          onPress={() => pickImage(true)}
                        >
                          <Ionicons name="camera" size={24} color={colors.primary} />
                          <Text style={[styles.actionText, { color: colors.primary }]}>
                            Prendre photo
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, { borderColor: colors.primary }]}
                          onPress={() => pickImage(false)}
                        >
                          <Ionicons name="images" size={24} color={colors.primary} />
                          <Text style={[styles.actionText, { color: colors.primary }]}>
                            Galerie
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.footerButtons}>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.prevButton,
                      { backgroundColor: colors.border },
                    ]}
                    onPress={handlePrevious}
                  >
                    <Text style={[styles.buttonText, { color: colors.text }]}>
                      {t("credit.request.previous")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.nextButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={handleFinish}
                  >
                    <Text style={styles.buttonText}>{t("credit.request.finish")}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>Demande envoyée !</Text>
            <Text style={styles.successMessage}>
              Votre demande d'ouverture de compte a bien été reçue. Un conseiller vous contactera sous peu.
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.successButtonText}>Retour à l'accueil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
    fontSize: 16,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  pickerText: {
    fontSize: 16,
  },
  mandatoryOverlay: {
    position: "absolute",
    right: 15,
    top: 45,
    fontSize: 12,
    opacity: 0.6,
  },
  button: {
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  footerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  prevButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  stepText: {
    color: "#fff",
    fontWeight: "bold",
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 10,
  },
  imagePickerContainer: {
    marginTop: 5,
  },
  imageActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: "dashed",
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "600",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeImageBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 15,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalItemText: {
    fontSize: 16,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    width: "85%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
  },
  successButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: "100%",
  },
  successButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
