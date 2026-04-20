import React, { useState, useLayoutEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, Modal, FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useI18n } from "../../../app/providers/I18nProvider";
import { Ionicons } from "@expo/vector-icons";
import { secureGetItem, secureSetItem } from "../../../shared/utils/secureStorage";
import { demandeCredit } from "../../../services/credit/demandeCredit";

const COUNTRIES = ["AFGHANISTAN","AFRIQUE DU SUD","ALGÉRIE","ALLEMAGNE","ANGOLA","ARABIE SAOUDITE","ARGENTINE","AUSTRALIE","AUTRICHE","BELGIQUE","BÉNIN","BRÉSIL","BURKINA FASO","BURUNDI","CAMEROUN","CANADA","CENTRAFRIQUE","CHILI","CHINE","COLOMBIE","COMORES","CONGO","CONGO (RDC)","CÔTE D'IVOIRE","DANEMARK","DJIBOUTI","ÉGYPTE","ÉMIRATS ARABES UNIS","ESPAGNE","ÉTATS-UNIS","ÉTHIOPIE","FRANCE","GABON","GAMBIE","GHANA","GRÈCE","GUINÉE","GUINÉE-BISSAU","INDE","INDONÉSIE","IRAK","IRAN","IRLANDE","ISRAËL","ITALIE","JAPON","KENYA","LIBAN","LIBYE","MADAGASCAR","MALAISIE","MALI","MAROC","MAURITANIE","MEXIQUE","NIGER","NIGÉRIA","NORVÈGE","NOUVELLE-ZÉLANDE","OMAN","OUGANDA","PAKISTAN","PAYS-BAS","PÉROU","PHILIPPINES","POLOGNE","PORTUGAL","QATAR","ROUMANIE","ROYAUME-UNI","RUSSIE","RWANDA","SÉNÉGAL","SINGAPOUR","SOMALIE","SOUDAN","SRI LANKA","SUÈDE","SUISSE","SYRIE","TANZANIE","TCHAD","THAÏLANDE","TOGO","TUNISIE","TURQUIE","UKRAINE","VENEZUELA","VIETNAM","ZAMBIE","ZIMBABWE"];

/* --- Picker bottom-sheet --- */
const PickerSheet = ({
  label, value, options, onSelect, searchable = false,
}: { label: string; value: string; options: string[]; onSelect: (v: string) => void; searchable?: boolean }) => {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = searchable ? options.filter(o => o.toLowerCase().includes(q.toLowerCase())) : options;
  const hasValue = !!value;

  return (
    <>
      <TouchableOpacity
        style={[ps.row, { backgroundColor: colors.card, borderColor: hasValue ? colors.primary + "60" : colors.border }]}
        onPress={() => { setQ(""); setOpen(true); }}
        activeOpacity={0.7}
      >
        <View style={ps.rowLeft}>
          <Text style={[ps.rowLabel, { color: colors.text + "60" }]}>{label}</Text>
          <Text style={[ps.rowValue, { color: hasValue ? colors.text : colors.text + "40" }]}>
            {value || "Sélectionner…"}
          </Text>
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
                  placeholder="Rechercher…"
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
});

/* --- Text field --- */
const Field = ({ label, icon, value, onChange, placeholder, keyboardType = "default", colors }: {
  label: string; icon: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any; colors: any;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[fs.wrap, { backgroundColor: colors.card, borderColor: focused ? colors.primary : (value ? colors.primary + "50" : colors.border) }]}>
      <View style={[fs.iconWrap, { backgroundColor: colors.primary + "15" }]}>
        <Ionicons name={icon as any} size={16} color={colors.primary} />
      </View>
      <View style={fs.inner}>
        <Text style={[fs.label, { color: colors.text + "60" }]}>{label}</Text>
        <TextInput
          style={[fs.input, { color: colors.text }]}
          placeholder={placeholder || label}
          placeholderTextColor={colors.text + "35"}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
};

const fs = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderRadius: 14, marginBottom: 12, overflow: "hidden",
  },
  iconWrap: { width: 48, alignSelf: "stretch", justifyContent: "center", alignItems: "center" },
  inner: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  label: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  input: { fontSize: 15, fontWeight: "500", padding: 0 },
});

