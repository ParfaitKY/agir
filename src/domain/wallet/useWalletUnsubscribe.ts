import { useState } from "react";
import { Alert } from "react-native";
import { secureGetItem } from "../../shared/utils/secureStorage";
import { listerComptes, demanderToken } from "../../services/wallet/subscribe";
import { resilierMobileBanking } from "../../services/wallet/unsubscribe";

export type ComboCompte = {
  CO_CODECOMPTE: string;
  NUMEROCOMPTE: string;
  SOLDE: string;
  SL_RESULTAT?: string;
};

export const useWalletUnsubscribe = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Données
  const [comboComptes, setComboComptes] = useState<ComboCompte[]>([]);

  // Formulaire
  const [form, setForm] = useState<{
    cmb_compte?: string;
    chp_telephone?: string;
  }>({});

  const [errors, setErrors] = useState<{
    compte?: string;
    telephone?: string;
  }>({});

  // États UI (Modales)
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
      if (result.error) throw result.error;

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
    const compte = String(form.cmb_compte || "").trim();

    if (!compte) next.compte = "Le compte est obligatoire.";
    if (!tel || tel.length < 10 || tel.length > 15 || !/^[\d]{6,15}$/.test(tel))
      next.telephone = "Veuillez renseigner un numéro de téléphone correct.";

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
    if (result.error) throw result.error;

    const data: any = result.data;
    const res = data?.pvgDemandeTokenResult || data?.data || {};

    if (res?.SL_RESULTAT === "TRUE") {
      return String(res?.TK_TOKEN || "");
    }
    throw new Error(String(res?.SL_RESULTAT || "Token invalide"));
  }

  async function submitUnsubscription(token: string) {
    const session = await getSession();
    const payload = {
      LG_CODELANGUE: "fr",
      AG_CODEAGENCE: session.AG_CODEAGENCE,
      CO_CODECOMPTE: form.cmb_compte,
      SO_TELEPHONE: form.chp_telephone,
      DATEJOURNEE: session.JT_DATEJOURNEETRAVAIL,
      TYPEOPERATION: "02", // 02 pour Résiliation (supposition standard)
      TK_TOKEN: token,
      SL_LOGIN: session.SL_LOGIN,
      SL_MOTDEPASSE: session.SL_MOTPASSE,
      SL_CLESESSION: session.SL_CLESESSION,
      SL_VERSIONAPK: "2",
      OS_MACADRESSE: "80:",
      TYPE_APP: "CLIENT",
    } as any;

    const result = await resilierMobileBanking(payload);
    if (result.error) throw result.error;

    const data: any = result.data;
    const res = data?.pvgResiliationMobileBankingResult || data?.data || {};

    if (res?.SL_RESULTAT === "TRUE") {
      Alert.alert("Succès", String(res?.SL_MESSAGE || "Résiliation effectuée"));
      return true;
    }
    throw new Error(String(res?.SL_MESSAGE || "Échec de la résiliation"));
  }

  async function testAndSubmit() {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const tk = await requestToken();
      await submitUnsubscription(tk);
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    loading,
    submitting,
    comboComptes,
    form,
    errors,
    modalCompte,
    setForm,
    setModalCompte,
    loadAccounts,
    testAndSubmit
  };
};
