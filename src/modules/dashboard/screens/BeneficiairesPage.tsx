import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AddBeneficiaireModal from "./AddBeneficiaireModal";
import { useI18n } from "../../../app/providers/I18nProvider";

interface Contact {
  initial: string;
  name: string;
  id: string;
  bank: string;
  amount: string;
  time: string;
  favorite: boolean;
  color?: string;
}

const BeneficiairesPage: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useI18n();
  const [showAddModal, setShowAddModal] = useState(false);

  const tabs = [t("beneficiaries.tabs.all"), t("beneficiaries.tabs.favorites")];
  const [activeTab, setActiveTab] = useState<string>(
    t("beneficiaries.tabs.all")
  );

  const contacts: Contact[] = [
    {
      initial: "M",
      name: "MOUPEPIDI",
      id: "1000CCHQ00000031002",
      bank: "La Peyie EMF",
      amount: "50 000 XAF",
      time: "il y a 2 jours",
      favorite: true,
      color: "#F44336",
    },
    {
      initial: "D",
      name: "DERLY",
      id: "1000CCHQ00000031003",
      bank: "La Peyie EMF",
      amount: "125 000 XAF",
      time: "il y a 1 semaine",
      favorite: true,
      color: "#009688",
    },
    {
      initial: "MK",
      name: "MARIE KOUASSI",
      id: "2000EFQ00000045001",
      bank: "Autre Banque",
      amount: "30 000 XAF",
      time: "il y a 1 mois",
      favorite: false,
      color: "#FFC107",
    },
    {
      initial: "JT",
      name: "JEAN TRAORE",
      id: "1000CCHQ00000031004",
      bank: "La Peyie EMF",
      amount: "70 000 XAF",
      time: "il y a 3 semaines",
      favorite: false,
      color: "#673AB7",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerCard}>
        <View>
          <Text style={styles.headerTitle}>
            {t("beneficiaries.header.title")}
          </Text>
          <Text style={styles.headerSubtitle}>
            {contacts.length} {t("beneficiaries.header.countSuffix")}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
        <AddBeneficiaireModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={(benef) => {
            console.log("Bénéficiaire ajouté : ", benef);
            setShowAddModal(false);
          }}
        />
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        <StatCard
          value="3"
          label={t("beneficiaries.stats.favorites")}
          icon="⭐"
        />
        <StatCard
          value="300k"
          label={t("beneficiaries.stats.transferred")}
          icon="💵"
        />
        <StatCard value="5" label={t("beneficiaries.stats.total")} icon="👥" />
      </View>

      {/* ACCÈS RAPIDE */}
      <Text style={styles.sectionTitle}>{t("beneficiaries.quick.title")}</Text>

      <View style={styles.quickRow}>
        <QuickUser initial="M" name="MOUPEPIDI" color="#F44336" />
        <QuickUser initial="D" name="DERLY" color="#009688" />
        <QuickUser initial="JT" name="JEAN" color="#673AB7" />
      </View>

      {/* SEARCH */}
      <TextInput
        style={styles.searchInput}
        placeholder={t("beneficiaries.search.placeholder")}
        placeholderTextColor="#777"
      />

      {/* TABS */}
      <View style={styles.tabsRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab
                  ? styles.tabTextActive
                  : styles.tabTextInactive,
              ]}
            >
              {tab} (
              {tab === t("beneficiaries.tabs.all")
                ? contacts.length
                : contacts.filter((c) => c.favorite).length}
              )
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CONTACTS */}
      {contacts
        .filter((c) =>
          activeTab === t("beneficiaries.tabs.favorites") ? c.favorite : true
        )
        .map((contact, i) => (
          <ContactCard key={i} contact={contact} />
        ))}

      {/* HELP */}
      <View style={styles.helpCard}>
        <View style={styles.itemRow}>
          <View style={styles.outerCircle}>
            <View style={styles.innerCircle}>
              <Text style={styles.exclamation}>!</Text>
            </View>
          </View>

          <Text style={styles.helpText}>{t("beneficiaries.help.contact")}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

