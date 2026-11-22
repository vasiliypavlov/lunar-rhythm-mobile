import { DICT_RU } from './dict_ru.js';
import { DICT_EN } from './dict_en.js';
import { DICT_ES } from './dict_es.js';
import { DICT_DE } from './dict_de.js';
import { DICT_FR } from './dict_fr.js';

export const BUILTIN_DICTIONARIES = {
  ru: DICT_RU,
  en: DICT_EN,
  es: DICT_ES,
  de: DICT_DE,
  fr: DICT_FR
};

export const SUPPORTED_BUILTIN_LANGS = ['ru', 'en', 'es', 'de', 'fr'];

export const DEFAULT_DICTIONARY = DICT_RU;

export function detectDefaultLang(overrideLang) {
  const navLang =
    overrideLang !== undefined
      ? overrideLang
      : typeof navigator !== 'undefined'
      ? navigator.language || (Array.isArray(navigator.languages) ? navigator.languages[0] : '') || ''
      : '';
  const base = String(navLang).trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_BUILTIN_LANGS.includes(base) ? base : 'en';
}

export function getBuiltinDictionary(langKey) {
  if (langKey && BUILTIN_DICTIONARIES[langKey]) {
    return BUILTIN_DICTIONARIES[langKey];
  }
  return BUILTIN_DICTIONARIES[detectDefaultLang()] || DICT_EN;
}

export function deepMergeDictionary(baseOrLang, custom) {
  const base =
    typeof baseOrLang === 'string'
      ? getBuiltinDictionary(baseOrLang)
      : baseOrLang && typeof baseOrLang === 'object' && !Array.isArray(baseOrLang)
      ? baseOrLang
      : getBuiltinDictionary(detectDefaultLang());

  if (!custom || typeof custom !== 'object' || Array.isArray(custom)) {
    return structuredClone(base);
  }

  const result = {};
  const keys = new Set([...Object.keys(base), ...Object.keys(custom)]);
  for (const key of keys) {
    const baseVal = base[key];
    const customVal = custom[key];
    if (
      baseVal &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMergeDictionary(
        baseVal,
        customVal && typeof customVal === 'object' && !Array.isArray(customVal) ? customVal : {}
      );
    } else if (Array.isArray(baseVal)) {
      if (Array.isArray(customVal) && customVal.length > 0) {
        result[key] = customVal
          .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
          .map(v => String(v));
        if (!result[key].length) result[key] = structuredClone(baseVal);
      } else if (typeof customVal === 'string' && customVal.trim() !== '') {
        // Backward compatibility with v1.0 custom dictionaries where lifestyle_tips slots were single strings
        result[key] = [customVal];
      } else {
        result[key] = structuredClone(baseVal);
      }
    } else if (customVal !== undefined && customVal !== null && customVal !== '') {
      result[key] = typeof baseVal === 'string' ? String(customVal) : customVal;
    } else {
      result[key] = baseVal;
    }
  }
  return result;
}
