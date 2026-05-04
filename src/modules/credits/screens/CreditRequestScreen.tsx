import React, { useState, useLayoutEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, Modal, FlatList,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useI18n } from "../../../app/providers/I18nProvider";
import { Ionicons } from "@expo/vector-icons";
import { secureGetItem, secureSetItem } from "../../../shared/utils/secureStorage";
import { demandeCredit } from "../../../services/credit/demandeCredit";
import { useCreditProduits } from "../../../domain/credit/useCreditProduits";
import { CODECRYPTAGE } from "../../../services/endpoints";

// Listes de fallback si l'API ne retourne pas de produits
const FALLBACK_TYPES = ["Particulier", "Entreprise"];
const FALLBACK_NATURES = ["Consommation", "Immobilier", "Agricole", "Equipement"];
const FALLBACK_PERIODICITES = ["Mensuelle", "Trimestrielle", "Semestrielle", "Annuelle"];
const FALLBACK_ID_TYPES = ["CNI", "Passeport", "Permis de conduire", "Attestation"];
const FALLBACK_VILLES = ["Abidjan", "Bouake", "Daloa", "Yamoussoukro", "San-Pedro", "Korhogo", "Man"];
const FALLBACK_COMMUNES = ["Cocody", "Plateau", "Yopougon", "Abobo", "Adjame", "Marcory", "Treichville", "Attiecoube"];
const FALLBACK_OBJETS = ["Achat equipement", "Fonds de roulement", "Construction", "Renovation", "Vehicule", "Education"];

const COUNTRIES = [
  "Afghanistan","Afrique du Sud","Algerie","Allemagne","Angola","Arabie Saoudite",
  "Argentine","Australie","Autriche","Belgique","Benin","Bresil","Burkina Faso",
  "Burundi","Cameroun","Canada","Centrafrique","Chili","Chine","Colombie","Comores",
  "Congo","Congo (RDC)","Cote d'Ivoire","Danemark","Djibouti","Egypte",
  "Emirats Arabes Unis","Espagne","Etats-Unis","Ethiopie","France","Gabon","Gambie",
  "Ghana","Grece","Guinee","Guinee-Bissau","Inde","Indonesie","Irak","Iran",
  "Irlande","Israel","Italie","Japon","Kenya","Liban","Libye","Madagascar",
  "Malaisie","Mali","Maroc","Mauritanie","Mexique","Niger","Nigeria","Norvege",
  "Nouvelle-Zelande","Oman","Ouganda","Pakistan","Pays-Bas","Perou","Philippines",
  "Pologne","Portugal","Qatar","Roumanie","Royaume-Uni","Russie","Rwanda","Senegal",
  "Singapour","Somalie","Soudan","Sri Lanka","Suede","Suisse","Syrie","Tanzanie",
  "Tchad","Thailande","Togo","Tunisie","Turquie","Ukraine","Venezuela","Vietnam",
  "Zambie","Zimbabwe",
];

