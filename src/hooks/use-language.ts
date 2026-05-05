import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  normalizeLanguage,
  setStoredLanguage,
  type AppLanguage
} from "@/lib/language";

export function useLanguage() {
  const { i18n } = useTranslation();

  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);

  useEffect(() => {
    document.documentElement.setAttribute("data-language", language);
  }, [language]);

  const setLanguage = useCallback(
    async (nextLanguage: AppLanguage) => {
      const normalized = normalizeLanguage(nextLanguage);
      await setStoredLanguage(normalized);
      await i18n.changeLanguage(normalized);
    },
    [i18n]
  );

  return {
    language,
    setLanguage
  };
}
