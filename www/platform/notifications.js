/**
 * Локальные уведомления Android.
 * =========================================================================
 *
 * Полностью заменяет Service Worker расширения Chrome (`chrome.alarms` +
 * `chrome.notifications`). Планирование выполняется через нативный плагин
 * @capacitor/local-notifications, который внутри использует AlarmManager:
 *
 *   - ежедневные чекпоинты (Утро / День / Вечер);
 *   - лунные будильники (по номеру лунных суток 1..30 и по конкретной дате).
 *
 * Важная особенность Android: `setRepeating` в плагине вычисляет период как
 * (дата первого срабатывания − сейчас), что даёт накопление дрейфа. Поэтому
 * здесь используется точный подход: на каждый чекпоинт планируется серия
 * одноразовых alarm'ов с точным временем на N дней вперёд. Серия
 * пересобирается при каждом запуске/возврате в приложение, поэтому горизонт
 * постоянно скользит и расписание никогда не устаревает.
 */

import { getPlugin, addPluginListener } from './capacitor.js';

/** Канал ежедневных сводок. */
export const CHANNEL_CHECKPOINT = 'lunar_checkpoint';
/** Канал лунного будильника. */
export const CHANNEL_ALARM = 'lunar_alarm';

/** Важность канала: 5 = IMPORTANCE_HIGH (звук + вибрация). */
const IMPORTANCE_HIGH = 5;
/** Видимость на экране блокировки: 1 = VISIBILITY_PUBLIC. */
const VISIBILITY_PUBLIC = 1;

/** Сколько дней вперёд планируются ежедневные чекпоинты. */
export const CHECKPOINT_HORIZON_DAYS = 30;
/** Сколько будущих срабатываний планируется для ежемесячного лунного будильника. */
export const ALARM_HORIZON_OCCURRENCES = 3;

/** Базовые идентификаторы уведомлений (Android: 32-битный int). */
const CHECKPOINT_ID_BASE = 100000;
const ALARM_ID_BASE = 200000;

/**
 * Возвращает нативный плагин LocalNotifications либо null.
 */
function getPluginInstance() {
  const plugin = getPlugin('LocalNotifications');
  if (!plugin || typeof plugin.schedule !== 'function') return null;
  return plugin;
}

/**
 * true, если локальные уведомления доступны в текущем окружении.
 */
export function isAvailable() {
  return Boolean(getPluginInstance());
}

/**
 * Запрашивает разрешение на показ уведомлений (Android 13+ и раньше).
 *
 * @returns {Promise<'granted'|'denied'|'prompt'|'unavailable'>}
 */
export async function requestPermission() {
  const plugin = getPluginInstance();
  if (!plugin || typeof plugin.requestPermissions !== 'function') return 'unavailable';
  try {
    const result = await plugin.requestPermissions();
    return (result && result.display) || 'prompt';
  } catch {
    return 'denied';
  }
}

/**
 * Создаёт каналы уведомлений (Android 8+). Без канала уведомление не придёт.
 */
export async function ensureChannels(labels = {}) {
  const plugin = getPluginInstance();
  if (!plugin || typeof plugin.createChannel !== 'function') return;

  const checkpointName = labels.checkpointChannelName || 'Ежедневные сводки ритма';
  const checkpointDescription =
    labels.checkpointChannelDescription || 'Краткая сводка лунного ритма на утро, день и вечер.';
  const alarmName = labels.alarmChannelName || 'Лунный будильник';
  const alarmDescription =
    labels.alarmChannelDescription || 'Напоминания, привязанные к лунным суткам или конкретной дате.';

  try {
    await plugin.createChannel({
      id: CHANNEL_CHECKPOINT,
      name: checkpointName,
      description: checkpointDescription,
      importance: IMPORTANCE_HIGH,
      visibility: VISIBILITY_PUBLIC,
      lights: true,
      lightColor: '#EAB32E',
      vibration: true,
      sound: 'default'
    });
  } catch {
    /* ignore */
  }

  try {
    await plugin.createChannel({
      id: CHANNEL_ALARM,
      name: alarmName,
      description: alarmDescription,
      importance: IMPORTANCE_HIGH,
      visibility: VISIBILITY_PUBLIC,
      lights: true,
      lightColor: '#E65100',
      vibration: true,
      sound: 'default'
    });
  } catch {
    /* ignore */
  }
}

/**
 * Отменяет ранее запланированные уведомления.
 *
 * Стратегия: сначала отменяются идентификаторы из сохранённого реестра,
 * затем — все реально ожидающие в AlarmManager (на случай рассинхронизации).
 */
