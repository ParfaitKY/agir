import React, { useState, useLayoutEffect } from "react";
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
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useI18n } from "../../../app/providers/I18nProvider";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Composant Helper pour les sélecteurs (Dropdowns)
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

  // Force colors for Light Theme look on the white card
  const labelColor = "#333333";
  const inputBg = "#FFFFFF";
  const borderColor = "#E0E0E0";
  const textColor = "#000000";
  const placeholderColor = "#9E9E9E";

  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.pickerButton,
          { borderColor: borderColor, backgroundColor: inputBg },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={[
            styles.pickerText,
            { color: value ? textColor : placeholderColor },
          ]}
        >
          {value || placeholder || "Sélectionner"}
        </Text>
        <Ionicons name="chevron-down" size={20} color={placeholderColor} />
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
          <View style={[styles.modalContent, { backgroundColor: "#fff" }]}>
            <View
              style={[styles.modalHeader, { borderBottomColor: borderColor }]}
            >
              <Text style={[styles.modalTitle, { color: textColor }]}>
                {label}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: borderColor }]}
                  onPress={() => {
                    onSelect(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: textColor }]}>
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
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export const CreditRequestScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [activeLoan, setActiveLoan] = useState<{
    amount: number;
    duration: number; // mois
    remainingPayments: number;
    dueDate: string;
  } | null>(null);

  // Simuler un prêt en cours (à remplacer par un appel API réel)
  React.useEffect(() => {
    // Exemple : setActiveLoan({ amount: 5000000, duration: 24, remainingPayments: 12, dueDate: "15/05/2024" });
    setActiveLoan(null);
  }, []);

  // Define colors for consistent Light Theme on the white card
  const labelColor = "#333333";
  const inputBg = "#FFFFFF";
  const borderColor = "#E0E0E0";
  const textColor = "#000000";
  const placeholderColor = "#9E9E9E";

  // Form State
  const [type, setType] = useState("");
  const [nature, setNature] = useState("");
  const [product, setProduct] = useState("");
  const [activity, setActivity] = useState("");
  const [object, setObject] = useState("");
  const [descActivity, setDescActivity] = useState("");
  const [amount, setAmount] = useState("");

  const [periodicity, setPeriodicity] = useState("");
  const [duration, setDuration] = useState("");
  const [deferred, setDeferred] = useState("");
  const [country, setCountry] = useState("CÔTE D'IVOIRE");
  const [birthCountry, setBirthCountry] = useState("CÔTE D'IVOIRE");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [city, setCity] = useState("");
  const [commune, setCommune] = useState("");
  const [location, setLocation] = useState("");

  // Setup Header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 16 }}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      ),
      headerTitleAlign: "center",
    });
  }, [navigation, colors]);

  const handleNext = () => {
    if (
      !type ||
      !nature ||
      !product ||
      !activity ||
      !object ||
      !descActivity ||
      !amount
    ) {
      Alert.alert(t("common.error"), t("common.fillAllFields"));
      return;
    }
    setStep(2);
  };

  const handlePrevious = () => {
    setStep(1);
  };

  const handleFinish = () => {
    if (
      !periodicity ||
      !duration ||
      !deferred ||
      !country ||
      !birthCountry ||
      !idType ||
      !idNumber ||
      !city ||
      !commune ||
      !location
    ) {
      Alert.alert(t("common.error"), t("common.fillAllFields"));
      return;
    }
    // Submit logic here
    Alert.alert("Succès", "Demande de crédit soumise avec succès", [
      { text: "OK", onPress: () => navigation.goBack() },
    ]);
  };

  if (activeLoan) {
    return (
      <View
        style={[styles.container, { backgroundColor: "#F5F5F5", padding: 20 }]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={64}
            color={colors.primary}
            style={{ marginBottom: 20 }}
          />
          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: labelColor,
              marginBottom: 20,
            }}
          >
            Prêt en cours
          </Text>

          <View style={{ width: "100%", paddingHorizontal: 20 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 15,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: borderColor,
              }}
            >
              <Text style={{ fontSize: 16, color: "#666" }}>Montant</Text>
              <Text
                style={{ fontSize: 16, fontWeight: "bold", color: textColor }}
              >
                {activeLoan.amount.toLocaleString("fr-FR")} XAF
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 15,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: borderColor,
              }}
            >
              <Text style={{ fontSize: 16, color: "#666" }}>Durée</Text>
              <Text
                style={{ fontSize: 16, fontWeight: "bold", color: textColor }}
              >
                {activeLoan.duration} mois
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 15,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: borderColor,
              }}
            >
              <Text style={{ fontSize: 16, color: "#666" }}>
                Paiements restants
              </Text>
              <Text
                style={{ fontSize: 16, fontWeight: "bold", color: textColor }}
              >
                {activeLoan.remainingPayments}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 15,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: borderColor,
              }}
            >
              <Text style={{ fontSize: 16, color: "#666" }}>
                Date d'échéance
              </Text>
              <Text
                style={{ fontSize: 16, fontWeight: "bold", color: textColor }}
              >
                {activeLoan.dueDate}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary, marginTop: 30, width: "100%" },
            ]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#F5F5F5" }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Stepper */}
          <View style={styles.stepperContainer}>
            <View
              style={[
                styles.stepCircle,
                { backgroundColor: step >= 1 ? "#8BC34A" : "#BDBDBD" },
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
                { backgroundColor: step >= 2 ? "#8BC34A" : "#E0E0E0" },
              ]}
            />
            <View
              style={[
                styles.stepCircle,
                { backgroundColor: step >= 2 ? "#8BC34A" : "#BDBDBD" },
              ]}
            >
              <Text style={styles.stepText}>2</Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: "#fff" }]}>
            {step === 1 && (
              <>
                <FormPicker
                  label={t("credit.request.type")}
                  value={type}
                  options={["Particulier", "Entreprise"]}
                  onSelect={setType}
                />
                <FormPicker
                  label={t("credit.request.nature")}
                  value={nature}
                  options={["Consommation", "Immobilier", "Agricole"]}
                  onSelect={setNature}
                />
                <FormPicker
                  label={t("credit.request.product")}
                  value={product}
                  options={["Produit A", "Produit B", "Produit C"]}
                  onSelect={setProduct}
                />
                <FormPicker
                  label={t("credit.request.activity")}
                  value={activity}
                  options={["Commerce", "Services", "Industrie"]}
                  onSelect={setActivity}
                />
                <FormPicker
                  label={t("credit.request.object")}
                  value={object}
                  options={["Achat équipement", "Fonds de roulement"]}
                  onSelect={setObject}
                />

                <View style={styles.fieldGroup}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: borderColor,
                        color: textColor,
                        backgroundColor: inputBg,
                      },
                    ]}
                    placeholder={t("credit.request.descActivity")}
                    placeholderTextColor={placeholderColor}
                    value={descActivity}
                    onChangeText={setDescActivity}
                  />
                  <Text
                    style={[
                      styles.mandatoryOverlayInput,
                      { color: colors.error },
                    ]}
                  >
                    {t("credit.simulator.mandatory")}
                  </Text>
                </View>

                <View style={styles.fieldGroup}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: borderColor,
                        color: textColor,
                        backgroundColor: inputBg,
                      },
                    ]}
                    placeholder={t("credit.request.amount")}
                    placeholderTextColor={placeholderColor}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                  />
                  <Text
                    style={[
                      styles.mandatoryOverlayInput,
                      { color: colors.error },
                    ]}
                  >
                    {t("credit.simulator.mandatory")}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#2196F3" }]} // Strong Blue for Next
                  onPress={handleNext}
                >
                  <Text style={styles.buttonText}>
                    {t("credit.request.next")}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {step === 2 && (
              <>
                <FormPicker
                  label={t("credit.request.periodicity")}
                  value={periodicity}
                  options={["Mensuelle", "Trimestrielle", "Annuelle"]}
                  onSelect={setPeriodicity}
                />

                <View style={styles.fieldGroup}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: borderColor,
                        color: textColor,
                        backgroundColor: inputBg,
                      },
                    ]}
                    placeholder={t("credit.request.duration")}
                    placeholderTextColor={placeholderColor}
                    keyboardType="numeric"
                    value={duration}
                    onChangeText={setDuration}
                  />
                  <Text
                    style={[
                      styles.mandatoryOverlayInput,
                      { color: colors.error },
                    ]}
                  >
                    {t("credit.simulator.mandatory")}
                  </Text>
                </View>

                <View style={styles.fieldGroup}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: borderColor,
                        color: textColor,
                        backgroundColor: inputBg,
                      },
                    ]}
                    placeholder={t("credit.request.deferred")}
                    placeholderTextColor={placeholderColor}
                    keyboardType="numeric"
                    value={deferred}
                    onChangeText={setDeferred}
                  />
                  <Text
                    style={[
                      styles.mandatoryOverlayInput,
                      { color: colors.error },
                    ]}
                  >
                    {t("credit.simulator.mandatory")}
                  </Text>
                </View>

                <FormPicker
                  label={t("credit.request.country")}
                  value={country}
                  options={["CÔTE D'IVOIRE"]}
                  onSelect={setCountry}
                  required
                />

                <FormPicker
                  label={t("credit.request.birthCountry")}
                  value={birthCountry}
                  options={[
                    "CÔTE D'IVOIRE",
                    "SÉNÉGAL",
                    "MALI",
                    "BURKINA FASO",
                    "FRANCE",
                  ]}
                  onSelect={setBirthCountry}
                  required
                />

                <FormPicker
                  label={t("credit.request.idType")}
                  value={idType}
                  options={[
                    "CNI",
                    "PASSEPORT",
                    "PERMIS DE CONDUIRE",
                    "ATTESTATION",
                  ]}
                  onSelect={setIdType}
                  required
                />

                <View style={styles.fieldGroup}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: borderColor,
                        color: textColor,
                        backgroundColor: inputBg,
                      },
                    ]}
                    placeholder={t("credit.request.idNumber")}
                    placeholderTextColor={placeholderColor}
                    value={idNumber}
                    onChangeText={setIdNumber}
                  />
                  <Text
                    style={[
                      styles.mandatoryOverlayInput,
                      { color: colors.error },
                    ]}
                  >
                    {t("credit.simulator.mandatory")}
                  </Text>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: labelColor }]}>
                    {t("credit.request.city")}
                  </Text>
                  {/* Using text input for now as per image looks like select but lets stick to simple mock if no data */}
                  {/* Image shows dropdown arrow, so keeping FormPicker logic but maybe mocked */}
                  <TouchableOpacity
                    style={[
                      styles.pickerButton,
                      {
                        borderColor: borderColor,
                        backgroundColor: inputBg,
                      },
                    ]}
                    onPress={() => setCity(city ? "" : "ABIDJAN")} // Toggle mock
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        { color: city ? textColor : placeholderColor },
                      ]}
                    >
                      {city || t("credit.request.city")}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={placeholderColor}
                    />
                  </TouchableOpacity>
                  <Text
                    style={[styles.mandatoryOverlay, { color: colors.error }]}
                  >
                    {t("credit.simulator.mandatory")}
                  </Text>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: labelColor }]}>
                    {t("credit.request.commune")}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.pickerButton,
                      {
                        borderColor: borderColor,
                        backgroundColor: inputBg,
                      },
                    ]}
                    onPress={() => setCommune(commune ? "" : "COCODY")} // Toggle mock
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        { color: commune ? textColor : placeholderColor },
                      ]}
                    >
                      {commune || t("credit.request.commune")}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={placeholderColor}
                    />
                  </TouchableOpacity>
                  <Text
                    style={[styles.mandatoryOverlay, { color: colors.error }]}
                  >
                    {t("credit.simulator.mandatory")}
                  </Text>
                </View>

                <View style={styles.fieldGroup}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: borderColor,
                        color: textColor,
                        backgroundColor: inputBg,
                      },
                    ]}
                    placeholder={t("credit.request.location")}
                    placeholderTextColor={placeholderColor}
                    value={location}
                    onChangeText={setLocation}
                  />
                  <Text
                    style={[
                      styles.mandatoryOverlayInput,
                      { color: colors.error },
                    ]}
                  >
                    {t("credit.simulator.mandatory")}
                  </Text>
                </View>

                <View style={styles.footerButtons}>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.prevButton,
                      { backgroundColor: "#757575" }, // Solid Grey for Previous
                    ]}
                    onPress={handlePrevious}
                  >
                    <Text style={styles.buttonText}>
                      {t("credit.request.previous")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.nextButton,
                      { backgroundColor: "#E53935" }, // Strong Red for Finish
                    ]}
                    onPress={handleFinish}
                  >
                    <Text style={styles.buttonText}>
                      {t("credit.request.finish")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
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
    position: "relative",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
    fontSize: 16,
  },
  mandatoryOverlay: {
    position: "absolute",
    right: 15,
    top: 45, // Adjust based on label height + padding
    fontSize: 12,
    opacity: 0.6,
  },
  mandatoryOverlayInput: {
    position: "absolute",
    right: 15,
    top: 18,
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
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
});
