import {
  BUILTIN_DICTIONARIES,
  detectDefaultLang,
  getBuiltinDictionary,
  deepMergeDictionary
} from './dictionary_default.js';
import {
  PHASE_COLORS,
  formatHM,
  getCalendarDayLunarSummary,
  getMoonPhaseInfo,
  getTimeSlot,
  computePersonalState,
  computeRawDiagnosticData,
  findNextDateForLunarDay,
  parseBirthDateString
} from './astro_engine.js';
import * as storage from './platform/storage.js';
import * as speech from './platform/speech.js';
import * as notifications from './platform/notifications.js';
import { addPluginListener, isNativePlatform } from './platform/capacitor.js';

const ACTIVE_ALARM_BADGE_COLOR = '#E65100';

const DEFAULT_PERSISTED_STATE = {
  birthDate: null,
  birthTime: null,
  builtinLang: null,
  dictionaryMode: 'default',
  customDictionary: null,
  reminders: [],
  notifications: {
    morningEnabled: true,
    dayEnabled: true,
    eveningEnabled: true,
    alarmPushEnabled: true,
    morning: '08:30',
    day: '13:30',
    evening: '20:30'
  },
  selectedVoiceURI: '',
  pendingAutoplay: null,
  activeAlarm: null,
  scheduledNotificationIds: []
};

const stateStore = {
  async loadState() {
    const data = await storage.readState();
    return mergePersistedDefaults(data);
  },
  async saveState(patch) {
    appState = { ...appState, ...patch };
    await storage.writeState(appState);
    return appState;
  }
};

function mergePersistedDefaults(data) {
  const rawNotifs = (data && data.notifications) || {};
  const legacyCheckpoints =
    typeof rawNotifs.checkpointsEnabled === 'boolean'
      ? rawNotifs.checkpointsEnabled
      : typeof rawNotifs.enabled === 'boolean'
      ? rawNotifs.enabled
      : true;

  const morningEnabled =
    typeof rawNotifs.morningEnabled === 'boolean'
      ? rawNotifs.morningEnabled
      : legacyCheckpoints;
  const dayEnabled =
    typeof rawNotifs.dayEnabled === 'boolean'
      ? rawNotifs.dayEnabled
      : legacyCheckpoints;
  const eveningEnabled =
    typeof rawNotifs.eveningEnabled === 'boolean'
      ? rawNotifs.eveningEnabled
      : legacyCheckpoints;
  const alarmPushEnabled =
    typeof rawNotifs.alarmPushEnabled === 'boolean'
      ? rawNotifs.alarmPushEnabled
      : DEFAULT_PERSISTED_STATE.notifications.alarmPushEnabled;

  const builtinLang = BUILTIN_DICTIONARIES[data && data.builtinLang]
    ? data.builtinLang
    : detectDefaultLang();

  return {
    ...DEFAULT_PERSISTED_STATE,
    ...(data || {}),
    builtinLang,
    notifications: {
      ...DEFAULT_PERSISTED_STATE.notifications,
      ...rawNotifs,
      morningEnabled,
      dayEnabled,
      eveningEnabled,
      alarmPushEnabled
    },
    reminders: Array.isArray(data && data.reminders) ? data.reminders : [],
    activeAlarm: (data && data.activeAlarm) || null,
    scheduledNotificationIds: Array.isArray(data && data.scheduledNotificationIds)
      ? data.scheduledNotificationIds.filter((id) => Number.isFinite(id))
      : []
  };
}

let appState = structuredClone(DEFAULT_PERSISTED_STATE);
let selectedDate = startOfDay(new Date());
let activeTab = 'today';
let reminderFormMode = 'lunar';
let dayNoteTargetDate = null;
let copyPromptResetTimer = null;
let copyRawResetTimer = null;

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatHumanDate(d, lang = 'ru-RU') {
  return d.toLocaleDateString(lang || 'ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function formatShortDate(d, lang = 'ru-RU') {
  return d.toLocaleDateString(lang || 'ru-RU', {
    day: 'numeric',
    month: 'short'
  }).replace('.', '');
}

function toEnglishOrdinal(n) {
  const num = Number(n);
  const mod100 = num % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${num}th`;
  switch (num % 10) {
    case 1: return `${num}st`;
    case 2: return `${num}nd`;
    case 3: return `${num}rd`;
    default: return `${num}th`;
  }
}

function getActiveBaseDictionary() {
  return getBuiltinDictionary(appState.builtinLang);
}

function getActiveDictionary() {
  const baseDict = getActiveBaseDictionary();
  if (appState.dictionaryMode === 'custom' && appState.customDictionary) {
    return deepMergeDictionary(baseDict, appState.customDictionary);
  }
  return baseDict;
}

function getLocalizedZodiacSign(dict, canonicalSign) {
  return dict.zodiac_names?.[canonicalSign] || canonicalSign;
}

function renderMoonCanvas(canvas, phaseInfo) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.43;

  const imgData = ctx.createImageData(w, h);
  const data = imgData.data;

  const litR = 234;
  const litG = 179;
  const litB = 46;

  const elongRad = (phaseInfo.elong * Math.PI) / 180;
  const sx = Math.sin(elongRad);
  const sz = -Math.cos(elongRad);

  const softWidth = 0.22;
  const halfSoft = softWidth * 0.5;
  const aaWidth = 1.4 / R;

  for (let py = 0; py < h; py++) {
    const ny = (py - cy) / R;
    const ny2 = ny * ny;
    for (let px = 0; px < w; px++) {
      const nx = (px - cx) / R;
      const r2 = nx * nx + ny2;
      const r = Math.sqrt(r2);

      if (r > 1 + aaWidth) continue;

      const edgeAlpha = r <= 1 - aaWidth ? 1 : Math.max(0, Math.min(1, (1 + aaWidth - r) / (2 * aaWidth)));
      const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, r2)));
      const dot = nx * sx + nz * sz;

      const t = Math.max(0, Math.min(1, (dot + halfSoft) / softWidth));
      const litMask = t * t * (3 - 2 * t);

      let rimAlpha = 0;
      if (phaseInfo.illumination < 0.08) {
        const rimStrength = (0.08 - phaseInfo.illumination) / 0.08;
        const rimBand = Math.max(0.03, 1.4 / R);
        const distFromEdge = Math.abs(r - (1 - rimBand * 0.5));
        if (distFromEdge < rimBand) {
          rimAlpha = 0.10 * rimStrength * (1 - distFromEdge / rimBand);
        }
      }

      const finalAlpha = Math.max(litMask * edgeAlpha, rimAlpha * edgeAlpha);
      if (finalAlpha <= 0.002) continue;

      const idx = (py * w + px) * 4;
      const useRim = rimAlpha > litMask;
      data[idx] = useRim ? 255 : litR;
      data[idx + 1] = useRim ? 255 : litG;
      data[idx + 2] = useRim ? 255 : litB;
      data[idx + 3] = Math.round(finalAlpha * 255);
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

function createMiniMoonCanvas(phaseInfo) {
  const canvas = document.createElement('canvas');
  canvas.className = 'tl-moon-canvas';
  canvas.width = 32;
  canvas.height = 32;
  canvas.setAttribute('aria-hidden', 'true');
  renderMoonCanvas(canvas, phaseInfo);
  return canvas;
}

function playNavigationChime() {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        resolve();
        return;
      }
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const freqs = [523.25, 659.25];
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.001, now);
      master.gain.exponentialRampToValueAtTime(0.14, now + 0.03);
      master.gain.exponentialRampToValueAtTime(0.0008, now + 0.40);
      master.connect(ctx.destination);

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        osc.connect(master);
        osc.start(now + idx * 0.07);
        osc.stop(now + 0.42);
      });

      setTimeout(() => {
        ctx.close().catch(() => {});
        resolve();
      }, 420);
    } catch {
      resolve();
    }
  });
}

function getVoicesList() {
  return speech.getVoicesList();
}

async function speakText(text, customPrefix = '') {
  const dict = getActiveDictionary();
  const lang = dict.meta?.lang || 'ru-RU';
  let fullText = [customPrefix, text].filter(Boolean).join(' ').trim();
  if (!fullText) return;

  if (lang.toLowerCase().startsWith('ru')) {
    fullText = fullText.replace(/\b([1-9]|[12]\d|30)\s+лунные\s+сутки\b/gi, (_, numStr) => {
      const n = Number(numStr);
      return RU_ORDINAL_PLURAL_1_TO_30[n]
        ? `${RU_ORDINAL_PLURAL_1_TO_30[n]} лунные сутки`
        : `${numStr} лунные сутки`;
    });
  }

  const stopBtn = document.getElementById('btn-stop-speech');
  stopBtn.classList.remove('hidden');

  await playNavigationChime();

  const hideStop = () => stopBtn.classList.add('hidden');

  const result = await speech.speak(fullText, {
    lang,
    rate: 1.0,
    pitch: 1.0,
    voiceURI: appState.selectedVoiceURI || '',
    onEnd: hideStop,
    onError: hideStop
  });

  if (!result.ok) {
    hideStop();
  }
}

const RU_ORDINAL_PLURAL_1_TO_30 = {
  1: 'первые',
  2: 'вторые',
  3: 'третьи',
  4: 'четвёртые',
  5: 'пятые',
  6: 'шестые',
  7: 'седьмые',
  8: 'восьмые',
  9: 'девятые',
  10: 'десятые',
  11: 'одиннадцатые',
  12: 'двенадцатые',
  13: 'тринадцатые',
  14: 'четырнадцатые',
  15: 'пятнадцатые',
  16: 'шестнадцатые',
  17: 'семнадцатые',
  18: 'восемнадцатые',
  19: 'девятнадцатые',
  20: 'двадцатые',
  21: 'двадцать первые',
  22: 'двадцать вторые',
  23: 'двадцать третьи',
  24: 'двадцать четвёртые',
  25: 'двадцать пятые',
  26: 'двадцать шестые',
  27: 'двадцать седьмые',
  28: 'двадцать восьмые',
  29: 'двадцать девятые',
  30: 'тридцатые'
};

function formatLunarDayForSpeech(dayNumber, lang, lunarDayFullLabel) {
  const baseLang = (lang || 'en').toLowerCase().split(/[-_]/)[0];
  if (baseLang === 'ru' && RU_ORDINAL_PLURAL_1_TO_30[dayNumber]) {
    return `${RU_ORDINAL_PLURAL_1_TO_30[dayNumber]} ${lunarDayFullLabel}`;
  }
  if (baseLang === 'en') {
    return `${toEnglishOrdinal(dayNumber)} ${lunarDayFullLabel}`;
  }
  return `${dayNumber} ${lunarDayFullLabel}`;
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function uncapitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function stripTrailingDot(str) {
  return String(str || '').replace(/[.!?\s]+$/g, '').trim();
}

function getFirstSentence(str) {
  const clean = String(str || '').trim();
  if (!clean) return '';
  const match = clean.match(/^[^.!?]+[.!?]?/);
  return match ? stripTrailingDot(match[0]) : stripTrailingDot(clean);
}

const PASSIVE_PHASES = new Set(['phase_minimum', 'phase_decline']);
const ACTIVE_ZODIAC_SIGNS = new Set(['Овен', 'Близнецы', 'Лев', 'Стрелец', 'Водолей']);
const ACTIVE_LUNAR_DAYS = new Set([3, 7, 8, 10, 11, 14, 17, 20, 21]);
const RESTRAINED_LUNAR_DAYS = new Set([9, 15, 19, 23, 25, 26, 29, 30]);

function getLunarDayPolarity(dayNum) {
  const n = Number(dayNum);
  if (ACTIVE_LUNAR_DAYS.has(n)) return 'active';
  if (RESTRAINED_LUNAR_DAYS.has(n)) return 'restrained';
  return 'neutral';
}

function getPersonalPacingPolarity(phaseKey) {
  return PASSIVE_PHASES.has(phaseKey) ? 'passive' : 'active';
}

function buildBackdropContrastSentence(baseLang, { isPersonal, phaseKey, activeLunarDay }) {
  if (!isPersonal) return '';
  const lunarPolarity = getLunarDayPolarity(activeLunarDay);
  if (lunarPolarity === 'neutral') return '';
  const personalPolarity = getPersonalPacingPolarity(phaseKey);

  if (personalPolarity === 'passive' && lunarPolarity === 'active') {
    const isMinimum = phaseKey === 'phase_minimum';
    switch (baseLang) {
      case 'ru': {
        const modeDesc = isMinimum ? 'отдых и восстановление сил' : 'спокойный ритм и экономия сил';
        return `Но нужно учитывать, что ваш личный режим сейчас — ${modeDesc}. Внешний импульс стоит направить на закрытие текущих дел и воздержаться от новых стартов.`;
      }
      case 'es': {
        const modeDesc = isMinimum ? 'descanso y recuperación de fuerzas' : 'ritmo tranquilo y ahorro de energía';
        return `Pero conviene tener en cuenta que tu modo personal es de ${modeDesc}. Dirige el impulso externo a cerrar tareas en curso y abstente de nuevos inicios.`;
      }
      case 'de': {
        const modeDesc = isMinimum ? 'Ruhe und Kräfteerholung' : 'ruhiges Tempo und Kräfteschonung';
        return `Berücksichtigen Sie jedoch, dass Ihr persönlicher Modus auf ${modeDesc} steht. Nutzen Sie den äußeren Impuls für den Abschluss laufender Aufgaben und verzichten Sie auf Neustarts.`;
      }
      case 'fr': {
        const modeDesc = isMinimum ? 'repos et récupération des forces' : 'rythme calme et économie d’énergie';
        return `Mais gardez à l’esprit que votre mode personnel est au ${modeDesc}. Orientez l’élan extérieur vers la clôture des dossiers en cours et abstenez-vous de nouveaux départs.`;
      }
      default: {
        const modeDesc = isMinimum ? 'rest and energy recovery' : 'steady pacing and conserving energy';
        return `Still, factor in that your personal mode is ${modeDesc}. Direct the outward momentum into finishing ongoing work and refrain from new launches.`;
      }
    }
  }

  if (personalPolarity === 'active' && lunarPolarity === 'restrained') {
    switch (baseLang) {
      case 'ru': return 'Личного ресурса достаточно, но внешний календарный фон предупреждает о лишних рисках — действуйте расчётливо, перепроверяйте условия и не форсируйте события.';
      case 'es': return 'Tu energía personal es alta, pero el contexto del calendario advierte fricción extra — actúa con cálculo, revisa las condiciones y evita forzar resultados.';
      case 'de': return 'Ihre persönliche Energie ist hoch, doch der Kalender-Hintergrund mahnt zur Vorsicht — handeln Sie überlegt, prüfen Sie Details nach und erzwingen Sie nichts.';
      case 'fr': return 'Votre énergie personnelle est élevée, mais le contexte du calendrier invite à la prudence — agissez avec méthode, vérifiez les détails et ne forcez rien.';
      default: return 'Your personal energy is high, yet the calendar backdrop signals extra friction — act deliberately, double-check terms, and avoid forcing outcomes.';
    }
  }

  if (personalPolarity === 'passive' && lunarPolarity === 'restrained') {
    switch (baseLang) {
      case 'ru': return 'И личный темп, и внешний фон единодушны: день лучше провести в спокойном темпе, без перегрузок и спорных решений.';
      case 'es': return 'Tanto tu ritmo personal como el entorno coinciden: conviene llevar el día con calma, sin sobrecargas ni decisiones arriesgadas.';
      case 'de': return 'Sowohl Ihr persönliches Tempo als auch das äußere Umfeld raten zu Zurückhaltung — ohne Überlastung und riskante Schritte.';
      case 'fr': return 'Votre rythme personnel et le contexte ambiant convergent : gardez une journée douce, sans surcharge ni décision risquée.';
      default: return 'Both your personal pacing and the external backdrop agree: keep the day gentle, without overload or risky decisions.';
    }
  }

  switch (baseLang) {
    case 'ru': return 'И ваш ресурс, и внешняя среда поддерживают движение вперёд — удобное окно для ответственных шагов.';
    case 'es': return 'Tanto tu recurso como el entorno respaldan el avance — una ventana bien alineada para pasos firmes.';
    case 'de': return 'Sowohl Ihre Ressource als auch der Kalender-Hintergrund stützen Fortschritte — ein stimmiges Zeitfenster für klare Schritte.';
    case 'fr': return 'Votre ressource et le contexte ambiant soutiennent tous deux l’élan — un créneau bien aligné pour avancer.';
    default: return 'Both your personal capacity and the external backdrop support forward motion — a well-aligned window for decisive steps.';
  }
}

function formatCalendarBackdropText(baseLang, { isPersonal, phaseKey, activeLunarDay, backdropLead, lunarNoteSentence, contrastSentence }) {
  const lunarPolarity = getLunarDayPolarity(activeLunarDay);
  const personalPolarity = isPersonal ? getPersonalPacingPolarity(phaseKey) : 'neutral';

  if (isPersonal && personalPolarity === 'passive' && lunarPolarity === 'active' && lunarNoteSentence) {
    const cleanQuote = stripTrailingDot(lunarNoteSentence);
    switch (baseLang) {
      case 'ru':
        return `${backdropLead} Для внешней деловой среды это: «${cleanQuote}». ${contrastSentence}`;
      case 'es':
        return `${backdropLead} Para el entorno laboral externo es: «${cleanQuote}». ${contrastSentence}`;
      case 'de':
        return `${backdropLead} Für das äußere Arbeitsumfeld gilt: „${cleanQuote}“. ${contrastSentence}`;
      case 'fr':
        return `${backdropLead} Pour l’environnement extérieur, c’est : « ${cleanQuote} ». ${contrastSentence}`;
      default:
        return `${backdropLead} For the external business environment, this marks: "${cleanQuote}." ${contrastSentence}`;
    }
  }

  return [backdropLead, lunarNoteSentence, contrastSentence].filter(Boolean).join(' ');
}

function buildLunarBackdropSpeechLine(baseLang, { lunarDaySpeech, lunarDayNote, phaseKey, activeLunarDay, bgAdvice, contrastSentence }) {
  const lunarPolarity = getLunarDayPolarity(activeLunarDay);
  const personalPolarity = getPersonalPacingPolarity(phaseKey);
  const isConflict = personalPolarity === 'passive' && lunarPolarity === 'active';

  if (isConflict) {
    const firstDesc = uncapitalizeFirst(getFirstSentence(lunarDayNote));
    const isMinimum = phaseKey === 'phase_minimum';
    let mainLine = '';
    switch (baseLang) {
      case 'ru': {
        const modeDesc = isMinimum ? 'отдых и восстановление сил' : 'спокойный ритм и экономия сил';
        mainLine = `На внешнем календарном фоне сейчас ${lunarDaySpeech}${firstDesc ? ` — для общей среды это ${firstDesc}` : ''}, но нужно учитывать, что ваш личный режим сейчас — ${modeDesc}. Внешний импульс стоит направить на закрытие текущих дел и воздержаться от новых стартов.`;
        if (bgAdvice) mainLine += ` На длинной дистанции сегодня ощущается точный пик: ${uncapitalizeFirst(bgAdvice)}.`;
        return { isConflict: true, line: mainLine };
      }
      case 'es': {
        const modeDesc = isMinimum ? 'descanso y recuperación de fuerzas' : 'ritmo tranquilo y ahorro de energía';
        mainLine = `En el contexto externo del calendario transcurre el ${lunarDaySpeech}${firstDesc ? ` — para el entorno general es ${firstDesc}` : ''}, pero conviene tener en cuenta que tu modo personal es de ${modeDesc}. Dirige el impulso externo a cerrar tareas en curso y abstente de nuevos inicios.`;
        if (bgAdvice) mainLine += ` Además hay un pico exacto de fondo: ${uncapitalizeFirst(bgAdvice)}.`;
        return { isConflict: true, line: mainLine };
      }
      case 'de': {
        const modeDesc = isMinimum ? 'Ruhe und Kräfteerholung' : 'ruhiges Tempo und Kräfteschonung';
        mainLine = `Im äußeren Kalender-Hintergrund läuft der ${lunarDaySpeech}${firstDesc ? ` — für das allgemeine Umfeld gilt: ${firstDesc}` : ''}, doch berücksichtigen Sie, dass Ihr persönlicher Modus auf ${modeDesc} steht. Nutzen Sie den äußeren Impuls für laufende Abschlüsse und verzichten Sie auf Neustarts.`;
        if (bgAdvice) mainLine += ` Zugleich gibt es einen exakten Hintergrund-Höhepunkt: ${bgAdvice}.`;
        return { isConflict: true, line: mainLine };
      }
      case 'fr': {
        const modeDesc = isMinimum ? 'repos et récupération des forces' : 'rythme calme et économie d’énergie';
        mainLine = `Dans le contexte extérieur du calendrier, c’est le ${lunarDaySpeech}${firstDesc ? ` — pour l’ambiance générale, c’est ${firstDesc}` : ''}, mais gardez à l’esprit que votre mode personnel est au ${modeDesc}. Orientez l’élan extérieur vers la clôture des dossiers en cours et abstenez-vous de nouveaux départs.`;
        if (bgAdvice) mainLine += ` Un pic exact de fond s’y ajoute : ${uncapitalizeFirst(bgAdvice)}.`;
        return { isConflict: true, line: mainLine };
      }
      default: {
        const modeDesc = isMinimum ? 'rest and energy recovery' : 'steady pacing and conserving energy';
        mainLine = `In the external calendar backdrop, today is the ${lunarDaySpeech}${firstDesc ? ` — for the general environment that means ${firstDesc}` : ''}, yet factor in that your personal mode is ${modeDesc}. Channel outward momentum into closing ongoing items and refrain from new launches.`;
        if (bgAdvice) mainLine += ` Alongside an exact background peak: ${uncapitalizeFirst(bgAdvice)}.`;
        return { isConflict: true, line: mainLine };
      }
    }
  }

  let line = '';
  if (bgAdvice) {
    switch (baseLang) {
      case 'ru': line = `${stripTrailingDot(lunarDayNote)}, а на длинной дистанции сегодня ощущается точный пик: ${uncapitalizeFirst(bgAdvice)}.`; break;
      case 'es': line = `${stripTrailingDot(lunarDayNote)}, con un pico exacto de fondo: ${uncapitalizeFirst(bgAdvice)}.`; break;
      case 'de': line = `${stripTrailingDot(lunarDayNote)}, begleitet von einem exakten Hintergrund-Höhepunkt: ${bgAdvice}.`; break;
      case 'fr': line = `${stripTrailingDot(lunarDayNote)}, avec un pic exact de fond : ${uncapitalizeFirst(bgAdvice)}.`; break;
      default: line = `${stripTrailingDot(lunarDayNote)}, alongside an exact background peak: ${uncapitalizeFirst(bgAdvice)}.`; break;
    }
  } else if (lunarDayNote) {
    line = lunarDayNote;
  }

  return {
    isConflict: false,
    line: [line, contrastSentence].filter(Boolean).join(' ')
  };
}

function formatLunarDayBackdropLead(baseLang, ctx) {
  const {
    activeLunarDay,
    lunarDayFullLabel,
    firstDay,
    secondDay,
    activeIndex,
    transitionTimeStr,
    moonLoc
  } = ctx;

  const hasTransition = firstDay !== secondDay && transitionTimeStr;
  const isAlreadySwitched = hasTransition && activeIndex === 1;
  const isBeforeSwitch = hasTransition && activeIndex === 0;

  switch (baseLang) {
    case 'ru': {
      const dayStr = `${getRuOrdinalNumeric(activeLunarDay)} ${lunarDayFullLabel}`;
      if (isAlreadySwitched) {
        return `С ${transitionTimeStr} идут ${dayStr}, ${moonLoc}.`;
      }
      if (isBeforeSwitch) {
        return `До ${transitionTimeStr} идут ${dayStr} (далее ${getRuOrdinalNumeric(secondDay)}), ${moonLoc}.`;
      }
      return `Идут ${dayStr}, ${moonLoc}.`;
    }
    case 'es': {
      const dayStr = `${activeLunarDay}.º ${lunarDayFullLabel}`;
      if (isAlreadySwitched) {
        return `Desde las ${transitionTimeStr} transcurre el ${dayStr}, ${moonLoc}.`;
      }
      if (isBeforeSwitch) {
        return `Hasta las ${transitionTimeStr} transcurre el ${dayStr} (después el ${secondDay}.º), ${moonLoc}.`;
      }
      return `Transcurre el ${dayStr}, ${moonLoc}.`;
    }
    case 'de': {
      const dayStr = `${activeLunarDay}. ${lunarDayFullLabel}`;
      if (isAlreadySwitched) {
        return `Seit ${transitionTimeStr} läuft der ${dayStr}, ${moonLoc}.`;
      }
      if (isBeforeSwitch) {
        return `Bis ${transitionTimeStr} läuft der ${dayStr} (danach der ${secondDay}.), ${moonLoc}.`;
      }
      return `Es läuft der ${dayStr}, ${moonLoc}.`;
    }
    case 'fr': {
      const dayStr = `${activeLunarDay}e ${lunarDayFullLabel}`;
      if (isAlreadySwitched) {
        return `Depuis ${transitionTimeStr}, nous sommes au ${dayStr}, ${moonLoc}.`;
      }
      if (isBeforeSwitch) {
        return `Jusqu'à ${transitionTimeStr}, nous sommes au ${dayStr} (puis le ${secondDay}e), ${moonLoc}.`;
      }
      return `Nous sommes au ${dayStr}, ${moonLoc}.`;
    }
    default: {
      const dayStr = `${toEnglishOrdinal(activeLunarDay)} ${lunarDayFullLabel}`;
      if (isAlreadySwitched) {
        return `Since ${transitionTimeStr}, it is the ${dayStr}, ${moonLoc}.`;
      }
      if (isBeforeSwitch) {
        return `Until ${transitionTimeStr}, it is the ${dayStr} (then the ${toEnglishOrdinal(secondDay)}), ${moonLoc}.`;
      }
      return `It is the ${dayStr}, ${moonLoc}.`;
    }
  }
}

