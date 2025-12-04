import React from "react";
import { blocagesCompte, BlocageItem } from "../../services/compte/blocagesCompte";
import type { RequestResult } from "../../services/httpClient";

export type BlocagesState = {
  blockedCount: number;
  blockedList: BlocageItem[];
  blockedAmountTotal: number;
  isBlocked: boolean;
};

function todayYMD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function extractAmount(item: any): number {
  const candidates = [
    item?.montant,
    item?.MONTANT,
    item?.montantBlocage,
    item?.MONTANT_BLOCAGE,
    item?.MC_MONTANTDEBIT,
    item?.MC_MONTANTCREDIT,
    item?.MONTANTBLOQUE,
  ];
  for (const v of candidates) {
    const n = typeof v === "string" ? Number(v) : Number(v || 0);
    if (!isNaN(n)) return n;
  }
  return 0;
}

export function useBlocagesCompte() {
  const [state, setState] = React.useState<BlocagesState>({
    blockedCount: 0,
    blockedList: [],
    blockedAmountTotal: 0,
    isBlocked: false,
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<any>(null);

  const fetchData = async (accountId: string, journee?: string, tiers?: string) => {
    setLoading(true);
    setError(null);
    const body = {
      CO_CODECOMPTE: accountId,
      BL_DATEJOURNEE: journee || todayYMD(),
      MB_IDTIERS: tiers || "",
    };
    try {
      const res: RequestResult<any> = await blocagesCompte(body);
      if (res.error) {
        setError(res.error);
        return;
      }
      const api = res.data || {};
      const count = Number(api?.count || 0);
      const list: BlocageItem[] = Array.isArray(api?.data) ? api.data : [];
      const total = list.reduce((sum, it) => sum + extractAmount(it), 0);
      setState({
        blockedCount: count,
        blockedList: list,
        blockedAmountTotal: total,
        isBlocked: count > 0,
      });
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  return { ...state, loading, error, fetchData };
}
