import React, { useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  ScrollView,
  Image,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "../../../app/providers/I18nProvider";

const ShareAppScreen: React.FC = () => {
  const { t } = useI18n();

  const appUrl = "https://lapeyrie-emf.ga/app";
  const shareMessage = `${t("share.message")}\n${t(
    "share.download"
  )} : ${appUrl}`;

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const fadeButtons = useRef(new Animated.Value(0)).current;
  const scaleButtons = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(fadeButtons, {
        toValue: 1,
        duration: 550,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleButtons, {
        toValue: 1,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, fadeButtons, scaleButtons]);

  const copyLink = async () => {
    try {
      // Web: navigator.clipboard
      // Native: fallback Alert (ou expo-clipboard si ajouté au projet)
      const navClipboard = (global as any).navigator?.clipboard;
      if (navClipboard?.writeText) {
        await navClipboard.writeText(appUrl);
        Alert.alert(
          t("share.alert.copied.title"),
          t("share.alert.copied.body")
        );
      } else {
        Alert.alert("Lien", appUrl);
      }
    } catch (e) {
      Alert.alert(
        t("share.alert.copyError.title"),
        t("share.alert.copyError.body")
      );
    }
  };

  const shareWhatsApp = async () => {
    const waUrl = `whatsapp://send?text=${encodeURIComponent(shareMessage)}`;
    const webUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    const can = await Linking.canOpenURL(waUrl);
    await Linking.openURL(can ? waUrl : webUrl);
    Alert.alert(t("share.action.whatsapp"), t("share.alert.init"));
  };

  const shareMessenger = async () => {
    const msUrl = `fb-messenger://share?link=${encodeURIComponent(appUrl)}`;
    const webUrl = `https://m.me/share?link=${encodeURIComponent(appUrl)}`;
    const can = await Linking.canOpenURL(msUrl);
    await Linking.openURL(can ? msUrl : webUrl);
    Alert.alert(t("share.action.messenger"), t("share.alert.init"));
  };

  const shareEmail = async () => {
    const mailUrl = `mailto:?subject=${encodeURIComponent(
      "LA PEYRIE EMF"
    )}&body=${encodeURIComponent(shareMessage)}`;
    const can = await Linking.canOpenURL(mailUrl);
    if (!can) {
      Alert.alert(
        t("share.alert.emailOpenError.title"),
        t("share.alert.emailOpenError.body")
      );
      return;
    }
    await Linking.openURL(mailUrl);
    Alert.alert(
      t("share.alert.emailDraft.title"),
      t("share.alert.emailDraft.body")
    );
  };

  const shareSMS = async () => {
    // iOS: sms:&body= ; Android: sms:?body=
    const smsUrl = `sms:&body=${encodeURIComponent(shareMessage)}`;
    const altUrl = `sms:?body=${encodeURIComponent(shareMessage)}`;
    const can = await Linking.canOpenURL(smsUrl);
    await Linking.openURL(can ? smsUrl : altUrl);
    Alert.alert(t("share.action.sms"), t("share.alert.init"));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.logoWrap,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.logoCircle}>
            <Image
              source={{ uri: "https://lapeyrie-emf.ga/logo.png" }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>{t("share.title")}</Text>
          <Text style={styles.subtitle}>{t("share.subtitle")}</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            { opacity: fadeButtons, transform: [{ scale: scaleButtons }] },
          ]}
        >
          <View style={styles.buttonsGrid}>
            <TouchableOpacity
              style={[styles.shareBtn, styles.whatsapp]}
              onPress={shareWhatsApp}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={styles.shareBtnText}>
                {t("share.action.whatsapp")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareBtn, styles.messenger]}
              onPress={shareMessenger}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubbles-outline" size={20} color="#fff" />
              <Text style={styles.shareBtnText}>
                {t("share.action.messenger")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareBtn, styles.email]}
              onPress={shareEmail}
              activeOpacity={0.85}
            >
              <Ionicons name="mail-outline" size={20} color="#fff" />
              <Text style={styles.shareBtnText}>{t("share.action.email")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareBtn, styles.sms]}
              onPress={shareSMS}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbox-outline" size={20} color="#fff" />
              <Text style={styles.shareBtnText}>{t("share.action.sms")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareBtn, styles.copy]}
              onPress={copyLink}
              activeOpacity={0.85}
            >
              <Ionicons name="link-outline" size={20} color="#fff" />
              <Text style={styles.shareBtnText}>{t("share.action.copy")}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  logoWrap: { alignItems: "center" },
  logoCircle: {
    height: 92,
    width: 92,
    borderRadius: 46,
    backgroundColor: "#EAF4FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D6E8FF",
    marginBottom: 8,
  },
  logo: { height: 64, width: 64 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0A0A0A",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
  },
  card: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderColor: "#E5E7EB",
    borderWidth: 1,
  },
  buttonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 150,
    justifyContent: "center",
  },
  shareBtnText: { color: "#fff", fontWeight: "600" },
  whatsapp: { backgroundColor: "#25D366" },
  messenger: { backgroundColor: "#1877F2" },
  email: { backgroundColor: "#0066CC" },
  sms: { backgroundColor: "#10B981" },
  copy: { backgroundColor: "#374151" },
});

export default ShareAppScreen;