function formatWeeklyBackgroundLead(baseLang, labels, bgDetail, edgeDetail) {
  const needsCautionBridge =
    bgDetail?.valence === 'warning' &&
    edgeDetail?.valence &&
    edgeDetail.valence !== 'warning';

  if (needsCautionBridge) {
    switch (baseLang) {
      case 'ru':
        return bgDetail.isExact
          ? `При этом учитывайте фон недели (${labels.card_exact_peak_badge})`
          : 'При этом учитывайте фон недели';
      case 'es':
        return bgDetail.isExact
          ? `Ten en cuenta también el contexto semanal (${labels.card_exact_peak_badge})`
          : 'Ten en cuenta también el contexto semanal';
      case 'de':
        return bgDetail.isExact
          ? `Beachten Sie dabei den Wochenhintergrund (${labels.card_exact_peak_badge})`
          : 'Beachten Sie dabei den Wochenhintergrund';
      case 'fr':
        return bgDetail.isExact
          ? `Tenez toutefois compte du fond de semaine (${labels.card_exact_peak_badge})`
          : 'Tenez toutefois compte du fond de semaine';
      default:
        return bgDetail.isExact
          ? `Meanwhile, factor in the weekly backdrop (${labels.card_exact_peak_badge})`
          : 'Meanwhile, factor in the weekly backdrop';
    }
  }

  return bgDetail.isExact
    ? `${labels.card_weekly_bg} (${labels.card_exact_peak_badge})`
    : labels.card_weekly_bg;
}

function buildEveningWrapLine(baseLang, { isPersonal, phaseKey, activeLunarDay, lunarDayFullLabel }) {
  const isCalmClosing = !isPersonal || PASSIVE_PHASES.has(phaseKey) || getLunarDayPolarity(activeLunarDay) === 'restrained';
  switch (baseLang) {
    case 'ru': {
      const dayLabel = `${getRuOrdinalNumeric(activeLunarDay)} ${lunarDayFullLabel}`;
      return isCalmClosing
        ? `Спокойно завершите ${dayLabel}: закройте открытые бытовые или рабочие мелочи и перейдите к восстановлению без вечерних переговоров и новых стартов.`
        : `Подведите спокойный итог (${dayLabel}): зафиксируйте сделанное за день и плавно закройте рабочий контур перед сном.`;
    }
    case 'es': {
      const dayLabel = `${activeLunarDay}.º ${lunarDayFullLabel}`;
      return isCalmClosing
        ? `Cierra con calma el ${dayLabel}: concluye pequeños pendientes y pasa al descanso sin negociaciones tardías ni nuevos inicios.`
        : `Haz un cierre tranquilo (${dayLabel}): registra lo avanzado hoy y desconecta gradualmente del ritmo laboral antes de dormir.`;
    }
    case 'de': {
      const dayLabel = `${activeLunarDay}. ${lunarDayFullLabel}`;
      return isCalmClosing
        ? `Schließen Sie den ${dayLabel} ruhig ab: erledigen Sie kleine offene Punkte und wechseln Sie ohne späte Verhandlungen oder Neustarts in die Erholung.`
        : `Ziehen Sie ein ruhiges Tagesfazit (${dayLabel}): halten Sie Ergebnisse fest und beenden Sie den Arbeitsmodus rechtzeitig vor dem Schlaf.`;
    }
    case 'fr': {
      const dayLabel = `${activeLunarDay}e ${lunarDayFullLabel}`;
      return isCalmClosing
        ? `Terminez calmement le ${dayLabel} : bouclez les derniers détails et passez au repos sans négociations tardives ni nouveaux lancements.`
        : `Faites un bilan apaisé (${dayLabel}) : notez l'essentiel accompli aujourd'hui et quittez le mode actif avant le sommeil.`;
    }
    default: {
      const dayLabel = `${toEnglishOrdinal(activeLunarDay)} ${lunarDayFullLabel}`;
      return isCalmClosing
        ? `Wind down the ${dayLabel} gently: close small open items and shift into recovery without late negotiations or new launches.`
        : `Wrap up the ${dayLabel} calmly: capture today's progress and step cleanly out of work mode before sleep.`;
    }
  }
}

function isActiveSignalEdge(edge) {
  if (!edge) return false;
  return (
    edge.transit === 'Mars' ||
    edge.natal === 'Mars' ||
    edge.actorKey === 'actor_mars' ||
    edge.aspectKey === 'edge_conjunction' ||
    edge.aspectKey === 'edge_sextile'
  );
}

function buildHarmonyBridge(personal, sign, dailyFocusEdge, dict = getActiveDictionary()) {
  if (!personal || !PASSIVE_PHASES.has(personal.phaseKey)) return '';
  const hasActiveSign = ACTIVE_ZODIAC_SIGNS.has(sign);
  const hasActiveAspect = isActiveSignalEdge(dailyFocusEdge);
  if (!hasActiveSign && !hasActiveAspect) return '';

  const labels = getUILabels(dict);
  if (personal.phaseKey === 'phase_minimum') {
    return labels.harmony_bridge_minimum;
  }
  return labels.harmony_bridge_decline;
}

function pickDeterministicVariant(pool, seedStr) {
  if (typeof pool === 'string') return pool;
  if (!Array.isArray(pool) || pool.length === 0) return '';
  let hash = 2166136261;
  const s = String(seedStr || '');
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return pool[(hash >>> 0) % pool.length];
}

function getRotatedLifestyleTip(dict, phaseKey, timeSlot, activeLunarDay, dayInPhase = 1, dateSeed = '') {
  const raw = dict.lifestyle_tips?.[phaseKey]?.[timeSlot];
  if (Array.isArray(raw) && raw.length > 0) {
    if (dateSeed) {
      return pickDeterministicVariant(raw, `${dateSeed}|${phaseKey}|${timeSlot}|tip`);
    }
    return raw[(Number(activeLunarDay) + Number(dayInPhase)) % raw.length];
  }
  return typeof raw === 'string' ? raw : '';
}

function getPhaseVariantLine(dict, phaseKey, dateSeed) {
  const pool = dict.phase_variants?.[phaseKey];
  if (Array.isArray(pool) && pool.length > 0) {
    return pickDeterministicVariant(pool, `${dateSeed}|${phaseKey}|pv`);
  }
  return dict.phases?.[phaseKey]?.tts_summary || '';
}

function getRoleToneOrHint(dict, roleKey, phaseKey) {
  const tone = dict.role_tone?.[roleKey]?.[phaseKey];
  if (tone) return tone;
  return dict.roles?.[roleKey]?.hint || '';
}

function getWindowFocusCue(dict, slot, dateSeed) {
  const pool = dict.window_focus?.[slot];
  if (Array.isArray(pool) && pool.length > 0) {
    return pickDeterministicVariant(pool, `${dateSeed}|${slot}|wf`);
  }
  return '';
}

function getDayTheme(dict, canonicalSign) {
  return dict.day_themes?.[canonicalSign] || null;
}

function getEdgeScenarioAdvice(dict, edge) {
  if (!edge) return '';
  const matrixText = dict.actor_maneuver_matrix?.[edge.actorKey]?.[edge.aspectKey];
  if (matrixText) return matrixText;
  return dict.maneuvers?.[edge.aspectKey]?.advice || '';
}

function resolveLanguageNameEn(bcp47Lang) {
  const raw = (bcp47Lang || 'ru-RU').trim();
  const baseCode = raw.split('-')[0] || 'ru';
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
      const display = new Intl.DisplayNames(['en'], { type: 'language' });
      return display.of(baseCode) || display.of(raw) || 'Russian';
    }
  } catch {
    // Fallback below if DisplayNames cannot resolve custom code
  }
  return baseCode === 'ru' ? 'Russian' : raw;
}

function formatMoonLocPhrase(baseLang, canonicalSign, signName, ingressInfo, withTimeAdverb = false, includeToday = true) {
  const ruSignGen = getRuZodiacGenitive(canonicalSign, signName);
  if (ingressInfo) {
    const t = ingressInfo.timeStr;
    const fromRu = getRuZodiacGenitive(ingressInfo.fromCanonical, ingressInfo.fromSignName);
    const toRu = getRuZodiacGenitive(ingressInfo.toCanonical, ingressInfo.toSignName);
    switch (baseLang) {
      case 'ru': {
        const prefix = withTimeAdverb ? (includeToday ? 'сегодня ' : 'в этот день ') : '';
        return `${prefix}Луна до ${t} в знаке ${fromRu}, далее в знаке ${toRu}`;
      }
      case 'es': {
        const prefix = withTimeAdverb && includeToday ? 'hoy ' : '';
        return `${prefix}la Luna está en ${ingressInfo.fromSignName} hasta las ${t} y después en ${ingressInfo.toSignName}`;
      }
      case 'de': {
        const prefix = withTimeAdverb && includeToday ? 'heute steht ' : '';
        const verb = withTimeAdverb && includeToday ? '' : ' steht';
        return `${prefix}der Mond${verb} bis ${t} im Zeichen ${ingressInfo.fromSignName}, danach im Zeichen ${ingressInfo.toSignName}`;
      }
      case 'fr': {
        const prefix = withTimeAdverb && includeToday ? "aujourd'hui " : '';
        return `${prefix}la Lune est en ${ingressInfo.fromSignName} jusqu'à ${t}, puis en ${ingressInfo.toSignName}`;
      }
      default: {
        const prefix = withTimeAdverb && includeToday ? 'today ' : '';
        return `${prefix}the Moon is in ${ingressInfo.fromSignName} until ${t}, then in ${ingressInfo.toSignName}`;
      }
    }
  }

  switch (baseLang) {
    case 'ru': {
      const prefix = withTimeAdverb ? (includeToday ? 'сегодня ' : 'в этот день ') : '';
      return `${prefix}Луна в знаке ${ruSignGen}`;
    }
    case 'es': {
      const prefix = withTimeAdverb && includeToday ? 'hoy ' : '';
      return `${prefix}la Luna está en ${signName}`;
    }
    case 'de': {
      const prefix = withTimeAdverb && includeToday ? 'heute steht ' : '';
      const verb = withTimeAdverb && includeToday ? '' : ' steht';
      return `${prefix}der Mond${verb} im Zeichen ${signName}`;
    }
    case 'fr': {
      const prefix = withTimeAdverb && includeToday ? "aujourd'hui " : '';
      return `${prefix}la Lune est en ${signName}`;
    }
    default: {
      const prefix = withTimeAdverb && includeToday ? 'today ' : '';
      return `${prefix}the Moon is in ${signName}`;
    }
  }
}

