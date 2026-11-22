/**
 * Озвучка (TTS).
 * =========================================================================
 *
 * Основной движок — нативный плагин @capacitor-community/text-to-speech
 * (Android TextToSpeech API). Он выбран основным потому, что в Android
 * WebView стандартный `window.speechSynthesis` часто либо отсутствует,
 * либо не видит установленные голоса (особенно в старых версиях WebView).
 *
 * `window.speechSynthesis` остаётся запасным вариантом — он используется:
 *   - в обычном браузере (предпросмотр на ПК, отладка);
 *   - если нативный движок недоступен или не поддерживает язык словаря.
 *
 * Язык озвучки автоматически берётся из `meta.lang` активного словаря.
 */

import { getPlugin } from './capacitor.js';

/** Очередь общения с движком: Flush = 0 — новая речь прерывает предыдущую. */
const QUEUE_STRATEGY_FLUSH = 0;

/** Кэш успешных проверок поддержки языка: lang -> true. */
const languageSupportCache = new Map();

/** Текущий выполняющийся нативный вызов speak (для корректной отмены). */
let activeNativeSpeech = null;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Возвращает нативный плагин TextToSpeech либо null.
 */
function getTtsPlugin() {
  const plugin = getPlugin('TextToSpeech');
  if (!plugin || typeof plugin.speak !== 'function') return null;
  return plugin;
}

/**
 * true, если нативный движок озвучки доступен в текущем окружении.
 */
export function isNativeSpeechAvailable() {
  return Boolean(getTtsPlugin());
}

/**
 * Прогревает нативный движок озвучки: заранее проверяет доступность языка,
 * чтобы первое нажатие на кнопку «Озвучить» не ждало инициализации движка.
 *
 * @param {string} lang BCP-47 код языка, напр. 'ru-RU'.
 */
export async function warmUp(lang) {
  const tts = getTtsPlugin();
  if (!tts || typeof tts.isLanguageSupported !== 'function') return false;
  if (languageSupportCache.get(lang) === true) return true;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (await isLanguageSupported(lang)) return true;
    await delay(350);
  }
  return false;
}

/**
 * Проверяет поддержку языка нативным движком (с кэшем успешных ответов).
 *
 * @param {string} lang
 * @returns {Promise<boolean>}
 */
export async function isLanguageSupported(lang) {
  if (!lang) return false;
  if (languageSupportCache.get(lang) === true) return true;

  const tts = getTtsPlugin();
  if (!tts || typeof tts.isLanguageSupported !== 'function') return false;

  try {
    const result = await tts.isLanguageSupported({ lang });
    if (result && result.supported) {
      languageSupportCache.set(lang, true);
      return true;
    }
  } catch {
    /* движок ещё не инициализирован — считаем язык неподдерживаемым */
  }
  return false;
}

/**
 * Возвращает список доступных голосов: сначала нативные, затем web-голоса.
 * Формат унифицирован с `SpeechSynthesisVoice`.
 *
 * @returns {Promise<Array<object>>}
 */
