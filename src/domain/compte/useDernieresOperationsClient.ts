import React from "react";
import { secureGetItem } from "../../shared/utils/secureStorage";
import {
  dernieresOperationsClient,
  OperationItem,
  DernieresOperationsResponse,
} from "../../services/compte/dernieresOperationsClient";
import type { RequestResult } from "../../services/httpClient";

type Statistiques = {
  moyenne_credit?: number;
  moyenne_debit?: number;
  solde?: number;
  total_credit?: number;
  total_debit?: number;
};

type GroupedDebits = Record<
  string,
  { total: number; operations: OperationItem[] }
>;

function toNumber(n: any): number {
  const v =
    typeof n === "string" ? Number(n.replace(/[^0-9.-]/g, "")) : Number(n);
  return isNaN(v) ? 0 : v;
}

function parseDateStr(s?: string): number {
  if (!s) return 0;
  // Try ISO
  const iso = Date.parse(s);
  if (!isNaN(iso)) return iso;
  // Try dd/MM/yyyy or dd/MM/yyyy HH:mm
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (m) {
    const dd = Number(m[1]);
    const mm = Number(m[2]) - 1;
    const yyyy = Number(m[3]);
    const hh = m[4] ? Number(m[4]) : 0;
    const min = m[5] ? Number(m[5]) : 0;
    return new Date(yyyy, mm, dd, hh, min).getTime();
  }
  return 0;
}

export function useDernieresOperationsClient(count: number = 10) {
  const [operations, setOperations] = React.useState<OperationItem[]>([]);
  const [statistiques, setStatistiques] = React.useState<
    Statistiques | undefined
  >(undefined);
  const [groupedDebits, setGroupedDebits] = React.useState<GroupedDebits>({});
  const [chartData, setChartData] = React.useState<{
    labels: string[];
    datasets: { data: number[] }[];
  }>({ labels: [], datasets: [{ data: [] }] });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    const clientId = await secureGetItem("client_id");
    const token = await secureGetItem("auth_token");
    const loginSaved = await secureGetItem("user_login");

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const dateFin = `${dd}/${mm}/${yyyy}`;

    const headers: any = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    // X-CLIENT-ID et X-LOGIN retirés : bloqués par CORS — client_id passé dans le body

    const body = {
      Nombretransactions: String(count),
      DateDebut: "01/01/1900",
      DateFin: dateFin,
      CodeCryptage: "Y}@128eVIXfoi7",
      ...(clientId ? { CLIENT_ID: clientId } : {}),
    };
    try {
      const res: RequestResult<DernieresOperationsResponse> =
        await dernieresOperationsClient(body, headers);
      const api = res.data;
      if (res.error || !api) {
        setError(res.error);
        return;
      }
      const container = api.data || (api as any).DONNEES || api;
      const opsArray =
        container?.operations || (container as any).OPERATIONS || [];
      const ops: OperationItem[] = Array.isArray(opsArray) ? opsArray : [];
      const stats: Statistiques | undefined = (container?.statistiques ||
        (container as any).STATISTIQUES) as Statistiques | undefined;

      const sorted = [...ops].sort(
        (a, b) => parseDateStr(b.MC_DATESAISIE) - parseDateStr(a.MC_DATESAISIE),
      );

      // Déduplication des opérations :
      // 1. Si MC_NUMPIECE est disponible, on l'utilise comme clé unique primaire.
      // 2. Détection des opérations miroirs (virements internes/remboursements) : 
      //    Si on voit un Débit et un Crédit avec le même Libellé, Date et Montant, on ne garde qu'un seul.
      const seenPieces = new Set<string>();
      const seenMirrors = new Set<string>(); // Key: Label_Date_Amount
      
      const uniqueOps = sorted.filter((item: any) => {
        const numPiece = String(item.MC_NUMPIECE || "").trim();
        const label = String(item.MC_LIBELLEOPERATION || "").trim();
        const date = String(item.MC_DATESAISIE || item.MC_DATEPIECE || "").split(" ")[0].trim();
        const debit = Number(item.MC_MONTANTDEBIT || 0);
        const credit = Number(item.MC_MONTANTCREDIT || 0);
        const amount = Math.max(debit, credit);
        const type = String(item.TypeOperation || item.MC_SENS || "").toUpperCase();
        const isDebit = type === "DEBIT" || type === "D" || (debit > 0 && credit === 0);

        // 1. Vérification par Numéro de Pièce (Identifiant technique unique)
        if (numPiece) {
          if (seenPieces.has(numPiece)) return false;
          seenPieces.add(numPiece);
        }

        // 2. Détection de miroir (Même Label, Même Date, Même Montant)
        const mirrorKey = `${label}_${date}_${amount}`;
        if (seenMirrors.has(mirrorKey)) {
          // Si on a déjà vu cette opération (même label/date/montant), c'est probablement le miroir (crédit)
          // On ne l'affiche pas pour éviter les doubles dans l'activité récente.
          return false;
        }
        
        seenMirrors.add(mirrorKey);
        return true;
      });

      setOperations(uniqueOps);
      setStatistiques(stats);

      const grouped: GroupedDebits = {};
      for (const op of uniqueOps) {
        const type = String(op.TypeOperation || "").toUpperCase();
        if (type !== "DEBIT") continue;
        const key = op.TS_CODETYPESCHEMACOMPTABLE || "AUTRE";
        const amount = toNumber(op.MC_MONTANTDEBIT);
        if (!grouped[key]) grouped[key] = { total: 0, operations: [] };
        grouped[key].total += amount;
        grouped[key].operations.push(op);
      }
      setGroupedDebits(grouped);

      const labels = Object.keys(grouped);
      const values = labels.map((k) => grouped[k].total);
      setChartData({ labels, datasets: [{ data: values }] });
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    operations,
    statistiques,
    groupedDebits,
    chartData,
    isLoading,
    error,
    fetchData,
  };
}
