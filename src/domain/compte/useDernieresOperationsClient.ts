import React from "react";
import {
  dernieresOperationsClient,
  OperationItem,
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
    const body = {
      Nombretransactions: String(count),
      DateDebut: "01/01/1900",
      DateFin: "02/12/2025",
      CodeCryptage: "Y}@128eVIXfoi7",
    };
    try {
      const res: RequestResult<any> = await dernieresOperationsClient(body);
      const api = res.data || ({} as any);
      if (res.error) {
        setError(res.error);
        return;
      }
      const container = api?.data || api?.DONNEES || api;
      const opsArray = container?.operations || container?.OPERATIONS || [];
      const ops: OperationItem[] = Array.isArray(opsArray) ? opsArray : [];
      const stats: Statistiques | undefined = (container?.statistiques ||
        container?.STATISTIQUES) as Statistiques | undefined;

      const sorted = [...ops].sort(
        (a, b) => parseDateStr(b.MC_DATESAISIE) - parseDateStr(a.MC_DATESAISIE)
      );

      // Deduplication logic
      const uniqueOps: OperationItem[] = [];
      const seen = new Set<string>();

      for (const op of sorted) {
        const type = String(op.TypeOperation || "").toUpperCase();
        const isCredit = type === "CREDIT";
        const amt = isCredit ? op.MC_MONTANTCREDIT : op.MC_MONTANTDEBIT;
        const label = op.MC_LIBELLEOPERATION || "";
        const date = op.MC_DATESAISIE || "";
        
        // Key based on Label, Amount and Date (ignoring type/direction to filter pairs)
        const key = `${label}|${amt}|${date}`;
        
        if (!seen.has(key)) {
          seen.add(key);
          uniqueOps.push(op);
        }
      }

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