function formatSpeechByLang(baseLang, parts) {
  const {
    lunarDaySpeech,
    trendLabel,
    canonicalSign,
    signName,
    ingressInfo,
    lunarDayNote,
    contrastSentence,
    phaseKey,
    activeLunarDay,
    zodiacHint,
    illuminationPct,
    firstDay,
    secondDay,
    activeIndex,
    transitionTimeStr,
    phaseTitle,
    dayInPhase,
    phaseVariantLine,
    dayThemeFocus,
    roleTone,
    bridgeText,
    edgeInfo,
    bgAdvice,
    tip
  } = parts;

  const speechSignLead = (langCode) => {
    if (!ingressInfo) {
      switch (langCode) {
        case 'ru': return `в знаке ${signName}`;
        case 'es': return `en ${signName}`;
        case 'de': return `im Zeichen ${signName}`;
        case 'fr': return `en ${signName}`;
        default: return `in ${signName}`;
      }
    }
    const t = ingressInfo.timeStr;
    const fromRu = getRuZodiacGenitive(ingressInfo.fromCanonical, ingressInfo.fromSignName);
    const toRu = getRuZodiacGenitive(ingressInfo.toCanonical, ingressInfo.toSignName);
    switch (langCode) {
      case 'ru': return `Луна до ${t} в знаке ${fromRu}, далее в знаке ${toRu}`;
      case 'es': return `con la Luna en ${ingressInfo.fromSignName} hasta las ${t} y luego en ${ingressInfo.toSignName}`;
      case 'de': return `der Mond steht bis ${t} im Zeichen ${ingressInfo.fromSignName}, danach im Zeichen ${ingressInfo.toSignName}`;
      case 'fr': return `la Lune est en ${ingressInfo.fromSignName} jusqu'à ${t}, puis en ${ingressInfo.toSignName}`;
      default: return `the Moon is in ${ingressInfo.fromSignName} until ${t}, then in ${ingressInfo.toSignName}`;
    }
  };

  const formatTransitionSpeech = (langCode) => {
    if (!transitionTimeStr) return '';
    const alreadySwitched = firstDay !== secondDay && activeIndex === 1;
    switch (langCode) {
      case 'ru':
        return alreadySwitched
          ? `Текущие ${lunarDaySpeech} начались в ${transitionTimeStr}.`
          : `Смена лунных суток наступит в ${transitionTimeStr}.`;
      case 'es':
        return alreadySwitched
          ? `El ${lunarDaySpeech} actual comenzó a las ${transitionTimeStr}.`
          : `El cambio de día lunar será a las ${transitionTimeStr}.`;
      case 'de':
        return alreadySwitched
          ? `Der aktuelle ${lunarDaySpeech} begann um ${transitionTimeStr}.`
          : `Der nächste Mondtag beginnt um ${transitionTimeStr}.`;
      case 'fr':
        return alreadySwitched
          ? `Le ${lunarDaySpeech} actuel a commencé à ${transitionTimeStr}.`
          : `Le prochain jour lunaire commence à ${transitionTimeStr}.`;
      default:
        return alreadySwitched
          ? `The current ${lunarDaySpeech} began at ${transitionTimeStr}.`
          : `The next lunar day begins at ${transitionTimeStr}.`;
    }
  };

  if (!phaseTitle) {
    const signPhrase = speechSignLead(baseLang);
    const sep = ingressInfo ? ': ' : ' ';
    const transSentence = formatTransitionSpeech(baseLang);
    switch (baseLang) {
      case 'ru':
        return [
          `На календаре ${lunarDaySpeech}, ${uncapitalizeFirst(trendLabel)}${sep}${signPhrase}.`,
          dayThemeFocus,
          lunarDayNote,
          `Обстановка дня располагает к тому, что ${zodiacHint}, а освещённость Луны составляет ${illuminationPct} процентов.`,
          transSentence
        ];
      case 'es':
        return [
          `Hoy es ${lunarDaySpeech}, ${uncapitalizeFirst(trendLabel)}${ingressInfo ? ', ' : ' '}${signPhrase}.`,
          dayThemeFocus,
          lunarDayNote,
          `La jornada favorece ${zodiacHint}, con una iluminación lunar del ${illuminationPct} por ciento.`,
          transSentence
        ];
      case 'de':
        return [
          `Heute ist der ${lunarDaySpeech}, ${trendLabel}${ingressInfo ? '; ' : ' '}${signPhrase}.`,
          dayThemeFocus,
          lunarDayNote,
          `Die Tagesstimmung unterstützt ${zodiacHint}, bei ${illuminationPct} Prozent Mondbeleuchtung.`,
          transSentence
        ];
      case 'fr':
        return [
          `Aujourd'hui, c'est le ${lunarDaySpeech}, ${uncapitalizeFirst(trendLabel)}${ingressInfo ? ' ; ' : ' '}${signPhrase}.`,
          dayThemeFocus,
          lunarDayNote,
          `L'ambiance du jour favorise ${zodiacHint}, avec une illumination lunaire de ${illuminationPct} pour cent.`,
          transSentence
        ];
      default:
        return [
          `Today is the ${lunarDaySpeech}, ${uncapitalizeFirst(trendLabel)}${ingressInfo ? '; ' : ' '}${signPhrase}.`,
          dayThemeFocus,
          lunarDayNote,
          `The day favors ${zodiacHint}, with lunar illumination at ${illuminationPct} percent.`,
          transSentence
        ];
    }
  }

  const sentences = [];
  const signPhrase = speechSignLead(baseLang);
  const sep = ingressInfo ? (baseLang === 'ru' ? ': ' : baseLang === 'es' ? ', ' : '; ') : ' ';
  const lunarSpeechBlock = buildLunarBackdropSpeechLine(baseLang, {
    lunarDaySpeech,
    lunarDayNote,
    phaseKey,
    activeLunarDay,
    bgAdvice,
    contrastSentence
  });
  const includeBridge = Boolean(bridgeText && !lunarSpeechBlock.isConflict);

  switch (baseLang) {
    case 'ru':
      sentences.push(`На календаре ${lunarDaySpeech}, ${uncapitalizeFirst(trendLabel)}${sep}${signPhrase}.`);
      sentences.push(phaseVariantLine || `Идёт ${dayInPhase}-й день этапа «${phaseTitle}».`);
      if (roleTone) sentences.push(roleTone);
      if (dayThemeFocus) sentences.push(dayThemeFocus);
      if (includeBridge) sentences.push(bridgeText);
      if (edgeInfo) {
        const dynMap = {
          exact: 'Пик этой тенденции приходится на сегодня.',
          applying: 'Эта тенденция постепенно усиливается.',
          separating: 'Пик уже пройден, ситуация стабилизируется.'
        };
        sentences.push(`На первый план выходят ${uncapitalizeFirst(edgeInfo.actorTitle)}. ${ensureSentence(edgeInfo.advice)} ${dynMap[edgeInfo.dynamicKey]}`);
      } else if (!includeBridge) {
        sentences.push(`Влияние знака ${getRuZodiacGenitive(canonicalSign, signName)} делает этот день удобным там, где важно ${zodiacHint}.`);
      }
      if (lunarSpeechBlock.line) sentences.push(lunarSpeechBlock.line);
      if (tip) sentences.push(tip);
      return sentences;

    case 'es':
      sentences.push(`Hoy es ${lunarDaySpeech}, ${uncapitalizeFirst(trendLabel)}${sep}${signPhrase}.`);
      sentences.push(phaseVariantLine || `Es el día ${dayInPhase} de la fase «${phaseTitle}».`);
      if (roleTone) sentences.push(roleTone);
      if (dayThemeFocus) sentences.push(dayThemeFocus);
      if (includeBridge) sentences.push(bridgeText);
      if (edgeInfo) {
        const dynMap = {
          exact: 'El punto máximo cae hoy mismo.',
          applying: 'Esta tendencia va tomando fuerza.',
          separating: 'El pico ya pasó y la tensión disminuye.'
        };
        sentences.push(`En primer plano destacan ${edgeInfo.actorTitle.toLowerCase()}. ${ensureSentence(edgeInfo.advice)} ${dynMap[edgeInfo.dynamicKey]}`);
      } else if (!includeBridge) {
        sentences.push(`La Luna en ${signName} favorece especialmente ${zodiacHint}.`);
      }
      if (lunarSpeechBlock.line) sentences.push(lunarSpeechBlock.line);
      if (tip) sentences.push(tip);
      return sentences;

    case 'de':
      sentences.push(`Heute ist der ${lunarDaySpeech}, ${trendLabel}${sep}${signPhrase}.`);
      sentences.push(phaseVariantLine || `Es ist Tag ${dayInPhase} der Phase «${phaseTitle}».`);
      if (roleTone) sentences.push(roleTone);
      if (dayThemeFocus) sentences.push(dayThemeFocus);
      if (includeBridge) sentences.push(bridgeText);
      if (edgeInfo) {
        const dynMap = {
          exact: 'Der Höhepunkt liegt genau heute.',
          applying: 'Dieser Einfluss nimmt allmählich zu.',
          separating: 'Der Höhepunkt ist überschritten und die Lage beruhigt sich.'
        };
        sentences.push(`Im Vordergrund stehen ${edgeInfo.actorTitle}. ${ensureSentence(edgeInfo.advice)} ${dynMap[edgeInfo.dynamicKey]}`);
      } else if (!includeBridge) {
        sentences.push(`Der Mond im Zeichen ${signName} unterstützt besonders ${zodiacHint}.`);
      }
      if (lunarSpeechBlock.line) sentences.push(lunarSpeechBlock.line);
      if (tip) sentences.push(tip);
      return sentences;

    case 'fr':
      sentences.push(`Aujourd'hui, c'est le ${lunarDaySpeech}, ${uncapitalizeFirst(trendLabel)}${sep}${signPhrase}.`);
      sentences.push(phaseVariantLine || `Nous sommes au jour ${dayInPhase} de la phase « ${phaseTitle} ».`);
      if (roleTone) sentences.push(roleTone);
      if (dayThemeFocus) sentences.push(dayThemeFocus);
      if (includeBridge) sentences.push(bridgeText);
      if (edgeInfo) {
        const dynMap = {
          exact: 'Le pic tombe aujourd\'hui même.',
          applying: 'Cette tendance monte progressivement.',
          separating: 'Le pic est passé et la tension retombe.'
        };
        sentences.push(`Au premier plan figurent ${edgeInfo.actorTitle.toLowerCase()}. ${ensureSentence(edgeInfo.advice)} ${dynMap[edgeInfo.dynamicKey]}`);
      } else if (!includeBridge) {
        sentences.push(`La Lune en ${signName} favorise particulièrement ${zodiacHint}.`);
      }
      if (lunarSpeechBlock.line) sentences.push(lunarSpeechBlock.line);
      if (tip) sentences.push(tip);
      return sentences;

    default:
      sentences.push(`Today is the ${lunarDaySpeech}, ${uncapitalizeFirst(trendLabel)}${sep}${signPhrase}.`);
      sentences.push(phaseVariantLine || `You are on day ${dayInPhase} of the "${phaseTitle}" phase.`);
      if (roleTone) sentences.push(roleTone);
      if (dayThemeFocus) sentences.push(dayThemeFocus);
      if (includeBridge) sentences.push(bridgeText);
      if (edgeInfo) {
        const dynMap = {
          exact: 'Peak intensity lands today.',
          applying: 'This trend is steadily building.',
          separating: 'The peak has passed and tension is easing.'
        };
        sentences.push(`At the forefront are ${edgeInfo.actorTitle.toLowerCase()}. ${ensureSentence(edgeInfo.advice)} ${dynMap[edgeInfo.dynamicKey]}`);
      } else if (!includeBridge) {
        sentences.push(`Moon in ${signName} especially supports ${zodiacHint}.`);
      }
      if (lunarSpeechBlock.line) sentences.push(lunarSpeechBlock.line);
      if (tip) sentences.push(tip);
      return sentences;
  }
}

function buildBriefingSpeechText() {
  const dict = getActiveDictionary();
  const labels = getUILabels(dict);
  const lang = dict.meta?.lang || 'ru-RU';
  const baseLang = lang.toLowerCase().split(/[-_]/)[0];
  const now = new Date();
  const isToday = isSameCalendarDay(selectedDate, now);
  const refMoment = isToday
    ? now
    : new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 21, 0, 0, 0);

  const summary = getCalendarDayLunarSummary(selectedDate, refMoment);
  const lunarDaySpeech = formatLunarDayForSpeech(
    summary.activeLunarDay,
    lang,
    labels.lunar_day_full
  );
  const lunarDayNote = dict.lunar_days?.[String(summary.activeLunarDay)] || '';
  const trendLabel = dict.moon_trends?.[summary.phaseInfo.trend] || '';
  const sign = summary.phaseInfo.zodiacSign;
  const signName = getLocalizedZodiacSign(dict, sign);
  const zodiacHint = dict.zodiac_hints?.[sign] || '';
  const dateSeed = toISODate(selectedDate);
  const dayTheme = getDayTheme(dict, sign);
  const dayThemeFocus = dayTheme?.focus || '';
  const ingressInfo = summary.signIngress
    ? {
        fromCanonical: summary.signIngress.fromSign,
        toCanonical: summary.signIngress.toSign,
        fromSignName: getLocalizedZodiacSign(dict, summary.signIngress.fromSign),
        toSignName: getLocalizedZodiacSign(dict, summary.signIngress.toSign),
        timeStr: summary.signIngress.timeStr
      }
    : null;

  if (!appState.birthDate) {
    const sentences = formatSpeechByLang(baseLang, {
      lunarDaySpeech,
      trendLabel,
      canonicalSign: sign,
      signName,
      ingressInfo,
      lunarDayNote,
      contrastSentence: '',
      zodiacHint,
      dayThemeFocus,
      illuminationPct: summary.phaseInfo.illuminationPct,
      firstDay: summary.firstDay,
      secondDay: summary.secondDay,
      activeIndex: summary.activeIndex,
      transitionTimeStr: summary.transitionTimeStr
    });
    return sentences.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  const personal = computePersonalState(appState.birthDate, selectedDate, refMoment, appState.birthTime);
  if (!personal) return '';

  const phase = dict.phases[personal.phaseKey];
  const tip = getRotatedLifestyleTip(
    dict,
    personal.phaseKey,
    personal.timeSlot,
    summary.activeLunarDay,
    personal.phaseStage.dayInPhase,
    dateSeed
  );
  const phaseVariantLine = getPhaseVariantLine(dict, personal.phaseKey, dateSeed);
  const roleTone = getRoleToneOrHint(dict, personal.roleKey, personal.phaseKey);
  const bridgeText = buildHarmonyBridge(personal, sign, personal.dailyFocusEdge, dict);
  const contrastSentence = buildBackdropContrastSentence(baseLang, {
    isPersonal: true,
    phaseKey: personal.phaseKey,
    activeLunarDay: summary.activeLunarDay
  });

  let edgeInfo = null;
  if (personal.dailyFocusEdge) {
    const edge = personal.dailyFocusEdge;
    const actor = dict.actors[edge.actorKey] || dict.actors.actor_moon;
    edgeInfo = {
      actorTitle: actor.title,
      advice: stripTrailingDot(getEdgeScenarioAdvice(dict, edge)),
      dynamicKey: edge.dynamicKey
    };
  }

  const bgAdvice =
    personal.isBackgroundExactPeak && personal.backgroundEdge
      ? stripTrailingDot(getEdgeScenarioAdvice(dict, personal.backgroundEdge))
      : '';

  const sentences = formatSpeechByLang(baseLang, {
    lunarDaySpeech,
    trendLabel,
    canonicalSign: sign,
    signName,
    ingressInfo,
    lunarDayNote,
    contrastSentence,
    phaseKey: personal.phaseKey,
    activeLunarDay: summary.activeLunarDay,
    zodiacHint,
    phaseTitle: phase.title,
    dayInPhase: personal.phaseStage.dayInPhase,
    phaseVariantLine,
    dayThemeFocus,
    roleTone,
    bridgeText,
    edgeInfo,
    bgAdvice,
    tip
  });

  return sentences.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function buildExternalAIPrompt() {
  const dict = getActiveDictionary();
  const lang = dict.meta?.lang || 'ru-RU';
  const now = new Date();
  const isToday = isSameCalendarDay(selectedDate, now);
  const refMoment = isToday
    ? now
    : new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 21, 0, 0, 0);

  const summary = getCalendarDayLunarSummary(selectedDate, refMoment);
  const personal = appState.birthDate
    ? computePersonalState(appState.birthDate, selectedDate, refMoment, appState.birthTime)
    : null;

  const isoDate = toISODate(selectedDate);
  const humanDate = formatHumanDate(selectedDate, lang);
  const currentTimeStr = formatHM(refMoment);
  const activeTimeSlot = personal ? personal.timeSlot : getTimeSlot(refMoment);

  const sign = summary.phaseInfo.zodiacSign;
  const zodiacHint = dict.zodiac_hints?.[sign] || '';
  const firstNote = dict.lunar_days?.[String(summary.firstDay)] || '';
  const secondNote = dict.lunar_days?.[String(summary.secondDay)] || '';
  const lunarDayNote = dict.lunar_days?.[String(summary.activeLunarDay)] || '';
  const detailedTrend =
    dict.moon_phase_names?.[summary.phaseInfo.detailedTrend] ||
    dict.moon_trends?.[summary.phaseInfo.trend] ||
    summary.phaseInfo.trend;
  const targetLangName = resolveLanguageNameEn(lang);

  const lines = [
    'You are an analytical daily rhythm and productivity strategist.',
    'Generate a cohesive, practical, realistic plan of action for the selected day based STRICTLY on the pre-computed astronomical and personal telemetry below.',
    'Treat all supplied telemetry as ground truth. DO NOT recalculate planetary positions, lunar days, aspects, or phases on your own.',
    '',
    '### RULES & CONSTRAINTS',
    `1. OUTPUT CONTRACT & STRICT MONOLINGUAL HEADINGS: Structure your response into strictly 6 numbered sections. Output section titles strictly in ${targetLangName} ONLY (do NOT output bilingual slashes or English translations in the response headings; use these English structural topics purely as internal reference: 1) Remainder of Day Framing, 2) Priorities, 3) Communication, 4) Pacing & Breaks, 5) Recovery, 6) Clarifying Questions). Keep each section concise with a maximum of 7 bullet points per section.`,
    `2. EVENING & TIME HORIZON (timeSlot: ${activeTimeSlot}): When timeSlot === "evening", plan ONLY from Current Local Time (${currentTimeStr}) until bedtime (assume 23:00 by default if bedtime is unknown, and explicitly state this assumption). When timeSlot === "day", plan strictly from midday/current time onward.`,
    '3. LATE-NIGHT CUTOFF (< 60 MINS TO BEDTIME): If less than 60 minutes remain before bedtime (23:00 default), collapse the entire action plan into ONE single closing micro-action plus the evening recovery ritual.',
    '4. NO PAST OR DAYTIME-ONLY TASKS AT NIGHT: Strictly forbid scheduling past hours, morning routines, or daytime-only work/preparations when in the evening window. Only neutral evening preparation for tomorrow morning is allowed (e.g., laying out clothes, clearing the desk, setting an alarm).',
    '5. PRIORITY CAP (MAX 2): In Section 2 (Priorities), list strictly NO MORE than 2 priority tasks for the remainder of the evening (or current time window) to prevent schedule overload.',
    '6. CONFLICT RESOLUTION & EXPLICIT IMPULSE NEUTRALIZATION: Whenever an active operational role (e.g., Sprint / Drive) or fast zodiac/aspect hints (e.g., Aries / initiative / fast decisions) coincide with a low-energy personal phase (phase_minimum / phase_decline), explicitly neutralize any impulse to start new tasks, cold outreach, or new projects — channel speed strictly into closing already-started short items and replying to incoming messages.',
    '7. COMMUNICATION SPLIT (REPLY VS INITIATE): Separate incoming replies from outgoing initiation. During evening hours or low personal pacing, allow replying to incoming requests, and allow initiating messages ONLY if they directly close an open task or handoff. Do not start new discussions or open-ended threads.',
    '8. LUNAR DAY TRANSITION RULE: Treat the currently active lunar day as primary for all actionable guidance. Treat any earlier/previous lunar day strictly as passive background context without mixing conflicting advice. On any conflict, the active lunar day combined with the personal rest/pacing phase takes priority.',
    '9. REALISM & TIME-BOXING: Every suggested action must realistically fit into the remaining time window before bedtime or end of day. Any task requiring more than 30-40 minutes must be broken down into a concrete minimal next step or explicitly deferred to tomorrow.',
    `10. TELEMETRY TRANSLATION (NO PARROTING): Do NOT repeat, quote, or paraphrase raw telemetry numbers, degrees, orb values, or status fields in your output. Translate telemetry directly into actionable behavior using the voice of the active dictionary ("${dict.meta?.name || 'Default'}" — ${dict.meta?.description || 'Rational productivity without esotericism.'}) without adding extra astrology or unrequested esotericism.`,
    '11. GLOBAL LENGTH & FORMAT CAP: Keep the entire response concise within 450-600 words maximum, formatted in clean bullet points, with NO Markdown tables and ZERO repetition of raw telemetry numbers.',
    '12. UNCERTAINTY HANDLING: If key context is missing (such as exact bedtime, specific pending documents, or deadlines), deliver the complete plan first using explicit, stated assumptions, then ask 1-2 brief clarifying questions at the very end in Section 6 (strictly max 2 questions).',
    '13. FINAL QUALITY SELF-CHECK: Before finalizing, verify that your output uses strictly monolingual headings, stays within 450-600 words without Markdown tables, lists max 2 priorities, contains zero medical diagnoses/prescriptions, zero fatalistic claims, zero metaphors/esotericism (unless explicitly defined by a custom active dictionary), zero tasks for past hours, full respect for low personal pacing, and includes at least one deliberate pause plus a concrete evening recovery ritual.',
    '',
    '### PRE-COMPUTED TELEMETRY',
    `- Selected Date: ${isoDate} (${humanDate})`,
    `- Current Local Time: ${currentTimeStr} (timeSlot: ${activeTimeSlot})`
  ];

  if (summary.firstDay !== summary.secondDay) {
    lines.push(
      `- Lunar Day Timeline: ${toEnglishOrdinal(summary.firstDay)} lunar day (from ${summary.firstDayStartTimeStr}) until ${summary.transitionTimeStr}, followed by ${toEnglishOrdinal(summary.secondDay)} lunar day (starts at ${summary.secondDayStartTimeStr}); primary active now: ${toEnglishOrdinal(summary.activeLunarDay)} lunar day`
    );
    if (summary.activeIndex === 0) {
      if (firstNote) lines.push(`- Primary Active Lunar Day (${summary.firstDay}): ${firstNote}`);
      if (secondNote) lines.push(`- Upcoming Lunar Day Context (after ${summary.transitionTimeStr}, ${summary.secondDay}): ${secondNote}`);
    } else {
      if (firstNote) lines.push(`- Previous Background Lunar Day (${summary.firstDay}, ended at ${summary.transitionTimeStr}): ${firstNote}`);
      if (secondNote) lines.push(`- Primary Active Lunar Day (${summary.secondDay}): ${secondNote}`);
    }
  } else {
    lines.push(
      `- Lunar Day Timeline: ${toEnglishOrdinal(summary.activeLunarDay)} lunar day all day (from ${summary.firstDayStartTimeStr}, next transition at ${summary.transitionTimeStr}); primary active now: ${toEnglishOrdinal(summary.activeLunarDay)} lunar day`
    );
    if (lunarDayNote) lines.push(`- Primary Active Lunar Day (${summary.activeLunarDay}): ${lunarDayNote}`);
  }

  const dayThemeObj = getDayTheme(dict, sign);
  const ingressLine = summary.signIngress
    ? `- Exact Moon Sign Ingress Today: ${summary.signIngress.fromSign} -> ${summary.signIngress.toSign} at ${summary.signIngress.timeStr}`
    : null;
  lines.push(
    `- Moon Phase & Illumination: ${detailedTrend}, Moon age ${summary.phaseInfo.moonAge.toFixed(1)} days, ${summary.phaseInfo.illuminationExact.toFixed(1)}% illuminated`,
    `- Moon Zodiac Sign: ${sign} (${zodiacHint})${dayThemeObj ? `; Daily Theme: ${dayThemeObj.title} — ${dayThemeObj.focus}` : ''}`,
    ...(ingressLine ? [ingressLine] : []),
    `- Intra-day Moon Sign Windows: Morning 09:00 = ${summary.windows.morning.zodiacSign}, Day 14:00 = ${summary.windows.day.zodiacSign}, Evening 20:00 = ${summary.windows.evening.zodiacSign}`
  );

  if (personal) {
    const profileObj = dict.profiles[personal.profileKey];
    const ageObj = dict.age_classes[personal.ageClassKey];
    const phaseObj = dict.phases[personal.phaseKey];
    const roleObj = dict.roles[personal.roleKey];
    const harmonizedRoleTone = getRoleToneOrHint(dict, personal.roleKey, personal.phaseKey);
    const phaseDayNote =
      dict.phase_day_notes?.[personal.phaseKey]?.[personal.phaseStage.key] ||
      personal.phaseStage.hint;
    const hasTension = Boolean(buildHarmonyBridge(personal, sign, personal.dailyFocusEdge));
    const tipText = getRotatedLifestyleTip(
      dict,
      personal.phaseKey,
      personal.timeSlot,
      summary.activeLunarDay,
      personal.phaseStage.dayInPhase,
      isoDate
    );

    lines.push(
      `- Birth Profile: ${profileObj?.title || personal.profileKey}`,
      `- Age Guideline: ${ageObj?.title || personal.ageClassKey} — ${ageObj?.modifier_hint || ''}`,
      `- Personal Cycle Phase: ${phaseObj?.title || personal.phaseKey} (${personal.phaseKey}) [${phaseObj?.badge || ''}, ${phaseObj?.tempo || ''}], Day ${personal.phaseStage.dayInPhase} of ${personal.phaseStage.totalDays} (${personal.phaseStage.label})`,
      `- Phase Focus: ${phaseDayNote}`,
      `- Operational Role: ${roleObj?.title || personal.roleKey} (${personal.roleKey}) — ${harmonizedRoleTone}`
    );

    if (hasTension) {
      lines.push(
        `- Pacing Harmonization: Active external/role momentum overlaps with a low-tempo personal phase; restrict energy strictly to closing already-started short tasks and incoming replies rather than starting new initiatives.`
      );
    }

    const lunarPolarity = getLunarDayPolarity(summary.activeLunarDay);
    const personalPolarity = getPersonalPacingPolarity(personal.phaseKey);
    if (personalPolarity === 'passive' && lunarPolarity === 'active') {
      lines.push(
        `- Environment vs Personal Pacing Contrast: Active lunar day (${toEnglishOrdinal(summary.activeLunarDay)}) accelerates external business activity while personal rhythm (${personal.phaseKey}) requires recovery — explicitly separate external rush from personal capacity and forbid new project starts.`
      );
    } else if (personalPolarity === 'active' && lunarPolarity === 'restrained') {
      lines.push(
        `- Environment vs Personal Pacing Contrast: Personal capacity (${personal.phaseKey}) is high while the lunar day (${toEnglishOrdinal(summary.activeLunarDay)}) signals extra external friction — channel strong personal drive carefully with double-checked terms and zero impulsive risk.`
      );
    }

    if (personal.dailyFocusEdge) {
      const e = personal.dailyFocusEdge;
      const actor = dict.actors[e.actorKey] || dict.actors.actor_moon;
      const maneuver = dict.maneuvers[e.aspectKey];
      const aspectTitle = maneuver?.title || `${e.angle}° aspect`;
      const advice = getEdgeScenarioAdvice(dict, e);
      const dyn = dict.aspect_dynamics?.[e.dynamicKey] || e.dynamicKey;
      lines.push(
        `- Primary Daily Aspect: ${e.transit} -> natal ${e.natal}: ${aspectTitle} (${e.angle}°, orb ${e.diff}°)`,
        `  - Sphere: ${actor?.title || e.actorKey}`,
        `  - Guidance: ${advice} (${dyn})`
      );
    } else {
      lines.push(`- Primary Daily Focus: Moon in ${sign} (${zodiacHint})`);
    }

    if (personal.backgroundEdge) {
      const bg = personal.backgroundEdge;
      const bgActor = dict.actors[bg.actorKey];
      const bgManeuver = dict.maneuvers[bg.aspectKey];
      const bgTitle = bgManeuver?.title || `${bg.angle}° aspect`;
      const bgAdvice = getEdgeScenarioAdvice(dict, bg);
      const bgDyn = dict.aspect_dynamics?.[bg.dynamicKey] || bg.dynamicKey;
      lines.push(
        `- Weekly Background Aspect: ${bg.transit} -> natal ${bg.natal}: ${bgTitle} (${bg.angle}°, orb ${bg.diff}°, exact peak today: ${personal.isBackgroundExactPeak ? 'YES' : 'NO'})`,
        `  - Context (${bgActor?.title || bg.actorKey}): ${bgAdvice} (${bgDyn})`
      );
    } else {
      lines.push('- Weekly Background Aspect: None active within orb');
    }

    lines.push(`- Recommended Lifestyle Habit (${personal.timeSlot}): ${tipText}`);
  } else {
    lines.push('- Personal Cycle / Birth Profile: Not provided (General Lunar Calendar mode)');
  }

  lines.push(
    `- Active Dictionary: ${dict.meta?.name || 'Default'} (${lang})`,
    '',
    `IMPORTANT: Write your entire response in ${targetLangName}. Follow the 6-section output contract strictly.`
  );

  return lines.join('\n');
}

