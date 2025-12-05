import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { defaultTranslations } from '@/lib/translations';

type Language = 'en' | 'pt';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'pt';
  });
  const [dbTranslations, setDbTranslations] = useState<Record<string, { en: string; pt: string }>>({});

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    const fetchTranslations = async () => {
      const { data } = await supabase.from('translations').select('key, en, pt');
      if (data) {
        const map: Record<string, { en: string; pt: string }> = {};
        data.forEach(item => {
          map[item.key] = { en: item.en, pt: item.pt };
        });
        setDbTranslations(map);
      }
    };
    fetchTranslations();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    // First check DB translations, then fall back to defaults
    if (dbTranslations[key]) {
      return dbTranslations[key][language];
    }
    if (defaultTranslations[key]) {
      return defaultTranslations[key][language];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
