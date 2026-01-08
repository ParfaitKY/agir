import React from 'react';
import { View, Text as RNText, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../../app/providers/I18nProvider';
import { useTheme } from '../../../shared/styles/ThemeProvider';

export const LanguageScreen: React.FC = () => {
  const { language, setLanguage, t } = useI18n();
  const { colors } = useTheme();

  const languages = [
    { code: 'fr' as const, label: t('language.fr'), subtitle: 'French', flag: '🇫🇷' },
    { code: 'en' as const, label: t('language.en'), subtitle: 'English', flag: '🇬🇧' },
    { code: 'zh' as const, label: t('language.zh'), subtitle: 'Chinese', flag: '🇨🇳' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.headerCard, { backgroundColor: colors.card, shadowColor: colors.text + '20' }]}>
          <RNText style={[styles.headerTitle, { color: colors.text }]}>{t('language.title')}</RNText>
          <RNText style={[styles.headerSubtitle, { color: colors.text + '80' }]}>Select Language | 选择语言</RNText>
        </View>

        <View style={styles.list}>
          {languages.map(({ code, label, subtitle, flag }) => {
            const selected = language === code;
            return (
              <TouchableOpacity 
                key={code} 
                style={[
                  styles.langItem, 
                  { backgroundColor: colors.card, shadowColor: colors.text + '20' },
                  selected && { borderColor: colors.primary, backgroundColor: colors.primary + '20' }
                ]} 
                activeOpacity={0.8} 
                onPress={() => setLanguage(code)}
              >
                <View style={styles.langLeft}>
                  <RNText style={styles.flag}>{flag}</RNText>
                  <View>
                    <RNText style={[styles.langLabel, { color: colors.text }]}>{label}</RNText>
                    <RNText style={[styles.langSub, { color: colors.text + '80' }]}>{subtitle}</RNText>
                  </View>
                </View>
                {selected ? (
                  <View style={styles.checkWrap}>
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={colors.text + '80'} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.noteBox, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
          <View style={styles.noteHeader}>
            <Ionicons name="information" size={16} color={colors.primary} />
            <RNText style={[styles.noteHeaderText, { color: colors.primary }]}>{t('language.note.title')}</RNText>
          </View>
          <RNText style={[styles.noteText, { color: colors.primary }]}>{t('language.note.title')}</RNText>
          <RNText style={[styles.noteText, { color: colors.primary }]}>The language will be applied to the entire app.</RNText>
          <RNText style={[styles.noteText, { color: colors.primary }]}>语言将应用于整个应用程序。</RNText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { flex: 1 },
  headerCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#000', marginBottom: 6 },
  headerSubtitle: { fontSize: 12, color: '#999' },
  list: { marginTop: 12, marginHorizontal: 16 },
  langItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  langItemActive: { borderWidth: 2, borderColor: '#8AC1FF', backgroundColor: '#E7F1FF' },
  langLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flag: { fontSize: 24 },
  langLabel: { fontSize: 18, fontWeight: '700', color: '#000' },
  langSub: { fontSize: 12, color: '#777', marginTop: 2 },
  checkWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  noteBox: {
    backgroundColor: '#E7F1FF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  noteHeaderText: { fontSize: 14, fontWeight: '600', color: '#1B64B8' },
  noteText: { fontSize: 13, color: '#1B64B8' },
});

export default LanguageScreen;