// =========================================================================
// Rendering: Hero, Today, Timeline, Reminders, Settings
// =========================================================================
function getUILabels(dict = getActiveDictionary()) {
  const baseLabels = getActiveBaseDictionary().ui_labels || {};
  return {
    ...baseLabels,
    ...(dict.ui_labels || {})
  };
}

function renderUI() {
  const dict = getActiveDictionary();
  updateStaticUILabels(dict);
  renderHeroAndToday(dict);
  renderTimelineStrip(dict);
  renderRemindersList(dict);
  renderSettingsPanel(dict);
  notifyPreviewHost();
}

function updateStaticUILabels(dict) {
  const labels = getUILabels(dict);
  const lang = dict.meta?.lang || 'ru-RU';
  const baseLang = lang.split('-')[0] || 'ru';

  document.documentElement.lang = baseLang;
  document.title = `${labels.app_title} — ${labels.app_subtitle}`;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && labels[key]) {
      el.textContent = labels[key];
    }
  });

  document.getElementById('hero-age-unit').textContent = labels.moon_age_unit;
  document.getElementById('moon-canvas').setAttribute('aria-label', labels.hero_moon_aria);
  document.getElementById('hero-illumination').title = labels.hero_illumination_title;

  const copyBtn = document.getElementById('btn-copy-ai-prompt');
  copyBtn.title = labels.btn_copy_prompt_title;
  copyBtn.setAttribute('aria-label', labels.btn_copy_prompt_aria);
  document.getElementById('hero-prompt-label').textContent = labels.prompt_copied_toast;

  const speakBtn = document.getElementById('btn-speak-briefing');
  speakBtn.title = labels.btn_speak_briefing;
  speakBtn.setAttribute('aria-label', labels.btn_speak_briefing);

  const stopBtn = document.getElementById('btn-stop-speech');
  stopBtn.title = labels.btn_stop_speech;
  stopBtn.setAttribute('aria-label', labels.btn_stop_speech);

  document.getElementById('btn-toggle-reminder-form').textContent = `+ ${labels.btn_add_reminder}`;
  document.getElementById('mode-btn-lunar').textContent = labels.tab_by_lunar_day;
  document.getElementById('mode-btn-date').textContent = labels.tab_by_date;

  document.getElementById('day-note-input').placeholder = labels.day_note_placeholder;
  document.getElementById('input-reminder-text').placeholder = labels.placeholder_reminder_text;
  document.getElementById('btn-close-day-note').setAttribute('aria-label', labels.btn_close);
  document.getElementById('timeline-section').setAttribute('aria-label', labels.timeline_aria);
  document.getElementById('lunar-timeline-strip').setAttribute('aria-label', labels.timeline_aria);
  document.getElementById('day-note-panel').setAttribute('aria-label', labels.day_note_title);
  document.getElementById('tab-today').setAttribute('aria-label', labels.nav_today);
  document.getElementById('tab-reminders').setAttribute('aria-label', labels.nav_reminders);
  document.getElementById('tab-settings').setAttribute('aria-label', labels.nav_settings);
  document.getElementById('select-builtin-lang').setAttribute('aria-label', labels.label_builtin_lang);
  const birthInputEl = document.getElementById('input-birth-date');
  birthInputEl.setAttribute('aria-label', labels.label_birth_date);
  birthInputEl.placeholder = labels.placeholder_birth_date || 'dd.mm.yyyy';
  const birthPickerBtn = document.getElementById('btn-birth-date-picker');
  if (birthPickerBtn) {
    birthPickerBtn.title = labels.btn_pick_date || labels.label_birth_date;
    birthPickerBtn.setAttribute('aria-label', labels.btn_pick_date || labels.label_birth_date);
  }
  const birthTimeEl = document.getElementById('input-birth-time');
  birthTimeEl.setAttribute('aria-label', labels.label_birth_time);
  birthTimeEl.title = labels.title_birth_time;
  const copyRawBtn = document.getElementById('btn-copy-raw-data');
  if (!copyRawBtn.classList.contains('is-copied')) {
    copyRawBtn.textContent = labels.btn_copy_raw_data;
  }
  document.getElementById('input-time-morning').setAttribute('aria-label', labels.slot_morning);
  document.getElementById('input-time-day').setAttribute('aria-label', labels.slot_day);
  document.getElementById('input-time-evening').setAttribute('aria-label', labels.slot_evening);

  const lunarSelect = document.getElementById('input-lunar-day');
  Array.from(lunarSelect.options).forEach((opt, idx) => {
    opt.textContent = `${idx + 1} ${labels.lunar_day_full}`;
  });
}

const RU_ZODIAC_GENITIVE = {
  'Овен': 'Овна',
  'Телец': 'Тельца',
  'Близнецы': 'Близнецов',
  'Рак': 'Рака',
  'Лев': 'Льва',
  'Дева': 'Девы',
  'Весы': 'Весов',
  'Скорпион': 'Скорпиона',
  'Стрелец': 'Стрельца',
  'Козерог': 'Козерога',
  'Водолей': 'Водолея',
  'Рыбы': 'Рыб'
};

function getRuZodiacGenitive(canonicalSign, signName) {
  if (signName === canonicalSign && RU_ZODIAC_GENITIVE[canonicalSign]) {
    return RU_ZODIAC_GENITIVE[canonicalSign];
  }
  return signName;
}

function getRuOrdinalNumeric(dayNum) {
  const n = Number(dayNum);
  return n === 3 || n === 23 ? `${n}-и` : `${n}-е`;
}

function getRuAccusativePhrase(text) {
  if (!text) return '';
  if (text === 'Высокая динамика') return 'высокую динамику';
  return uncapitalizeFirst(text);
}

function mapGuestPhaseKey(detailedTrend) {
  switch (detailedTrend) {
    case 'new':
    case 'waning_crescent':
      return 'phase_minimum';
    case 'waxing_crescent':
    case 'first_quarter':
      return 'phase_rise';
    case 'waxing_gibbous':
    case 'full':
      return 'phase_peak';
    case 'waning_gibbous':
    case 'last_quarter':
    default:
      return 'phase_decline';
  }
}

function resolveDayStatus(personal, summary, dict, labels) {
  if (personal) {
    const isPassive = PASSIVE_PHASES.has(personal.phaseKey);
    const top = personal.dailyFocusEdge;
    const valence = top ? (dict.maneuvers?.[top.aspectKey]?.valence || 'neutral') : 'neutral';

    if (personal.phaseKey === 'phase_minimum' || (personal.phaseKey === 'phase_decline' && valence === 'warning')) {
      return { key: 'refrain', label: labels.day_status_refrain };
    }
    if (isPassive || valence === 'warning') {
      return { key: 'caution', label: labels.day_status_caution };
    }
    return { key: 'favorable', label: labels.day_status_favorable };
  }

  const trend = summary.phaseInfo.detailedTrend;
  if (trend === 'new' || trend === 'waning_crescent') {
    return { key: 'refrain', label: labels.day_status_refrain };
  }
  if (trend === 'first_quarter' || trend === 'last_quarter') {
    return { key: 'caution', label: labels.day_status_caution };
  }
  return { key: 'favorable', label: labels.day_status_favorable };
}

