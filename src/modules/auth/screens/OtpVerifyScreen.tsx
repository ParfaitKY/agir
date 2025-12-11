import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useI18n } from "../../../app/providers/I18nProvider";

const OtpVerifyScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { tText } = useI18n();
  const route = useRoute<any>();
  const phoneMasked = useMemo(() => {
    const raw = String(route?.params?.phone || "+225 07 ***** 12");
    return raw;
  }, [route]);

  const DIGITS = 6;
  const [values, setValues] = useState<string[]>(Array(DIGITS).fill(""));
  const [active, setActive] = useState(0);
  const inputs = useRef<TextInput[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const DEFAULT_CODE = "123456";
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    inputs.current[active]?.focus?.();
  }, [active]);

  const handleChange = (index: number, text: string) => {
    const v = text.replace(/\D/g, "").slice(0, 1);
    const next = [...values];
    next[index] = v;
    setValues(next);
    if (v && index < DIGITS - 1) setActive(index + 1);
  };

  const handleKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === "Backspace") {
      const next = [...values];
      if (next[index]) {
        next[index] = "";
        setValues(next);
      } else if (index > 0) {
        setActive(index - 1);
        const prev = [...values];
        prev[index - 1] = "";
        setValues(prev);
      }
    }
  };

  const code = values.join("");
  const canSubmit = code.length === DIGITS;

  const resend = () => {
    setSecondsLeft(60);
    setValues(Array(DIGITS).fill(""));
    setActive(0);
    setStatus("idle");
  };

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Entrez votre code
        </Text>
        <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
          {tText("Saisissez le code envoyé par SMS au")} {phoneMasked}.
        </Text>

        <View style={styles.timerRow}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={[styles.timerText, { color: colors.primary }]}>
            {" "}
            {fmtTime(secondsLeft)}
          </Text>
        </View>

        <View style={styles.otpRow}>
          {Array.from({ length: DIGITS }).map((_, i) => (
            <View key={`otp-${i}`} style={styles.otpItem}>
              <TextInput
                ref={(r) => (inputs.current[i] = r as any)}
                value={values[i]}
                onChangeText={(t) => handleChange(i, t)}
                onKeyPress={(e) => handleKeyPress(i, e)}
                keyboardType="number-pad"
                maxLength={1}
                style={[styles.otpInput, { color: colors.text }]}
                placeholder=""
                selectionColor={colors.primary}
              />
              <View
                style={[
                  styles.underline,
                  {
                    backgroundColor:
                      i === active ? colors.primary : colors.border,
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: colors.primary, opacity: canSubmit ? 1 : 0.6 },
          ]}
          disabled={!canSubmit}
          onPress={() => {
            if (code === DEFAULT_CODE) {
              setStatus("ok");
              try {
                (route as any)?.params?.onSuccess?.();
              } catch {}
              navigation.goBack();
            } else {
              setStatus("error");
            }
          }}
        >
          <Text style={[styles.submitText, { color: colors.background }]}>
            Valider
          </Text>
        </TouchableOpacity>

        {status === "error" && (
          <Text
            style={{ color: colors.error, marginTop: 10, fontWeight: "600" }}
          >
            Code incorrect
          </Text>
        )}
        {status === "ok" && (
          <Text
            style={{ color: colors.success, marginTop: 10, fontWeight: "700" }}
          >
            Code validé
          </Text>
        )}

        <TouchableOpacity
          onPress={resend}
          disabled={secondsLeft > 0}
          style={{ marginTop: 12 }}
        >
          <Text
            style={{
              color: colors.primary,
              opacity: secondsLeft > 0 ? 0.6 : 1,
              fontWeight: "600",
            }}
          >
            Renvoyer le code
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerRow: { paddingHorizontal: 16, paddingTop: 8 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  title: { fontSize: 28, fontWeight: "800", marginTop: 8 },
  subtitle: { fontSize: 14, marginTop: 8 },
  timerRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  timerText: { fontSize: 16, fontWeight: "700" },
  otpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    paddingHorizontal: 4,
  },
  otpItem: { width: "14.5%", alignItems: "center" },
  otpInput: {
    fontSize: 22,
    textAlign: "center",
    paddingVertical: 6,
    width: "100%",
  },
  underline: { height: 3, width: "100%", borderRadius: 2, marginTop: 8 },
  submitBtn: {
    marginTop: 36,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitText: { fontSize: 16, fontWeight: "700" },
});

export default OtpVerifyScreen;
