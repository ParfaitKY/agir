import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useNavigation } from "@react-navigation/native";

const WalletMobileScreens: React.FC = () => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.grid, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.text },
          ]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("WalletMobileSubscribe")}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="phone-portrait" size={32} color="#4CAF50" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Souscription
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.text + "80" }]}>
            compte mobile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.text },
          ]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("WalletBankTransferMobile")}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="swap-horizontal" size={32} color="#1E88E5" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Compte</Text>
          <Text style={[styles.cardSubtitle, { color: colors.text + "80" }]}>
            bancaire - mobile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.text },
          ]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("WalletMobileTransferBank")}
        >
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="arrow-left-right"
              size={32}
              color="#8D6E63"
            />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Compte</Text>
          <Text style={[styles.cardSubtitle, { color: colors.text + "80" }]}>
            mobile - bancaire
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.text },
          ]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("WalletMobileUnsubscribe")}
        >
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="block-helper"
              size={32}
              color="#E53935"
            />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Désouscription
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.text + "80" }]}>
            compte mobile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.text },
          ]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("WalletMobileOperationsList")}
        >
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="format-list-numbered"
              size={32}
              color="#7E57C2"
            />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Liste</Text>
          <Text style={[styles.cardSubtitle, { color: colors.text + "80" }]}>
            des opérations mobile
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7", padding: 16 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    alignItems: "center",
  },
  iconWrap: { marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 20 },
  cardSubtitle: { fontSize: 13 },
});

export default WalletMobileScreens;