function buildTodayIntroText(baseLang, ctx) {
  const {
    labels,
    isToday,
    isPersonal,
    statusKey,
    hasWarning,
    phaseKey,
    phaseTitle,
    dayInPhase,
    totalDays,
    profileTitle,
    ageTitle,
    roleTitle,
    dayThemeFocus,
    activeLunarDay,
    firstDay,
    secondDay,
    activeIndex,
    transitionTimeStr,
    lunarDayFullLabel,
    lunarDayNote,
    canonicalSign,
    signName,
    ingressInfo,
    zodiacHint,
    detailedTrendLabel,
    illuminationStr
  } = ctx;

  const themeNote = dayThemeFocus ? ` ${dayThemeFocus}` : '';
  const moonLoc = formatMoonLocPhrase(baseLang, canonicalSign, signName, ingressInfo, true, isToday);
  const backdropLead = formatLunarDayBackdropLead(baseLang, {
    activeLunarDay,
    lunarDayFullLabel,
    firstDay,
    secondDay,
    activeIndex,
    transitionTimeStr,
    moonLoc
  });
  const lunarNoteSentence = ensureSentence(lunarDayNote);
  const contrastSentence = buildBackdropContrastSentence(baseLang, {
    isPersonal,
    phaseKey,
    activeLunarDay
  });
  const backdropLabel = labels?.label_calendar_backdrop || '';
  const resourceLabel = labels?.label_personal_resource || '';
  const backdropText = formatCalendarBackdropText(baseLang, {
    isPersonal,
    phaseKey,
    activeLunarDay,
    backdropLead,
    lunarNoteSentence,
    contrastSentence
  });

  if (!isPersonal) {
    let mainText = '';
    switch (baseLang) {
      case 'ru': {
        const lead = `Фаза Луны — ${uncapitalizeFirst(detailedTrendLabel)} (${illuminationStr}%), ${moonLoc}.${themeNote}`;
        if (statusKey === 'refrain') {
          mainText = `${lead} Лучше воздержаться от новых стартов, крупных обязательств и поспешных решений — время подходит для спокойного завершения дел и восстановления.`;
        } else if (statusKey === 'caution') {
          mainText = `${lead} Стоит избегать перегрузок и суеты — благоприятно для выверенных дел (${zodiacHint}).`;
        } else {
          mainText = `${lead} Благоприятно для задач, где помогают ${zodiacHint}.`;
        }
        break;
      }
      case 'es': {
        const lead = `Fase lunar: ${uncapitalizeFirst(detailedTrendLabel)} (${illuminationStr}%), ${moonLoc}.${themeNote}`;
        if (statusKey === 'refrain') {
          mainText = `${lead} Mejor abstenerse de nuevos comienzos, grandes compromisos y decisiones apresuradas — momento propicio para cerrar pendientes y descansar.`;
        } else if (statusKey === 'caution') {
          mainText = `${lead} Conviene evitar sobrecargas y prisas — favorable para pasos medidos (${zodiacHint}).`;
        } else {
          mainText = `${lead} Favorable para tareas donde ayuda ${zodiacHint}.`;
        }
        break;
      }
      case 'de': {
        const lead = `Mondphase: ${detailedTrendLabel} (${illuminationStr}%), ${moonLoc}.${themeNote}`;
        if (statusKey === 'refrain') {
          mainText = `${lead} Besser zurückhalten bei Neustarts, großen Verpflichtungen und vorschnellen Entscheidungen — ruhige Zeit für Abschlüsse und Erholung.`;
        } else if (statusKey === 'caution') {
          mainText = `${lead} Vermeiden Sie Überlastung und Hektik — geeignet für überlegte Schritte (${zodiacHint}).`;
        } else {
          mainText = `${lead} Günstig für Vorhaben mit Fokus auf ${zodiacHint}.`;
        }
        break;
      }
      case 'fr': {
        const lead = `Phase lunaire : ${uncapitalizeFirst(detailedTrendLabel)} (${illuminationStr}%), ${moonLoc}.${themeNote}`;
        if (statusKey === 'refrain') {
          mainText = `${lead} Mieux vaut s'abstenir de nouveaux départs, de gros engagements et de décisions hâtives — temps calme propice au bouclage et au repos.`;
        } else if (statusKey === 'caution') {
          mainText = `${lead} Évitez la surcharge et la précipitation — utile pour avancer avec mesure (${zodiacHint}).`;
        } else {
          mainText = `${lead} Favorable aux démarches soutenues par ${zodiacHint}.`;
        }
        break;
      }
      default: {
        const lead = `Moon phase: ${uncapitalizeFirst(detailedTrendLabel)} (${illuminationStr}%), ${moonLoc}.${themeNote}`;
        if (statusKey === 'refrain') {
          mainText = `${lead} Best to refrain from new launches, major commitments, and hasty decisions — a quiet window for wrapping up open items and recovery.`;
        } else if (statusKey === 'caution') {
          mainText = `${lead} Avoid overloading your schedule or rushing — workable for measured steps (${zodiacHint}).`;
        } else {
          mainText = `${lead} Favorable for tasks supported by ${zodiacHint}.`;
        }
        break;
      }
    }

    return {
      mainLabel: '',
      mainText,
      backdropLabel,
      backdropText
    };
  }

  let mainText = '';
  switch (baseLang) {
    case 'ru': {
      const roleBit = roleTitle ? `, формат дня — ${uncapitalizeFirst(roleTitle)}` : '';
      const courseSentence = `Основной курс дня — ${uncapitalizeFirst(phaseTitle)} (день ${dayInPhase} из ${totalDays}${roleBit}): опирайтесь на ${uncapitalizeFirst(profileTitle)} и ${getRuAccusativePhrase(ageTitle)}.`;
      let guidanceSentence = '';

      if (phaseKey === 'phase_minimum') {
        guidanceSentence = 'Лучше воздержаться от новых стартов, крупных обязательств и импульсивных решений.';
      } else if (phaseKey === 'phase_decline') {
        guidanceSentence = hasWarning
          ? 'Лучше воздержаться от споров, спешки и запуска новых проектов — сосредоточьтесь на завершении текущих дел.'
          : 'Лучше воздержаться от запуска новых проектов, лишних обещаний и резкой смены планов — сделайте упор на завершение текущих дел.';
      } else if (phaseKey === 'phase_rise') {
        guidanceSentence = hasWarning
          ? 'Стоит воздержаться от распыления и непроверенных обещаний — сделайте упор на пошаговое планирование и проверку деталей.'
          : 'Благоприятно сделать упор на пошаговое планирование, сбор данных и спокойную подготовку к запуску.';
      } else {
        guidanceSentence = hasWarning
          ? 'Стоит воздержаться от резкости и поспешных конфликтов — направьте ресурс на ключевые переговоры и сложные задачи.'
          : 'Благоприятно направить высокий ресурс на ключевые переговоры, запуск важных проектов и ответственные решения.';
      }

      mainText = `${courseSentence} ${guidanceSentence}`;
      break;
    }
    case 'es': {
      const roleBit = roleTitle ? `, formato de hoy: ${roleTitle.toLowerCase()}` : '';
      const courseSentence = `El rumbo principal de hoy es ${phaseTitle.toLowerCase()} (día ${dayInPhase} de ${totalDays}${roleBit}): apóyate en ${profileTitle.toLowerCase()} y ${ageTitle.toLowerCase()}.`;
      let guidanceSentence = '';

      if (phaseKey === 'phase_minimum') {
        guidanceSentence = 'Mejor abstenerse de nuevos comienzos, grandes compromisos y decisiones impulsivas.';
      } else if (phaseKey === 'phase_decline') {
        guidanceSentence = hasWarning
          ? 'Mejor abstenerse de discusiones, prisas y nuevos proyectos — concéntrate en cerrar las tareas en curso.'
          : 'Mejor abstenerse de lanzar nuevos proyectos, promesas innecesarias y cambios bruscos — prioriza cerrar lo iniciado.';
      } else if (phaseKey === 'phase_rise') {
        guidanceSentence = hasWarning
          ? 'Conviene abstenerse de dispersarse o prometer sin verificar — enfócate en planificar paso a paso y revisar detalles.'
          : 'Favorable para enfocarse en planificar paso a paso, reunir datos y preparar lanzamientos con calma.';
      } else {
        guidanceSentence = hasWarning
          ? 'Conviene evitar la brusquedad y conflictos apresurados — dirige tu recurso a negociaciones clave y tareas exigentes.'
          : 'Favorable para dirigir tu energía alta a negociaciones clave, lanzamientos importantes y decisiones firmes.';
      }

      mainText = `${courseSentence} ${guidanceSentence}`;
      break;
    }
    case 'de': {
      const roleBit = roleTitle ? `, Tagesmodus: ${roleTitle}` : '';
      const courseSentence = `Der heutige Hauptkurs ist ${phaseTitle} (Tag ${dayInPhase} von ${totalDays}${roleBit}): stützen Sie sich auf ${profileTitle} und ${ageTitle}.`;
      let guidanceSentence = '';

      if (phaseKey === 'phase_minimum') {
        guidanceSentence = 'Besser zurückhalten bei Neustarts, großen Verpflichtungen und impulsiven Entscheidungen.';
      } else if (phaseKey === 'phase_decline') {
        guidanceSentence = hasWarning
          ? 'Besser zurückhalten bei Debatten, Hektik und neuen Projekten — konzentrieren Sie sich auf den Abschluss laufender Aufgaben.'
          : 'Besser zurückhalten bei neuen Projektstarts, unnötigen Zusagen und abrupten Wechseln — setzen Sie auf den Abschluss laufender Aufgaben.';
      } else if (phaseKey === 'phase_rise') {
        guidanceSentence = hasWarning
          ? 'Vermeiden Sie Verzettelung und ungeprüfte Zusagen — setzen Sie auf schrittweise Planung und Detailprüfung.'
          : 'Günstig für den Fokus auf schrittweise Planung, Datensammlung und ruhige Startvorbereitung.';
      } else {
        guidanceSentence = hasWarning
          ? 'Vermeiden Sie Schärfe und vorschnelle Konflikte — lenken Sie Ihre Energie auf Schlüsselgespräche und komplexe Aufgaben.'
          : 'Günstig, um hohe Energie in Schlüsselgespräche, wichtige Projektstarts und klare Entscheidungen zu lenken.';
      }

      mainText = `${courseSentence} ${guidanceSentence}`;
      break;
    }
    case 'fr': {
      const roleBit = roleTitle ? `, format du jour : ${roleTitle.toLowerCase()}` : '';
      const courseSentence = `Le cap principal du jour est ${phaseTitle.toLowerCase()} (jour ${dayInPhase} sur ${totalDays}${roleBit}) : appuyez-vous sur ${profileTitle.toLowerCase()} et ${ageTitle.toLowerCase()}.`;
      let guidanceSentence = '';

      if (phaseKey === 'phase_minimum') {
        guidanceSentence = "Mieux vaut s'abstenir de nouveaux départs, de gros engagements et de décisions impulsives.";
      } else if (phaseKey === 'phase_decline') {
        guidanceSentence = hasWarning
          ? "Mieux vaut s'abstenir de débats, de précipitation et de nouveaux projets — concentrez-vous sur la clôture des dossiers en cours."
          : "Mieux vaut s'abstenir de lancer de nouveaux projets, de promesses superflues et de virages brusques — misez sur la clôture des dossiers en cours.";
      } else if (phaseKey === 'phase_rise') {
        guidanceSentence = hasWarning
          ? "Mieux vaut éviter la dispersion et les promesses non vérifiées — misez sur la planification par étapes et la vérification des détails."
          : "Favorable pour miser sur la planification par étapes, la collecte d'informations et une préparation posée.";
      } else {
        guidanceSentence = hasWarning
          ? "Évitez la brusquerie et les conflits précipités — canalisez votre énergie vers les négociations clés et les tâches exigeantes."
          : 'Favorable pour orienter votre pleine énergie vers les négociations clés, les lancements majeurs et les décisions nettes.';
      }

      mainText = `${courseSentence} ${guidanceSentence}`;
      break;
    }
    default: {
      const roleBit = roleTitle ? `, daily mode: ${roleTitle.toLowerCase()}` : '';
      const courseSentence = `Today's core course is ${phaseTitle.toLowerCase()} (day ${dayInPhase} of ${totalDays}${roleBit}): lean on ${profileTitle.toLowerCase()} and ${ageTitle.toLowerCase()}.`;
      let guidanceSentence = '';

      if (phaseKey === 'phase_minimum') {
        guidanceSentence = 'Best to refrain from new launches, major commitments, and impulsive decisions.';
      } else if (phaseKey === 'phase_decline') {
        guidanceSentence = hasWarning
          ? 'Best to refrain from disputes, rushing, and new projects — focus on finishing ongoing tasks.'
          : 'Best to refrain from launching new projects, extra commitments, and abrupt changes — focus on finishing ongoing work.';
      } else if (phaseKey === 'phase_rise') {
        guidanceSentence = hasWarning
          ? 'Avoid scattering focus or making unverified promises — lean into step-by-step planning and checking details.'
          : 'Favorable to focus on step-by-step planning, gathering data, and calm launch preparation.';
      } else {
        guidanceSentence = hasWarning
          ? 'Avoid harshness and hasty conflicts — channel high resources into key negotiations and demanding tasks.'
          : 'Favorable to channel high resources into key negotiations, major project launches, and decisive action.';
      }

      mainText = `${courseSentence} ${guidanceSentence}`;
      break;
    }
  }

  return {
    mainLabel: resourceLabel,
    mainText,
    backdropLabel,
    backdropText
  };
}

function formatUntilTimeSuffix(baseLang, timeStr) {
  if (!timeStr) return '';
  switch (baseLang) {
    case 'ru': return ` (до ${timeStr})`;
    case 'es': return ` (hasta las ${timeStr})`;
    case 'de': return ` (bis ${timeStr})`;
    case 'fr': return ` (jusqu'à ${timeStr})`;
    default: return ` (until ${timeStr})`;
  }
}

function formatDayIngressFocus(baseLang, canonicalSign, signName, hintText, timeStr) {
  const ruSign = getRuZodiacGenitive(canonicalSign, signName);
  switch (baseLang) {
    case 'ru': return `С ${timeStr} Луна переходит в знак ${ruSign}: ${hintText}.`;
    case 'es': return `Desde las ${timeStr}, la Luna pasa a ${signName}: ${hintText}.`;
    case 'de': return `Ab ${timeStr} wechselt der Mond ins Zeichen ${signName}: ${hintText}.`;
    case 'fr': return `À partir de ${timeStr}, la Lune passe en ${signName} : ${hintText}.`;
    default: return `From ${timeStr}, the Moon enters ${signName}: ${hintText}.`;
  }
}

function formatSignShiftNote(baseLang, canonicalSign, signName, slot, ingressTimeStr = '') {
  const ruSign = getRuZodiacGenitive(canonicalSign, signName);
  if (ingressTimeStr) {
    switch (baseLang) {
      case 'ru': return `С ${ingressTimeStr} Луна переходит в знак ${ruSign}.`;
      case 'es': return `Desde las ${ingressTimeStr}, la Luna pasa a ${signName}.`;
      case 'de': return `Ab ${ingressTimeStr} wechselt der Mond ins Zeichen ${signName}.`;
      case 'fr': return `À partir de ${ingressTimeStr}, la Lune passe en ${signName}.`;
      default: return `From ${ingressTimeStr}, the Moon enters ${signName}.`;
    }
  }
  switch (baseLang) {
    case 'ru':
      return slot === 'evening'
        ? `К вечеру фон смещается в сторону знака ${ruSign}.`
        : `В середине дня фокус смещается в сторону знака ${ruSign}.`;
    case 'es':
      return slot === 'evening'
        ? `Hacia la noche el tono cambia hacia ${signName}.`
        : `Al mediodía el enfoque cambia hacia ${signName}.`;
    case 'de':
      return slot === 'evening'
        ? `Am Abend wechselt die Stimmung ins Zeichen ${signName}.`
        : `Mittags verlagert sich der Fokus ins Zeichen ${signName}.`;
    case 'fr':
      return slot === 'evening'
        ? `En soirée, l'ambiance bascule vers ${signName}.`
        : `En milieu de journée, le focus passe en ${signName}.`;
    default:
      return slot === 'evening'
        ? `By evening, the lunar tone shifts toward ${signName}.`
        : `By midday, the lunar focus shifts toward ${signName}.`;
  }
}

function ensureSentence(str) {
  const s = String(str || '').trim();
  if (!s) return '';
  return /[.!?]$/.test(s) ? s : `${s}.`;
}

function buildSlotCardsData(baseLang, ctx) {
  const {
    labels,
    isPersonal,
    phaseKey,
    phaseVariantLine,
    phaseDayNote,
    roleTone,
    bridgeText,
    edgeDetail,
    bgDetail,
    canonicalSign,
    signName,
    zodiacHint,
    dayZodiacHint,
    ingressInfo,
    morningCanonicalSign,
    dayCanonicalSign,
    eveningCanonicalSign,
    morningSignName,
    daySignName,
    eveningSignName,
    signShiftedDay,
    signShiftedEvening,
    windowCues,
    detailedTrendLabel,
    activeLunarDay,
    lunarDayFullLabel,
    firstDay,
    secondDay,
    transitionTimeStr,
    tips
  } = ctx;

  const bridgePrefix = bridgeText ? `${bridgeText} ` : '';
  const ingressTime = ingressInfo?.timeStr || '';

  // 1. Morning text (uses L0 phaseVariant/phaseDayNote + harmonized L1 roleTone + L2 morning focus cue + morning lifestyle tip)
  let morningText = '';
  const morningCue = ensureSentence(windowCues?.morning);
  if (isPersonal) {
    morningText = [phaseVariantLine || phaseDayNote, roleTone, morningCue, tips.morning].filter(Boolean).join(' ');
  } else {
    const mSign = morningSignName || signName;
    const mCanonical = morningCanonicalSign || canonicalSign;
    const untilSuffix = signShiftedDay && ingressTime ? formatUntilTimeSuffix(baseLang, ingressTime) : '';
    const guestMorningByLang = {
      ru: `Утренний ориентир задаёт ${uncapitalizeFirst(detailedTrendLabel)} в знаке ${getRuZodiacGenitive(mCanonical, mSign)}${untilSuffix}.`,
      es: `La mañana queda marcada por ${uncapitalizeFirst(detailedTrendLabel)} en ${mSign}${untilSuffix}.`,
      de: `Den Morgen prägt die Phase ${detailedTrendLabel} im Zeichen ${mSign}${untilSuffix}.`,
      fr: `La matinée est guidée par ${uncapitalizeFirst(detailedTrendLabel)} en ${mSign}${untilSuffix}.`,
      en: `The morning tone is set by ${uncapitalizeFirst(detailedTrendLabel)} in ${mSign}${untilSuffix}.`
    };
    morningText = [guestMorningByLang[baseLang] || guestMorningByLang.en, morningCue, tips.morning].filter(Boolean).join(' ');
  }

  // 2. Day text (primary fast/baseline edge + bridged weekly background + intraday day shift note + L2 day focus cue + day tip)
  let dayTactics = '';
  let dayShiftNote = '';
  if (isPersonal && edgeDetail) {
    const aspectLine = `${edgeDetail.actorTitle} — ${uncapitalizeFirst(edgeDetail.maneuverTitle)}. ${edgeDetail.scenarioAdvice} ${edgeDetail.dynamicText}`.trim();
    let bgLine = '';
    if (bgDetail) {
      const bgLead = formatWeeklyBackgroundLead(baseLang, labels, bgDetail, edgeDetail);
      const bgSentence = `${bgDetail.actorTitle} — ${uncapitalizeFirst(bgDetail.maneuverTitle)}: ${uncapitalizeFirst(bgDetail.advice)}`;
      bgLine = `${bgLead}: ${bgSentence}`;
    }
    dayTactics = `${bridgePrefix}${aspectLine}${bgLine ? ` ${bgLine}` : ''}`.trim();
    dayShiftNote = signShiftedDay
      ? formatSignShiftNote(baseLang, dayCanonicalSign || canonicalSign, daySignName, 'day', ingressTime)
      : '';
  } else {
    const dCanonical = dayCanonicalSign || canonicalSign;
    const dSignName = daySignName || signName;
    const dHint = dayZodiacHint || zodiacHint;
    if (signShiftedDay && ingressTime) {
      dayTactics = `${bridgePrefix}${formatDayIngressFocus(baseLang, dCanonical, dSignName, dHint, ingressTime)}`.trim();
    } else {
      const dRuGen = getRuZodiacGenitive(dCanonical, dSignName);
      const signFocusByLang = {
        ru: `Фокус знака ${dRuGen}: ${dHint}.`,
        es: `Enfoque lunar en ${dSignName}: ${dHint}.`,
        de: `Fokus im Zeichen ${dSignName}: ${dHint}.`,
        fr: `Focus de la Lune en ${dSignName} : ${dHint}.`,
        en: `Moon focus in ${dSignName}: ${dHint}.`
      };
      dayTactics = `${bridgePrefix}${signFocusByLang[baseLang] || signFocusByLang.en}`.trim();
      dayShiftNote = signShiftedDay
        ? formatSignShiftNote(baseLang, dCanonical, dSignName, 'day', ingressTime)
        : '';
    }
  }
  const dayCue = ensureSentence(windowCues?.day);
  const dayText = [dayTactics, dayShiftNote, dayCue, tips.day].filter(Boolean).join(' ');

  // 3. Evening text (strictly evening closing guidance, evening sign/lunar transition only if >= 18:00, L2 evening cue, evening tip)
  const transitionHour = transitionTimeStr ? Number(String(transitionTimeStr).split(':')[0]) : NaN;
  const isEveningTransition = firstDay !== secondDay && Number.isFinite(transitionHour) && transitionHour >= 18;
  const transitionNoteByLang = {
    ru: `Смена лунных суток — вечером в ${transitionTimeStr}.`,
    es: `El cambio de día lunar será esta tarde a las ${transitionTimeStr}.`,
    de: `Der Wechsel des Mondtags erfolgt abends um ${transitionTimeStr}.`,
    fr: `Le changement de jour lunaire aura lieu ce soir à ${transitionTimeStr}.`,
    en: `Lunar day transitions this evening at ${transitionTimeStr}.`
  };
  const wrapLine = buildEveningWrapLine(baseLang, {
    isPersonal,
    phaseKey,
    activeLunarDay,
    lunarDayFullLabel
  });
  const transLine = isEveningTransition ? (transitionNoteByLang[baseLang] || transitionNoteByLang.en) : '';
  const eveningShiftNote = signShiftedEvening
    ? formatSignShiftNote(baseLang, eveningCanonicalSign || canonicalSign, eveningSignName, 'evening', ingressTime)
    : '';
  const eveningCue = ensureSentence(windowCues?.evening);
  const eveningText = [wrapLine, eveningShiftNote, transLine, eveningCue, tips.evening].filter(Boolean).join(' ');

  return [
    { slot: 'morning', title: labels.slot_morning_title, text: morningText },
    { slot: 'day', title: labels.slot_day_title, text: dayText },
    { slot: 'evening', title: labels.slot_evening_title, text: eveningText }
  ];
}

