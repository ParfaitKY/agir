import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

type LanguageCode = 'fr' | 'en' | 'zh';

type Translations = Record<string, Record<LanguageCode, string>>;

const LOCALE_MAP: Record<LanguageCode, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  zh: 'zh-CN',
};

const STORAGE_KEY = 'app_language';

// Dictionnaire minimal — peut être étendu progressivement
const TRANSLATIONS: Translations = {
  'settings.header': { fr: 'Paramètres', en: 'Settings', zh: '设置' },
  'settings.section.account': { fr: 'COMPTE', en: 'ACCOUNT', zh: '账户' },
  'settings.section.finance': { fr: 'SERVICES FINANCIERS', en: 'FINANCIAL SERVICES', zh: '金融服务' },
  'settings.section.preferences': { fr: 'PRÉFÉRENCES', en: 'PREFERENCES', zh: '偏好设置' },
  'settings.section.security': { fr: 'SÉCURITÉ', en: 'SECURITY', zh: '安全' },
  'settings.section.support': { fr: 'SUPPORT', en: 'SUPPORT', zh: '支持' },
  'settings.section.app': { fr: 'APPLICATION', en: 'APPLICATION', zh: '应用' },
  'settings.logout': { fr: 'Se déconnecter', en: 'Log out', zh: '退出登录' },
  'settings.language': { fr: 'Langue', en: 'Language', zh: '语言' },
  'language.title': { fr: 'Choisir la langue', en: 'Choose language', zh: '选择语言' },
  'language.note.title': { fr: 'La langue sera appliquée à l’ensemble de l’application.', en: 'The language will be applied to the entire app.', zh: '语言将应用于整个应用程序。' },
  'language.fr': { fr: 'Français', en: 'French', zh: '法语' },
  'language.en': { fr: 'English', en: 'English', zh: '英语' },
  'language.zh': { fr: '中文', en: 'Chinese', zh: '中文' },
};

interface I18nContextValue {
  language: LanguageCode;
  locale: string;
  setLanguage: (code: LanguageCode) => Promise<void> | void;
  t: (key: string) => string;
  tText: (text: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLang] = useState<LanguageCode>('fr');

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(STORAGE_KEY);
        if (saved === 'fr' || saved === 'en' || saved === 'zh') setLang(saved);
      } catch {}
    })();
  }, []);

  const setLanguage = async (code: LanguageCode) => {
    setLang(code);
    try { await SecureStore.setItemAsync(STORAGE_KEY, code); } catch {}
    // expose locale globally pour utilitaires sans contexte
    (global as any).__APP_LOCALE = LOCALE_MAP[code];
  };

  const locale = useMemo(() => LOCALE_MAP[language], [language]);

  const t = (key: string) => {
    const entry = TRANSLATIONS[key];
    if (!entry) return key;
    return entry[language] || entry['fr'];
  };

  // Traduit des chaînes courtes connues (fallback identitaire sinon)
  const tText = (text: string) => {
    const map: Record<string, string> = {
      'Paramètres': 'settings.header',
      'COMPTE': 'settings.section.account',
      'SERVICES FINANCIERS': 'settings.section.finance',
      'PRÉFÉRENCES': 'settings.section.preferences',
      'SÉCURITÉ': 'settings.section.security',
      'SUPPORT': 'settings.section.support',
      'APPLICATION': 'settings.section.app',
      'Se déconnecter': 'settings.logout',
      'Langue': 'settings.language',
    };
    const key = map[text];
    return key ? t(key) : text;
  };

  const value: I18nContextValue = { language, locale, setLanguage, t, tText };

  // initialiser global locale
  (global as any).__APP_LOCALE = locale;

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};

export const getLocale = (): string => {
  const g = (global as any).__APP_LOCALE;
  return typeof g === 'string' ? g : 'fr-FR';
};

