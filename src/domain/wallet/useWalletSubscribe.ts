import { useState } from "react";
import { Alert } from "react-native";
import { secureGetItem } from "../../shared/utils/secureStorage";
import {
  chargerPays,
  listerComptes,
  demanderToken,
  souscrireMobileBanking,
} from "../../services/wallet/subscribe";

export type ComboPays = {
  PY_CODEPAYS: string;
  PY_LIBELLE: string;
  SL_RESULTAT?: string;
};

export type ComboCompte = {
  CO_CODECOMPTE: string;
  NUMEROCOMPTE: string;
  SOLDE: string;
  SL_RESULTAT?: string;
};

export const useWalletSubscribe = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Données
  const [comboPays, setComboPays] = useState<ComboPays[]>([]);
  const [comboComptes, setComboComptes] = useState<ComboCompte[]>([]);
  
  // Formulaire
  const [form, setForm] = useState<{
    cmb_compte?: string;
    cmb_pays?: string;
    chp_telephone?: string;
    chp_email?: string;
    chp_localisation?: string;
  }>({ cmb_pays: "0001" });
  
  const [errors, setErrors] = useState<{
    email?: string;
    telephone?: string;
    compte?: string;
    pays?: string;
    localisation?: string;
  }>({});

  // États UI (Modales)
  const [modalPays, setModalPays] = useState(false);
  const [modalCompte, setModalCompte] = useState(false);

  // Utilitaires
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
    const storedDate = await secureGetItem("work_date");
    const JT_DATEJOURNEETRAVAIL = storedDate || formatDate(new Date());
    return {
      AG_CODEAGENCE,
      JT_DATEJOURNEETRAVAIL,
      CL_IDCLIENT,
      SL_LOGIN,
      SL_MOTPASSE,
      SL_CLESESSION,
    };
  }

  // Actions
  async function loadCountries() {
    try {
      setLoading(true);
      const session = await getSession();
      const payload = {
        DATEJOURNEE: session.JT_DATEJOURNEETRAVAIL,
        SL_LOGIN: session.SL_LOGIN,
        SL_MOTDEPASSE: session.SL_MOTPASSE,
        SL_CLESESSION: session.SL_CLESESSION,
        SL_VERSIONAPK: "2",
        LG_CODELANGUE: "fr",
        OS_MACADRESSE: "80",
      } as any;
      
      const result = await chargerPays(payload);
      if (result.error) {
        // Gérer l'erreur 404 spécifiquement
        const error: any = result.error;
        if (error?.response?.status === 404 || error?.status === 404) {
          throw new Error("Service de souscription temporairement indisponible. Veuillez contacter votre agence.");
        }
        throw result.error;
      }
      
      const data: any = result.data;
      const list: ComboPays[] =
        data?.pvgChargerDansDataSetPourComboPaysResult || data?.data || [];
        
      setComboPays(Array.isArray(list) ? list : []);
      
      const preset = (Array.isArray(list) ? list : []).find(
        (p) => p.PY_CODEPAYS === "0001"
      );
      setForm((f) => ({ ...f, cmb_pays: preset?.PY_CODEPAYS || f.cmb_pays }));
      
      const ok =
        (Array.isArray(list) && list[0]?.SL_RESULTAT === "TRUE") ||
        !!list.length;
        
      if (!ok) {
        Alert.alert("Erreur", "Impossible de charger les pays");
      }
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Réseau indisponible");
    } finally {
        setLoading(false);
    }
  }

  async function loadAccounts() {
    try {
      setLoading(true);
      const session = await getSession();
      const payload = {
        DATEJOURNEE: session.JT_DATEJOURNEETRAVAIL,
        CL_IDCLIENT: session.CL_IDCLIENT,
        MB_IDTIERS: "",
        SL_LOGIN: session.SL_LOGIN,
        SL_MOTDEPASSE: session.SL_MOTPASSE,
        TYPEOPERATION: "04",
        SL_CLESESSION: session.SL_CLESESSION,
        LG_CODELANGUE: "fr",
        OS_MACADRESSE: "80",
        TYPEOPERATEUR: "01",
        SL_VERSIONAPK: "2",
      } as any;
      
      const result = await listerComptes(payload);
      if (result.error) {
        // Gérer l'erreur 404 spécifiquement
        const error: any = result.error;
        if (error?.response?.status === 404 || error?.status === 404) {
          throw new Error("Service de souscription temporairement indisponible. Veuillez contacter votre agence.");
        }
        throw result.error;
      }
      
      const data: any = result.data;
      const list: ComboCompte[] =
        data?.pvgUserAcompteListResult || data?.data || [];
        
      setComboComptes(Array.isArray(list) ? list : []);
      
      const ok = Array.isArray(list) && list[0]?.SL_RESULTAT === "TRUE";
      
      if (!ok) Alert.alert("Erreur", "Impossible de charger les comptes");
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Réseau indisponible");
    } finally {
        setLoading(false);
    }
  }

  function validate() {
    const next: any = {};
    const tel = String(form.chp_telephone || "").trim();
    const mail = String(form.chp_email || "").trim();
    const loc = String(form.chp_localisation || "").trim();
    const compte = String(form.cmb_compte || "").trim();
    const pays = String(form.cmb_pays || "").trim();
    const emailRegex =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    
    if (!compte) next.compte = "le compte est obligatoire.";
    if (!pays) next.pays = "le pays est obligatoire.";
    if (!tel || tel.length < 10 || tel.length > 15 || !/^[\d]{6,15}$/.test(tel))
      next.telephone = "Veuillez renseigner un numero de telephone correct.";
    if (tel && tel.length < 10)
      next.telephone = "la taille minimun valable de saisie est 10.";
    if (!loc) next.localisation = "la localisation est obligatoire.";
    if (!mail) next.email = "la champ Email est obligatoire.";
    if (mail && !emailRegex.test(mail))
      next.email = "Veuillez renseigner un email correct.";
    
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function requestToken() {
    const session = await getSession();
    const payload = {
      LG_CODELANGUE: "fr",
      AG_CODEAGENCE: session.AG_CODEAGENCE,
      TK_TOKEN: "",
      TYPEOPERATION: "0",
      SL_LOGIN: session.SL_LOGIN,
      SL_MOTDEPASSE: session.SL_MOTPASSE,
      SL_CLESESSION: session.SL_CLESESSION,
      SL_VERSIONAPK: "2",
      OS_MACADRESSE: "80:",
    } as any;
    
    const result = await demanderToken(payload);
    if (result.error) {
      // Gérer l'erreur 404 spécifiquement
      const error: any = result.error;
      if (error?.response?.status === 404 || error?.status === 404) {
        throw new Error("Service de souscription temporairement indisponible. Veuillez contacter votre agence.");
      }
      throw result.error;
    }
    
    const data: any = result.data;
    const res = data?.pvgDemandeTokenResult || data?.data || {};
    
    if (res?.SL_RESULTAT === "TRUE") {
      return String(res?.TK_TOKEN || "");
    }
    throw new Error(String(res?.SL_RESULTAT || "Token invalide"));
  }

  async function submitSubscription(token: string) {
    const session = await getSession();
    const payload = {
      LG_CODELANGUE: "fr",
      AG_CODEAGENCE: session.AG_CODEAGENCE,
      CO_CODECOMPTE: form.cmb_compte,
      SO_CODESOUSCRIPTION: "",
      PY_CODEPAYS: form.cmb_pays,
      SO_TELEPHONE: form.chp_telephone,
      DATEJOURNEE: session.JT_DATEJOURNEETRAVAIL,
      SO_EMAIL: form.chp_email,
      SO_LIEURESIDENCE: form.chp_localisation,
      TYPEOPERATION: "01",
      TK_TOKEN: token,
      SL_LOGIN: session.SL_LOGIN,
      SL_MOTDEPASSE: session.SL_MOTPASSE,
      SL_CLESESSION: session.SL_CLESESSION,
      SL_VERSIONAPK: "2",
      OS_MACADRESSE: "80:",
      TYPE_APP: "CLIENT",
    } as any;
    
    const result = await souscrireMobileBanking(payload);
    if (result.error) {
      // Gérer l'erreur 404 spécifiquement
      const error: any = result.error;
      if (error?.response?.status === 404 || error?.status === 404) {
        throw new Error("Service de souscription temporairement indisponible. Veuillez contacter votre agence.");
      }
      throw result.error;
    }
    
    const data: any = result.data;
    const res = data?.pvgSouscriptionMobileBankingResult || data?.data || {};
    
    if (res?.SL_RESULTAT === "TRUE") {
      Alert.alert("Succès", String(res?.SL_MESSAGE || "Souscription effectuée"));
      return true;
    }
    throw new Error(String(res?.SL_MESSAGE || "Échec de la souscription"));
  }

  async function testAndSubmit() {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const tk = await requestToken();
      await submitSubscription(tk);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    loading,
    submitting,
    comboPays,
    comboComptes,
    form,
    errors,
    modalPays,
    modalCompte,
    setForm,
    setModalPays,
    setModalCompte,
    loadCountries,
    loadAccounts,
    testAndSubmit
  };
};