function renderHeroAndToday(dict) {
  const labels = getUILabels(dict);
  const lang = dict.meta?.lang || 'ru-RU';
  const baseLang = lang.toLowerCase().split(/[-_]/)[0];
  const now = new Date();
  const todayStart = startOfDay(now);
  const selectedStart = startOfDay(selectedDate);
  const isToday = selectedStart.getTime() === todayStart.getTime();
  const isPastDate = selectedStart.getTime() < todayStart.getTime();
  const refMoment = isToday
    ? now
    : new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 21, 0, 0, 0);

  const summary = getCalendarDayLunarSummary(selectedDate, refMoment);
  const personal = appState.birthDate
    ? computePersonalState(appState.birthDate, selectedDate, refMoment, appState.birthTime)
    : null;

  // Hero container background
  const heroCard = document.getElementById('hero-card');
  const bgHex = personal ? personal.headerColor : PHASE_COLORS.neutral;
  heroCard.style.backgroundColor = bgHex;
  document.documentElement.style.setProperty('--hero-bg', bgHex);

  // Top-left: Moon illumination with 1 decimal place
  document.getElementById('hero-illumination').textContent =
    `${summary.phaseInfo.illuminationExact.toFixed(1)} %`;

  // Bottom-left: Active alarm bell indicator
  const alarmBtn = document.getElementById('btn-active-alarm');
  if (appState.activeAlarm) {
    alarmBtn.classList.remove('hidden');
    alarmBtn.title = `${labels.hero_alarm_title}: ${appState.activeAlarm.text || labels.day_note_title}`;
    alarmBtn.setAttribute('aria-label', labels.hero_alarm_aria);
  } else {
    alarmBtn.classList.add('hidden');
    alarmBtn.title = labels.hero_alarm_title;
    alarmBtn.setAttribute('aria-label', labels.hero_alarm_aria);
  }

  // Moon canvas
  renderMoonCanvas(document.getElementById('moon-canvas'), summary.phaseInfo);

  // Center top row: Moon age (X.X) + zodiac sign superscript + localized unit
  const sign = summary.phaseInfo.zodiacSign;
  const signName = getLocalizedZodiacSign(dict, sign);
  document.getElementById('hero-day').textContent = summary.phaseInfo.moonAge.toFixed(1);
  document.getElementById('hero-sup-top').textContent = signName;
  document.getElementById('hero-age-unit').textContent = labels.moon_age_unit;

  // Center bottom row: symmetrical lunar day pair with start time superscripts above both numbers
  document.getElementById('hero-lunar-first').textContent = String(summary.firstDay);
  document.getElementById('hero-lunar-second').textContent = String(summary.secondDay);
  document.getElementById('hero-lunar-first-time').textContent = summary.firstDayStartTimeStr;
  document.getElementById('hero-lunar-second-time').textContent = summary.secondDayStartTimeStr;
  document.getElementById('hero-lunar-slot-first').classList.toggle('is-active', summary.activeIndex === 0);
  document.getElementById('hero-lunar-slot-second').classList.toggle('is-active', summary.activeIndex === 1);

  // Center third row: moonrise and moonset times for selected calendar day
  document.getElementById('hero-moonrise').textContent = summary.moonriseStr || '--:--';
  document.getElementById('hero-moonset').textContent = summary.moonsetStr || '--:--';

  // Top-right trend glyph + exact 8-phase localized tooltip
  const trendLabel = dict.moon_trends?.[summary.phaseInfo.trend] || '';
  const detailedTrendLabel =
    dict.moon_phase_names?.[summary.phaseInfo.detailedTrend] ||
    trendLabel ||
    labels.hero_trend_title;
  const trendEl = document.getElementById('hero-trend');
  trendEl.textContent = summary.phaseInfo.trendGlyph;
  trendEl.title = detailedTrendLabel;
  trendEl.setAttribute('aria-label', detailedTrendLabel);

  // Context bar above timeline: "<Phase badge> · <Date>" in State B, "<Date>" in State A
  const humanDate = formatHumanDate(selectedDate, lang);
  const dateLabel = personal
    ? `${dict.phases[personal.phaseKey]?.badge || ''} · ${humanDate}`
    : (isToday ? `${labels.label_today} · ${humanDate}` : humanDate);
  document.getElementById('selected-date-label').textContent = dateLabel;
  document.getElementById('btn-back-today').classList.toggle('hidden', isToday);

  const zodiacHint = dict.zodiac_hints?.[sign] || '';
  const lunarDayNote = dict.lunar_days?.[String(summary.activeLunarDay)] || '';
  const dayStatus = resolveDayStatus(personal, summary, dict, labels);

  const phaseKeyForTips = personal
    ? personal.phaseKey
    : mapGuestPhaseKey(summary.phaseInfo.detailedTrend);
  const dayInPhaseForTips = personal ? personal.phaseStage.dayInPhase : 1;

  const dateSeed = toISODate(selectedDate);
  const dayTheme = getDayTheme(dict, sign);
  const dayThemeFocus = dayTheme?.focus || '';
  const tips = {
    morning: getRotatedLifestyleTip(dict, phaseKeyForTips, 'morning', summary.activeLunarDay, dayInPhaseForTips, dateSeed),
    day: getRotatedLifestyleTip(dict, phaseKeyForTips, 'day', summary.activeLunarDay, dayInPhaseForTips, dateSeed),
    evening: getRotatedLifestyleTip(dict, phaseKeyForTips, 'evening', summary.activeLunarDay, dayInPhaseForTips, dateSeed)
  };
  const windowCues = {
    morning: getWindowFocusCue(dict, 'morning', dateSeed),
    day: getWindowFocusCue(dict, 'day', dateSeed),
    evening: getWindowFocusCue(dict, 'evening', dateSeed)
  };

  let phaseTitle = '';
  let profileTitle = '';
  let ageTitle = '';
  let roleTitle = '';
  let phaseDayNote = '';
  let phaseVariantLine = '';
  let roleTone = '';
  let bridgeText = '';
  let edgeDetail = null;
  let bgDetail = null;

  if (personal) {
    const phaseObj = dict.phases[personal.phaseKey];
    const profileObj = dict.profiles[personal.profileKey];
    const roleObj = dict.roles[personal.roleKey];
    const ageObj = dict.age_classes[personal.ageClassKey];
    phaseTitle = phaseObj?.title || '';
    profileTitle = profileObj?.title || '';
    ageTitle = ageObj?.title || '';
    roleTitle = roleObj?.title || '';
    phaseDayNote =
      dict.phase_day_notes?.[personal.phaseKey]?.[personal.phaseStage.key] ||
      personal.phaseStage.hint;
    phaseVariantLine = getPhaseVariantLine(dict, personal.phaseKey, dateSeed);
    roleTone = getRoleToneOrHint(dict, personal.roleKey, personal.phaseKey);
    bridgeText = buildHarmonyBridge(personal, sign, personal.dailyFocusEdge, dict);

    if (personal.dailyFocusEdge) {
      const top = personal.dailyFocusEdge;
      const actor = dict.actors[top.actorKey] || dict.actors.actor_moon;
      const maneuver = dict.maneuvers[top.aspectKey];
      edgeDetail = {
        actorTitle: actor.title,
        maneuverTitle: maneuver?.title || '',
        valence: maneuver?.valence || 'neutral',
        scenarioAdvice: getEdgeScenarioAdvice(dict, top),
        dynamicText: dict.aspect_dynamics?.[top.dynamicKey] || ''
      };
    }

    if (personal.backgroundEdge) {
      const bg = personal.backgroundEdge;
      const bgActor = dict.actors[bg.actorKey] || dict.actors.actor_outer;
      const bgManeuver = dict.maneuvers[bg.aspectKey];
      bgDetail = {
        actorTitle: bgActor.title,
        maneuverTitle: bgManeuver?.title || '',
        valence: bgManeuver?.valence || 'neutral',
        advice: getEdgeScenarioAdvice(dict, bg),
        isExact: personal.isBackgroundExactPeak
      };
    }
  }

  const hasWarning = Boolean(
    personal?.dailyFocusEdge &&
    dict.maneuvers?.[personal.dailyFocusEdge.aspectKey]?.valence === 'warning'
  );

  const ingressInfo = summary.signIngress
    ? {
        fromCanonical: summary.signIngress.fromSign,
        toCanonical: summary.signIngress.toSign,
        fromSignName: getLocalizedZodiacSign(dict, summary.signIngress.fromSign),
        toSignName: getLocalizedZodiacSign(dict, summary.signIngress.toSign),
        timeStr: summary.signIngress.timeStr
      }
    : null;

  const introBlocks = buildTodayIntroText(baseLang, {
    labels,
    isToday,
    isPersonal: Boolean(personal),
    statusKey: dayStatus.key,
    hasWarning,
    phaseKey: personal?.phaseKey,
    phaseTitle,
    dayInPhase: personal?.phaseStage?.dayInPhase || 1,
    totalDays: personal?.phaseStage?.totalDays || 8,
    profileTitle,
    ageTitle,
    roleTitle,
    dayThemeFocus,
    activeLunarDay: summary.activeLunarDay,
    firstDay: summary.firstDay,
    secondDay: summary.secondDay,
    activeIndex: summary.activeIndex,
    transitionTimeStr: summary.transitionTimeStr,
    lunarDayFullLabel: labels.lunar_day_full,
    lunarDayNote,
    canonicalSign: sign,
    signName,
    ingressInfo,
    zodiacHint,
    detailedTrendLabel,
    illuminationStr: summary.phaseInfo.illuminationExact.toFixed(1)
  });

  // Today cards container: 1 unified summary intro block + 3 Morning/Day/Evening cards
  const cardsEl = document.getElementById('today-cards');
  cardsEl.innerHTML = '';

  const summaryCard = document.createElement('article');
  summaryCard.className = 'surface-card today-summary-card';
  const summaryHeading = personal ? labels.today_course_heading : labels.today_guest_heading;

  const titleEl = document.createElement('div');
  titleEl.className = 'card-title';
  titleEl.textContent = summaryHeading;
  summaryCard.appendChild(titleEl);

  const mainPara = document.createElement('p');
  mainPara.className = 'today-summary-text';
  if (introBlocks.mainLabel) {
    const lbl = document.createElement('strong');
    lbl.className = 'today-inline-label';
    lbl.textContent = `${introBlocks.mainLabel}: `;
    mainPara.appendChild(lbl);
  }
  mainPara.appendChild(document.createTextNode(introBlocks.mainText));
  summaryCard.appendChild(mainPara);

  if (introBlocks.backdropText) {
    const backdropPara = document.createElement('p');
    backdropPara.className = 'today-summary-text today-backdrop-text';
    if (introBlocks.backdropLabel) {
      const bLbl = document.createElement('strong');
      bLbl.className = 'today-inline-label';
      bLbl.textContent = `${introBlocks.backdropLabel}: `;
      backdropPara.appendChild(bLbl);
    }
    backdropPara.appendChild(document.createTextNode(introBlocks.backdropText));
    summaryCard.appendChild(backdropPara);
  }
  cardsEl.appendChild(summaryCard);

  const wMorningSign = summary.windows?.morning?.zodiacSign || sign;
  const wDaySign = summary.windows?.day?.zodiacSign || sign;
  const wEveningSign = summary.windows?.evening?.zodiacSign || sign;
  const morningSignName = getLocalizedZodiacSign(dict, wMorningSign);
  const daySignName = getLocalizedZodiacSign(dict, wDaySign);
  const eveningSignName = getLocalizedZodiacSign(dict, wEveningSign);
  const dayZodiacHint = dict.zodiac_hints?.[wDaySign] || zodiacHint;

  const slotCards = buildSlotCardsData(baseLang, {
    labels,
    isPersonal: Boolean(personal),
    phaseKey: personal?.phaseKey,
    phaseVariantLine,
    phaseDayNote,
    roleTone,
    bridgeText,
    edgeDetail,
    bgDetail,
    canonicalSign: sign,
    signName,
    zodiacHint,
    dayZodiacHint,
    ingressInfo,
    morningCanonicalSign: wMorningSign,
    dayCanonicalSign: wDaySign,
    eveningCanonicalSign: wEveningSign,
    morningSignName,
    daySignName,
    eveningSignName,
    signShiftedDay: wDaySign !== wMorningSign,
    signShiftedEvening: wEveningSign !== wDaySign,
    windowCues,
    detailedTrendLabel,
    activeLunarDay: summary.activeLunarDay,
    lunarDayFullLabel: labels.lunar_day_full,
    firstDay: summary.firstDay,
    secondDay: summary.secondDay,
    transitionTimeStr: summary.transitionTimeStr,
    tips
  });

  const activeSlot = personal ? personal.timeSlot : getTimeSlot(now);
  const slotOrder = ['morning', 'day', 'evening'];
  const activeSlotIdx = slotOrder.indexOf(activeSlot);

  slotCards.forEach((item, idx) => {
    const slotCard = document.createElement('article');
    let stateClass = '';
    if (isToday) {
      if (idx === activeSlotIdx) stateClass = ' is-active';
      else if (idx < activeSlotIdx) stateClass = ' is-past';
    } else if (isPastDate) {
      stateClass = ' is-past';
    }
    slotCard.className = `surface-card slot-card${stateClass}`;
    slotCard.innerHTML = `
      <div class="slot-card-title"></div>
      <p class="card-desc"></p>
    `;
    slotCard.querySelector('.slot-card-title').textContent = item.title;
    slotCard.querySelector('.card-desc').textContent = item.text;
    cardsEl.appendChild(slotCard);
  });
}

function getRemindersForDate(dateObj, activeLunarDay) {
  const iso = toISODate(dateObj);
  return appState.reminders.filter(r => {
    if (!r.enabled) return false;
    if (r.mode === 'date' && r.dateISO === iso) return true;
    if (r.mode === 'lunar') {
      if (r.repeatMonthly && r.lunarDay === activeLunarDay) return true;
      if (r.nextTriggerAt && toISODate(new Date(r.nextTriggerAt)) === iso) return true;
    }
    return false;
  });
}

function renderTimelineStrip(dict) {
  const labels = getUILabels(dict);
  const lang = dict.meta?.lang || 'ru-RU';
  const strip = document.getElementById('lunar-timeline-strip');
  strip.innerHTML = '';

  const today = startOfDay(new Date());
  const fragment = document.createDocumentFragment();
  let selectedCellEl = null;

  for (let offset = -30; offset <= 30; offset++) {
    // Evaluate each timeline cell strictly at 21:00 local time so lunar day numbers progress cleanly
    const cellDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset, 21, 0, 0, 0);
    const isTodayCell = offset === 0;
    const isSelectedCell = isSameCalendarDay(cellDate, selectedDate);

    const summary = getCalendarDayLunarSummary(cellDate, cellDate);
    const personal = appState.birthDate
      ? computePersonalState(appState.birthDate, cellDate, cellDate, appState.birthTime)
      : null;

    const matchingReminders = getRemindersForDate(cellDate, summary.activeLunarDay);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'timeline-cell';
    if (isTodayCell) btn.classList.add('is-today');
    if (isSelectedCell) {
      btn.classList.add('is-selected');
      selectedCellEl = btn;
    }
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-selected', String(isSelectedCell));

    if (matchingReminders.length) {
      const dot = document.createElement('span');
      dot.className = 'tl-reminder-dot';
      dot.title = labels.timeline_has_reminder;
      btn.appendChild(dot);
    }

    const dateSpan = document.createElement('span');
    dateSpan.className = 'tl-date tabular-nums';
    dateSpan.textContent = formatShortDate(cellDate, lang);
    btn.appendChild(dateSpan);

    btn.appendChild(createMiniMoonCanvas(summary.phaseInfo));

    const lunarSpan = document.createElement('span');
    lunarSpan.className = 'tl-lunar-day tabular-nums';
    lunarSpan.textContent = String(summary.activeLunarDay);
    btn.appendChild(lunarSpan);

    if (personal) {
      const bar = document.createElement('span');
      bar.className = 'tl-phase-bar';
      bar.style.background = personal.headerColor;
      btn.appendChild(bar);
    }

    btn.addEventListener('click', () => {
      selectedDate = startOfDay(cellDate);
      renderHeroAndToday(getActiveDictionary());
      renderTimelineStrip(getActiveDictionary());
      openDayNotePanel(cellDate, summary, personal);
    });

    fragment.appendChild(btn);
  }

  strip.appendChild(fragment);

  if (selectedCellEl) {
    requestAnimationFrame(() => {
      selectedCellEl.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
    });
  }
}

function openDayNotePanel(dateObj, summary, personal) {
  dayNoteTargetDate = startOfDay(dateObj);
  const dict = getActiveDictionary();
  const labels = getUILabels(dict);
  const lang = dict.meta?.lang || 'ru-RU';
  const panel = document.getElementById('day-note-panel');
  panel.classList.remove('hidden');

  document.getElementById('day-note-title').textContent = formatHumanDate(dateObj, lang);
  const phaseLabel = personal
    ? ` · ${dict.phases[personal.phaseKey]?.title || ''}`
    : '';
  const signName = getLocalizedZodiacSign(dict, summary.phaseInfo.zodiacSign);
  document.getElementById('day-note-meta').textContent =
    `${summary.activeLunarDay} ${labels.lunar_day_full} · ${signName}${phaseLabel}`;

  const existingWrap = document.getElementById('day-note-existing');
  const existing = getRemindersForDate(dateObj, summary.activeLunarDay);
  existingWrap.innerHTML = '';

  existing.forEach(rem => {
    const row = document.createElement('div');
    row.className = 'day-note-item';
    const textSpan = document.createElement('span');
    textSpan.textContent = rem.text;
    const speakBtn = document.createElement('button');
    speakBtn.type = 'button';
    speakBtn.className = 'icon-btn-tiny';
    speakBtn.textContent = labels.btn_speak;
    speakBtn.addEventListener('click', () => {
      speakText(rem.text, labels.reminder_prefix_tts);
    });
    row.append(textSpan, speakBtn);
    existingWrap.appendChild(row);
  });

  document.getElementById('day-note-input').value = '';
}

function renderRemindersList(dict) {
  const labels = getUILabels(dict);
  const lang = dict.meta?.lang || 'ru-RU';
  const container = document.getElementById('reminders-list');
  container.innerHTML = '';

  if (!appState.reminders.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = labels.reminders_empty;
    container.appendChild(empty);
    return;
  }

  appState.reminders.forEach(rem => {
    const item = document.createElement('article');
    item.className = `reminder-item ${rem.enabled ? '' : 'is-disabled'}`;

    const nextDateStr = rem.nextTriggerAt
      ? formatHumanDate(new Date(rem.nextTriggerAt), lang)
      : rem.dateISO || '';
    const modeLabel =
      rem.mode === 'lunar'
        ? `${rem.lunarDay} ${labels.lunar_day_short}${rem.repeatMonthly ? ` · ${labels.label_every_month}` : ''}`
        : `${rem.dateISO} (${rem.lunarDay} ${labels.lunar_day_short})`;

    item.innerHTML = `
      <div class="reminder-head">
        <span class="reminder-meta tabular-nums">${modeLabel} · ${nextDateStr}</span>
        <div class="reminder-controls">
          <button type="button" class="icon-btn-tiny" data-act="speak">${labels.btn_speak}</button>
          <button type="button" class="icon-btn-tiny" data-act="toggle">${rem.enabled ? labels.btn_toggle_off : labels.btn_toggle_on}</button>
          <button type="button" class="icon-btn-tiny danger" data-act="delete">${labels.btn_delete}</button>
        </div>
      </div>
      <p class="reminder-text"></p>
    `;
    item.querySelector('.reminder-text').textContent = rem.text;

    item.querySelector('[data-act="speak"]').addEventListener('click', () => {
      speakText(rem.text, labels.reminder_prefix_tts);
    });
    item.querySelector('[data-act="toggle"]').addEventListener('click', async () => {
      const updated = appState.reminders.map(r =>
        r.id === rem.id ? { ...r, enabled: !r.enabled } : r
      );
      await persistReminders(updated);
      renderUI();
    });
    item.querySelector('[data-act="delete"]').addEventListener('click', async () => {
      const updated = appState.reminders.filter(r => r.id !== rem.id);
      await persistReminders(updated);
      renderUI();
    });

    container.appendChild(item);
  });
}

