import { useState, useEffect, useCallback } from "react";
import { secureGetItem, secureSetItem } from "../../shared/utils/secureStorage";

export interface Beneficiaire {
  id: string;
  name: string;
  accountNumber: string;
  bank: string;
  email?: string;
  favorite: boolean;
  color: string;
  createdAt: string;
  lastTransferAmount?: number;
  lastTransferDate?: string;
}

const COLORS = ["#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#3B82F6", "#EC4899", "#14B8A6", "#F97316"];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const getInitials = (name: string): string => {
  const parts = name.trim().toUpperCase().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2);
  return parts[0][0] + (parts[1]?.[0] || "");
};

export const useBeneficiaires = () => {
  const [beneficiaires, setBeneficiaires] = useState<Beneficiaire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les bénéficiaires depuis le storage
  const loadBeneficiaires = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userId = await secureGetItem("user_id");
      const storageKey = `beneficiaires_${userId || "default"}`;
      const data = await secureGetItem(storageKey);
      
      if (data) {
        const parsed = JSON.parse(data);
        setBeneficiaires(parsed);
      } else {
        setBeneficiaires([]);
      }
    } catch (err) {
      console.error("[useBeneficiaires] Error loading:", err);
      setError("Erreur lors du chargement des bénéficiaires");
      setBeneficiaires([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sauvegarder les bénéficiaires dans le storage
  const saveBeneficiaires = useCallback(async (data: Beneficiaire[]) => {
    try {
      const userId = await secureGetItem("user_id");
      const storageKey = `beneficiaires_${userId || "default"}`;
      await secureSetItem(storageKey, JSON.stringify(data));
    } catch (err) {
      console.error("[useBeneficiaires] Error saving:", err);
      throw new Error("Erreur lors de la sauvegarde");
    }
  }, []);

  // Ajouter un bénéficiaire
  const addBeneficiaire = useCallback(async (data: {
    name: string;
    accountNumber: string;
    bank: string;
    email?: string;
  }) => {
    try {
      const newBenef: Beneficiaire = {
        id: Date.now().toString(),
        name: data.name,
        accountNumber: data.accountNumber,
        bank: data.bank,
        email: data.email,
        favorite: false,
        color: getRandomColor(),
        createdAt: new Date().toISOString(),
      };

      const updated = [...beneficiaires, newBenef];
      await saveBeneficiaires(updated);
      setBeneficiaires(updated);
      return { success: true, data: newBenef };
    } catch (err) {
      console.error("[useBeneficiaires] Error adding:", err);
      return { success: false, error: "Erreur lors de l'ajout" };
    }
  }, [beneficiaires, saveBeneficiaires]);

  // Supprimer un bénéficiaire
  const deleteBeneficiaire = useCallback(async (id: string) => {
    try {
      const updated = beneficiaires.filter((b) => b.id !== id);
      await saveBeneficiaires(updated);
      setBeneficiaires(updated);
      return { success: true };
    } catch (err) {
      console.error("[useBeneficiaires] Error deleting:", err);
      return { success: false, error: "Erreur lors de la suppression" };
    }
  }, [beneficiaires, saveBeneficiaires]);

  // Basculer le statut favori
  const toggleFavorite = useCallback(async (id: string) => {
    try {
      const updated = beneficiaires.map((b) =>
        b.id === id ? { ...b, favorite: !b.favorite } : b
      );
      await saveBeneficiaires(updated);
      setBeneficiaires(updated);
      return { success: true };
    } catch (err) {
      console.error("[useBeneficiaires] Error toggling favorite:", err);
      return { success: false, error: "Erreur lors de la mise à jour" };
    }
  }, [beneficiaires, saveBeneficiaires]);

  // Mettre à jour un bénéficiaire
  const updateBeneficiaire = useCallback(async (id: string, data: Partial<Beneficiaire>) => {
    try {
      const updated = beneficiaires.map((b) =>
        b.id === id ? { ...b, ...data } : b
      );
      await saveBeneficiaires(updated);
      setBeneficiaires(updated);
      return { success: true };
    } catch (err) {
      console.error("[useBeneficiaires] Error updating:", err);
      return { success: false, error: "Erreur lors de la mise à jour" };
    }
  }, [beneficiaires, saveBeneficiaires]);

  // Enregistrer un transfert
  const recordTransfer = useCallback(async (accountNumber: string, amount: number) => {
    try {
      const updated = beneficiaires.map((b) =>
        b.accountNumber === accountNumber
          ? {
              ...b,
              lastTransferAmount: amount,
              lastTransferDate: new Date().toISOString(),
            }
          : b
      );
      await saveBeneficiaires(updated);
      setBeneficiaires(updated);
      return { success: true };
    } catch (err) {
      console.error("[useBeneficiaires] Error recording transfer:", err);
      return { success: false };
    }
  }, [beneficiaires, saveBeneficiaires]);

  // Charger au montage
  useEffect(() => {
    loadBeneficiaires();
  }, [loadBeneficiaires]);

  // Calculer les statistiques
  const stats = {
    total: beneficiaires.length,
    favorites: beneficiaires.filter((b) => b.favorite).length,
    totalTransferred: beneficiaires.reduce((sum, b) => sum + (b.lastTransferAmount || 0), 0),
  };

  return {
    beneficiaires,
    isLoading,
    error,
    stats,
    addBeneficiaire,
    deleteBeneficiaire,
    toggleFavorite,
    updateBeneficiaire,
    recordTransfer,
    reload: loadBeneficiaires,
    getInitials,
  };
};

export default useBeneficiaires;
