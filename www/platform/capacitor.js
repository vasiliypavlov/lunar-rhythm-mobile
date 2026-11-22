/**
 * Тонкий адаптер над нативным мостом Capacitor.
 * =========================================================================
 *
 * В Android WebView Capacitor автоматически внедряет `window.Capacitor`
 * (native-bridge.js) и генерирует JS-обёртки всех нативных плагинов в
 * `window.Capacitor.Plugins`. Благодаря этому плагины доступны напрямую,
 * без сборщика и без bare-specifier импортов:
 *
 *   Capacitor.Plugins.Preferences.get({ key: 'x' })
 *   Capacitor.Plugins.LocalNotifications.schedule({ notifications: [...] })
 *   Capacitor.Plugins.TextToSpeech.speak({ text, lang, rate })
 *
 * В обычном браузере (предпросмотр на ПК) нативного моста нет — все вызовы
 * деградируют в безопасные no-op / fallback-реализации, чтобы приложение
 * оставалось работоспособным и в браузере.
 */

const globalScope =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
    ? window
    : {};

/**
 * Возвращает глобальный объект Capacitor либо null, если приложение
 * запущено вне нативного контейнера.
 */
export function getCapacitor() {
  return globalScope.Capacitor || null;
}

/**
 * true, если код выполняется внутри нативного контейнера Capacitor.
 */
export function isNativePlatform() {
  const cap = getCapacitor();
  return Boolean(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
}

/**
 * Идентификатор платформы: 'android' | 'ios' | 'web'.
 */
export function getPlatform() {
  const cap = getCapacitor();
  if (cap && typeof cap.getPlatform === 'function') {
    try {
      return cap.getPlatform();
    } catch {
      /* ignore */
    }
  }
  return 'web';
}

/**
 * Возвращает JS-обёртку нативного плагина по имени либо null.
 *
 * Важно: обёртка генерируется нативным рантаймом только для плагинов,
 * реально скомпилированных в APK. Поэтому проверка наличия — это проверка
 * того, что плагин доступен, а не проверка typeof.
 */
export function getPlugin(name) {
  const cap = getCapacitor();
  if (!cap || !cap.Plugins) return null;
  try {
    return cap.Plugins[name] || null;
  } catch {
    return null;
  }
}

/**
 * true, если нативный плагин доступен в текущем окружении.
 */
export function hasPlugin(name) {
  return Boolean(getPlugin(name));
}

/**
 * Подписка на событие нативного плагина.
 *
 * Capacitor генерирует для каждого плагина метод `addListener`, который
 * возвращает хендл с методом `remove()`. Если плагина нет — возвращается
 * безопасный no-op хендл, чтобы вызывающий код не нуждался в проверках.
 *
 * @param {string} pluginName Имя плагина, напр. 'LocalNotifications'.
 * @param {string} eventName Имя события.
 * @param {Function} callback Обработчик события.
 * @returns {{ remove: () => Promise<void> }}
 */
export function addPluginListener(pluginName, eventName, callback) {
  const plugin = getPlugin(pluginName);
  if (!plugin || typeof plugin.addListener !== 'function') {
    return { remove: async () => {} };
  }
  try {
    const handle = plugin.addListener(eventName, callback);
    return {
      remove: async () => {
        try {
          if (handle && typeof handle.remove === 'function') {
            await handle.remove();
          }
        } catch {
          /* ignore */
        }
      }
    };
  } catch {
    return { remove: async () => {} };
  }
}