function formatIsoToDisplayDate(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoStr.trim());
  if (!m) return '';
  return `${m[3]}.${m[2]}.${m[1]}`;
}

function parseDisplayOrIsoDate(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  let y, m, d;
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  const dmyMatch = /^(\d{2})[.\/:-](\d{2})[.\/:-](\d{4})$/.exec(s);
  if (isoMatch) {
    y = Number(isoMatch[1]);
    m = Number(isoMatch[2]);
    d = Number(isoMatch[3]);
  } else if (dmyMatch) {
    d = Number(dmyMatch[1]);
    m = Number(dmyMatch[2]);
    y = Number(dmyMatch[3]);
  } else {
    return null;
  }
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, m - 1, d, 12, 0, 0, 0);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function maskBirthDateDigits(raw) {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 8)}`;
}

function renderSettingsPanel(dict) {
  const labels = getUILabels(dict);
  const birthInput = document.getElementById('input-birth-date');
  const birthPicker = document.getElementById('input-birth-date-picker');
  const displayBirth = formatIsoToDisplayDate(appState.birthDate);
  if (typeof document.activeElement === 'undefined' || document.activeElement !== birthInput || !displayBirth) {
    birthInput.value = displayBirth;
  }
  if (birthPicker) {
    birthPicker.value = appState.birthDate || '';
  }
  document.getElementById('input-birth-time').value = appState.birthTime || '';

  const profileBox = document.getElementById('profile-summary-box');
  if (appState.birthDate) {
    const personal = computePersonalState(appState.birthDate, new Date(), new Date(), appState.birthTime);
    const prof = dict.profiles[personal.profileKey];
    const age = dict.age_classes[personal.ageClassKey];
    profileBox.classList.remove('hidden');
    profileBox.innerHTML = `
      <strong>${prof.title}</strong> · ${age.title}<br/>
      <span>${prof.short_desc} (${labels.label_birth_lunar_age}: ${personal.birthMoonAge.toFixed(1)} ${labels.moon_age_unit})</span>
    `;
  } else {
    profileBox.classList.add('hidden');
    profileBox.innerHTML = '';
  }

  document.getElementById('input-morning-enabled').checked = Boolean(
    appState.notifications.morningEnabled
  );
  document.getElementById('input-day-enabled').checked = Boolean(
    appState.notifications.dayEnabled
  );
  document.getElementById('input-evening-enabled').checked = Boolean(
    appState.notifications.eveningEnabled
  );
  document.getElementById('input-alarm-push-enabled').checked = Boolean(
    appState.notifications.alarmPushEnabled
  );
  document.getElementById('input-time-morning').value = appState.notifications.morning || '08:30';
  document.getElementById('input-time-day').value = appState.notifications.day || '13:30';
  document.getElementById('input-time-evening').value = appState.notifications.evening || '20:30';

  // Built-in language & Dictionary switcher
  document.getElementById('select-builtin-lang').value = appState.builtinLang || detectDefaultLang();
  const btnDef = document.getElementById('dict-mode-default');
  const btnCust = document.getElementById('dict-mode-custom');
  btnDef.classList.toggle('active', appState.dictionaryMode === 'default');
  btnCust.classList.toggle('active', appState.dictionaryMode === 'custom');

  const metaBox = document.getElementById('dict-meta-info');
  metaBox.innerHTML = `
    <strong>${escapeHtml(dict.meta?.name || labels.app_title)}</strong> · ${escapeHtml(labels.label_dict_lang)}: <code>${escapeHtml(dict.meta?.lang || 'ru-RU')}</code><br/>
    <span>${escapeHtml(dict.meta?.description || '')}</span>
  `;

  void populateVoiceSelector();
}

async function populateVoiceSelector() {
  const select = document.getElementById('select-voice');
  const voices = await getVoicesList();
  const dict = getActiveDictionary();
  const labels = getUILabels(dict);
  const langPrefix = (dict.meta?.lang || 'ru-RU').split('-')[0].toLowerCase();

  select.innerHTML = '';

  const autoOpt = document.createElement('option');
  autoOpt.value = '';
  autoOpt.textContent = `${labels.label_voice_auto} (${dict.meta?.lang || 'ru-RU'})`;
  select.appendChild(autoOpt);

  const sorted = [...voices].sort((a, b) => {
    const aLang = (a.lang || '').toLowerCase();
    const bLang = (b.lang || '').toLowerCase();
    const aMatch = aLang.startsWith(langPrefix) ? 0 : 1;
    const bMatch = bLang.startsWith(langPrefix) ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });

  sorted.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.voiceURI;
    opt.textContent = `${v.name} (${v.lang})`;
    select.appendChild(opt);
  });

  select.value = appState.selectedVoiceURI || '';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// =========================================================================
// Reminder Calculators & Form Helpers
// =========================================================================
function updateLunarDayNextPreview() {
  const dict = getActiveDictionary();
  const labels = getUILabels(dict);
  const lang = dict.meta?.lang || 'ru-RU';
  const dayNum = Number(document.getElementById('input-lunar-day').value) || 1;
  const nextDate = findNextDateForLunarDay(dayNum, new Date());
  document.getElementById('lunar-day-next-preview').textContent =
    `${labels.label_nearest}: ${formatHumanDate(nextDate, lang)}, ${nextDate.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}`;
}

function updateCalendarDateCalcPreview() {
  const dict = getActiveDictionary();
  const labels = getUILabels(dict);
  const val = document.getElementById('input-calendar-date').value;
  const box = document.getElementById('date-calc-preview');
  const parsed = parseBirthDateString(val);
  if (!parsed) {
    box.textContent = labels.label_select_date_preview;
    return;
  }
  const summary = getCalendarDayLunarSummary(parsed, parsed);
  const personal = appState.birthDate
    ? computePersonalState(appState.birthDate, parsed, parsed, appState.birthTime)
    : null;
  const signName = getLocalizedZodiacSign(dict, summary.phaseInfo.zodiacSign);
  const phasePart = personal ? ` · ${labels.label_phase_prefix}: ${dict.phases[personal.phaseKey]?.title}` : '';
  box.textContent =
    `${summary.activeLunarDay} ${labels.lunar_day_full} (${signName}, ${summary.phaseInfo.illuminationExact.toFixed(1)}%)${phasePart}`;
}

// =========================================================================
// Notification Scheduling (replacement for the Chrome background Service Worker)
// =========================================================================
// The extension used chrome.alarms + chrome.notifications inside a Service
// Worker. In the mobile app the same logic lives in the foreground and is
// executed through @capacitor/local-notifications (AlarmManager).

/** Ежедневные чекпоинты (утро/день/вечер) и лунные будильники. */
const CHECKPOINT_SLOTS = ['morning', 'day', 'evening'];

/**
 * Строки, относящиеся к самой платформе Android (а не к лунному контенту).
 * Вынесены отдельно, чтобы не менять встроенные словари.
 */
const PLATFORM_LABELS = {
  ru: {
    exact_alarm_title: 'Точные будильники отключены',
    exact_alarm_desc:
      'Система Android не разрешает точные alarm’ы: время срабатывания уведомлений может смещаться на десятки минут.',
    exact_alarm_button: 'Разрешить точные будильники'
  },
  en: {
    exact_alarm_title: 'Exact alarms are disabled',
    exact_alarm_desc:
      'Android does not allow exact alarms: notification delivery may be delayed by tens of minutes.',
    exact_alarm_button: 'Allow exact alarms'
  },
  es: {
    exact_alarm_title: 'Las alarmas exactas están desactivadas',
    exact_alarm_desc:
      'Android no permite alarmas exactas: la entrega de notificaciones puede retrasarse decenas de minutos.',
    exact_alarm_button: 'Permitir alarmas exactas'
  },
  de: {
    exact_alarm_title: 'Exakte Alarme sind deaktiviert',
    exact_alarm_desc:
      'Android erlaubt keine exakten Alarme: Benachrichtigungen können um Zehnminuten verzögert werden.',
    exact_alarm_button: 'Exakte Alarme erlauben'
  },
  fr: {
    exact_alarm_title: 'Les alarmes exactes sont désactivées',
    exact_alarm_desc:
      'Android n’autorise pas les alarmes exactes : la notification peut être retardée de plusieurs dizaines de minutes.',
    exact_alarm_button: 'Autoriser les alarmes exactes'
  }
};

/**
 * Возвращает строки платформенных подсказок для активного языка интерфейса.
 */
function getPlatformLabels() {
  const lang = appState.builtinLang || 'ru';
  return PLATFORM_LABELS[lang] || PLATFORM_LABELS.ru;
}

/**
 * Builds the content of a daily checkpoint notification for a specific moment.
 * Mirrors showCheckpointNotification() from the extension's background.js.
 */
function buildCheckpointContent(targetMoment, slot, dict, state) {
  const baseDict = getActiveBaseDictionary();
  const labels = { ...baseDict.ui_labels, ...(dict.ui_labels || {}) };
  const summary = getCalendarDayLunarSummary(targetMoment, targetMoment);
  const signLabel = getLocalizedZodiacSign(dict, summary.phaseInfo.zodiacSign);

  let title = `${labels.app_title} · ${summary.activeLunarDay} ${labels.lunar_day_short}`;
  let message = `${signLabel} · ${summary.phaseInfo.illuminationExact.toFixed(1)}%`;

  if (state.birthDate) {
    const personal = computePersonalState(
      state.birthDate,
      targetMoment,
      targetMoment,
      state.birthTime
    );
    if (personal) {
      const phaseObj = dict.phases[personal.phaseKey];
      const rawTip = dict.lifestyle_tips[personal.phaseKey]?.[slot];
      const dateSeed = `${targetMoment.getFullYear()}-${String(
        targetMoment.getMonth() + 1
      ).padStart(2, '0')}-${String(targetMoment.getDate()).padStart(2, '0')}`;
      let tip = '';
      if (Array.isArray(rawTip) && rawTip.length) {
        const seedStr = `${dateSeed}|${personal.phaseKey}|${slot}|tip`;
        let h = 2166136261;
        for (let i = 0; i < seedStr.length; i++) {
          h ^= seedStr.charCodeAt(i);
          h = Math.imul(h, 16777619);
        }
        tip = rawTip[(h >>> 0) % rawTip.length];
      } else if (typeof rawTip === 'string') {
        tip = rawTip;
      }
      const roleTone = dict.role_tone?.[personal.roleKey]?.[personal.phaseKey] || '';
      title = `${labels.app_title} · ${phaseObj.badge} (${summary.activeLunarDay} ${labels.lunar_day_short})`;
      message = [phaseObj.title + '.', roleTone, tip].filter(Boolean).join(' ').trim();
    }
  }

  return { title, body: message };
}

/**
 * Builds the content of a lunar alarm notification.
 */
function buildAlarmContent(reminder, dict) {
  const labels = dict.ui_labels || {};
  return {
    title: `${labels.app_title} · ${reminder.lunarDay} ${labels.lunar_day_short}`,
    body: reminder.text || labels.reminder_prefix_tts || ''
  };
}

/**
 * Computes the upcoming fire moments for a reminder.
 *
 * - A monthly lunar alarm yields several future occurrences (so that the
 *   alarm keeps working even if the app is opened rarely);
 * - A one-time alarm yields a single moment.
 */
function computeAlarmOccurrences(reminder) {
  const now = Date.now();
  const moments = [];

  if (reminder.mode === 'lunar' && reminder.repeatMonthly) {
    let cursor = new Date(Math.max(now + 60000, reminder.nextTriggerAt || now + 60000));
    for (let i = 0; i < notifications.ALARM_HORIZON_OCCURRENCES; i++) {
      const nextDate = findNextDateForLunarDay(reminder.lunarDay, cursor);
      if (!nextDate) break;
      if (nextDate.getTime() > now) moments.push(new Date(nextDate.getTime()));
      cursor = new Date(nextDate.getTime() + 3600000 * 6);
    }
    return moments;
  }

  if (reminder.nextTriggerAt && reminder.nextTriggerAt > now) {
    moments.push(new Date(reminder.nextTriggerAt));
  }
  return moments;
}

/**
 * Rebuilds the full notification schedule: cancels the previous one and
 * schedules the daily checkpoints plus the lunar alarms.
 */
async function rescheduleNotifications() {
  if (!notifications.isAvailable()) return;

  const state = appState;
  const dict = getActiveDictionary();
  const baseDict = getActiveBaseDictionary();
  const labels = { ...baseDict.ui_labels, ...(dict.ui_labels || {}) };

  await notifications.ensureChannels({
    checkpointChannelName: labels.channel_checkpoint_name,
    checkpointChannelDescription: labels.channel_checkpoint_description,
    alarmChannelName: labels.channel_alarm_name,
    alarmChannelDescription: labels.channel_alarm_description
  });

  await notifications.cancelAll(state.scheduledNotificationIds || []);

  const now = new Date();
  const scheduled = [];

  // Daily checkpoints: a series of exact one-shot alarms for the next N days.
  CHECKPOINT_SLOTS.forEach((slot, slotIndex) => {
    if (!state.notifications[`${slot}Enabled`]) return;
    const timeStr = state.notifications[slot];
    if (!timeStr) return;

    const [hh, mm] = String(timeStr).split(':').map(Number);
    for (let dayOffset = 0; dayOffset < notifications.CHECKPOINT_HORIZON_DAYS; dayOffset++) {
      const at = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + dayOffset,
        hh || 0,
        mm || 0,
        0,
        0
      );
      if (at.getTime() <= now.getTime()) continue;

      const content = buildCheckpointContent(at, slot, dict, state);
      scheduled.push({
        id: notifications.checkpointNotificationId(slotIndex, dayOffset),
        title: content.title,
        body: content.body,
        channelId: notifications.CHANNEL_CHECKPOINT,
        schedule: { at, allowWhileIdle: true },
        extra: { kind: 'checkpoint', slot, at: at.getTime() }
      });
    }
  });

  // Lunar alarms: 1..30 lunar days and specific calendar dates.
  const enabledReminders = state.reminders.filter((reminder) => reminder.enabled);
  enabledReminders.forEach((reminder, reminderIndex) => {
    const occurrences = computeAlarmOccurrences(reminder);
    const content = buildAlarmContent(reminder, dict);
    occurrences.forEach((at, occurrenceIndex) => {
      scheduled.push({
        id: notifications.alarmNotificationId(reminderIndex, occurrenceIndex),
        title: content.title,
        body: content.body,
        channelId: notifications.CHANNEL_ALARM,
        schedule: { at, allowWhileIdle: true },
        extra: {
          kind: 'reminder',
          reminderId: reminder.id,
          lunarDay: reminder.lunarDay,
          text: reminder.text || '',
          at: at.getTime()
        }
      });
    });
  });

  const scheduledIds = await notifications.schedule(scheduled);
  await stateStore.saveState({ scheduledNotificationIds: scheduledIds });
}

/**
 * Detects reminders whose fire moment has already passed (the alarm has
 * fired) and rolls their state forward.
 *
 * This is the mobile counterpart of handleReminderAlarm() from the
 * extension's Service Worker: when the app is opened after a lunar alarm
 * has fired, the bell indicator is activated.
 */
function detectTriggeredReminders() {
  const now = Date.now();
  let fired = null;
  let changed = false;

  const updated = appState.reminders.map((reminder) => {
    if (!reminder.enabled || !reminder.nextTriggerAt) return reminder;

    if (reminder.nextTriggerAt <= now) {
      if (!fired) fired = reminder;
      changed = true;

      if (reminder.mode === 'lunar' && reminder.repeatMonthly) {
        const nextDate = findNextDateForLunarDay(reminder.lunarDay, new Date(now + 3600000 * 6));
        return { ...reminder, nextTriggerAt: nextDate.getTime() };
      }
      return { ...reminder, enabled: false };
    }
    return reminder;
  });

  return { fired, reminders: updated, changed };
}

/**
 * Synchronizes the alarm state with the real world: activates the bell
 * indicator for a fired lunar alarm and rolls recurring alarms forward.
 */
async function syncAlarmState() {
  const { fired, reminders, changed } = detectTriggeredReminders();

  if (changed) {
    const patch = { reminders };
    if (fired && !appState.activeAlarm) {
      const dict = getActiveDictionary();
      patch.activeAlarm = {
        id: fired.id,
        text: fired.text || dict.ui_labels?.reminder_prefix_tts || '',
        lunarDay: fired.lunarDay,
        triggeredAt: Date.now()
      };
    }
    await stateStore.saveState(patch);
  }

  return fired;
}

/**
 * Requests the notification permission (Android 13+).
 */
async function ensureNotificationPermission() {
  if (!notifications.isAvailable()) return 'unavailable';
  return notifications.requestPermission();
}

/**
 * Сохраняет список напоминаний и пересобирает расписание уведомлений.
 */
async function persistReminders(reminders) {
  appState.reminders = reminders;
  await stateStore.saveState({ reminders });
  await rescheduleNotifications();
}

/**
 * Обновляет блок-предупреждение о запрете точных alarm'ов (Android 12+).
 */
async function renderExactAlarmPanel() {
  const panel = document.getElementById('exact-alarm-panel');
  if (!panel) return;

  const status = await notifications.checkExactAlarmPermission();
  if (status === 'granted' || status === 'unknown') {
    panel.classList.add('hidden');
    return;
  }

  const platformLabels = getPlatformLabels();
  document.getElementById('exact-alarm-text').textContent =
    `${platformLabels.exact_alarm_title}. ${platformLabels.exact_alarm_desc}`;
  document.getElementById('btn-exact-alarm').textContent = platformLabels.exact_alarm_button;
  panel.classList.remove('hidden');
}

// =========================================================================
// Notify Preview Host (when embedded in AI Studio web workbench)
// =========================================================================
function notifyPreviewHost() {
  if (isNativePlatform() || window.parent === window) return;
  const now = new Date();
  const dict = getActiveDictionary();
  const summary = getCalendarDayLunarSummary(now, now);
  const personal = appState.birthDate
    ? computePersonalState(appState.birthDate, now, now, appState.birthTime)
    : null;
  const hasAlarm = Boolean(appState.activeAlarm);
  window.parent.postMessage(
    {
      type: 'LUNAR_EXT_STATE',
      badgeText: hasAlarm ? '🔔' : String(summary.activeLunarDay),
      badgeColor: hasAlarm
        ? ACTIVE_ALARM_BADGE_COLOR
        : personal
        ? personal.headerColor
        : PHASE_COLORS.neutral,
      mode: personal ? 'B' : 'A',
      zodiac: getLocalizedZodiacSign(dict, summary.phaseInfo.zodiacSign)
    },
    '*'
  );
}

// =========================================================================
// Event Wiring & Initialization
// =========================================================================
function bindEvents() {
  // Bottom Navigation Tabs
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      document.querySelectorAll('.nav-tab').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `tab-${activeTab}`);
      });
    });
  });

  // Return to Today button
  const resetToToday = () => {
    selectedDate = startOfDay(new Date());
    document.getElementById('day-note-panel').classList.add('hidden');
    renderUI();
  };
  document.getElementById('btn-back-today').addEventListener('click', resetToToday);

  // Active Alarm Bell (top-left of hero): dismiss alarm, restore badge, and speak reminder
  document.getElementById('btn-active-alarm').addEventListener('click', async () => {
    if (!appState.activeAlarm) return;
    const dict = getActiveDictionary();
    const alarmText = appState.activeAlarm.text || '';
    appState.activeAlarm = null;
    await stateStore.saveState({ activeAlarm: null });
    renderUI();
    await speakText(alarmText, dict.ui_labels.reminder_prefix_tts);
  });

  // Copy External AI Prompt (compact 28x28 icon expanding into 2s confirmation pill)
  const copyPromptBtn = document.getElementById('btn-copy-ai-prompt');
  const copyPromptLabel = document.getElementById('hero-prompt-label');
  copyPromptBtn.addEventListener('click', async () => {
    const labels = getUILabels();
    const promptText = buildExternalAIPrompt();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(promptText);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      const ta = document.createElement('textarea');
      ta.value = promptText;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }

    if (copyPromptResetTimer) clearTimeout(copyPromptResetTimer);
    copyPromptLabel.textContent = labels.prompt_copied_toast;
    copyPromptBtn.classList.add('is-copied');
    copyPromptResetTimer = setTimeout(() => {
      copyPromptBtn.classList.remove('is-copied');
      copyPromptResetTimer = null;
    }, 2000);
  });

  // Speak Briefing & Stop
  document.getElementById('btn-speak-briefing').addEventListener('click', () => {
    speakText(buildBriefingSpeechText());
  });
  document.getElementById('btn-stop-speech').addEventListener('click', async () => {
    await speech.stop();
    document.getElementById('btn-stop-speech').classList.add('hidden');
  });

  // Day Note Drawer
  document.getElementById('btn-close-day-note').addEventListener('click', () => {
    document.getElementById('day-note-panel').classList.add('hidden');
  });
  document.getElementById('btn-save-day-note').addEventListener('click', async () => {
    const input = document.getElementById('day-note-input');
    const text = input.value.trim();
    if (!text || !dayNoteTargetDate) return;

    const midday = new Date(
      dayNoteTargetDate.getFullYear(),
      dayNoteTargetDate.getMonth(),
      dayNoteTargetDate.getDate(),
      9, 0, 0, 0
    );
    const summary = getCalendarDayLunarSummary(dayNoteTargetDate, midday);
    const newRem = {
      id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      mode: 'date',
      lunarDay: summary.activeLunarDay,
      dateISO: toISODate(dayNoteTargetDate),
      text,
      repeatMonthly: false,
      enabled: true,
      nextTriggerAt: midday.getTime()
    };

    await persistReminders([newRem, ...appState.reminders]);
    input.value = '';
    const personal = appState.birthDate
      ? computePersonalState(appState.birthDate, dayNoteTargetDate, midday, appState.birthTime)
      : null;
    renderUI();
    openDayNotePanel(dayNoteTargetDate, summary, personal);
  });

  // Reminders Tab: Form toggle & Mode switch
  const formEl = document.getElementById('reminder-form');
  document.getElementById('btn-toggle-reminder-form').addEventListener('click', () => {
    formEl.classList.toggle('hidden');
    updateLunarDayNextPreview();
    updateCalendarDateCalcPreview();
  });
  document.getElementById('btn-cancel-reminder').addEventListener('click', () => {
    formEl.classList.add('hidden');
  });

  document.querySelectorAll('#reminder-form .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      reminderFormMode = btn.dataset.mode;
      document.querySelectorAll('#reminder-form .seg-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.getElementById('mode-panel-lunar').classList.toggle('hidden', reminderFormMode !== 'lunar');
      document.getElementById('mode-panel-date').classList.toggle('hidden', reminderFormMode !== 'date');
    });
  });

  // Populate 1..30 lunar days dropdown
  const lunarSelect = document.getElementById('input-lunar-day');
  for (let d = 1; d <= 30; d++) {
    const opt = document.createElement('option');
    opt.value = String(d);
    opt.textContent = `${d} лунные сутки`;
    lunarSelect.appendChild(opt);
  }
  lunarSelect.addEventListener('change', updateLunarDayNextPreview);

  const calInput = document.getElementById('input-calendar-date');
  calInput.value = toISODate(new Date());
  calInput.addEventListener('change', updateCalendarDateCalcPreview);

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = document.getElementById('input-reminder-text').value.trim();
    if (!text) return;

    let newRem;
    if (reminderFormMode === 'lunar') {
      const lunarDay = Number(lunarSelect.value) || 1;
      const repeatMonthly = document.getElementById('input-repeat-monthly').checked;
      const nextDate = findNextDateForLunarDay(lunarDay, new Date());
      newRem = {
        id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        mode: 'lunar',
        lunarDay,
        dateISO: toISODate(nextDate),
        text,
        repeatMonthly,
        enabled: true,
        nextTriggerAt: nextDate.getTime()
      };
    } else {
      const dateStr = calInput.value || toISODate(new Date());
      const parsed = parseBirthDateString(dateStr) || new Date();
      const targetAt = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 9, 0, 0, 0);
      const summary = getCalendarDayLunarSummary(parsed, targetAt);
      newRem = {
        id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        mode: 'date',
        lunarDay: summary.activeLunarDay,
        dateISO: dateStr,
        text,
        repeatMonthly: false,
        enabled: true,
        nextTriggerAt: targetAt.getTime()
      };
    }

    await persistReminders([newRem, ...appState.reminders]);
    document.getElementById('input-reminder-text').value = '';
    formEl.classList.add('hidden');
    renderUI();
  });

  // Settings Tab: Birth date (language-aware mask + native picker sync) & optional birth time
  const birthInputEl = document.getElementById('input-birth-date');
  const birthPickerEl = document.getElementById('input-birth-date-picker');

  birthInputEl.addEventListener('input', async (e) => {
    const rawVal = e.target.value;
    const directIso = /^\d{4}-\d{2}-\d{2}$/.test(rawVal.trim()) ? parseDisplayOrIsoDate(rawVal) : null;
    if (directIso) {
      e.target.value = formatIsoToDisplayDate(directIso);
      if (appState.birthDate !== directIso) {
        appState.birthDate = directIso;
        await stateStore.saveState({ birthDate: directIso });
        renderUI();
      }
      return;
    }

    const digits = rawVal.replace(/\D/g, '').slice(0, 8);
    const formatted = maskBirthDateDigits(digits);
    if (e.target.value !== formatted) {
      e.target.value = formatted;
    }

    if (digits.length === 0) {
      if (appState.birthDate !== null) {
        appState.birthDate = null;
        await stateStore.saveState({ birthDate: null });
        renderUI();
      }
      return;
    }

    if (digits.length === 8) {
      const parsedIso = parseDisplayOrIsoDate(formatted);
      if (parsedIso && appState.birthDate !== parsedIso) {
        appState.birthDate = parsedIso;
        await stateStore.saveState({ birthDate: parsedIso });
        renderUI();
      }
    }
  });

  birthInputEl.addEventListener('blur', async (e) => {
    const trimmed = e.target.value.trim();
    if (!trimmed) {
      if (appState.birthDate !== null) {
        appState.birthDate = null;
        await stateStore.saveState({ birthDate: null });
        renderUI();
      }
      return;
    }
    const parsedIso = parseDisplayOrIsoDate(trimmed);
    if (parsedIso) {
      e.target.value = formatIsoToDisplayDate(parsedIso);
      if (appState.birthDate !== parsedIso) {
        appState.birthDate = parsedIso;
        await stateStore.saveState({ birthDate: parsedIso });
        renderUI();
      }
    } else {
      e.target.value = formatIsoToDisplayDate(appState.birthDate);
    }
  });

  if (birthPickerEl) {
    birthPickerEl.addEventListener('change', async (e) => {
      const iso = e.target.value || null;
      appState.birthDate = iso;
      birthInputEl.value = formatIsoToDisplayDate(iso);
      await stateStore.saveState({ birthDate: appState.birthDate });
      renderUI();
    });
  }

  document.getElementById('input-birth-time').addEventListener('change', async (e) => {
    appState.birthTime = e.target.value || null;
    await stateStore.saveState({ birthTime: appState.birthTime });
    renderUI();
  });

  document.getElementById('btn-clear-birth').addEventListener('click', async () => {
    appState.birthDate = null;
    appState.birthTime = null;
    await stateStore.saveState({ birthDate: null, birthTime: null });
    renderUI();
  });

  // Notifications (3 independent checkpoint toggles + alarm push notifications)
  const saveNotifs = async () => {
    appState.notifications = {
      morningEnabled: document.getElementById('input-morning-enabled').checked,
      dayEnabled: document.getElementById('input-day-enabled').checked,
      eveningEnabled: document.getElementById('input-evening-enabled').checked,
      alarmPushEnabled: document.getElementById('input-alarm-push-enabled').checked,
      morning: document.getElementById('input-time-morning').value || '08:30',
      day: document.getElementById('input-time-day').value || '13:30',
      evening: document.getElementById('input-time-evening').value || '20:30'
    };
    await stateStore.saveState({ notifications: appState.notifications });

    // Permission is re-requested on every settings change, then the whole
    // notification schedule is rebuilt.
    await ensureNotificationPermission();
    await rescheduleNotifications();
  };
  document.getElementById('input-morning-enabled').addEventListener('change', saveNotifs);
  document.getElementById('input-day-enabled').addEventListener('change', saveNotifs);
  document.getElementById('input-evening-enabled').addEventListener('change', saveNotifs);
  document.getElementById('input-alarm-push-enabled').addEventListener('change', saveNotifs);
  document.getElementById('input-time-morning').addEventListener('change', saveNotifs);
  document.getElementById('input-time-day').addEventListener('change', saveNotifs);
  document.getElementById('input-time-evening').addEventListener('change', saveNotifs);

  // Android 12+: переход в системные настройки точных alarm'ов
  const exactAlarmBtn = document.getElementById('btn-exact-alarm');
  if (exactAlarmBtn) {
    exactAlarmBtn.addEventListener('click', async () => {
      await notifications.requestExactAlarmPermission();
      await renderExactAlarmPanel();
      await rescheduleNotifications();
    });
  }

  // Voice
  document.getElementById('select-voice').addEventListener('change', async (e) => {
    appState.selectedVoiceURI = e.target.value || '';
    await stateStore.saveState({ selectedVoiceURI: appState.selectedVoiceURI });
  });
  document.getElementById('btn-test-voice').addEventListener('click', () => {
    const dict = getActiveDictionary();
    const sample = dict.phases?.phase_peak?.tts_summary || dict.meta?.tts_prefix || 'Проверка голоса.';
    speakText(sample);
  });

  // Built-in language & Dictionaries
  document.getElementById('select-builtin-lang').addEventListener('change', async (e) => {
    const nextLang = BUILTIN_DICTIONARIES[e.target.value] ? e.target.value : detectDefaultLang();
    appState.builtinLang = nextLang;
    appState.selectedVoiceURI = '';
    await stateStore.saveState({ builtinLang: nextLang, selectedVoiceURI: '' });
    renderUI();
  });

  document.getElementById('dict-mode-default').addEventListener('click', async () => {
    appState.dictionaryMode = 'default';
    await stateStore.saveState({ dictionaryMode: 'default' });
    renderUI();
  });

  document.getElementById('dict-mode-custom').addEventListener('click', async () => {
    const labels = getUILabels();
    const status = document.getElementById('dict-status-msg');
    if (!appState.customDictionary) {
      status.classList.remove('hidden');
      status.classList.add('error');
      status.textContent = labels.msg_upload_custom_first;
      return;
    }
    status.classList.add('hidden');
    appState.dictionaryMode = 'custom';
    await stateStore.saveState({ dictionaryMode: 'custom' });
    renderUI();
  });

  document.getElementById('btn-download-template').addEventListener('click', () => {
    const baseDict = getActiveBaseDictionary();
    const langCode = appState.builtinLang || detectDefaultLang();
    const blob = new Blob([JSON.stringify(baseDict, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `base_default_${langCode}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  document.getElementById('input-upload-dict').addEventListener('change', async (e) => {
    const labels = getUILabels();
    const file = e.target.files?.[0];
    const status = document.getElementById('dict-status-msg');
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validKeys = [
        'meta', 'profiles', 'phases', 'phase_day_notes', 'roles', 'age_classes',
        'actors', 'moon_trends', 'moon_phase_names', 'zodiac_names', 'zodiac_hints', 'lunar_days',
        'aspect_dynamics', 'maneuvers', 'actor_maneuver_matrix', 'lifestyle_tips', 'ui_labels'
      ];
      const hasKnownSection =
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        validKeys.some(k => k in parsed);

      if (!hasKnownSection) {
        throw new Error('JSON does not contain valid dictionary sections.');
      }

      const merged = deepMergeDictionary(getActiveBaseDictionary(), parsed);
      const nextLabels = getUILabels(merged);
      appState.customDictionary = merged;
      appState.dictionaryMode = 'custom';
      await stateStore.saveState({
        customDictionary: merged,
        dictionaryMode: 'custom'
      });

      status.classList.remove('hidden', 'error');
      status.textContent = `${nextLabels.msg_dict_loaded}: ${merged.meta?.name || file.name}`;
      renderUI();
    } catch (err) {
      status.classList.remove('hidden');
      status.classList.add('error');
      status.textContent = `${labels.msg_dict_error}: ${err.message}`;
    } finally {
      e.target.value = '';
    }
  });

  // Copy Raw Data (JSON) button in Settings
  const copyRawBtn = document.getElementById('btn-copy-raw-data');
  copyRawBtn.addEventListener('click', async () => {
    const labels = getUILabels();
    const now = new Date();
    const isToday = isSameCalendarDay(selectedDate, now);
    const refMoment = isToday
      ? now
      : new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 21, 0, 0, 0);

    const rawPayload = computeRawDiagnosticData(
      appState.birthDate,
      appState.birthTime,
      selectedDate,
      refMoment
    );
    const jsonText = JSON.stringify(rawPayload, null, 2);

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonText);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      const ta = document.createElement('textarea');
      ta.value = jsonText;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }

    if (copyRawResetTimer) clearTimeout(copyRawResetTimer);
    copyRawBtn.textContent = labels.raw_data_copied_toast;
    copyRawBtn.classList.add('is-copied');
    copyRawResetTimer = setTimeout(() => {
      copyRawBtn.classList.remove('is-copied');
      copyRawBtn.textContent = getUILabels().btn_copy_raw_data;
      copyRawResetTimer = null;
    }, 2000);
  });
}

