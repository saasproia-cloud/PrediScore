export const LOCALES = ["fr", "en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "prediscore.locale";

export const LOCALE_META: Record<Locale, { label: string; short: string; flag: string }> = {
  fr: { label: "Français", short: "FR", flag: "🇫🇷" },
  en: { label: "English", short: "EN", flag: "🇬🇧" },
  es: { label: "Español", short: "ES", flag: "🇪🇸" },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