/* --- Main screen --- */
export const CreditRequestScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useI18n();

  const [viewMode, setViewMode] = useState<"history" | "form">("history");
  const [historyFilter, setHistoryFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [requests, setRequests] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  const [successVisible, setSuccessVisible] = useState(false);

  // Form state
  const [type, setType] = useState("Particulier");
  const [nature, setNature] = useState("Consommation");
  const [product, setProduct] = useState("Produit A");
  const [activity, setActivity] = useState("Commerce");
  const [object, setObject] = useState("Achat équipement");
  const [descActivity, setDescActivity] = useState("");
  const [amount, setAmount] = useState("");
  const [periodicity, setPeriodicity] = useState("Mensuelle");
  const [duration, setDuration] = useState("");
  const [deferred, setDeferred] = useState("0");
  const [country, setCountry] = useState("CÔTE D'IVOIRE");
  const [birthCountry, setBirthCountry] = useState("CÔTE D'IVOIRE");
  const [idType, setIdType] = useState("CNI");
  const [idNumber, setIdNumber] = useState("");
  const [city, setCity] = useState("ABIDJAN");
  const [commune, setCommune] = useState("COCODY");
  const [location, setLocation] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 16 }}>
          <Ionicons name="notifications-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  React.useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const stored = await secureGetItem("local_credit_requests");
      const data = stored ? JSON.parse(stored) : [];
      setRequests(data.filter((i: any) => !String(i.id).startsWith("mock-")));
    } catch {}
  };

  const handleNext = () => {
    if (!descActivity || !amount) { Alert.alert(t("common.error"), t("common.fillAllFields")); return; }
    setStep(2);
  };

  const handleFinish = async () => {
    if (!duration || !idNumber || !location) { Alert.alert(t("common.error"), t("common.fillAllFields")); return; }
    try {
      const clientId = await secureGetItem("client_id");
      const userAgency = await secureGetItem("user_agency");
      const userOperator = await secureGetItem("user_operator");
      const fmt = (d: Date) => `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
      const now = new Date();
      const end = new Date(now); end.setMonth(end.getMonth() + (parseInt(duration) || 2));

      await demandeCredit({
        LG_CODELANGUE: "FR", AG_CODEAGENCE: userAgency || "1000",
        OF_CODEOBJETFINANCEMENT: "01", PS_CODESOUSPRODUIT: "00153",
        TA_CODETYPEACTIVITE: "09", AC_CODEACTIVITE: "0007", AT_CODEACTIVITE: "00013",
        CL_IDCLIENT: clientId || "100000000011",
        CR_DESCRIPTIONACTIVITE: descActivity, CO_CODECOMMUNE: "0000000005",
        CR_ADRESSEGEOGRAPHIQUEACTIVITE: location,
        CR_MONTANTCREDIT: amount.replace(/\D/g, ""),
        CR_DATEREMBOURSEMENT: fmt(end), CR_TAUX: "12", CR_DUREE: duration,
        CR_DIFFERE: deferred || "0", PE_CODEPERIODICITE: "01",
        OP_CODEOPERATEUR: userOperator || "100000033", TYPEOPERATION: "0",
        CR_DATEMISEENPLACE: fmt(now), CODECRYPTAGE: "Y}@128eVIXfoi7",
      });

      const newReq = { id: Date.now(), amount: parseFloat(amount) || 0, date: now.toISOString().split("T")[0], status: "APPROVED", type: nature };
      const reqStr = await secureGetItem("local_credit_requests");
      const reqs = reqStr ? JSON.parse(reqStr) : [];
      reqs.push(newReq);
      await secureSetItem("local_credit_requests", JSON.stringify(reqs));
      loadRequests();
      setSuccessVisible(true);
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
  };

  const statusMeta = (s: string) => {
    if (s === "APPROVED") return { label: "Validée", color: colors.success, bg: colors.success + "15", icon: "checkmark-circle" };
    if (s === "REJECTED") return { label: "Rejetée", color: colors.error, bg: colors.error + "15", icon: "close-circle" };
    return { label: "En cours", color: colors.primary, bg: colors.primary + "15", icon: "time" };
  };

  /* -- History view -- */
  if (viewMode === "history") {
    const filtered = requests.filter(r => r.status === historyFilter);
    const TABS: Array<"PENDING" | "APPROVED" | "REJECTED"> = ["PENDING", "APPROVED", "REJECTED"];
    const tabLabels: Record<string, string> = { PENDING: "En cours", APPROVED: "Validées", REJECTED: "Rejetées" };

    return (
      <View style={[sc.root, { backgroundColor: colors.background }]}>
        {/* Hero */}
        <View style={[sc.hero, { backgroundColor: colors.primary }]}>
          <View>
            <Text style={sc.heroSub}>Mes demandes</Text>
            <Text style={sc.heroTitle}>{requests.length} demande{requests.length !== 1 ? "s" : ""}</Text>
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

        <FlatList
          data={filtered}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={sc.empty}>
              <Ionicons name="file-tray-outline" size={56} color={colors.text + "20"} />
              <Text style={[sc.emptyText, { color: colors.text + "40" }]}>Aucune demande</Text>
            </View>
          }
          renderItem={({ item }) => {
            const meta = statusMeta(item.status);
            return (
              <View style={[sc.reqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[sc.reqAccent, { backgroundColor: meta.color }]} />
                <View style={[sc.reqIconWrap, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon as any} size={22} color={meta.color} />
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
                  <Text style={[sc.reqDate, { color: colors.text + "50" }]}>Demandé le {item.date}</Text>
                </View>
              </View>
            );
          }}
        />

        <TouchableOpacity style={sc.fab} onPress={() => { setStep(1); setViewMode("form"); }} activeOpacity={0.85}>
          <View style={[sc.fabGrad, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={sc.fabText}>Nouvelle demande</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  /* -- Form view -- */
  const stepTitles = ["Informations du crédit", "Informations personnelles"];
  const stepIcons = ["card-outline", "person-outline"];

  return (
    <View style={[sc.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={sc.formScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Back */}
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

          {/* Step header card */}
          <View style={[sc.stepHeader, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "25" }]}>
            <View style={[sc.stepHeaderIcon, { backgroundColor: colors.primary + "20" }]}>
              <Ionicons name={stepIcons[step - 1] as any} size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={[sc.stepHeaderLabel, { color: colors.text + "60" }]}>Étape {step} sur 2</Text>
              <Text style={[sc.stepHeaderTitle, { color: colors.text }]}>{stepTitles[step - 1]}</Text>
            </View>
          </View>

          {/* Form fields */}
          <View style={sc.formCard}>
            {step === 1 && (
              <>
                <PickerSheet label={t("credit.request.type")} value={type} options={["Particulier", "Entreprise"]} onSelect={setType} />
                <PickerSheet label={t("credit.request.nature")} value={nature} options={["Consommation", "Immobilier", "Agricole"]} onSelect={setNature} />
                <PickerSheet label={t("credit.request.product")} value={product} options={["Produit A", "Produit B", "Produit C"]} onSelect={setProduct} />
                <PickerSheet label={t("credit.request.activity")} value={activity} options={["Commerce", "Services", "Industrie"]} onSelect={setActivity} />
                <PickerSheet label={t("credit.request.object")} value={object} options={["Achat équipement", "Fonds de roulement"]} onSelect={setObject} />
                <Field label={t("credit.request.descActivity")} icon="document-text-outline" value={descActivity} onChange={setDescActivity} colors={colors} />
                <Field label={t("credit.request.amount")} icon="cash-outline" value={amount} onChange={setAmount} keyboardType="numeric" placeholder="Ex : 500 000" colors={colors} />

                <TouchableOpacity style={[sc.btn, { backgroundColor: colors.primary }]} onPress={handleNext} activeOpacity={0.85}>
                  <Text style={sc.btnText}>{t("credit.request.next")}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </>
            )}

            {step === 2 && (
              <>
                <PickerSheet label={t("credit.request.periodicity")} value={periodicity} options={["Mensuelle", "Trimestrielle", "Annuelle"]} onSelect={setPeriodicity} />
                <Field label={t("credit.request.duration")} icon="time-outline" value={duration} onChange={setDuration} keyboardType="numeric" placeholder="Ex : 24 mois" colors={colors} />
                <Field label={t("credit.request.deferred")} icon="hourglass-outline" value={deferred} onChange={setDeferred} keyboardType="numeric" colors={colors} />
                <PickerSheet label={t("credit.request.country")} value={country} options={["CÔTE D'IVOIRE"]} onSelect={setCountry} />
                <PickerSheet label={t("credit.request.birthCountry")} value={birthCountry} options={COUNTRIES} onSelect={setBirthCountry} searchable />
                <PickerSheet label={t("credit.request.idType")} value={idType} options={["CNI", "PASSEPORT", "PERMIS DE CONDUIRE", "ATTESTATION"]} onSelect={setIdType} />
                <Field label={t("credit.request.idNumber")} icon="id-card-outline" value={idNumber} onChange={setIdNumber} colors={colors} />
                <PickerSheet label={t("credit.request.city")} value={city} options={["ABIDJAN", "BOUAKÉ", "DALOA", "YAMOUSSOUKRO", "SAN-PÉDRO"]} onSelect={setCity} />
                <PickerSheet label={t("credit.request.commune")} value={commune} options={["COCODY", "PLATEAU", "YOPOUGON", "ABOBO", "ADJAMÉ", "MARCORY", "TREICHVILLE"]} onSelect={setCommune} />
                <Field label={t("credit.request.location")} icon="location-outline" value={location} onChange={setLocation} colors={colors} />

                <View style={sc.btnRow}>
                  <TouchableOpacity style={[sc.btnSecondary, { borderColor: colors.border }]} onPress={() => setStep(1)} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={16} color={colors.text} />
                    <Text style={[sc.btnSecondaryText, { color: colors.text }]}>{t("credit.request.previous")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[sc.btnPrimary, { backgroundColor: colors.primary }]} onPress={handleFinish} activeOpacity={0.85}>
                    <Text style={sc.btnText}>{t("credit.request.finish")}</Text>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success modal */}
      <Modal visible={successVisible} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={sc.modalOverlay}>
          <View style={[sc.modalCard, { backgroundColor: colors.card }]}>
            <View style={[sc.modalIconWrap, { backgroundColor: colors.success + "20" }]}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            </View>
            <Text style={[sc.modalTitle, { color: colors.text }]}>Demande envoyée !</Text>
            <Text style={[sc.modalSub, { color: colors.text + "70" }]}>
              Votre demande de crédit a été soumise avec succès. Vous serez contacté sous 48h.
            </Text>
            <TouchableOpacity
              style={[sc.modalBtn, { backgroundColor: colors.success }]}
              onPress={() => { setSuccessVisible(false); navigation.goBack(); }}
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

  // Hero
  hero: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    margin: 16, borderRadius: 20, padding: 20,
  },
  heroSub: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 2 },
  heroIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },

  // Tab bar
  tabBar: {
    flexDirection: "row", borderBottomWidth: 1,
  },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 14, position: "relative" },
  tabText: { fontSize: 13, fontWeight: "600" },
  tabUnderline: { position: "absolute", bottom: 0, left: "15%", right: "15%", height: 2.5, borderRadius: 2 },

  // Request card
  reqCard: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, marginBottom: 10, borderWidth: 1, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  reqAccent: { width: 4, alignSelf: "stretch" },
  reqIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", margin: 12 },
  reqBody: { flex: 1, paddingVertical: 12, paddingRight: 12 },
  reqTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  reqType: { fontSize: 14, fontWeight: "700" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  reqAmount: { fontSize: 18, fontWeight: "800", marginBottom: 2 },
  reqDate: { fontSize: 11 },

  // Empty
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14 },

  // FAB
  fab: { position: "absolute", bottom: 24, left: 16, right: 16 },
  fabGrad: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderRadius: 18, paddingVertical: 16,
    shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6,
  },
  fabText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Form
  formScroll: { padding: 16, paddingBottom: 60 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  backText: { fontSize: 14, fontWeight: "600" },

  // Stepper
  stepper: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  stepItem: { alignItems: "center", gap: 6 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  stepNum: { color: "#fff", fontSize: 14, fontWeight: "700" },
  stepLabel: { fontSize: 10, fontWeight: "600", textAlign: "center", maxWidth: 80 },
  stepLine: { flex: 1, height: 2, marginHorizontal: 8, marginBottom: 20 },

  // Step header
  stepHeader: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16,
  },
  stepHeaderIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  stepHeaderLabel: { fontSize: 11, fontWeight: "600" },
  stepHeaderTitle: { fontSize: 16, fontWeight: "700", marginTop: 2 },

  // Form card
  formCard: {
    borderRadius: 0,
  },

  // Buttons
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

  // Success modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalCard: { width: "100%", borderRadius: 24, padding: 28, alignItems: "center" },
  modalIconWrap: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
  modalSub: { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  modalBtn: { width: "100%", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  modalBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

export default CreditRequestScreen;