export async function cancelAll(knownIds = []) {
  const plugin = getPluginInstance();
  if (!plugin || typeof plugin.cancel !== 'function') return;

  const ids = new Set();
  for (const id of knownIds) {
    if (Number.isFinite(id)) ids.add(id);
  }

  try {
    const pending = await plugin.getPending();
    const pendingList = pending && Array.isArray(pending.notifications) ? pending.notifications : [];
    for (const item of pendingList) {
      if (item && Number.isFinite(item.id)) ids.add(item.id);
    }
  } catch {
    /* ignore */
  }

  if (!ids.size) return;

  try {
    await plugin.cancel({
      notifications: Array.from(ids).map((id) => ({ id }))
    });
  } catch {
    /* ignore */
  }
}

/**
 * Планирует набор уведомлений.
 *
 * @param {Array<object>} notifications Описания в формате LocalNotificationSchema.
 * @returns {Promise<number[]>} Идентификаторы запланированных уведомлений.
 */
export async function schedule(notifications) {
  const plugin = getPluginInstance();
  if (!plugin || !Array.isArray(notifications) || !notifications.length) return [];

  const valid = notifications.filter(
    (item) =>
      item &&
      Number.isFinite(item.id) &&
      item.title &&
      item.schedule &&
      item.schedule.at instanceof Date &&
      !Number.isNaN(item.schedule.at.getTime())
  );
  if (!valid.length) return [];

  try {
    const result = await plugin.schedule({ notifications: valid });
    const scheduled = result && Array.isArray(result.notifications) ? result.notifications : [];
    return scheduled.map((item) => item.id).filter((id) => Number.isFinite(id));
  } catch {
    return [];
  }
}

/**
 * Подписка на нажатие по уведомлению в шторке.
 *
 * Payload нативного плагина: { actionId, notification } — где notification
 * содержит переданные при планировании поля, включая `extra`.
 *
 * @param {Function} callback Получает объект { id, title, body, extra }.
 * @returns {{ remove: () => Promise<void> }}
 */
export function onNotificationTapped(callback) {
  return addPluginListener('LocalNotifications', 'localNotificationActionPerformed', (payload) => {
    const notification = (payload && payload.notification) || {};
    const extra = notification.extra || {};
    callback({
      id: notification.id,
      title: notification.title || '',
      body: notification.body || '',
      extra
    });
  });
}

/**
 * Подписка на момент срабатывания уведомления (без нажатия).
 *
 * @param {Function} callback Получает объект { id, title, body, extra }.
 * @returns {{ remove: () => Promise<void> }}
 */
export function onNotificationReceived(callback) {
  return addPluginListener('LocalNotifications', 'localNotificationReceived', (notification) => {
    const schema = notification || {};
    callback({
      id: schema.id,
      title: schema.title || '',
      body: schema.body || '',
      extra: schema.extra || {}
    });
  });
}

/**
 * Возвращает список ожидающих (запланированных) уведомлений.
 *
 * @returns {Promise<Array<object>>}
 */
export async function getPending() {
  const plugin = getPluginInstance();
  if (!plugin || typeof plugin.getPending !== 'function') return [];
  try {
    const result = await plugin.getPending();
    return result && Array.isArray(result.notifications) ? result.notifications : [];
  } catch {
    return [];
  }
}

/**
 * Проверяет, разрешены ли точные alarm'ы (Android 12+).
 *
 * Без этого разрешения система переводит будильники в «неточный» режим и
 * время срабатывания может смещаться на десятки минут.
 *
 * @returns {Promise<'granted'|'denied'|'unknown'>}
 */
export async function checkExactAlarmPermission() {
  const plugin = getPluginInstance();
  if (!plugin || typeof plugin.checkExactNotificationSetting !== 'function') return 'unknown';
  try {
    const result = await plugin.checkExactNotificationSetting();
    return (result && result.exact_alarm) || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Открывает системный экран разрешения точных alarm'ов (Android 12+).
 *
 * @returns {Promise<'granted'|'denied'|'unknown'>}
 */
export async function requestExactAlarmPermission() {
  const plugin = getPluginInstance();
  if (!plugin || typeof plugin.changeExactNotificationSetting !== 'function') return 'unknown';
  try {
    const result = await plugin.changeExactNotificationSetting();
    return (result && result.exact_alarm) || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Идентификатор уведомления для ежедневного чекпоинта.
 * @param {number} slotIndex Индекс слота (0 — утро, 1 — день, 2 — вечер).
 * @param {number} dayOffset Смещение в днях от текущего.
 */
export function checkpointNotificationId(slotIndex, dayOffset) {
  return CHECKPOINT_ID_BASE + slotIndex * 1000 + dayOffset;
}

/**
 * Идентификатор уведомления для лунного будильника.
 * @param {number} reminderIndex Индекс напоминания в списке.
 * @param {number} occurrenceIndex Номер будущего срабатывания.
 */
export function alarmNotificationId(reminderIndex, occurrenceIndex) {
  return ALARM_ID_BASE + reminderIndex * 100 + occurrenceIndex;
}
