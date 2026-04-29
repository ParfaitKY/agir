import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AddBeneficiaireModal from "./AddBeneficiaireModal";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useBeneficiaires, Beneficiaire } from "../../../domain/beneficiaires/useBeneficiaires";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const BeneficiairesPage: React.FC = () => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { 
    beneficiaires, 
    isLoading, 
    stats, 
    addBeneficiaire, 
    deleteBeneficiaire, 
    toggleFavorite,
    getInitials 
  } = useBeneficiaires();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "fav">("all");
  const [search, setSearch] = useState("");

  const filtered = beneficiaires.filter((c) => {
    const matchTab = activeTab === "fav" ? c.favorite : true;
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.accountNumber.includes(search);
    return matchTab && matchSearch;
  });

  const handleAddBeneficiaire = async (data: any) => {
    const result = await addBeneficiaire(data);
    if (result.success) {
      setShowAddModal(false);
      Alert.alert("Succès", "Bénéficiaire ajouté avec succès");
    } else {
      Alert.alert("Erreur", result.error || "Impossible d'ajouter le bénéficiaire");
    }
  };

  const handleDeleteBeneficiaire = (id: string, name: string) => {
    Alert.alert(
      "Supprimer le bénéficiaire",
      `Voulez-vous vraiment supprimer ${name} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const result = await deleteBeneficiaire(id);
            if (!result.success) {
              Alert.alert("Erreur", result.error || "Impossible de supprimer");
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (id: string) => {
    await toggleFavorite(id);
  };

  const handleTransfer = (beneficiaire: Beneficiaire) => {
    // Naviguer vers l'écran de virement avec le bénéficiaire pré-rempli
    (navigation as any).navigate("Transfer", {
      beneficiary: {
        accountNumber: beneficiaire.accountNumber,
        name: beneficiaire.name,
        bank: beneficiaire.bank,
      },
    });
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `${diffDays}j`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem`;
    return `${Math.floor(diffDays / 30)}mois`;
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <Header
            colors={colors}
            t={t}
            stats={stats}
            beneficiaires={beneficiaires}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            search={search}
            setSearch={setSearch}
            onAdd={() => setShowAddModal(true)}
            onTransfer={handleTransfer}
            getInitials={getInitials}
          />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={[s.emptyIcon, { backgroundColor: colors.card }]}>
              <Ionicons name="people-outline" size={40} color={colors.text + "30"} />
            </View>
            <Text style={[s.emptyTitle, { color: colors.text + "50" }]}>Aucun bénéficiaire</Text>
            <Text style={[s.emptySub, { color: colors.text + "30" }]}>Ajoutez votre premier contact</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <ContactCard 
            contact={item} 
            colors={colors} 
            index={index}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDeleteBeneficiaire}
            onTransfer={handleTransfer}
            getInitials={getInitials}
            getTimeAgo={getTimeAgo}
          />
        )}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[s.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      <AddBeneficiaireModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddBeneficiaire}
      />
    </View>
  );
};