export async function getVoicesList() {
  const voices = [];
  const seen = new Set();

  const tts = getTtsPlugin();
  if (tts && typeof tts.getSupportedVoices === 'function') {
    try {
      const result = await tts.getSupportedVoices();
      if (result && Array.isArray(result.voices)) {
        for (const voice of result.voices) {
          const key = `${voice.voiceURI}|${voice.lang}`;
          if (!seen.has(key)) {
            seen.add(key);
            voices.push(voice);
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  try {
    const webVoices = globalThis.window?.speechSynthesis?.getVoices?.() || [];
    for (const voice of webVoices) {
      const key = `${voice.voiceURI}|${voice.lang}`;
      if (!seen.has(key)) {
        seen.add(key);
        voices.push(voice);
      }
    }
  } catch {
    /* ignore */
  }

  return voices;
}

/**
 * Подбирает web-голос по языку и желаемому voiceURI.
 */
function resolveWebVoice(voices, langCode, preferredURI) {
  if (!voices.length) return null;

  const targetLang = (langCode || 'ru-RU').toLowerCase();
  const baseLang = targetLang.split('-')[0];

  if (preferredURI) {
    const chosen = voices.find((v) => v.voiceURI === preferredURI);
    if (chosen && (!langCode || (chosen.lang || '').toLowerCase().startsWith(baseLang))) {
      return chosen;
    }
  }

  return (
    voices.find((v) => (v.lang || '').toLowerCase() === targetLang) ||
    voices.find((v) => (v.lang || '').toLowerCase().startsWith(baseLang)) ||
    voices[0]
  );
}

/**
 * Озвучивает текст нативным движком.
 *
 * @returns {Promise<boolean>} true, если речь запущена нативно.
 */
async function speakViaNative(text, { lang, rate, pitch, voiceURI, onEnd, onError }) {
  const tts = getTtsPlugin();
  if (!tts) return false;

  let voiceIndex = -1;
  if (voiceURI && typeof tts.getSupportedVoices === 'function') {
    try {
      const result = await tts.getSupportedVoices();
      const voices = result && Array.isArray(result.voices) ? result.voices : [];
      const normalized = voiceURI.startsWith('native:') ? voiceURI.slice(7) : voiceURI;
      voiceIndex = voices.findIndex((v) => v.voiceURI === normalized);
    } catch {
      voiceIndex = -1;
    }
  }

  try {
    activeNativeSpeech = tts.speak({
      text,
      lang,
      rate,
      pitch,
      volume: 1.0,
      voice: voiceIndex,
      queueStrategy: QUEUE_STRATEGY_FLUSH
    });
  } catch {
    activeNativeSpeech = null;
    return false;
  }

  activeNativeSpeech.then(
    () => {
      activeNativeSpeech = null;
      if (typeof onEnd === 'function') onEnd();
    },
    (error) => {
      activeNativeSpeech = null;
      if (typeof onError === 'function') onError(error);
    }
  );

  return true;
}

/**
 * Озвучивает текст через window.speechSynthesis (запасной путь).
 *
 * @returns {Promise<boolean>} true, если речь запущена.
 */
async function speakViaWeb(text, { lang, rate, pitch, voiceURI, onEnd, onError }) {
  const synth = globalThis.window?.speechSynthesis;
  const UtteranceCtor = globalThis.window?.SpeechSynthesisUtterance;
  if (!synth || !UtteranceCtor) return false;

  try {
    synth.cancel();

    const voices = await getVoicesList();
    const voice = resolveWebVoice(voices, lang, voiceURI);

    const utterance = new UtteranceCtor(text);
    utterance.lang = voice?.lang || lang;
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onend = () => {
      if (typeof onEnd === 'function') onEnd();
    };
    utterance.onerror = (event) => {
      if (typeof onError === 'function') onError(event);
    };

    synth.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

/**
 * Озвучивает текст.
 *
 * Порядок: нативный движок → (при неудаче) window.speechSynthesis.
 *
 * @param {string} text Текст для озвучки.
 * @param {object} [options]
 * @param {string} [options.lang] BCP-47 код языка (обычно meta.lang словаря).
 * @param {number} [options.rate=1.0] Скорость речи.
 * @param {number} [options.pitch=1.0] Высота тона.
 * @param {string} [options.voiceURI] Предпочтительный голос.
 * @param {Function} [options.onEnd] Вызывается после завершения речи.
 * @param {Function} [options.onError] Вызывается при ошибке озвучки.
 * @returns {Promise<{ok: boolean, engine: 'native'|'web'|'none'}>}
 */
export async function speak(text, options = {}) {
  const cleanText = String(text || '').trim();
  if (!cleanText) return { ok: false, engine: 'none' };

  const {
    lang = 'ru-RU',
    rate = 1.0,
    pitch = 1.0,
    voiceURI = '',
    onEnd,
    onError
  } = options;

  const nativeAvailable = isNativeSpeechAvailable();

  if (nativeAvailable) {
    const supported = await isLanguageSupported(lang);
    if (supported) {
      const started = await speakViaNative(cleanText, {
        lang,
        rate,
        pitch,
        voiceURI,
        onEnd,
        onError
      });
      if (started) return { ok: true, engine: 'native' };
    }
  }

  const started = await speakViaWeb(cleanText, {
    lang,
    rate,
    pitch,
    voiceURI,
    onEnd,
    onError
  });
  return started ? { ok: true, engine: 'web' } : { ok: false, engine: 'none' };
}

/**
 * Останавливает текущую озвучку (нативную и web одновременно).
 */
export async function stop() {
  const tts = getTtsPlugin();
  if (tts && typeof tts.stop === 'function') {
    try {
      await tts.stop();
    } catch {
      /* ignore */
    }
  }
  activeNativeSpeech = null;

  try {
    globalThis.window?.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}