/**
 * Обрабатывает отложенный автозапуск озвучки.
 *
 * В расширении Chrome переход по клику на уведомление открывал popup с
 * флагом ?autoplay=1. В мобильном приложении нажатие на уведомление в шторке
 * обрабатывается напрямую событием localNotificationActionPerformed, поэтому
 * здесь остаётся поддержка URL-флага (для предпросмотра в браузере) и
 * сохранённого pendingAutoplay.
 */
async function handlePendingAutoplay() {
  const params = new URLSearchParams(window.location.search);
  const urlAutoplay = params.get('autoplay') === '1';
  const pending = appState.pendingAutoplay;

  if (!urlAutoplay && !pending) return;

  if (pending) {
    await stateStore.saveState({ pendingAutoplay: null });
    appState.pendingAutoplay = null;
  }

  const dict = getActiveDictionary();
  if (pending && pending.type === 'reminder' && pending.text) {
    if (appState.activeAlarm) {
      appState.activeAlarm = null;
      await stateStore.saveState({ activeAlarm: null });
      renderUI();
    }
    await speakText(pending.text, dict.ui_labels.reminder_prefix_tts);
  } else {
    await speakText(buildBriefingSpeechText());
  }
}

/**
 * Регистрирует обработчик нажатия на уведомление в шторке Android.
 *
 * При нажатии приложение открывается и автоматически озвучивает текст:
 *  - для лунного будильника — текст напоминания;
 *  - для ежедневного чекпоинта — сводку ритма (как в расширении).
 */
function registerNotificationHandlers() {
  notifications.onNotificationTapped(async ({ extra }) => {
    const kind = extra?.kind || 'checkpoint';

    if (kind === 'reminder') {
      const dict = getActiveDictionary();
      const text = extra.text || appState.activeAlarm?.text || '';

      // Будильник считается обработанным — индикатор 🔔 снимается.
      if (appState.activeAlarm) {
        appState.activeAlarm = null;
        await stateStore.saveState({ activeAlarm: null });
        renderUI();
      }
      await speakText(text, dict.ui_labels?.reminder_prefix_tts || '');
      return;
    }

    await speakText(buildBriefingSpeechText());
  });
}

/**
 * Подписка на жизненный цикл приложения (@capacitor/app).
 *
 * При возврате в приложение пересчитывается состояние лунного будильника
 * и пересобирается расписание уведомлений — это заменяет Service Worker
 * расширения, который работал в фоне постоянно.
 */
function registerAppLifecycle() {
  addPluginListener('App', 'appStateChange', ({ isActive }) => {
    if (!isActive) return;
    handleAppResume();
  });
}

/**
 * Возврат в приложение: синхронизация будильника и пересборка расписания.
 */
async function handleAppResume() {
  try {
    const fired = await syncAlarmState();
    if (fired) renderUI();
    await rescheduleNotifications();
  } catch {
    /* ignore */
  }
}

async function init() {
  appState = await stateStore.loadState();

  if (!appState.builtinLang || !BUILTIN_DICTIONARIES[appState.builtinLang]) {
    await stateStore.saveState({ builtinLang: detectDefaultLang() });
  }

  // Обработчик нажатия на уведомление регистрируется сразу после загрузки
  // состояния: Capacitor удерживает событие до появления слушателя, поэтому
  // cold-start по тапу на уведомление не потеряется.
  registerNotificationHandlers();

  bindEvents();

  // Каналы уведомлений и разрешение на их показ (запрашивается при старте).
  const dict = getActiveDictionary();
  const baseDict = getActiveBaseDictionary();
  const labels = { ...baseDict.ui_labels, ...(dict.ui_labels || {}) };
  await notifications.ensureChannels({
    checkpointChannelName: labels.channel_checkpoint_name,
    checkpointChannelDescription: labels.channel_checkpoint_description,
    alarmChannelName: labels.channel_alarm_name,
    alarmChannelDescription: labels.channel_alarm_description
  });
  await ensureNotificationPermission();

  // Активируем индикатор 🔔, если лунный будильник уже сработал.
  await syncAlarmState();

  // Полная пересборка расписания уведомлений.
  await rescheduleNotifications();

  // Предупреждение о запрете точных alarm'ов (Android 12+).
  await renderExactAlarmPanel();

  // Возврат в приложение из фона.
  registerAppLifecycle();

  // Прогрев нативного движка озвучки, чтобы первая речь началась сразу.
  void speech.warmUp(dict.meta?.lang || 'ru-RU');

  // Обновление списка голосов при появлении новых (браузерный режим).
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      void populateVoiceSelector();
    };
  }

  renderUI();
  await handlePendingAutoplay();
}

init();