/* ── Header ── */
function Header({ colors, t, stats, beneficiaires, activeTab, setActiveTab, search, setSearch, onAdd, onTransfer, getInitials }: any) {
  const totalK = Math.round(stats.totalTransferred / 1000);
  
  return (
    <View>
      {/* Top summary */}
      <View style={[s.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={s.summaryLeft}>
          <Text style={[s.summaryCount, { color: colors.text }]}>{stats.total}</Text>
          <Text style={[s.summaryLabel, { color: colors.text + "60" }]}>bénéficiaires</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryMid}>
          <Text style={[s.summaryCount, { color: "#F59E0B" }]}>{stats.favorites}</Text>
          <Text style={[s.summaryLabel, { color: colors.text + "60" }]}>favoris</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryRight}>
          <Text style={[s.summaryCount, { color: colors.primary }]}>{totalK}k</Text>
          <Text style={[s.summaryLabel, { color: colors.text + "60" }]}>XOF transféré</Text>
        </View>
        <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.primary }]} onPress={onAdd}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Quick access */}
      {beneficiaires.length > 0 && (
        <>
          <Text style={[s.section, { color: colors.text }]}>Accès rapide</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.quickRow}
          >
            {beneficiaires.slice(0, 6).map((c: any) => (
              <TouchableOpacity key={c.id} style={s.quickItem} onPress={() => onTransfer(c)}>
                <View style={[s.quickRing, { borderColor: c.color + "50" }]}>
                  <View style={[s.quickAvatar, { backgroundColor: c.color }]}>
                    <Text style={s.quickInitial}>{getInitials(c.name)}</Text>
                  </View>
                </View>
                {c.favorite && (
                  <View style={[s.quickStar, { backgroundColor: colors.background }]}>
                    <Ionicons name="star" size={9} color="#F59E0B" />
                  </View>
                )}
                <Text style={[s.quickName, { color: colors.text }]} numberOfLines={1}>
                  {c.name.split(" ")[0]}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.quickItem} onPress={onAdd}>
              <View style={[s.quickRing, { borderColor: colors.border }]}>
                <View style={[s.quickAvatar, { backgroundColor: colors.card }]}>
                  <Ionicons name="add" size={20} color={colors.primary} />
                </View>
              </View>
              <Text style={[s.quickName, { color: colors.primary }]}>Ajouter</Text>
            </TouchableOpacity>
          </ScrollView>
        </>
      )}

      {/* Search */}
      <View style={[s.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={16} color={colors.text + "40"} />
        <TextInput
          style={[s.searchInput, { color: colors.text }]}
          placeholder="Rechercher un bénéficiaire…"
          placeholderTextColor={colors.text + "35"}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={colors.text + "40"} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={[s.tabWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {(["all", "fav"] as const).map((tab) => {
          const active = activeTab === tab;
          const count = tab === "all" ? stats.total : stats.favorites;
          return (
            <TouchableOpacity
              key={tab}
              style={[s.tabBtn, active && [s.tabBtnActive, { backgroundColor: colors.primary }]]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, { color: active ? "#fff" : colors.text + "55" }]}>
                {tab === "all" ? `Tous (${count})` : `Favoris (${count})`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {beneficiaires.length > 0 && (
        <Text style={[s.listLabel, { color: colors.text + "40" }]}>
          {stats.total} contact{stats.total > 1 ? "s" : ""}
        </Text>
      )}
    </View>
  );
}

/* ── Contact card ── */
function ContactCard({ 
  contact, 
  colors, 
  index, 
  onToggleFavorite, 
  onDelete, 
  onTransfer,
  getInitials,
  getTimeAgo 
}: { 
  contact: Beneficiaire; 
  colors: any; 
  index: number;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onTransfer: (contact: Beneficiaire) => void;
  getInitials: (name: string) => string;
  getTimeAgo: (date?: string) => string;
}) {
  const initial = getInitials(contact.name);
  const timeAgo = getTimeAgo(contact.lastTransferDate);
  const amount = contact.lastTransferAmount 
    ? `${contact.lastTransferAmount.toLocaleString("fr-FR")} XOF`
    : "Aucun transfert";

  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Avatar */}
      <View style={[s.avatarWrap, { backgroundColor: contact.color + "18" }]}>
        <View style={[s.avatar, { backgroundColor: contact.color }]}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={s.cardInfo}>
        <View style={s.cardTopRow}>
          <Text style={[s.cardName, { color: colors.text }]}>{contact.name}</Text>
          <View style={s.cardTopRight}>
            <TouchableOpacity onPress={() => onToggleFavorite(contact.id)} style={{ marginRight: 6 }}>
              <Ionicons 
                name={contact.favorite ? "star" : "star-outline"} 
                size={16} 
                color={contact.favorite ? "#F59E0B" : colors.text + "40"} 
              />
            </TouchableOpacity>
            {timeAgo && <Text style={[s.cardTime, { color: colors.text + "35" }]}>{timeAgo}</Text>}
          </View>
        </View>
        <Text style={[s.cardId, { color: colors.text + "40" }]}>{contact.accountNumber}</Text>
        <View style={s.cardBottom}>
          <View style={[s.bankTag, { backgroundColor: colors.primary + "12" }]}>
            <Ionicons name="business-outline" size={10} color={colors.primary} />
            <Text style={[s.bankText, { color: colors.primary }]}>{contact.bank}</Text>
          </View>
          <Text style={[s.cardAmount, { color: colors.text + "70" }]}>{amount}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={s.cardActions}>
        <TouchableOpacity 
          style={[s.sendBtn, { backgroundColor: contact.color }]}
          onPress={() => onTransfer(contact)}
        >
          <Ionicons name="arrow-forward" size={15} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.deleteBtn, { backgroundColor: colors.error + "15" }]}
          onPress={() => onDelete(contact.id, contact.name)}
        >
          <Ionicons name="trash-outline" size={14} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ── Styles ── */
const s = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },

  // Summary bar
  summary: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 20, padding: 18, marginBottom: 28,
    borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 3,
  },
  summaryLeft: { alignItems: "center", flex: 1 },
  summaryMid: { alignItems: "center", flex: 1 },
  summaryRight: { alignItems: "center", flex: 1 },
  summaryCount: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  summaryLabel: { fontSize: 11, marginTop: 2, fontWeight: "500" },
  summaryDivider: { width: 1, height: 32, backgroundColor: "#ffffff15" },
  addBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginLeft: 12 },

  // Section title
  section: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 14, opacity: 0.5 },

  // Quick access
  quickRow: { gap: 20, paddingBottom: 24 },
  quickItem: { alignItems: "center", width: 56, position: "relative" },
  quickRing: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, justifyContent: "center", alignItems: "center", marginBottom: 6 },
  quickAvatar: { width: 46, height: 46, borderRadius: 23, justifyContent: "center", alignItems: "center" },
  quickInitial: { color: "#fff", fontSize: 16, fontWeight: "800" },
  quickStar: { position: "absolute", top: 0, right: 0, width: 16, height: 16, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  quickName: { fontSize: 10, fontWeight: "600", textAlign: "center" },

  // Search
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 46, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },

  // Tabs
  tabWrap: { flexDirection: "row", borderRadius: 14, padding: 4, borderWidth: 1, marginBottom: 20, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center" },
  tabBtnActive: {},
  tabText: { fontSize: 13, fontWeight: "600" },

  // List label
  listLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 },

  // Contact card
  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
  },
  avatarWrap: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center" },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  cardInfo: { flex: 1 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  cardTopRight: { flexDirection: "row", alignItems: "center" },
  cardName: { fontSize: 14, fontWeight: "700", letterSpacing: 0.2 },
  cardTime: { fontSize: 11 },
  cardId: { fontSize: 11, marginBottom: 7 },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bankTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  bankText: { fontSize: 10, fontWeight: "600" },
  cardAmount: { fontSize: 12, fontWeight: "600" },
  cardActions: { gap: 6 },
  sendBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  deleteBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },

  // Empty
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptySub: { fontSize: 13 },

  // FAB
  fab: {
    position: "absolute", bottom: 28, right: 20,
    width: 54, height: 54, borderRadius: 27,
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.25, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 8,
  },
});

export default BeneficiairesPage;
