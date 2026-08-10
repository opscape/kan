export const locales = [
  "en",
  "fr",
  "de",
  "es",
  "it",
  "nl",
  "ru",
  "pl",
  "ptbr",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  nl: "Nederlands",
  ru: "Русский",
  pl: "Polski",
  ptbr: "Português",
};

export const localeLanguageTags: Record<Locale, string> = {
  en: "en",
  fr: "fr",
  de: "de",
  es: "es",
  it: "it",
  nl: "nl",
  ru: "ru",
  pl: "pl",
  ptbr: "pt-BR",
};