/* ─── PickerSheet ─────────────────────────────────────────────────────────── */
const PickerSheet = ({
  label, value, options, onSelect, searchable = false, loading = false,
}: {
  label: string; value: string; options: string[];
  onSelect: (v: string) => void; searchable?: boolean; loading?: boolean;
}) => {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = searchable
    ? options.filter(o => o.toLowerCase().includes(q.toLowerCase()))
    : options;
  const hasValue = !!value;

  return (
    <>
      <TouchableOpacity
        style={[ps.row, { backgroundColor: colors.card, borderColor: hasValue ? colors.primary + "60" : colors.border }]}
        onPress={() => { setQ(""); setOpen(true); }}
        activeOpacity={0.7}
        disabled={loading}
      >
        <View style={ps.rowLeft}>
          <Text style={[ps.rowLabel, { color: colors.text + "70" }]}>{label}</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 2 }} />
          ) : (
            <Text style={[ps.rowValue, { color: hasValue ? colors.text : colors.text + "40" }]}>
              {value || "Selectionner..."}
            </Text>
          )}
        </View>
        <View style={[ps.chevronWrap, { backgroundColor: colors.primary + "15" }]}>
          <Ionicons name="chevron-down" size={16} color={colors.primary} />
        </View>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={ps.overlay}>
          <View style={[ps.sheet, { backgroundColor: colors.card }]}>
            <View style={[ps.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={ps.sheetHeader}>
              <Text style={[ps.sheetTitle, { color: colors.text }]}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color={colors.text + "80"} />
              </TouchableOpacity>
            </View>
            {searchable && (
              <View style={[ps.searchRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="search-outline" size={15} color={colors.text + "50"} />
                <TextInput
                  style={[ps.searchInput, { color: colors.text }]}
                  placeholder="Rechercher..."
                  placeholderTextColor={colors.text + "40"}
                  value={q}
                  onChangeText={setQ}
                  autoFocus
                />
              </View>
            )}
            <FlatList
              data={filtered}
              keyExtractor={i => i}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={[ps.emptyText, { color: colors.text + "50" }]}>Aucun resultat</Text>
              }
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <TouchableOpacity
                    style={[ps.option, { borderBottomColor: colors.border }, selected && { backgroundColor: colors.primary + "10" }]}
                    onPress={() => { onSelect(item); setOpen(false); }}
                  >
                    <Text style={[ps.optionText, { color: selected ? colors.primary : colors.text }]}>{item}</Text>
                    {selected && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const ps = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12,
  },
  rowLeft: { flex: 1 },
  rowLabel: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  rowValue: { fontSize: 15, fontWeight: "500" },
  chevronWrap: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "75%" },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sheetTitle: { fontSize: 17, fontWeight: "700" },
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 42, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },
  option: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1 },
  optionText: { fontSize: 15 },
  emptyText: { textAlign: "center", paddingVertical: 24, fontSize: 14 },
});

/* ─── Field ──────────────────────────────────────────────────────────────── */
const Field = ({ label, icon, value, onChange, placeholder, keyboardType = "default", colors, multiline = false }: {
  label: string; icon: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any; colors: any; multiline?: boolean;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[fs.wrap, {
      backgroundColor: colors.card,
      borderColor: focused ? colors.primary : (value ? colors.primary + "50" : colors.border),
      alignItems: multiline ? "flex-start" : "center",
    }]}>
      <View style={[fs.iconWrap, { backgroundColor: colors.primary + "15", paddingTop: multiline ? 12 : 0 }]}>
        <Ionicons name={icon as any} size={16} color={colors.primary} />
      </View>
      <View style={fs.inner}>
        <Text style={[fs.label, { color: colors.text + "70" }]}>{label}</Text>
        <TextInput
          style={[fs.input, { color: colors.text }, multiline && { height: 72, textAlignVertical: "top" }]}
          placeholder={placeholder || label}
          placeholderTextColor={colors.text + "35"}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
};

const fs = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    borderWidth: 1.5, borderRadius: 14, marginBottom: 12, overflow: "hidden",
  },
  iconWrap: { width: 48, alignSelf: "stretch", justifyContent: "center", alignItems: "center" },
  inner: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  label: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  input: { fontSize: 15, fontWeight: "500", padding: 0 },
});

