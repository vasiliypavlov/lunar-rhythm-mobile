/**
 * Хранилище состояния приложения.
 * =========================================================================
 *
 * Основной бэкенд — нативный плагин @capacitor/preferences (SharedPreferences
 * на Android). Если нативный плагин недоступен (предпросмотр в браузере,
 * WebView без моста), используется прозрачный фолбэк на localStorage.
 *
 * Состояние хранится единым JSON-объектом под ключом `lunar_rhythm_state_v1`
 * — это гарантирует атомарность записи (настройки, дата рождения, активный
 * словарь и список напоминаний всегда сохраняются согласованно).
 */

import { getPlugin } from './capacitor.js';

export const STORAGE_KEY = 'lunar_rhythm_state_v1';

/**
 * Кэш доступности плагина: null — ещё не проверяли, true/false — результат.
 */
let preferencesUsable = null;

/**
 * Возвращает нативный плагин Preferences, если он реально работает.
 * Первая проверка — пробный вызов, чтобы не полагаться на наличие объекта.
 */
async function getPreferences() {
  if (preferencesUsable === false) return null;

  const plugin = getPlugin('Preferences');
  if (!plugin || typeof plugin.get !== 'function' || typeof plugin.set !== 'function') {
    preferencesUsable = false;
    return null;
  }

  if (preferencesUsable === true) return plugin;

  try {
    await plugin.get({ key: STORAGE_KEY });
    preferencesUsable = true;
    return plugin;
  } catch {
    preferencesUsable = false;
    return null;
  }
}

/**
 * Читает сырое состояние (объект) из хранилища.
 * @returns {Promise<object>}
 */
export async function readState() {
  const preferences = await getPreferences();
  if (preferences) {
    try {
      const result = await preferences.get({ key: STORAGE_KEY });
      const value = result && result.value;
      if (value === null || value === undefined || value === '') return {};
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      /* переходим к localStorage */
    }
  }

  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Записывает состояние в хранилище.
 * @param {object} state Полный объект состояния.
 * @returns {Promise<boolean>} true, если запись выполнена.
 */
export async function writeState(state) {
  let payload;
  try {
    payload = JSON.stringify(state);
  } catch {
    return false;
  }

  const preferences = await getPreferences();
  if (preferences) {
    try {
      await preferences.set({ key: STORAGE_KEY, value: payload });
      return true;
    } catch {
      /* переходим к localStorage */
    }
  }

  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, payload);
    return true;
  } catch {
    return false;
  }
}

/**
 * Полностью очищает сохранённое состояние.
 */
export async function clearState() {
  const preferences = await getPreferences();
  if (preferences) {
    try {
      await preferences.remove({ key: STORAGE_KEY });
    } catch {
      /* ignore */
    }
  }
  try {
    globalThis.localStorage?.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
