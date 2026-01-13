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
import {
  secureGetItem,
  secureSetItem,
} from "../../../shared/utils/secureStorage";

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
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
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
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [activeLoan, setActiveLoan] = useState<{
    amount: number;
    duration: number; // mois
    remainingPayments: number;
    dueDate: string;
  } | null>(null);

  // New states for dashboard view
  const [viewMode, setViewMode] = useState<"history" | "form">("history");
  const [historyFilter, setHistoryFilter] = useState<
    "PENDING" | "APPROVED" | "REJECTED"
  >("PENDING");
  const [requests, setRequests] = useState<any[]>([]);

  // Load requests on mount
  React.useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const stored = await secureGetItem("local_credit_requests");
      let data = stored ? JSON.parse(stored) : [];

      // Filter out mock data if it exists from previous sessions
      data = data.filter((item: any) => !String(item.id).startsWith("mock-"));

      setRequests(data);
    } catch (e) {
      console.error("Failed to load requests", e);
    }
  };

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

  const handleFinish = async () => {
    try {
      const missingFields = [];
      if (!periodicity) missingFields.push(t("credit.request.periodicity"));
      if (!duration) missingFields.push(t("credit.request.duration"));
      if (!deferred) missingFields.push(t("credit.request.deferred"));
      if (!country) missingFields.push(t("credit.request.country"));
      if (!birthCountry) missingFields.push(t("credit.request.birthCountry"));
      if (!idType) missingFields.push(t("credit.request.idType"));
      if (!idNumber) missingFields.push(t("credit.request.idNumber"));
      if (!city) missingFields.push(t("credit.request.city"));
      if (!commune) missingFields.push(t("credit.request.commune"));
      if (!location) missingFields.push(t("credit.request.location"));

      if (missingFields.length > 0) {
        Alert.alert(
          t("common.error"),
          `${t("common.fillAllFields")}\n\n${missingFields.join(", ")}`
        );
        return;
      }

      // Create a simulated credit account
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const newCreditAccount = {
        id: Date.now(),
        CO_CODECOMPTE: "CREDIT-" + Date.now(),
        CO_INTITULECOMPTE: "Compte Credit",
        NUMEROCOMPTE: "CR-" + Math.floor(Math.random() * 1000000000),
        SOLDE: parseFloat(amount) || 0,
        MONTANTBLOQUE: 0,
        PD_LIBELLE: "Crédit Consommation",
        CO_DATECLOTURE: "1900-01-01",
        type: "CREDIT",
        // Extra info for modal
        duration: duration + " mois",
        nextDueDate: nextMonth.toLocaleDateString("fr-FR"),
      };

      // Save to local storage (Accounts)
      const existingStr = await secureGetItem("local_credit_accounts");
      const existing = existingStr ? JSON.parse(existingStr) : [];
      existing.push(newCreditAccount);
      await secureSetItem("local_credit_accounts", JSON.stringify(existing));

      // Save to requests history
      const newRequest = {
        id: Date.now(),
        amount: parseFloat(amount) || 0,
        date: new Date().toISOString().split("T")[0],
        status: "APPROVED", // Auto-approved for demo
        type: nature || "Consommation",
      };
      const reqStr = await secureGetItem("local_credit_requests");
      const reqs = reqStr ? JSON.parse(reqStr) : [];
      reqs.push(newRequest);
      await secureSetItem("local_credit_requests", JSON.stringify(reqs));

      // Refresh list
      loadRequests();

      setSuccessModalVisible(true);
    } catch (e: any) {
      console.error("Erreur handleFinish", e);
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors de la soumission: " + e.message
      );
    }
  };

  if (viewMode === "history") {
    const filteredRequests = requests.filter((r) => r.status === historyFilter);

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerTabs, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[
              styles.headerTab,
              historyFilter === "PENDING" && {
                borderBottomColor: colors.primary,
              },
            ]}
            onPress={() => setHistoryFilter("PENDING")}
          >
            <Text
              style={[
                styles.headerTabText,
                { color: colors.text + "90" },
                historyFilter === "PENDING" && {
                  color: colors.primary,
                  fontWeight: "bold",
                },
              ]}
            >
              En cours
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.headerTab,
              historyFilter === "APPROVED" && {
                borderBottomColor: colors.primary,
              },
            ]}
            onPress={() => setHistoryFilter("APPROVED")}
          >
            <Text
              style={[
                styles.headerTabText,
                { color: colors.text + "90" },
                historyFilter === "APPROVED" && {
                  color: colors.primary,
                  fontWeight: "bold",
                },
              ]}
            >
              Validées
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.headerTab,
              historyFilter === "REJECTED" && {
                borderBottomColor: colors.primary,
              },
            ]}
            onPress={() => setHistoryFilter("REJECTED")}
          >
            <Text
              style={[
                styles.headerTabText,
                { color: colors.text + "90" },
                historyFilter === "REJECTED" && {
                  color: colors.primary,
                  fontWeight: "bold",
                },
              ]}
            >
              Rejetées
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 50 }}>
              <Ionicons
                name="file-tray-outline"
                size={64}
                color={colors.text + "40"}
              />
              <Text style={{ color: colors.text + "60", marginTop: 10 }}>
                Aucune demande
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[styles.requestCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.requestHeader}>
                <Text style={[styles.requestType, { color: colors.text }]}>
                  {item.type}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === "APPROVED"
                      ? { backgroundColor: colors.success + "15" }
                      : item.status === "REJECTED"
                      ? { backgroundColor: colors.error + "15" }
                      : { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.status === "APPROVED"
                        ? { color: colors.success }
                        : item.status === "REJECTED"
                        ? { color: colors.error }
                        : { color: colors.primary },
                    ]}
                  >
                    {item.status === "APPROVED"
                      ? "Validée"
                      : item.status === "REJECTED"
                      ? "Rejetée"
                      : "En cours"}
                  </Text>
                </View>
              </View>
              <Text style={[styles.requestAmount, { color: colors.primary }]}>
                {new Intl.NumberFormat("fr-FR").format(item.amount)} XOF
              </Text>
              <Text style={[styles.requestDate, { color: colors.text + "80" }]}>
                Demandé le {item.date}
              </Text>
            </View>
          )}
        />

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => {
            setStep(1);
            setViewMode("form");
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "bold", marginLeft: 8 }}>
            NOUVELLE DEMANDE
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Form View
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ padding: 16 }}>
          <TouchableOpacity
            onPress={() => setViewMode("history")}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
            <Text style={{ marginLeft: 8, fontSize: 16, color: colors.text }}>
              Retour aux demandes
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Stepper */}
          <View style={styles.stepperContainer}>
            <View
              style={[
                styles.stepCircle,
                {
                  backgroundColor: step >= 1 ? colors.primary : colors.border,
                },
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
                {
                  backgroundColor: step >= 2 ? colors.primary : colors.border,
                },
              ]}
            />
            <View
              style={[
                styles.stepCircle,
                {
                  backgroundColor: step >= 2 ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={styles.stepText}>2</Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
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
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: colors.background,
                      },
                    ]}
                    placeholder={t("credit.request.descActivity")}
                    placeholderTextColor={colors.text + "60"}
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
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: colors.background,
                      },
                    ]}
                    placeholder={t("credit.request.amount")}
                    placeholderTextColor={colors.text + "60"}
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
                  style={[styles.button, { backgroundColor: colors.primary }]}
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
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: colors.background,
                      },
                    ]}
                    placeholder={t("credit.request.duration")}
                    placeholderTextColor={colors.text + "60"}
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
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: colors.background,
                      },
                    ]}
                    placeholder={t("credit.request.deferred")}
                    placeholderTextColor={colors.text + "60"}
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
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: colors.background,
                      },
                    ]}
                    placeholder={t("credit.request.idNumber")}
                    placeholderTextColor={colors.text + "60"}
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
                  <Text style={[styles.label, { color: colors.text }]}>
                    {t("credit.request.city")}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.pickerButton,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                    onPress={() => setCity(city ? "" : "ABIDJAN")} // Toggle mock
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        { color: city ? colors.text : colors.text + "60" },
                      ]}
                    >
                      {city || t("credit.request.city")}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={colors.text + "60"}
                    />
                  </TouchableOpacity>
                  <Text
                    style={[styles.mandatoryOverlay, { color: colors.error }]}
                  >
                    {t("credit.simulator.mandatory")}
                  </Text>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {t("credit.request.commune")}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.pickerButton,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                    onPress={() => setCommune(commune ? "" : "COCODY")} // Toggle mock
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        { color: commune ? colors.text : colors.text + "60" },
                      ]}
                    >
                      {commune || t("credit.request.commune")}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={colors.text + "60"}
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
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: colors.background,
                      },
                    ]}
                    placeholder={t("credit.request.location")}
                    placeholderTextColor={colors.text + "60"}
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
            <Text style={styles.successTitle}>Succès</Text>
            <Text style={styles.successMessage}>demande de credit envoyée</Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.successButtonText}>OK</Text>
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
  headerTabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  headerTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  headerTabActive: {
    borderBottomColor: "#E53935",
  },
  headerTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#757575",
  },
  headerTabTextActive: {
    color: "#E53935",
    fontWeight: "bold",
  },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  requestType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  requestAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#E53935",
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: "#999",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#E53935",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
});
