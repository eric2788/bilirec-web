import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "@/i18n/resources";
import {
  detectBrowserLanguage,
  SUPPORTED_LANGUAGES,
  type AppLanguage
} from "@/lib/language";

void i18n.use(initReactI18next).init({
  resources,
  lng: detectBrowserLanguage(),
  fallbackLng: "zh-TW",
  supportedLngs: [...SUPPORTED_LANGUAGES],
  defaultNS: "common",
  ns: ["common"],
  interpolation: {
    escapeValue: false
  }
});

export function getCurrentLanguage(): AppLanguage {
  return i18n.resolvedLanguage === "zh-CN" ? "zh-CN" : "zh-TW";
}

export { i18n };
