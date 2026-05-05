import { sharedStore } from "@/lib/shared-store";

export const LANGUAGE_STORAGE_KEY = "app-language";
export const SUPPORTED_LANGUAGES = ["zh-TW", "zh-CN"] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function normalizeLanguage(input?: string | null): AppLanguage {
  if (!input) {
    return "zh-TW";
  }

  const language = input.toLowerCase();

  if (
    language.startsWith("zh-cn") ||
    language.startsWith("zh-sg") ||
    language.includes("hans")
  ) {
    return "zh-CN";
  }

  return "zh-TW";
}

export function detectBrowserLanguage(): AppLanguage {
  if (typeof navigator === "undefined") {
    return "zh-TW";
  }

  const candidates = [navigator.language, ...(navigator.languages ?? [])];

  for (const candidate of candidates) {
    const normalized = normalizeLanguage(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return "zh-TW";
}

export async function getStoredLanguage(): Promise<AppLanguage | null> {
  const value = await sharedStore.get<string>(LANGUAGE_STORAGE_KEY);
  if (!value) {
    return null;
  }

  return normalizeLanguage(value);
}

export async function setStoredLanguage(language: AppLanguage): Promise<void> {
  await sharedStore.set<AppLanguage>(LANGUAGE_STORAGE_KEY, language);
}