/* COMPONENTS --------------------------------------------------------- */

function StatCard({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickUser({
  initial,
  name,
  color,
}: {
  initial: string;
  name: string;
  color: string;
}) {
  return (
    <View style={styles.quickUser}>
      <View style={[styles.circle, { backgroundColor: color }]}>
        <Text style={styles.circleText}>{initial}</Text>
      </View>
      <Text style={styles.quickName}>{name}</Text>
    </View>
  );
}

function ContactCard({ contact }: { contact: Contact }) {
  return (
    <View style={styles.contactCard}>
      <View style={styles.contactLeft}>
        <View style={[styles.circleLarge, { backgroundColor: contact.color }]}>
          <Text style={styles.circleText}>{contact.initial}</Text>
        </View>

        <View>
          <Text style={styles.contactName}>{contact.name}</Text>
          <Text style={styles.contactId}>{contact.id}</Text>
          <Text style={styles.bank}>🏦 {contact.bank}</Text>
          <Text style={styles.amount}>💰 {contact.amount}</Text>
        </View>
      </View>

      <View style={styles.contactRight}>
        <Text style={styles.time}>{contact.time}</Text>
        <TouchableOpacity style={styles.arrowBtn}>
          <Text style={styles.arrow}>➜</Text>
        </TouchableOpacity>

        {contact.favorite && <Text style={styles.favorite}>⭐</Text>}
      </View>
    </View>
  );
}

/* STYLES -------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f7f7f7" },

  headerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 16,
    // effet flottant
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5, // Android

    borderWidth: 1,
    borderColor: "#F1F1F1",
  },

  headerTitle: { fontSize: 20, fontWeight: "bold" },
  headerSubtitle: { color: "#666", marginTop: 4 },

  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0066CC",
    justifyContent: "center",
    alignItems: "center",
  },

  addBtnText: { fontSize: 24, color: "#fff" },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 5,
    // Effet flottant
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,

    borderWidth: 1,
    borderColor: "#EDEDED",
  },

  statIcon: {
    fontSize: 25, // Effet flottant
  },
  statValue: { fontSize: 18, fontWeight: "bold", marginTop: 5 },
  statLabel: { color: "#666" },

  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },

  quickRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },

  quickUser: { alignItems: "center" },

  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },

  circleText: { color: "#fff", fontSize: 20, fontWeight: "bold" },

  quickName: { marginTop: 5, fontSize: 14 },

  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    // Effet flottant
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 8,
    justifyContent: "space-around",
    marginBottom: 15,
    // Effet flottant
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },

  tabBtn: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    borderRadius: 15,
  },

  tabActive: {
    backgroundColor: "#0066CC",
  },

  tabText: { fontSize: 16 },
  tabTextInactive: { color: "#000" },
  tabTextActive: { color: "#fff", fontWeight: "600" },

  contactCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    elevation: 3,
    // Effet flottant
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },

  contactLeft: { flexDirection: "row" },

  circleLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  contactName: { fontSize: 16, fontWeight: "bold" },
  contactId: { color: "#666", fontSize: 12 },
  bank: { marginTop: 5, fontSize: 13 },
  amount: { marginTop: 3, fontSize: 13 },

  contactRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  time: { fontSize: 12, color: "#999" },
  arrowBtn: { padding: 5 },
  arrow: { fontSize: 18 },
  favorite: { fontSize: 18 },

  helpCard: {
    backgroundColor: "#d3e9ff",
    padding: 16,
    borderRadius: 20,
    marginTop: 20,
  },

  itemRow: { flexDirection: "row", alignItems: "center" },

  outerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#cce5ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  innerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0066CC",
    justifyContent: "center",
    alignItems: "center",
  },

  exclamation: { color: "#fff", fontWeight: "bold", fontSize: 10 },

  helpText: { flex: 1, fontSize: 14, color: "#000" },
});

export default BeneficiairesPage;
