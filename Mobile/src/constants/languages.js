export const LANGUAGES = [
  {
    code: "vi",
    shortLabel: "VI",
    label: "Tiếng Việt",
    subtitle: "Ngôn ngữ mặc định",
    settingsLabel: "Tiếng Việt",
    changedMessage: "Đã chuyển sang tiếng Việt",
    flag: "🇻🇳"
  },
  {
    code: "en",
    shortLabel: "EN",
    label: "English",
    subtitle: "Default language",
    settingsLabel: "English",
    changedMessage: "Language changed to English",
    flag: "🇺🇸"
  }
];

export const DEFAULT_LANGUAGE_CODE = "vi";

export function getLanguageInfo(code) {
  return LANGUAGES.find((language) => language.code === code) || LANGUAGES[0];
}
