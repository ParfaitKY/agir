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

      // Deduplicate operations based on unique ID fields
      const uniqueOps: OperationItem[] = [];
      const seenIds = new Set<string>();

      for (const op of sorted) {
        // Create a unique key using composite fields
        // MC_NUMPIECE + MC_NUMSEQUENCE + AG_CODEAGENCE + CO_CODECOMPTE seems robust enough for banking transactions
        // Casting to any to avoid linter issues if type definition update is lagging
        const opAny = op as any;
        const numPiece = opAny.MC_NUMPIECE || "";
        const numSequence = opAny.MC_NUMSEQUENCE || "";
        const agence = opAny.AG_CODEAGENCE || "";
        const compte = opAny.CO_CODECOMPTE || "";
        const montantDebit = op.MC_MONTANTDEBIT || "0";
        const montantCredit = op.MC_MONTANTCREDIT || "0";

        // Fallback key if technical IDs are missing: Date + Amount + Label + Type
        const technicalId = `${numPiece}-${numSequence}-${agence}-${compte}`;
        const fallbackId = `${op.MC_DATESAISIE}-${montantDebit}-${montantCredit}-${op.MC_LIBELLEOPERATION}`;

        const key = numPiece && numSequence ? technicalId : fallbackId;

        if (!seenIds.has(key)) {
          seenIds.add(key);
          uniqueOps.push(op);
        }
      }

      // Grouping by MC_NUMPIECE to merge split transactions (e.g. Transfer + Fee)
      // The user wants to avoid "duplicates" which are actually multiple lines of the same accounting piece
      const mergedOps: OperationItem[] = [];
      const pieceMap = new Map<string, OperationItem[]>();

      for (const op of uniqueOps) {
        const opAny = op as any;
        const piece = opAny.MC_NUMPIECE;

        // Only group if piece is defined and valid (not 0)
        // We also check MC_DATEPIECE to ensure uniqueness across days if piece numbers reset
        const datePiece = opAny.MC_DATEPIECE || op.MC_DATESAISIE || "";

        if (piece && String(piece) !== "0") {
          const key = `${piece}_${datePiece}`;
          if (!pieceMap.has(key)) {
            pieceMap.set(key, []);
          }
          pieceMap.get(key)?.push(op);
        } else {
          // No piece number, keep as individual
          mergedOps.push(op);
        }
      }

      // Process groups
      pieceMap.forEach((group) => {
        if (group.length === 1) {
          mergedOps.push(group[0]);
        } else {
          // Find the "main" operation (usually the one with the highest amount or specific label)
          // We sum the amounts
          const totalDebit = group.reduce(
            (sum, op) => sum + Number(op.MC_MONTANTDEBIT || 0),
            0
          );
          const totalCredit = group.reduce(
            (sum, op) => sum + Number(op.MC_MONTANTCREDIT || 0),
            0
          );

          // Pick the operation with the highest value as the representative for Label, etc.
          const mainOp = group.reduce((prev, current) => {
            const prevVal = Math.max(
              Number(prev.MC_MONTANTDEBIT || 0),
              Number(prev.MC_MONTANTCREDIT || 0)
            );
            const currVal = Math.max(
              Number(current.MC_MONTANTDEBIT || 0),
              Number(current.MC_MONTANTCREDIT || 0)
            );
            return prevVal >= currVal ? prev : current;
          });

          mergedOps.push({
            ...mainOp,
            MC_MONTANTDEBIT: totalDebit,
            MC_MONTANTCREDIT: totalCredit,
          });
        }
      });

      // Re-sort by date descending
      const finalOps = mergedOps.sort(
        (a, b) => parseDateStr(b.MC_DATESAISIE) - parseDateStr(a.MC_DATESAISIE)
      );

      setOperations(finalOps);
      setStatistiques(stats);

      const grouped: GroupedDebits = {};
      for (const op of finalOps) {
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
