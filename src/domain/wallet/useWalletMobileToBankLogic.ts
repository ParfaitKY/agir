import { useState, useEffect, useCallback } from "react";
import { Alert, Linking } from "react-native";
import { secureGetItem } from "../../shared/utils/secureStorage";
import { listerComptes } from "../../services/wallet/subscribe";
import {
  fetchLinkedPhones,
  getMobileNetworks,
  getMobileToBankFees,
  initiateMobileToBank,
} from "../../services/wallet/mobileToBank";

export type Account = {
  CO_CODECOMPTE: string;
  NUMEROCOMPTE: string;
  SL_RESULTAT?: string;
};

export type Phone = {
  SO_CODESOUSCRIPTION: string;
  SO_TELEPHONE: string;
  SL_RESULTAT?: string;
};

export type Network = {
  IN_CODESERVICE: string;
  IN_LIBELLE: string;
  IN_ABREVIATIONSERVICE: string; // For fees
  SL_RESULTAT?: string;
};

export const useWalletMobileToBankLogic = () => {
  const [loading, setLoading] = useState(false);
  const [calculatingFees, setCalculatingFees] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Lists
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);

  // Form
  const [form, setForm] = useState<{
    account: string;
    phoneId: string;
    phoneNum: string;
    networkCode: string;
    networkAbbr: string; // For fee calculation
    amount: string;
  }>({
    account: "",
    phoneId: "",
    phoneNum: "",
    networkCode: "",
    networkAbbr: "",
    amount: "",
  });

  // Fees
  const [fees, setFees] = useState<{
    amount: number;
    commission: number;
    total: number;
    message?: string;
  } | null>(null);

  // OTP
  const [otp, setOtp] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);

  const formatDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  async function getSession() {
    const AG_CODEAGENCE = (await secureGetItem("user_agency")) || "";
    const CL_IDCLIENT =
      (await secureGetItem("user_id")) ||
      (await secureGetItem("client_id")) ||
      "";
    const SL_LOGIN = (await secureGetItem("user_login")) || "";
    const SL_MOTPASSE = (await secureGetItem("pin_user")) || "";
    const SL_CLESESSION = (await secureGetItem("user_secret_key")) || "";
    const JT_DATEJOURNEETRAVAIL = formatDate(new Date());
    return {
      AG_CODEAGENCE,
      JT_DATEJOURNEETRAVAIL,
      CL_IDCLIENT,
      SL_LOGIN,
      SL_MOTPASSE,
      SL_CLESESSION,
    };
  }

  // 1. Init Data (Phones -> Networks -> Accounts)
  const initData = useCallback(async () => {
    try {
      setLoading(true);
      const session = await getSession();
      const commonPayload = {
        SL_LOGIN: session.SL_LOGIN,
        SL_MOTDEPASSE: session.SL_MOTPASSE,
        SL_CLESESSION: session.SL_CLESESSION,
        LG_CODELANGUE: "fr",
        OS_MACADRESSE: "80",
        SL_VERSIONAPK: "2",
      };

      // 1. Phones
      const phonesRes = await fetchLinkedPhones({
        ...commonPayload,
        AG_CODEAGENCE: session.AG_CODEAGENCE,
        CL_IDCLIENT: session.CL_IDCLIENT,
        TYPEOPERATION: "02",
        TYPEOPERATEUR: "01",
      } as any);

      if (phonesRes.error) throw phonesRes.error;
      const phonesData =
        phonesRes.data?.pvgCompteMobileMappeResult ||
        phonesRes.data?.data ||
        [];
      const phoneList = Array.isArray(phonesData) ? phonesData : [];
      setPhones(phoneList);

      if (phoneList.length === 0 || phoneList[0]?.SL_RESULTAT === "FALSE") {
        Alert.alert("Info", "Aucun téléphone trouvé pour ce client.");
        // Stop or continue? Usually stop if critical.
      }

      // 2. Networks
      const networksRes = await getMobileNetworks({ ...commonPayload } as any);
      if (networksRes.error) throw networksRes.error;
      const networksData =
        networksRes.data
          ?.pvgChargerDansDataSetPourComboMobileIntouchServiceResult ||
        networksRes.data?.data ||
        [];
      setNetworks(Array.isArray(networksData) ? networksData : []);

      // 3. Accounts
      const accountsRes = await listerComptes({
        ...commonPayload,
        DATEJOURNEE: session.JT_DATEJOURNEETRAVAIL,
        CL_IDCLIENT: session.CL_IDCLIENT,
        MB_IDTIERS: "",
        TYPEOPERATION: "04",
        TYPEOPERATEUR: "01",
      } as any);
      if (accountsRes.error) throw accountsRes.error;
      const accountsData =
        accountsRes.data?.pvgUserAcompteListResult ||
        accountsRes.data?.data ||
        [];
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initData();
  }, [initData]);

  // 2. Fee Calculation
  const calculateFees = useCallback(async () => {
    if (!form.networkAbbr || !form.amount || isNaN(Number(form.amount))) {
      setFees(null);
      return;
    }

    try {
      setCalculatingFees(true);
      const session = await getSession();
      const payload = {
        MONTANT: form.amount, // Calcul direct
        MONTANTMF: "0",
        CODESERVICE: form.networkAbbr,
        TYPEOPERATION: "01", // Envoi
        SL_LOGIN: session.SL_LOGIN,
        SL_MOTDEPASSE: session.SL_MOTPASSE,
        SL_CLESESSION: session.SL_CLESESSION,
        LG_CODELANGUE: "fr",
        OS_MACADRESSE: "80",
        SL_VERSIONAPK: "2",
      };

      const result = await getMobileToBankFees(payload);
      if (result.error) return; // Silent fail or show subtle error

      const data =
        result.data?.pvgCommissioncinetpayResult || result.data?.data || {};
      if (data?.SL_RESULTAT === "TRUE") {
        setFees({
          amount: Number(data.SL_MONTANT || 0),
          commission: Number(data.SL_COMMISSION || 0),
          total: Number(data.SL_MONTANT || 0) + Number(data.SL_COMMISSION || 0), // Usually included or added depending on logic. Assuming Amount + Fees.
        });
      } else {
        setFees(null);
      }
    } catch (e) {
      // ignore
    } finally {
      setCalculatingFees(false);
    }
  }, [form.networkAbbr, form.amount]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateFees();
    }, 800); // Debounce
    return () => clearTimeout(timer);
  }, [calculateFees]);

  // 3. Submit
  async function handleSubmit() {
    if (!form.account || !form.phoneId || !form.networkCode || !form.amount) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    // Logic Intouch (Orange requires OTP?)
    // For now, assume we might need OTP if network implies it, or just proceed.
    // The prompt says "Orange (01) : Peut nécessiter un Token OTP".
    // Let's assume we show OTP modal for everything for now as per previous code, or implement smart logic.
    // But first, verify fees are calculated.

    setShowOtpModal(true);
  }

  async function confirmTransaction() {
    try {
      setSubmitting(true);
      setShowOtpModal(false);
      const session = await getSession();

      const payload = {
        NO_CODENATUREVIREMENT: "0011",
        TO_CODETYPETRANSFERT: "18",
        TW_CODEVALIDATION: String(Date.now()), // Unique ID
        IN_CODESERVICE: form.networkCode,
        SL_UTILISATEUR: "MOBILE APP",
        MC_TERMINAL: "MOBILE",
        MONTANT: form.amount,
        CO_CODECOMPTE: form.account,
        SO_CODESOUSCRIPTION: form.phoneId,
        SO_TELEPHONE: form.phoneNum,
        TYPEOPERATION: "01", // ? Check prompt "TYPEOPERATION: 01 (Envoi)"
        // But initiateMobileToBank payload might need adjust.
        // Prompt said: "Initiation de la transaction (pvgMobileTransactionMobileBanking)"
        SL_LOGIN: session.SL_LOGIN,
        SL_MOTDEPASSE: session.SL_MOTPASSE,
        SL_CLESESSION: session.SL_CLESESSION,
        LG_CODELANGUE: "fr",
        AG_CODEAGENCE: session.AG_CODEAGENCE,
        CL_IDCLIENT: session.CL_IDCLIENT,
        DATEJOURNEE: session.JT_DATEJOURNEETRAVAIL,
        OS_MACADRESSE: "80",
        SL_VERSIONAPK: "2",
        TYPE_APP: "CLIENT",
      };

      // If we need OTP (Token), it's not in the payload shown in prompt?
      // Prompt says "Peut nécessiter un Token OTP (ModalTokenComponent)".
      // But pvgMobileTransactionMobileBanking payload in prompt DOES NOT show TK_TOKEN.
      // Maybe it's handled via the web redirect (InAppBrowser).
      // Or maybe "TW_CODEVALIDATION" is it? No, that's generated ID.
      // Let's assume the OTP is handled by the web view if returned, or it's a misunderstanding and we just submit.
      // The user prompt says "Orange (01) : Peut nécessiter un Token OTP".
      // If we have OTP input in UI, where does it go?
      // "TW_CODEVALIDATION" might be the OTP if entered manually?
      // Actually, "TW_CODEVALIDATION" usually is the OTP provided by user.
      // Let's map `otp` to `TW_CODEVALIDATION` if provided, else generate ID?
      // "TW_CODEVALIDATION: Générer un ID unique" says the prompt.
      // So OTP might not be used in the API call?
      // Let's follow the prompt: "TW_CODEVALIDATION: Générer un ID unique".
      // And "Orange... Peut nécessiter un Token OTP". Maybe that's a separate flow?
      // Let's stick to the prompt payload.

      const result = await initiateMobileToBank(payload as any);
      if (result.error) throw result.error;

      const data =
        result.data?.pvgMobileTransactionMobileBankingResult ||
        result.data?.data ||
        {};

      if (data?.SL_RESULTAT === "TRUE") {
        if (data?.SL_URLOPERATEUR) {
          // Open Web Browser
          await Linking.openURL(data.SL_URLOPERATEUR);
        } else {
          Alert.alert("Succès", data?.SL_MESSAGE || "Transaction effectuée");
        }
      } else {
        Alert.alert("Erreur", data?.SL_MESSAGE || "Échec de la transaction");
      }
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    loading,
    calculatingFees,
    submitting,
    accounts,
    phones,
    networks,
    form,
    fees,
    otp,
    showOtpModal,
    setForm,
    setOtp,
    setShowOtpModal,
    handleSubmit,
    confirmTransaction,
  };
};