/* ─── Main Screen ────────────────────────────────────────────────────────── */
export const CreditRequestScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useI18n();

  const { produits, historique, isLoading, isLoadingHistory, error, fetchProduits, fetchHistorique } = useCreditProduits();

  const [viewMode, setViewMode] = useState<"history" | "form">("history");
  const [historyFilter, setHistoryFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [step, setStep] = useState(1);
  const [successVisible, setSuccessVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state — step 1
  const [type, setType] = useState("");
  const [nature, setNature] = useState("");
  const [selectedProduit, setSelectedProduit] = useState("");
  const [selectedProduitCode, setSelectedProduitCode] = useState("");
  const [activity, setActivity] = useState("");
  const [activityCode, setActivityCode] = useState("");
  const [object, setObject] = useState("");
  const [objectCode, setObjectCode] = useState("");
  const [descActivity, setDescActivity] = useState("");
  const [amount, setAmount] = useState("");

  // Form state — step 2
  const [periodicity, setPeriodicity] = useState("Mensuelle");
  const [periodicityCode, setPeriodicityCode] = useState("01");
  const [duration, setDuration] = useState("");
  const [deferred, setDeferred] = useState("0");
  const [country, setCountry] = useState("Cote d'Ivoire");
  const [birthCountry, setBirthCountry] = useState("Cote d'Ivoire");
  const [idType, setIdType] = useState("CNI");
  const [idNumber, setIdNumber] = useState("");
  const [city, setCity] = useState("Abidjan");
  const [commune, setCommune] = useState("Cocody");
  const [location, setLocation] = useState("");

  React.useEffect(() => {
    fetchProduits();
    fetchHistorique();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 16 }}>
          <Ionicons name="notifications-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  // Listes derivees des produits API ou fallback
  const produitLabels = produits.length > 0
    ? produits.map(p => p.PS_LIBELLE || p.PT_LIBELLE || "Produit").filter(Boolean)
    : ["Produit A", "Produit B", "Produit C"];

  const activiteLabels = produits.length > 0
    ? [...new Set(produits.map(p => p.TA_LIBELLE || p.AC_LIBELLE).filter(Boolean) as string[])]
    : FALLBACK_NATURES;

  const objetLabels = produits.length > 0
    ? [...new Set(produits.map(p => p.OF_LIBELLE).filter(Boolean) as string[])]
    : FALLBACK_OBJETS;

  const handleSelectProduit = (label: string) => {
    setSelectedProduit(label);
    const found = produits.find(p => (p.PS_LIBELLE || p.PT_LIBELLE) === label);
    if (found) {
      setSelectedProduitCode(found.PS_CODESOUSPRODUIT || "");
      // Pre-remplir le taux si disponible
    }
  };

  const handleSelectActivite = (label: string) => {
    setActivity(label);
    const found = produits.find(p => (p.TA_LIBELLE || p.AC_LIBELLE) === label);
    if (found) setActivityCode(found.TA_CODETYPEACTIVITE || found.AC_CODEACTIVITE || "");
  };

  const handleSelectObjet = (label: string) => {
    setObject(label);
    const found = produits.find(p => p.OF_LIBELLE === label);
    if (found) setObjectCode(found.OF_CODEOBJETFINANCEMENT || "");
  };

  const handleNext = () => {
    if (!descActivity.trim() || !amount.trim()) {
      Alert.alert("Champs requis", "Veuillez remplir la description et le montant.");
      return;
    }
    if (isNaN(Number(amount.replace(/\s/g, ""))) || Number(amount.replace(/\s/g, "")) <= 0) {
      Alert.alert("Montant invalide", "Veuillez saisir un montant valide.");
      return;
    }
    setStep(2);
  };

  const handleFinish = async () => {
    if (!duration.trim() || !idNumber.trim() || !location.trim()) {
      Alert.alert("Champs requis", "Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSubmitting(true);
    try {
      const clientId = await secureGetItem("client_id");
      const userAgency = await secureGetItem("user_agency");
      const userOperator = await secureGetItem("code_operateur");
      const token = await secureGetItem("auth_token");

      const fmt = (d: Date) =>
        `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + (parseInt(duration) || 12));

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await demandeCredit({
        LG_CODELANGUE: "FR",
        AG_CODEAGENCE: userAgency || "1000",
        OF_CODEOBJETFINANCEMENT: objectCode || "01",
        PS_CODESOUSPRODUIT: selectedProduitCode || "00153",
        TA_CODETYPEACTIVITE: activityCode || "09",
        AC_CODEACTIVITE: activityCode || "0007",
        AT_CODEACTIVITE: activityCode || "00013",
        CL_IDCLIENT: clientId || "",
        CR_DESCRIPTIONACTIVITE: descActivity,
        CO_CODECOMMUNE: "0000000005",
        CR_ADRESSEGEOGRAPHIQUEACTIVITE: location,
        CR_MONTANTCREDIT: amount.replace(/\D/g, ""),
        CR_DATEREMBOURSEMENT: fmt(end),
        CR_TAUX: "12",
        CR_DUREE: duration,
        CR_DIFFERE: deferred || "0",
        PE_CODEPERIODICITE: periodicityCode,
        OP_CODEOPERATEUR: userOperator || "",
        TYPEOPERATION: "0",
        CR_DATEMISEENPLACE: fmt(now),
        CODECRYPTAGE,
      }, headers);

      if ((res as any)?.error) {
        const msg = (res as any).error?.response?.data?.message || (res as any).error?.message || "Erreur lors de la soumission.";
        Alert.alert("Erreur", msg);
        return;
      }

      // Sauvegarder localement
      const newReq = {
        id: Date.now(),
        amount: parseFloat(amount.replace(/\D/g, "")) || 0,
        date: now.toISOString().split("T")[0],
        status: "PENDING",
        type: selectedProduit || nature || "Credit",
        nature: nature,
      };
      const reqStr = await secureGetItem("local_credit_requests");
      const reqs = reqStr ? JSON.parse(reqStr) : [];
      reqs.push(newReq);
      await secureSetItem("local_credit_requests", JSON.stringify(reqs));

      await fetchHistorique();
      setSuccessVisible(true);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  // Historique local (fallback si API indisponible)
  const localRequestsRef = React.useRef<any[]>([]);
  const [localRequests, setLocalRequests] = React.useState<any[]>([]);

  React.useEffect(() => {
    secureGetItem("local_credit_requests").then(s => {
      if (s) {
        const local = JSON.parse(s).filter((i: any) => !String(i.id).startsWith("mock-"));
        localRequestsRef.current = local;
        setLocalRequests(local);
      }
    });
  }, [successVisible]);

  const statusMeta = (s: string) => {
    if (s === "APPROVED") return { label: "Validee", color: colors.success, bg: colors.success + "15", icon: "checkmark-circle" as const };
    if (s === "REJECTED") return { label: "Rejetee", color: colors.error, bg: colors.error + "15", icon: "close-circle" as const };
    return { label: "En cours", color: colors.primary, bg: colors.primary + "15", icon: "time" as const };
  };

  /* ── Vue historique ── */
  if (viewMode === "history") {
    const TABS: Array<"PENDING" | "APPROVED" | "REJECTED"> = ["PENDING", "APPROVED", "REJECTED"];
    const tabLabels: Record<string, string> = { PENDING: "En cours", APPROVED: "Validees", REJECTED: "Rejetees" };

    const allRequests = historique.length > 0 ? historique : localRequests;
    const filtered = allRequests.filter((r: any) => r.status === historyFilter);

    return (
      <View style={[sc.root, { backgroundColor: colors.background }]}>
        {/* Hero */}
        <View style={[sc.hero, { backgroundColor: colors.primary }]}>
          <View>
            <Text style={sc.heroSub}>Mes demandes</Text>
            <Text style={sc.heroTitle}>
              {isLoadingHistory ? "..." : `${allRequests.length} demande${allRequests.length !== 1 ? "s" : ""}`}
            </Text>
          </View>
          <View style={[sc.heroIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Ionicons name="document-text-outline" size={28} color="#fff" />
          </View>
        </View>

        {/* Tabs */}
        <View style={[sc.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {TABS.map(tab => {
            const active = historyFilter === tab;
            return (
              <TouchableOpacity key={tab} style={sc.tabItem} onPress={() => setHistoryFilter(tab)}>
                <Text style={[sc.tabText, { color: active ? colors.primary : colors.text + "60" }]}>
                  {tabLabels[tab]}
                </Text>
                {active && <View style={[sc.tabUnderline, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoadingHistory ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={i => String(i.id)}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            ListEmptyComponent={
              <View style={sc.empty}>
                <Ionicons name="file-tray-outline" size={56} color={colors.text + "20"} />
                <Text style={[sc.emptyText, { color: colors.text + "40" }]}>Aucune demande</Text>
                <Text style={[sc.emptySubText, { color: colors.text + "30" }]}>
                  Appuyez sur "Nouvelle demande" pour commencer
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const meta = statusMeta(item.status);
              return (
                <View style={[sc.reqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[sc.reqAccent, { backgroundColor: meta.color }]} />
                  <View style={[sc.reqIconWrap, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon} size={22} color={meta.color} />
                  </View>
                  <View style={sc.reqBody}>
                    <View style={sc.reqTopRow}>
                      <Text style={[sc.reqType, { color: colors.text }]}>{item.type}</Text>
                      <View style={[sc.badge, { backgroundColor: meta.bg }]}>
                        <Text style={[sc.badgeText, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                    </View>
                    <Text style={[sc.reqAmount, { color: colors.primary }]}>
                      {new Intl.NumberFormat("fr-FR").format(item.amount)} XOF
                    </Text>
                    <Text style={[sc.reqDate, { color: colors.text + "50" }]}>
                      {item.date ? `Demande le ${item.date}` : ""}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <TouchableOpacity
          style={sc.fab}
          onPress={() => { setStep(1); setViewMode("form"); }}
          activeOpacity={0.85}
        >
          <View style={[sc.fabGrad, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={sc.fabText}>Nouvelle demande</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  /* ── Vue formulaire ── */
  const stepTitles = ["Informations du credit", "Informations personnelles"];
  const stepIcons: Array<"card-outline" | "person-outline"> = ["card-outline", "person-outline"];

  return (
    <View style={[sc.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={sc.formScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Retour */}
          <TouchableOpacity style={sc.backRow} onPress={() => setViewMode("history")}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={[sc.backText, { color: colors.primary }]}>Retour aux demandes</Text>
          </TouchableOpacity>

          {/* Stepper */}
          <View style={sc.stepper}>
            {[1, 2].map(n => {
              const done = step > n;
              const active = step === n;
              return (
                <React.Fragment key={n}>
                  <View style={sc.stepItem}>
                    <View style={[sc.stepCircle, {
                      backgroundColor: done ? colors.success : active ? colors.primary : colors.border,
                    }]}>
                      {done
                        ? <Ionicons name="checkmark" size={14} color="#fff" />
                        : <Text style={sc.stepNum}>{n}</Text>
                      }
                    </View>
                    <Text style={[sc.stepLabel, { color: active ? colors.primary : colors.text + "50" }]}>
                      {stepTitles[n - 1]}
                    </Text>
                  </View>
                  {n < 2 && <View style={[sc.stepLine, { backgroundColor: step > 1 ? colors.success : colors.border }]} />}
                </React.Fragment>
              );
            })}
          </View>

          {/* En-tete etape */}
          <View style={[sc.stepHeader, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "25" }]}>
            <View style={[sc.stepHeaderIcon, { backgroundColor: colors.primary + "20" }]}>
              <Ionicons name={stepIcons[step - 1]} size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={[sc.stepHeaderLabel, { color: colors.text + "70" }]}>Etape {step} sur 2</Text>
              <Text style={[sc.stepHeaderTitle, { color: colors.text }]}>{stepTitles[step - 1]}</Text>
            </View>
          </View>

          {/* Chargement produits */}
          {isLoading && (
            <View style={[sc.loadingBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={[sc.loadingText, { color: colors.text + "70" }]}>
                Chargement des produits de credit...
              </Text>
            </View>
          )}

          {/* Champs */}
          <View style={sc.formCard}>
            {step === 1 && (
              <>
                <PickerSheet
                  label="Type de client"
                  value={type}
                  options={FALLBACK_TYPES}
                  onSelect={setType}
                />
                <PickerSheet
                  label="Nature du credit"
                  value={nature}
                  options={FALLBACK_NATURES}
                  onSelect={setNature}
                />
                <PickerSheet
                  label="Produit de credit"
                  value={selectedProduit}
                  options={produitLabels}
                  onSelect={handleSelectProduit}
                  loading={isLoading}
                />
                <PickerSheet
                  label="Activite"
                  value={activity}
                  options={activiteLabels}
                  onSelect={handleSelectActivite}
                  loading={isLoading}
                />
                <PickerSheet
                  label="Objet du financement"
                  value={object}
                  options={objetLabels}
                  onSelect={handleSelectObjet}
                  loading={isLoading}
                />
                <Field
                  label="Description de l'activite"
                  icon="document-text-outline"
                  value={descActivity}
                  onChange={setDescActivity}
                  colors={colors}
                  multiline
                />
                <Field
                  label="Montant demande (XOF)"
                  icon="cash-outline"
                  value={amount}
                  onChange={setAmount}
                  keyboardType="numeric"
                  placeholder="Ex : 500 000"
                  colors={colors}
                />

                <TouchableOpacity
                  style={[sc.btn, { backgroundColor: colors.primary }]}
                  onPress={handleNext}
                  activeOpacity={0.85}
                >
                  <Text style={sc.btnText}>Suivant</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </>
            )}

            {step === 2 && (
              <>
                <PickerSheet
                  label="Periodicite de remboursement"
                  value={periodicity}
                  options={FALLBACK_PERIODICITES}
                  onSelect={(v) => {
                    setPeriodicity(v);
                    const codes: Record<string, string> = {
                      "Mensuelle": "01", "Trimestrielle": "03",
                      "Semestrielle": "06", "Annuelle": "12",
                    };
                    setPeriodicityCode(codes[v] || "01");
                  }}
                />
                <Field
                  label="Duree (en mois)"
                  icon="time-outline"
                  value={duration}
                  onChange={setDuration}
                  keyboardType="numeric"
                  placeholder="Ex : 24"
                  colors={colors}
                />
                <Field
                  label="Differe (en mois)"
                  icon="hourglass-outline"
                  value={deferred}
                  onChange={setDeferred}
                  keyboardType="numeric"
                  placeholder="0"
                  colors={colors}
                />
                <PickerSheet
                  label="Pays de residence"
                  value={country}
                  options={["Cote d'Ivoire"]}
                  onSelect={setCountry}
                />
                <PickerSheet
                  label="Pays de naissance"
                  value={birthCountry}
                  options={COUNTRIES}
                  onSelect={setBirthCountry}
                  searchable
                />
                <PickerSheet
                  label="Type de piece d'identite"
                  value={idType}
                  options={FALLBACK_ID_TYPES}
                  onSelect={setIdType}
                />
                <Field
                  label="Numero de piece"
                  icon="id-card-outline"
                  value={idNumber}
                  onChange={setIdNumber}
                  colors={colors}
                />
                <PickerSheet
                  label="Ville"
                  value={city}
                  options={FALLBACK_VILLES}
                  onSelect={setCity}
                />
                <PickerSheet
                  label="Commune"
                  value={commune}
                  options={FALLBACK_COMMUNES}
                  onSelect={setCommune}
                />
                <Field
                  label="Adresse geographique"
                  icon="location-outline"
                  value={location}
                  onChange={setLocation}
                  colors={colors}
                />

                <View style={sc.btnRow}>
                  <TouchableOpacity
                    style={[sc.btnSecondary, { borderColor: colors.border }]}
                    onPress={() => setStep(1)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-back" size={16} color={colors.text} />
                    <Text style={[sc.btnSecondaryText, { color: colors.text }]}>Precedent</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[sc.btnPrimary, { backgroundColor: submitting ? colors.primary + "80" : colors.primary }]}
                    onPress={handleFinish}
                    disabled={submitting}
                    activeOpacity={0.85}
                  >
                    {submitting
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <>
                          <Text style={sc.btnText}>Soumettre</Text>
                          <Ionicons name="checkmark" size={18} color="#fff" />
                        </>
                    }
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal succes */}
      <Modal visible={successVisible} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={sc.modalOverlay}>
          <View style={[sc.modalCard, { backgroundColor: colors.card }]}>
            <View style={[sc.modalIconWrap, { backgroundColor: colors.success + "20" }]}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            </View>
            <Text style={[sc.modalTitle, { color: colors.text }]}>Demande envoyee !</Text>
            <Text style={[sc.modalSub, { color: colors.text + "70" }]}>
              Votre demande de credit a ete soumise avec succes. Vous serez contacte sous 48h.
            </Text>
            <TouchableOpacity
              style={[sc.modalBtn, { backgroundColor: colors.success }]}
              onPress={() => {
                setSuccessVisible(false);
                setStep(1);
                setViewMode("history");
                // Reset form
                setType(""); setNature(""); setSelectedProduit(""); setActivity("");
                setObject(""); setDescActivity(""); setAmount("");
                setDuration(""); setDeferred("0"); setIdNumber(""); setLocation("");
              }}
            >
              <Text style={sc.modalBtnText}>Parfait !</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const sc = StyleSheet.create({
  root: { flex: 1 },

  hero: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    margin: 16, borderRadius: 20, padding: 20,
  },
  heroSub: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 2 },
  heroIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },

  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 14, position: "relative" },
  tabText: { fontSize: 13, fontWeight: "600" },
  tabUnderline: { position: "absolute", bottom: 0, left: "15%", right: "15%", height: 2.5, borderRadius: 2 },

  reqCard: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, marginBottom: 10, borderWidth: 1, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  reqAccent: { width: 4, alignSelf: "stretch" },
  reqIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", margin: 12 },
  reqBody: { flex: 1, paddingVertical: 12, paddingRight: 12 },
  reqTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  reqType: { fontSize: 14, fontWeight: "700", flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  reqAmount: { fontSize: 18, fontWeight: "800", marginBottom: 2 },
  reqDate: { fontSize: 11 },

  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 15, fontWeight: "600" },
  emptySubText: { fontSize: 13, textAlign: "center" },

  fab: { position: "absolute", bottom: 24, left: 16, right: 16 },
  fabGrad: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderRadius: 18, paddingVertical: 16,
    shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6,
  },
  fabText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  formScroll: { padding: 16, paddingBottom: 60 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  backText: { fontSize: 14, fontWeight: "600" },

  stepper: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  stepItem: { alignItems: "center", gap: 6 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  stepNum: { color: "#fff", fontSize: 14, fontWeight: "700" },
  stepLabel: { fontSize: 10, fontWeight: "600", textAlign: "center", maxWidth: 80 },
  stepLine: { flex: 1, height: 2, marginHorizontal: 8, marginBottom: 20 },

  stepHeader: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16,
  },
  stepHeaderIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  stepHeaderLabel: { fontSize: 11, fontWeight: "600" },
  stepHeaderTitle: { fontSize: 16, fontWeight: "700", marginTop: 2 },

  loadingBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 12,
  },
  loadingText: { fontSize: 13 },

  formCard: { borderRadius: 0 },

  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderRadius: 16, paddingVertical: 16, marginTop: 8,
    shadowColor: "#000", shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 4,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  btnSecondary: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 16, paddingVertical: 16, borderWidth: 1.5,
  },
  btnSecondaryText: { fontSize: 15, fontWeight: "600" },
  btnPrimary: {
    flex: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 16, paddingVertical: 16,
    shadowColor: "#000", shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 4,
  },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalCard: { width: "100%", borderRadius: 24, padding: 28, alignItems: "center" },
  modalIconWrap: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
  modalSub: { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  modalBtn: { width: "100%", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  modalBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

export default CreditRequestScreen;
