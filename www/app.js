import {
  BUILTIN_DICTIONARIES,
  detectDefaultLang,
  getBuiltinDictionary,
  deepMergeDictionary
} from './dictionary_default.js';
import {
  PHASE_COLORS,
  ASPECTS,
  PLANET_ORB,
  formatHM,
  fromJulianDay,
  getCalendarDayLunarSummary,
  getBodySkyPosition,
  getHorizonDayDetails,
  getLunarDayAt,
  getLunationIntervals,
  getMoonPhaseInfo,
  getObserverCoords,
  getPlanetLongitudes,
  getSunPosition,
  getTimeSlot,
  getZodiacSign,
  buildLayeredAspectGraph,
  computePersonalState,
  computeRawDiagnosticData,
  findNextDateForLunarDay,
  parseBirthDateString,
  parseObserverCoord,
  setObserverCoords,
  signedAngleDiff,
  toJulianDay
} from './astro_engine.js';
import * as storage from './platform/storage.js';
import * as speech from './platform/speech.js';
import * as notifications from './platform/notifications.js';
import { addPluginListener, isNativePlatform } from './platform/capacitor.js';

const ACTIVE_ALARM_BADGE_COLOR = '#E65100';

const DEFAULT_PERSISTED_STATE = {
  birthDate: null,
  birthTime: null,
  observerLat: null,
  observerLon: null,
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
  theme: 'dark',
  fontSize: 'normal',
  heroMode: 'moon',
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

  const rawLat = parseObserverCoord(data && data.observerLat);
  const rawLon = parseObserverCoord(data && data.observerLon);
  const hasValidCoords =
    rawLat !== null &&
    rawLon !== null &&
    rawLat >= -90 &&
    rawLat <= 90 &&
    rawLon >= -180 &&
    rawLon <= 180;

  const theme = data && data.theme === 'light' ? 'light' : 'dark';
  const fontSize =
    data && (data.fontSize === 'large' || data.fontSize === 'xlarge')
      ? data.fontSize
      : 'normal';
  const heroMode = data && data.heroMode === 'solar' ? 'solar' : 'moon';

  return {
    ...DEFAULT_PERSISTED_STATE,
    ...(data || {}),
    observerLat: hasValidCoords ? Number(rawLat.toFixed(4)) : null,
    observerLon: hasValidCoords ? Number(rawLon.toFixed(4)) : null,
    builtinLang,
    theme,
    fontSize,
    heroMode,
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

function applyAppearanceSettings() {
  const theme = appState.theme === 'light' ? 'light' : 'dark';
  const fontSize =
    appState.fontSize === 'large' || appState.fontSize === 'xlarge'
      ? appState.fontSize
      : 'normal';
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.fontSize = fontSize;
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme === 'light' ? '#f4f6f9' : '#0f1115');
  }
}

function shadeHexColor(hex, factor) {
  const clean = String(hex || '').replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return hex || '#3f3f3f';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const adjust = (c) => {
    const next = factor < 0 ? c * (1 + factor) : c + (255 - c) * factor;
    return Math.max(0, Math.min(255, Math.round(next)));
  };
  const toHex = (c) => adjust(c).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function blendHexColor(hexA, hexB, t) {
  const cleanA = String(hexA || '').replace('#', '').trim();
  const cleanB = String(hexB || '').replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(cleanA) || !/^[0-9a-fA-F]{6}$/.test(cleanB)) return hexA || '#3f3f3f';
  const k = Math.max(0, Math.min(1, Number(t) || 0));
  const lerpCh = (i) => {
    const a = parseInt(cleanA.slice(i, i + 2), 16);
    const b = parseInt(cleanB.slice(i, i + 2), 16);
    return Math.round(a + (b - a) * k).toString(16).padStart(2, '0');
  };
  return `#${lerpCh(0)}${lerpCh(2)}${lerpCh(4)}`;
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

function renderMoonCanvas(canvas, phaseInfo, options = {}) {
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
  const showDarkDisc = Boolean(options.showDarkDisc);

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

      if (showDarkDisc) {
        const darkR = 35;
        const darkG = 41;
        const darkB = 56;
        const idx = (py * w + px) * 4;
        data[idx] = Math.round(darkR + (litR - darkR) * litMask);
        data[idx + 1] = Math.round(darkG + (litG - darkG) * litMask);
        data[idx + 2] = Math.round(darkB + (litB - darkB) * litMask);
        data[idx + 3] = Math.round(edgeAlpha * (232 + 23 * litMask));
        continue;
      }

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

function renderSunCanvas(canvas, sunSky, dayHours) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const minDim = Math.min(w, h);
  const discR = minDim * 0.265;
  const haloR = minDim * 0.495;
  const isSubdued = dayHours <= 0.02 || (sunSky && sunSky.altDeg < -6);

  // Broad centered solar corona tapering smoothly inside canvas bounds
  const halo = ctx.createRadialGradient(cx, cy, discR * 0.88, cx, cy, haloR);
  if (isSubdued) {
    halo.addColorStop(0, 'rgba(255, 200, 95, 0.62)');
    halo.addColorStop(0.28, 'rgba(240, 165, 58, 0.34)');
    halo.addColorStop(0.65, 'rgba(214, 126, 38, 0.12)');
    halo.addColorStop(1, 'rgba(214, 126, 38, 0)');
  } else {
    halo.addColorStop(0, 'rgba(255, 232, 128, 0.90)');
    halo.addColorStop(0.22, 'rgba(255, 204, 68, 0.54)');
    halo.addColorStop(0.55, 'rgba(245, 168, 36, 0.22)');
    halo.addColorStop(0.82, 'rgba(234, 148, 28, 0.07)');
    halo.addColorStop(1, 'rgba(234, 148, 28, 0)');
  }
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
  ctx.fill();

  // Centered flat luminous solar disc with soft limb bloom (no 3D sphere shading)
  const discGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, discR * 1.06);
  if (isSubdued) {
    discGrad.addColorStop(0, '#fff3d6');
    discGrad.addColorStop(0.76, '#ffe4a8');
    discGrad.addColorStop(0.92, '#ffd078');
    discGrad.addColorStop(1, 'rgba(255, 200, 95, 0)');
  } else {
    discGrad.addColorStop(0, '#fffef7');
    discGrad.addColorStop(0.76, '#fffbe6');
    discGrad.addColorStop(0.91, '#ffefaa');
    discGrad.addColorStop(1, 'rgba(255, 224, 112, 0)');
  }

  ctx.save();
  ctx.fillStyle = discGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, discR * 1.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function createMiniMoonCanvas(phaseInfo) {
  const canvas = document.createElement('canvas');
  canvas.className = 'tl-moon-canvas';
  canvas.width = 48;
  canvas.height = 48;
  canvas.setAttribute('aria-hidden', 'true');
  renderMoonCanvas(canvas, phaseInfo, { showDarkDisc: appState.theme === 'light' });
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

/* =========================================================================
   Промпт для внешней ИИ-модели — «максимум математики, минимум рамок».

   Принципы:
   * Максимум фактов, минимум решений. Всё, что движок умеет считать, передаётся
     целиком; всё, что движок уже решил (фаза, роль, главный аспект), остаётся
     его решением — модель получает его как рамку и не оспаривает.
   * Рамка ≠ лексикон. Рамка (указание «что делать») в промпт не попадает;
     лексикон (подпись «что это») попадает обязательно — иначе модель выдумывает
     смысл незнакомых категорий.
   * Предмет прогноза — лунные сутки, а не календарный день. Календарный день —
     маска, через которую пользователь видит часть лунных суток: хвост активных
     суток плюс начало следующих, которые переходят на следующий календарный день.
   ========================================================================= */

// Окна календарного дня, по которым раскладывается оставшаяся часть суток.
const PROMPT_DAY_WINDOWS = [
  { key: 'morning', hour: 9 },
  { key: 'day', hour: 14 },
  { key: 'evening', hour: 20 },
  { key: 'night', hour: 23 }
];

// Планеты для суточной скорости (транзит → транзит включает и Солнце).
const PROMPT_SKY_PLANETS = [
  'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'
];
const PROMPT_SKY_ASPECT_BODIES = ['Sun', ...PROMPT_SKY_PLANETS];

// Резервные заголовки на случай, если в словаре нет ui_labels.ai_forecast_title.
const FALLBACK_FORECAST_TITLES = {
  'ru-RU': 'Астрологический прогноз на день',
  'ru': 'Астрологический прогноз на день',
  'en-US': 'Daily Astrological Forecast',
  'en': 'Daily Astrological Forecast',
  'es-ES': 'Pronóstico astrológico del día',
  'es': 'Pronóstico astrológico del día',
  'de-DE': 'Astrologische Tagesprognose',
  'de': 'Astrologische Tagesprognose',
  'fr-FR': 'Prévision astrologique du jour',
  'fr': 'Prévision astrologique du jour'
};

// Дескриптор авторской строки словаря: только «что это за категория».
// Вторая часть строки — директива («что делать») — в промпт не попадает.
function getCategoryDescriptor(text) {
  const clean = String(text || '').trim();
  if (!clean) return '';
  const match = clean.match(/^[^.!?]+[.!?]?/);
  return (match ? match[0] : clean).replace(/[.!?\s]+$/g, '').trim();
}

// Для строк вида «описание — директива» (aspect_dynamics): берём часть до тире.
function getClauseDescriptor(text) {
  return String(text || '').split(/\s+[—–]\s+/)[0].trim();
}

function getPromptDayRelation(targetDate, now = new Date()) {
  const targetStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (targetStart < todayStart) return 'past';
  if (targetStart > todayStart) return 'future';
  return 'today';
}

// Границы лунных суток вокруг опорного момента — с датами, а не только часами.
function getLunarDayBoundaries(targetDate, refMoment) {
  const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
  const jd0 = toJulianDay(dayStart);
  const jd1 = toJulianDay(dayEnd);
  const lun1 = getLunationIntervals(jd0);
  const lun2 = jd1 >= lun1.nmNext ? getLunationIntervals(jd1) : null;
  const all = lun2 ? [...lun1.intervals, ...lun2.intervals] : lun1.intervals;
  const refJD = toJulianDay(refMoment);
  const active = all.find((iv) => refJD >= iv.startJD && refJD < iv.endJD) || all[0];
  const idx = all.indexOf(active);
  const prev = idx > 0 && active.startJD > jd0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx + 1 < all.length ? all[idx + 1] : null;
  return {
    activeDay: active.day,
    activeStart: fromJulianDay(active.startJD),
    activeEnd: fromJulianDay(active.endJD),
    activeStartsSameDay: active.startJD >= jd0 && active.startJD <= jd1,
    activeEndsSameDay: active.endJD >= jd0 && active.endJD <= jd1,
    prevDay: prev ? prev.day : null,
    prevStart: prev ? fromJulianDay(prev.startJD) : null,
    prevEnd: prev ? fromJulianDay(prev.endJD) : null,
    nextDay: next ? next.day : null,
    nextStart: next ? fromJulianDay(next.startJD) : null,
    nextStartsSameDay: Boolean(next && next.startJD >= jd0 && next.startJD <= jd1)
  };
}

// Окна календарного дня: положение Луны, «уже прошло» и номер лунных суток.
function getPromptDayWindows(targetDate, refMoment, now = new Date()) {
  const dayRelation = getPromptDayRelation(targetDate, now);
  return PROMPT_DAY_WINDOWS.map((slot) => {
    const at = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      slot.hour,
      0,
      0,
      0
    );
    const info = getMoonPhaseInfo(at);
    const passed =
      dayRelation === 'past'
        ? true
        : dayRelation === 'future'
          ? false
          : slot.hour < refMoment.getHours();
    const lunar = getLunarDayAt(at);
    return {
      key: slot.key,
      hour: slot.hour,
      moonLon: Number(info.moonLon.toFixed(2)),
      sign: info.zodiacSign,
      passed,
      lunarDay: lunar.day
    };
  });
}

// Знаковая суточная скорость планеты: отрицательная — ретроградное движение.
function getSignedDailySpeed(planetName, refMoment) {
  const prev = getPlanetLongitudes(new Date(refMoment.getTime() - 12 * 3600000), [planetName])[planetName];
  const next = getPlanetLongitudes(new Date(refMoment.getTime() + 12 * 3600000), [planetName])[planetName];
  return signedAngleDiff(next, prev);
}

function getAngularSeparation(angleA, angleB) {
  let diff = Math.abs(angleA - angleB) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

// Орбит пары — минимум из орбит её тел.
function getPairOrbLimit(nameA, nameB) {
  const limitFor = (name) => {
    if (name === 'Sun' || name === 'Moon') return 2.0;
    return PLANET_ORB[name] ?? 1.0;
  };
  return Math.min(limitFor(nameA), limitFor(nameB));
}

// «Слой неба»: аспекты между транзитными планетами (включая Солнце).
function computeSkyAspects(refMoment) {
  const lons = getPlanetLongitudes(refMoment, PROMPT_SKY_ASPECT_BODIES);
  const found = [];
  for (let i = 0; i < PROMPT_SKY_ASPECT_BODIES.length; i++) {
    for (let j = i + 1; j < PROMPT_SKY_ASPECT_BODIES.length; j++) {
      const from = PROMPT_SKY_ASPECT_BODIES[i];
      const to = PROMPT_SKY_ASPECT_BODIES[j];
      const limit = getPairOrbLimit(from, to);
      for (const asp of ASPECTS) {
        const orb = Math.abs(getAngularSeparation(lons[from], lons[to]) - asp.angle);
        if (orb <= limit) found.push({ from, to, aspectKey: asp.key, angle: asp.angle, orb });
      }
    }
  }
  return found.sort((x, y) => x.orb - y.orb);
}

// Аспекты внутри натальной карты.
function computeNatalAspects(natalPlanets) {
  if (!natalPlanets) return [];
  const names = Object.keys(natalPlanets);
  const found = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const from = names[i];
      const to = names[j];
      const limit = getPairOrbLimit(from, to);
      for (const asp of ASPECTS) {
        const orb = Math.abs(
          getAngularSeparation(natalPlanets[from].longitude, natalPlanets[to].longitude) - asp.angle
        );
        if (orb <= limit) found.push({ from, to, aspectKey: asp.key, angle: asp.angle, orb });
      }
    }
  }
  return found.sort((x, y) => x.orb - y.orb);
}

// Слой «вчера / позавчера» — тот же движок, что считает карточку.
function getPromptHistoryLayer(birthDateStr, birthTimeStr, targetDate, refMoment) {
  if (!birthDateStr) return null;
  try {
    const birthObj = parseBirthDateString(birthDateStr, birthTimeStr);
    if (!birthObj) return null;
    return buildLayeredAspectGraph(birthObj, targetDate, refMoment);
  } catch {
    return null;
  }
}

/**
 * Блок астрономических данных: всё, что движок посчитал, без авторских выводов.
 */
function buildAstronomyDataBlock(raw, summary, dict, ctx) {
  const lines = [];
  const lunar = raw.lunar || {};
  const phaseInfo = summary.phaseInfo || {};
  const signName = (canonical) => getLocalizedZodiacSign(dict, canonical);
  const deg = (value) => `${Number(value).toFixed(2)}°`;
  const trendLabel = dict.moon_phase_names?.[lunar.detailedTrend] || lunar.detailedTrend;
  const ddmm = (d) =>
    `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  const bounds = ctx.boundaries;

  lines.push(
    `- Date: ${ctx.isoDate} (${ctx.dayRelation}) | reference moment (local): ${ctx.currentTimeStr} | time slot: ${ctx.activeTimeSlot}`
  );
  lines.push('');
  lines.push('LUNAR GEOMETRY');
  lines.push(
    `- Moon age: ${Number(phaseInfo.moonAge).toFixed(2)} days since the last exact new moon`
  );
  lines.push(
    `- Sun-Moon elongation: ${deg(phaseInfo.elong)} (angular distance between the directions to the Sun and to the Moon)`
  );
  lines.push(
    `- Illuminated fraction of the disc: ${Number(phaseInfo.illuminationExact).toFixed(1)} %`
  );
  lines.push(
    `- Current lunar phase: ${trendLabel} (${lunar.detailedTrend}), ${phaseInfo.isWaxing ? 'waxing' : 'waning'}`
  );
  lines.push(`- Moon ecliptic longitude: ${deg(phaseInfo.moonLon)} -> sign ${signName(phaseInfo.zodiacSign)}`);
  lines.push(
    `- Sun ecliptic longitude: ${deg(phaseInfo.sunLon)} -> sign ${signName(getZodiacSign(phaseInfo.sunLon))}`
  );
  if (summary.signIngress) {
    lines.push(
      `- Moon sign ingress during the day: ${signName(summary.signIngress.fromSign)} -> ${signName(summary.signIngress.toSign)} at ${summary.signIngress.timeStr}`
    );
  }
  lines.push(
    `- First moonrise / first moonset inside the calendar day: ${summary.moonriseStr} / ${summary.moonsetStr}`
  );
  if (raw.observer) {
    const tzTag = raw.observer.timeZone ? `, ${raw.observer.timeZone}` : '';
    lines.push(
      `- Observer coordinates for horizon calculations: ${Number(raw.observer.latitude).toFixed(2)}°, ${Number(raw.observer.longitude).toFixed(2)}° (${raw.observer.source}${tzTag})`
    );
  }
  lines.push('');

  lines.push('THE DAY IN FOUR WINDOWS (the Moon moves through the day; each window belongs to a lunar day)');
  for (const win of ctx.windows) {
    const passed = win.passed ? ' — already passed' : '';
    lines.push(
      `- ${win.key} (${String(win.hour).padStart(2, '0')}:00): Moon in ${signName(win.sign)} (${deg(win.moonLon)}), lunar day ${win.lunarDay}${passed}`
    );
  }
  lines.push('');

  lines.push(
    'LUNAR DAYS AND THE DYNAMICS VECTOR (a lunar day runs from one moonrise to the next and usually spans two calendar days)'
  );
  const activeNote = getCategoryDescriptor(dict.lunar_days?.[String(bounds.activeDay)] || '');
  const activeEdge = raw.personal?.dailyFocusEdge;
  lines.push(
    `- ${toEnglishOrdinal(bounds.activeDay)} (active at the reference moment): "${activeNote}" | window ${ddmm(bounds.activeStart)} ${formatHM(bounds.activeStart)} -> ${ddmm(bounds.activeEnd)} ${formatHM(bounds.activeEnd)}`
  );
  let dynamics =
    `    dynamics: the Moon is ${phaseInfo.isWaxing ? 'waxing' : 'waning'} at ${Number(phaseInfo.illuminationExact).toFixed(1)} % illumination (${lunar.detailedTrend}), Moon age ${Number(phaseInfo.moonAge).toFixed(2)} d`;
  if (activeEdge) {
    const peakPart =
      typeof activeEdge.peakHour === 'number'
        ? `, the aspect becomes exact around ${String(activeEdge.peakHour).padStart(2, '0')}:00`
        : '';
    dynamics += `, and the day leans on ${activeEdge.transit} -> natal ${activeEdge.natal}: ${activeEdge.aspectKey} (${activeEdge.dynamicKey}${peakPart})`;
  }
  lines.push(dynamics);
  if (bounds.prevDay !== null) {
    const prevNote = getCategoryDescriptor(dict.lunar_days?.[String(bounds.prevDay)] || '');
    lines.push(
      `- ${toEnglishOrdinal(bounds.prevDay)} (earlier portion of the same calendar day, ended ${ddmm(bounds.prevEnd)} at ${formatHM(bounds.prevEnd)}): "${prevNote}"`
    );
  }
  if (bounds.nextStart) {
    const nextNote = getCategoryDescriptor(dict.lunar_days?.[String(bounds.nextDay)] || '');
    const sameDayTag = bounds.nextStartsSameDay ? 'later inside the same calendar day' : 'on the next calendar day';
    lines.push(
      `- ${toEnglishOrdinal(bounds.nextDay)} (begins ${ddmm(bounds.nextStart)} at ${formatHM(bounds.nextStart)}, ${sameDayTag}): "${nextNote}"`
    );
  }
  lines.push('');

  lines.push('PLANETARY POSITIONS AT THE REFERENCE MOMENT (geocentric ecliptic longitude)');
  const transitParts = Object.entries(raw.transitPlanets || {}).map(
    ([name, p]) => `${name} ${deg(p.longitude)} (${signName(p.sign)})`
  );
  lines.push(`- Sun ${deg(phaseInfo.sunLon)} (${signName(getZodiacSign(phaseInfo.sunLon))})`);
  lines.push(`- ${transitParts.join(' · ')}`);
  lines.push('');
  lines.push('DAILY MOTION (signed longitude change over 24 h; negative = retrograde)');
  for (const planet of PROMPT_SKY_PLANETS) {
    const speed = getSignedDailySpeed(planet, ctx.refMoment);
    lines.push(
      `- ${planet}: ${Math.abs(speed).toFixed(3)}°/day, ${speed < 0 ? 'retrograde' : 'direct'}`
    );
  }
  lines.push('');

  if (raw.natalPlanets) {
    lines.push('NATAL POSITIONS (from the birth data supplied by the user)');
    const natalParts = Object.entries(raw.natalPlanets).map(
      ([name, p]) => `${name} ${deg(p.longitude)} (${signName(p.sign)})`
    );
    lines.push(`- ${natalParts.join(' · ')}`);
    lines.push('');
  }

  lines.push(
    'ACTIVE ASPECTS (transit body -> natal body; orb = current deviation from the exact angle)'
  );
  const aspects = raw.allAspectsWithinOrb || [];
  if (aspects.length) {
    for (const a of aspects) {
      lines.push(
        `- ${a.transit} -> natal ${a.natal}: ${a.aspectKey} (exact angle ${a.angle}°, orb ${Number(a.diff).toFixed(2)}°, ${a.dynamicKey}, ${a.layer} layer)`
      );
    }
  } else {
    lines.push('- none within orb');
  }
  lines.push('');

  lines.push("SKY ASPECTS (transit body -> transit body; the mutual geometry of today's sky)");
  const skyAspects = computeSkyAspects(ctx.refMoment);
  if (skyAspects.length) {
    for (const a of skyAspects) {
      lines.push(
        `- ${a.from} -> ${a.to}: ${a.aspectKey} (exact angle ${a.angle}°, orb ${a.orb.toFixed(2)}°)`
      );
    }
  } else {
    lines.push('- none within the per-planet orb');
  }
  lines.push('');

  lines.push('NATAL ASPECTS (natal body -> natal body; the standing structure of the birth chart)');
  const natalAspects = computeNatalAspects(raw.natalPlanets);
  if (natalAspects.length) {
    for (const a of natalAspects) {
      lines.push(
        `- ${a.from} -> ${a.to}: ${a.aspectKey} (exact angle ${a.angle}°, orb ${a.orb.toFixed(2)}°)`
      );
    }
  } else {
    lines.push('- none within the per-planet orb');
  }
  lines.push('');

  lines.push(
    'LUNAR ASPECTS AND THEIR PEAK TIMES (Moon aspects reaching exact peak inside this calendar day)'
  );
  const moonEdges = (raw.personal?.prioritizedFastEdges || []).filter((e) => e.transit === 'Moon');
  if (moonEdges.length) {
    for (const e of moonEdges) {
      const peak =
        typeof e.peakHour === 'number' ? `, peak around ${String(e.peakHour).padStart(2, '0')}:00` : '';
      lines.push(
        `- ${e.transit} -> natal ${e.natal}: ${e.aspectKey} (exact angle ${e.angle}°, orb at peak ${Number(e.diff).toFixed(2)}°, ${e.dynamicKey}${peak})`
      );
    }
  } else {
    lines.push('- none completing an exact peak inside this calendar day');
  }
  lines.push('');

  if (ctx.history) {
    lines.push('YESTERDAY AND THE DAY BEFORE (the engine compares today with the previous two days)');
    const formatEdges = (edges) =>
      (edges || [])
        .slice(0, 3)
        .map(
          (e) =>
            `${e.transit} -> natal ${e.natal}: ${e.aspectKey} (${e.dynamicKey}${
              typeof e.peakHour === 'number' ? `, peak ${String(e.peakHour).padStart(2, '0')}:00` : ''
            })`
        )
        .join(' · ');
    const yesterday = new Date(
      ctx.targetDate.getFullYear(),
      ctx.targetDate.getMonth(),
      ctx.targetDate.getDate() - 1
    );
    const dayBefore = new Date(
      ctx.targetDate.getFullYear(),
      ctx.targetDate.getMonth(),
      ctx.targetDate.getDate() - 2
    );
    lines.push(
      `- Yesterday (${ddmm(yesterday)}): ${formatEdges(ctx.history.prev1Edges) || 'none'}`
    );
    lines.push(
      `- The day before (${ddmm(dayBefore)}): ${formatEdges(ctx.history.prev2Raw?.combined) || 'none'}`
    );
    lines.push(
      '- The engine lowers the priority of a focus that repeats the previous day, so a change of focus between yesterday and today is itself a signal.'
    );
  }

  return lines;
}

/**
 * Метрики персонального 29,5-дневного цикла: числа и ключи классификации,
 * без авторских формулировок словаря на сегодняшний день.
 */
function buildPersonalRhythmBlock(raw) {
  const lines = [];
  const personal = raw.personal;

  if (!personal) {
    lines.push(
      '- no birth data supplied: the personal 29.53-day cycle, the birth rhythm profile and the natal aspects cannot be computed'
    );
    return lines;
  }

  lines.push(
    `- Birth data used: ${raw.input?.birthDate || '—'}${
      raw.input?.birthTime ? `, ${raw.input.birthTime}` : ''
    }`
  );
  lines.push(
    `- Moon age at birth: ${Number(personal.birthMoonAge).toFixed(2)} days — the zero point of the 29.53-day cycle`
  );
  lines.push(
    `- Current position in the personal cycle: ${Number(personal.personalPhase).toFixed(2)} days since that zero point (cycle length 29.53 days)`
  );
  lines.push(`- Profile: ${personal.profileKey}`);
  lines.push(`- Age class: ${personal.ageClassKey}`);
  lines.push(`- Time slot of the reference moment: ${personal.timeSlot}`);
  lines.push(
    '- The engine assigns the operational role and the primary aspect; its internal weights are not part of the input and the ranking is not open for revision.'
  );

  return lines;
}

/**
 * Глоссарий таксономии активного словаря — только подписи категорий.
 *
 * Дескриптор (что это за категория) нужен модели обязательно: без него она
 * выдумывает смысл незнакомых ключей. Директива (что делать) — это рамка
 * карточки, и она сюда не попадает.
 */
function buildInterpretiveGlossary(dict) {
  const lines = [];

  lines.push('PHASES (personal 29.53-day cycle)');
  for (const [key, phase] of Object.entries(dict.phases || {})) {
    const parts = [phase.badge || phase.title || key, phase.tempo, phase.action].filter(Boolean);
    lines.push(`- ${key}: ${parts.join('; ')}`);
  }
  lines.push('');

  lines.push('ROLES (operational modes)');
  for (const [key, role] of Object.entries(dict.roles || {})) {
    lines.push(`- ${key}: ${role.title || key}${role.hint ? ` — ${role.hint}` : ''}`);
  }
  lines.push('');

  lines.push('ACTORS (life areas a planet acts through)');
  for (const [key, actor] of Object.entries(dict.actors || {})) {
    lines.push(`- ${key}: ${actor.title || key}${actor.domain ? ` — ${actor.domain}` : ''}`);
  }
  lines.push('');

  lines.push('ASPECT TYPES');
  for (const [key, maneuver] of Object.entries(dict.maneuvers || {})) {
    const angle = ASPECTS.find((a) => a.key === key)?.angle;
    const valence = maneuver.valence ? ` [${maneuver.valence}]` : '';
    lines.push(`- ${key}${angle !== undefined ? `: ${angle}°` : ''} — ${maneuver.title || key}${valence}`);
  }
  lines.push('');

  lines.push('ASPECT DYNAMICS');
  for (const [key, text] of Object.entries(dict.aspect_dynamics || {})) {
    lines.push(`- ${key}: ${getClauseDescriptor(text)}`);
  }
  lines.push('');

  lines.push('SIGNS');
  for (const [canonical, localized] of Object.entries(dict.zodiac_names || {})) {
    const hint = dict.zodiac_hints?.[canonical];
    if (hint) lines.push(`- ${localized}: ${hint}`);
  }
  lines.push('');

  lines.push('PROFILES');
  for (const [key, profile] of Object.entries(dict.profiles || {})) {
    lines.push(`- ${key}: ${profile.title || key}${profile.short_desc ? ` — ${profile.short_desc}` : ''}`);
  }
  lines.push('');

  lines.push('AGE CLASSES');
  for (const [key, ageClass] of Object.entries(dict.age_classes || {})) {
    lines.push(
      `- ${key}: ${ageClass.title || key}${
        ageClass.modifier_hint ? ` — ${getCategoryDescriptor(ageClass.modifier_hint)}` : ''
      }`
    );
  }
  lines.push('');

  return lines;
}

/**
 * Собирает промпт для внешней ИИ-модели.
 *
 * Принцип: максимум нашей математики, минимум рамок. Приложение отдаёт всё, что
 * посчитало, и словарь категорий; готовый прогноз карточки сюда не попадает —
 * иначе промпт превращался бы в задание «перепиши карточку».
 */
function buildExternalAIPrompt() {
  const dict = getActiveDictionary();
  const lang = dict.meta?.lang || 'ru-RU';
  const baseLang = lang.toLowerCase().split(/[-_]/)[0];
  const targetLangName = resolveLanguageNameEn(lang);
  const now = new Date();
  const isToday = isSameCalendarDay(selectedDate, now);
  const refMoment = isToday
    ? now
    : new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 21, 0, 0, 0);

  const summary = getCalendarDayLunarSummary(selectedDate, refMoment);
  const raw = computeRawDiagnosticData(
    appState.birthDate,
    appState.birthTime,
    selectedDate,
    refMoment
  );

  const boundaries = getLunarDayBoundaries(selectedDate, refMoment);
  const ddmm = (d) =>
    `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  const dayRelation = getPromptDayRelation(selectedDate, now);

  const ctx = {
    dict,
    lang,
    targetLangName,
    dayRelation,
    isoDate: toISODate(selectedDate),
    humanDate: formatHumanDate(selectedDate, lang),
    currentTimeStr: formatHM(refMoment),
    activeTimeSlot: raw.personal?.timeSlot || getTimeSlot(refMoment),
    targetDate: selectedDate,
    refMoment,
    boundaries,
    windows: getPromptDayWindows(selectedDate, refMoment, now),
    history: getPromptHistoryLayer(
      appState.birthDate,
      appState.birthTime,
      selectedDate,
      refMoment
    ),
    title:
      dict.ui_labels?.ai_forecast_title ||
      FALLBACK_FORECAST_TITLES[lang] ||
      FALLBACK_FORECAST_TITLES[baseLang] ||
      FALLBACK_FORECAST_TITLES['en-US']
  };

  const hasBirthData = Boolean(raw.personal);
  const activeOrdinal = toEnglishOrdinal(ctx.boundaries.activeDay);
  let activeDayPhrase =
    `the ${activeOrdinal} lunar day runs from ${ddmm(ctx.boundaries.activeStart)} at ${formatHM(
      ctx.boundaries.activeStart
    )} to ${ddmm(ctx.boundaries.activeEnd)} at ${formatHM(ctx.boundaries.activeEnd)}`;
  if (ctx.boundaries.prevDay !== null) {
    activeDayPhrase +=
      `, having replaced the ${toEnglishOrdinal(ctx.boundaries.prevDay)} lunar day earlier on ${ctx.humanDate} at ${formatHM(
        ctx.boundaries.activeStart
      )}` +
      (ctx.boundaries.nextStartsSameDay
        ? ` before the ${toEnglishOrdinal(ctx.boundaries.nextDay)} begins at ${formatHM(ctx.boundaries.nextStart)}`
        : ' and continuing into the next calendar day');
  } else if (ctx.boundaries.nextStartsSameDay) {
    activeDayPhrase += `, so the visible slice of ${ctx.humanDate} is the tail of that lunar day followed by the beginning of the ${toEnglishOrdinal(
      ctx.boundaries.nextDay
    )} at ${formatHM(ctx.boundaries.nextStart)}, which continues into the next calendar day`;
  } else {
    activeDayPhrase += `, spanning all of ${ctx.humanDate}`;
  }

  const timeHorizonLine =
    dayRelation === 'today'
      ? `The reference moment is ${ctx.currentTimeStr} (current local time). The day is divided below into morning / day / evening / night, and the windows that have already passed are marked as such.`
      : dayRelation === 'future'
        ? `${ctx.humanDate} is a future calendar date (reference snapshot at ${ctx.currentTimeStr}). All four intraday windows (morning / day / evening / night) are still ahead.`
        : `${ctx.humanDate} is a past calendar date (reference snapshot at ${ctx.currentTimeStr}). All four intraday windows (morning / day / evening / night) have already passed.`;

  const lines = [
    `You are an astrologer-analyst. Write the daily horoscope for ${ctx.humanDate}`,
    '',
    'Everything you are given is below: the sky data for that day, the personal-cycle metrics, the app engine own read of the day,',
    'and the vocabulary the app uses for its categories. There is no ready-made forecast and nothing else is available to you —',
    'the reading does not exist until you write it. The structure, the length and the emphasis are entirely yours.',
    'Write for a person who knows nothing about astrology and is busy: explain every term in plain language, and turn the numbers into prose rather than printing them.',
    `The whole answer must be written in ${targetLangName}.`,
    `The answer opens with the title «${ctx.title}» — that is the heading of the whole forecast, so the sky is not opened as a separate section with a heading of its own.`,
    '',
    '### THE SUBJECT IS THE LUNAR DAY, NOT THE CALENDAR DAY',
    'A lunar day runs from one moonrise to the next and usually spans two calendar days; the calendar day is only the mask',
    `through which the user sees it. Here ${activeDayPhrase}.`,
    'Describe the lunar day as a whole, and give the actionable guidance for the part of it that is still ahead.',
    timeHorizonLine,
    ...(hasBirthData
      ? []
      : [
          'No birth date was supplied, so the personal 29.5-day cycle cannot be read for this day: work from the sky alone, say plainly that the personal cycle is unavailable, and do not invent one.'
        ]),
    '',
    '### RULES',
    '1. GROUND TRUTH. The positions, angles, orbs, timings and classifications below come from the app own ephemeris engine. Never recompute, correct or second-guess them.',
    "2. THE FRAME IS THE ENGINE DECISION, NOT A SUGGESTION. The phase, the stage, the profile, the age class, the operational role and the primary aspect listed under THE ENGINE'S READING OF TODAY are the app own verdict for this day. Interpret them, never overturn them and never tell the user that the app chose otherwise.",
    '3. NO FATALISM, NO HEALTH CLAIMS. Never claim that the sky determines fate, and never make medical, psychological or hormonal claims.',
    '',
    '### ASTRONOMICAL DATA (ground truth)',
    ...buildAstronomyDataBlock(raw, summary, dict, ctx),
    '',
    '### PERSONAL CYCLE (same engine + the birth data of the user)',
    ...buildPersonalRhythmBlock(raw),
    '',
    "### THE ENGINE'S READING OF TODAY (the frame — interpret, do not overturn)"
  ];

  if (hasBirthData) {
    const personal = raw.personal;
    const phase = dict.phases?.[personal.phaseKey];
    const profile = dict.profiles?.[personal.profileKey];
    const ageClass = dict.age_classes?.[personal.ageClassKey];
    const role = dict.roles?.[personal.roleKey];
    const focus = personal.dailyFocusEdge;

    lines.push(
      `- Personal phase: ${personal.phaseKey}${phase ? ` — ${phase.badge}; tempo ${phase.tempo}; action ${phase.action}` : ''}`
    );
    lines.push(
      `- Stage inside the phase: ${personal.phaseStage?.key} (day ${personal.phaseStage?.dayInPhase} of ${personal.phaseStage?.totalDays})`
    );
    if (profile) {
      lines.push(`- Profile: ${personal.profileKey} — ${profile.title} (${profile.short_desc})`);
    }
    if (ageClass) {
      lines.push(
        `- Age class: ${personal.ageClassKey} — ${ageClass.title} (${getCategoryDescriptor(ageClass.modifier_hint)})`
      );
    }
    if (role) {
      lines.push(`- Operational role: ${personal.roleKey} — ${role.title} (${role.hint})`);
    }
    if (focus) {
      const peak =
        typeof focus.peakHour === 'number'
          ? `, peak around ${String(focus.peakHour).padStart(2, '0')}:00`
          : '';
      lines.push(
        `- Primary aspect of the day: ${focus.transit} -> natal ${focus.natal}: ${focus.aspectKey} (exact angle ${focus.angle}°, orb ${Number(focus.diff).toFixed(2)}°, ${focus.dynamicKey}${peak})`
      );
    }
    if (personal.backgroundEdge) {
      const background = personal.backgroundEdge;
      lines.push(
        `- Weekly background aspect: ${background.transit} -> natal ${background.natal}: ${background.aspectKey} (exact angle ${background.angle}°, orb ${Number(background.diff).toFixed(2)}°, ${background.dynamicKey})`
      );
    } else {
      lines.push('- Weekly background aspect: none');
    }
  } else {
    lines.push('- no engine reading: without the birth data the engine classifies nothing');
  }

  lines.push('');
  lines.push('### TAXONOMY (labels only: what the categories are called and what they mean — not instructions)');
  lines.push(...buildInterpretiveGlossary(dict));

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
  const celestialToggle = document.getElementById('hero-celestial-toggle');
  if (celestialToggle) {
    celestialToggle.setAttribute('aria-label', labels.hero_moon_aria);
    celestialToggle.title = labels.hero_toggle_to_solar_title || labels.hero_moon_aria;
  }
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
  const backupTextarea = document.getElementById('reminders-backup-textarea');
  if (backupTextarea && labels.reminders_backup_placeholder) {
    backupTextarea.placeholder = labels.reminders_backup_placeholder;
  }
  const closeBackupBtn = document.getElementById('btn-close-reminders-backup');
  if (closeBackupBtn) closeBackupBtn.setAttribute('aria-label', labels.btn_close);
  document.getElementById('btn-close-day-note').setAttribute('aria-label', labels.btn_close);
  document.getElementById('timeline-section').setAttribute('aria-label', labels.timeline_aria);
  document.getElementById('lunar-timeline-strip').setAttribute('aria-label', labels.timeline_aria);
  document.getElementById('day-note-panel').setAttribute('aria-label', labels.day_note_title);
  document.getElementById('tab-today').setAttribute('aria-label', labels.nav_today);
  document.getElementById('tab-reminders').setAttribute('aria-label', labels.nav_reminders);
  document.getElementById('tab-settings').setAttribute('aria-label', labels.nav_settings);
  document.getElementById('select-builtin-lang').setAttribute('aria-label', labels.label_builtin_lang);
  const calInputEl = document.getElementById('input-calendar-date');
  if (calInputEl) {
    calInputEl.setAttribute('aria-label', labels.label_calendar_date);
    calInputEl.placeholder = labels.placeholder_birth_date || 'dd.mm.yyyy';
  }
  const calPickerBtn = document.getElementById('btn-calendar-date-picker');
  if (calPickerBtn) {
    calPickerBtn.title = labels.btn_pick_date || labels.label_calendar_date;
    calPickerBtn.setAttribute('aria-label', labels.btn_pick_date || labels.label_calendar_date);
  }
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
  const latInputEl = document.getElementById('input-observer-lat');
  if (latInputEl) {
    latInputEl.setAttribute('aria-label', labels.label_observer_lat || 'Latitude');
    latInputEl.placeholder = labels.placeholder_observer_lat || 'Lat (e.g. 56.13)';
  }
  const lonInputEl = document.getElementById('input-observer-lon');
  if (lonInputEl) {
    lonInputEl.setAttribute('aria-label', labels.label_observer_lon || 'Longitude');
    lonInputEl.placeholder = labels.placeholder_observer_lon || 'Lon (e.g. 47.25)';
  }
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

function sumHorizonSegmentsHours(segments) {
  if (!Array.isArray(segments) || !segments.length) return 0;
  return segments.reduce((acc, seg) => {
    if (!Array.isArray(seg) || seg.length < 2) return acc;
    return acc + Math.max(0, Number(seg[1]) - Number(seg[0]));
  }, 0);
}

function formatDurationHMM(totalMinutes) {
  const clamped = Math.max(0, Math.min(1440, Math.round(totalMinutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

const PERSONAL_VECTOR_SVGS = {
  phase_rise: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3.5" y1="12.5" x2="12.5" y2="3.5"></line><polyline points="6 3.5 12.5 3.5 12.5 10"></polyline></svg>',
  phase_peak: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="2.5" x2="13" y2="2.5"></line><line x1="8" y1="13.5" x2="8" y2="5.5"></line><polyline points="4.5 9 8 5.5 11.5 9"></polyline></svg>',
  phase_decline: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3.5" y1="3.5" x2="12.5" y2="12.5"></line><polyline points="12.5 6 12.5 12.5 6 12.5"></polyline></svg>',
  phase_minimum: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="13.5" x2="13" y2="13.5"></line><line x1="8" y1="2.5" x2="8" y2="10.5"></line><polyline points="4.5 7 8 10.5 11.5 7"></polyline></svg>'
};

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
  const bgMoment = isToday
    ? now
    : new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), now.getHours(), now.getMinutes(), 0, 0);

  const summary = getCalendarDayLunarSummary(selectedDate, refMoment);
  const personal = appState.birthDate
    ? computePersonalState(appState.birthDate, selectedDate, refMoment, appState.birthTime)
    : null;
  const isSolarMode = appState.heroMode === 'solar';

  // Hero container background + time-of-day radial vignette (daylight glow, warm dusk rim, deep midnight edge)
  const heroCard = document.getElementById('hero-card');
  const bgHex = personal ? personal.headerColor : PHASE_COLORS.neutral;
  const sunSkyForBg = getBodySkyPosition(toJulianDay(bgMoment), 'sun');
  const altDeg = sunSkyForBg.altDeg;
  const altT = Math.max(0, Math.min(1, (14 - altDeg) / 29));
  const nightFactor = altT * altT * (3 - 2 * altT);
  const twilightFactor = Math.max(0, 1 - Math.abs(altDeg - 1) / 11);
  const centerHex = shadeHexColor(bgHex, 0.14 - 0.08 * nightFactor);
  const midHex = shadeHexColor(bgHex, -0.02 - 0.06 * nightFactor);
  let edgeHex = shadeHexColor(bgHex, -(0.22 + 0.44 * nightFactor));
  if (twilightFactor > 0.01) {
    edgeHex = blendHexColor(edgeHex, '#3a1f32', 0.22 * twilightFactor);
  }
  if (nightFactor > 0.01) {
    edgeHex = blendHexColor(edgeHex, '#0c1224', 0.28 * nightFactor);
  }
  heroCard.style.backgroundColor = bgHex;
  heroCard.style.backgroundImage = `radial-gradient(ellipse 88% 98% at 42% 46%, ${centerHex} 0%, ${midHex} 50%, ${edgeHex} 100%)`;
  heroCard.classList.toggle('is-solar-mode', isSolarMode);
  heroCard.classList.toggle('has-active-alarm', Boolean(appState.activeAlarm));
  document.documentElement.style.setProperty('--hero-bg', bgHex);

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

  const sign = summary.phaseInfo.zodiacSign;
  const signName = getLocalizedZodiacSign(dict, sign);
  const trendLabel = dict.moon_trends?.[summary.phaseInfo.trend] || '';
  const detailedTrendLabel =
    dict.moon_phase_names?.[summary.phaseInfo.detailedTrend] ||
    trendLabel ||
    labels.hero_trend_title;

  const moonCanvasEl = document.getElementById('moon-canvas');
  const celestialToggleEl = document.getElementById('hero-celestial-toggle');
  const illumEl = document.getElementById('hero-illumination');
  const trendEl = document.getElementById('hero-trend');
  const heroDayEl = document.getElementById('hero-day');
  const heroSupTopEl = document.getElementById('hero-sup-top');
  const heroAgeUnitEl = document.getElementById('hero-age-unit');
  const slotFirstEl = document.getElementById('hero-lunar-slot-first');
  const slotSecondEl = document.getElementById('hero-lunar-slot-second');
  const bottomSlashEl = document.getElementById('hero-bottom-slash');
  const firstNumEl = document.getElementById('hero-lunar-first');
  const secondNumEl = document.getElementById('hero-lunar-second');
  const firstTimeEl = document.getElementById('hero-lunar-first-time');
  const secondTimeEl = document.getElementById('hero-lunar-second-time');
  const riseWrapEl = document.getElementById('hero-rise-wrap');
  const transitWrapEl = document.getElementById('hero-transit-wrap');
  const setWrapEl = document.getElementById('hero-set-wrap');
  const polarStatusEl = document.getElementById('hero-polar-status');
  const transitLabelEl = document.getElementById('hero-transit-label');
  const sunTransitEl = document.getElementById('hero-sun-transit');
  const riseValEl = document.getElementById('hero-moonrise');
  const setValEl = document.getElementById('hero-moonset');

  if (isSolarMode) {
    const sunHorizon = getHorizonDayDetails(refMoment);
    const sunHorizonPrev = getHorizonDayDetails(new Date(refMoment.getTime() - 86400000));
    const dayHours = sumHorizonSegmentsHours(sunHorizon.sunSegments);
    const prevDayHours = sumHorizonSegmentsHours(sunHorizonPrev.sunSegments);
    const dayMins = Math.round(dayHours * 60);
    const nightMins = Math.max(0, 1440 - dayMins);
    const isPolarDay = dayMins >= 1440;
    const isPolarNight = dayMins <= 0;

    renderSunCanvas(moonCanvasEl, sunSkyForBg, dayHours);
    if (celestialToggleEl) {
      celestialToggleEl.title = labels.hero_sun_aria || labels.hero_toggle_to_solar_title;
      celestialToggleEl.setAttribute('aria-label', labels.hero_sun_aria || labels.hero_moon_aria);
    }

    const daySharePct = (dayHours / 24) * 100;
    const deltaMin = Math.round((dayHours - prevDayHours) * 60);
    let solarTrendGlyph = '●';
    let solarTrendLabel = labels.solar_trend_solstice_max || '';
    if (isPolarDay) {
      solarTrendGlyph = '●';
      solarTrendLabel = labels.solar_trend_solstice_max || '';
    } else if (isPolarNight) {
      solarTrendGlyph = '○';
      solarTrendLabel = labels.solar_trend_solstice_min || '';
    } else if (deltaMin > 0) {
      solarTrendGlyph = '▲';
      solarTrendLabel = `${labels.solar_trend_growing || ''} (+${deltaMin} ${baseLang === 'ru' ? 'мин' : 'm'})`.trim();
    } else if (deltaMin < 0) {
      solarTrendGlyph = '▼';
      solarTrendLabel = `${labels.solar_trend_shrinking || ''} (${deltaMin} ${baseLang === 'ru' ? 'мин' : 'm'})`.trim();
    } else {
      solarTrendGlyph = dayHours >= 12 ? '●' : '○';
      solarTrendLabel = dayHours >= 12
        ? (labels.solar_trend_solstice_max || '')
        : (labels.solar_trend_solstice_min || '');
    }

    trendEl.textContent = solarTrendGlyph;
    trendEl.title = solarTrendLabel;
    trendEl.setAttribute('aria-label', solarTrendLabel);
    illumEl.textContent = `${daySharePct.toFixed(1)} %`;
    illumEl.title = `${labels.hero_solar_share_title || labels.hero_illumination_title} (${sunSkyForBg.altDeg.toFixed(1)}°)`;

    const sunZodiacCanonical = getZodiacSign(getSunPosition(toJulianDay(refMoment)).lon);
    heroDayEl.textContent = dayHours.toFixed(1);
    heroSupTopEl.textContent = getLocalizedZodiacSign(dict, sunZodiacCanonical);
    heroAgeUnitEl.textContent = labels.solar_day_unit || 'ч.';

    if (isPolarDay || isPolarNight) {
      bottomSlashEl.classList.add('hidden');
      slotSecondEl.classList.add('hidden');
      firstNumEl.textContent = isPolarDay ? '24:00' : '00:00';
      firstTimeEl.textContent = isPolarDay
        ? (labels.solar_day_short || 'день')
        : (labels.solar_polar_night_short || 'полярная ночь');
      slotFirstEl.classList.add('is-active');
      slotSecondEl.classList.remove('is-active');

      riseWrapEl.classList.add('hidden');
      transitWrapEl.classList.add('hidden');
      setWrapEl.classList.add('hidden');
      polarStatusEl.classList.remove('hidden');
      const polarTitle = isPolarDay
        ? (labels.solar_polar_day_label || 'Полярный день')
        : capitalizeFirst(labels.solar_polar_night_short || 'полярная ночь');
      polarStatusEl.textContent = `${polarTitle} · ${labels.solar_transit_label || 'Юг'} ${sunHorizon.sunTransitStr || '--:--'}`;
    } else {
      bottomSlashEl.classList.remove('hidden');
      slotSecondEl.classList.remove('hidden');
      firstNumEl.textContent = formatDurationHMM(dayMins);
      firstTimeEl.textContent = labels.solar_day_short || 'день';
      secondNumEl.textContent = formatDurationHMM(nightMins);
      secondTimeEl.textContent = labels.solar_night_short || 'ночь';

      const isSunUpNow = sunSkyForBg.altDeg > 0;
      slotFirstEl.classList.toggle('is-active', !isToday || isSunUpNow);
      slotSecondEl.classList.toggle('is-active', !isToday || !isSunUpNow);

      riseWrapEl.classList.remove('hidden');
      transitWrapEl.classList.remove('hidden');
      setWrapEl.classList.remove('hidden');
      polarStatusEl.classList.add('hidden');
      riseValEl.textContent = sunHorizon.sunriseStr || '--:--';
      transitLabelEl.textContent = labels.solar_transit_label || 'Юг';
      sunTransitEl.textContent = sunHorizon.sunTransitStr || '--:--';
      setValEl.textContent = sunHorizon.sunsetStr || '--:--';
    }
  } else {
    // Lunar Hero Mode
    renderMoonCanvas(moonCanvasEl, summary.phaseInfo);
    if (celestialToggleEl) {
      celestialToggleEl.title = labels.hero_toggle_to_solar_title || labels.hero_moon_aria;
      celestialToggleEl.setAttribute('aria-label', labels.hero_moon_aria);
    }

    illumEl.textContent = `${summary.phaseInfo.illuminationExact.toFixed(1)} %`;
    illumEl.title = labels.hero_illumination_title;

    heroDayEl.textContent = summary.phaseInfo.moonAge.toFixed(1);
    heroSupTopEl.textContent = signName;
    heroAgeUnitEl.textContent = labels.moon_age_unit;

    bottomSlashEl.classList.remove('hidden');
    slotSecondEl.classList.remove('hidden');
    firstNumEl.textContent = String(summary.firstDay);
    secondNumEl.textContent = String(summary.secondDay);
    firstTimeEl.textContent = summary.firstDayStartTimeStr;
    secondTimeEl.textContent = summary.secondDayStartTimeStr;
    slotFirstEl.classList.toggle('is-active', summary.activeIndex === 0);
    slotSecondEl.classList.toggle('is-active', summary.activeIndex === 1);

    riseWrapEl.classList.remove('hidden');
    transitWrapEl.classList.add('hidden');
    setWrapEl.classList.remove('hidden');
    polarStatusEl.classList.add('hidden');
    riseValEl.textContent = summary.moonriseStr || '--:--';
    setValEl.textContent = summary.moonsetStr || '--:--';

    trendEl.textContent = summary.phaseInfo.trendGlyph;
    trendEl.title = detailedTrendLabel;
    trendEl.setAttribute('aria-label', detailedTrendLabel);
  }

  // Top-right personal rhythm vector (distinct inline SVG icons when birthDate is set)
  const personalTrendEl = document.getElementById('hero-personal-trend');
  if (personalTrendEl) {
    if (personal) {
      const pTitle = dict.phases?.[personal.phaseKey]?.title || '';
      const pTooltip = pTitle
        ? `${pTitle} · ${labels.hero_personal_trend_title || labels.hero_trend_title}`
        : (labels.hero_personal_trend_title || labels.hero_trend_title);
      personalTrendEl.innerHTML = PERSONAL_VECTOR_SVGS[personal.phaseKey] || PERSONAL_VECTOR_SVGS.phase_rise;
      personalTrendEl.title = pTooltip;
      personalTrendEl.setAttribute('aria-label', pTooltip);
      personalTrendEl.classList.remove('hidden');
    } else {
      personalTrendEl.textContent = '';
      personalTrendEl.classList.add('hidden');
    }
  }

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
      bar.style.background = personal.timelineColor || personal.headerColor;
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

function updateObserverCoordsStatus(dict = getActiveDictionary(), isIncomplete = false) {
  const box = document.getElementById('location-status-box');
  if (!box) return;
  const labels = getUILabels(dict);
  if (isIncomplete) {
    box.classList.add('is-warning');
    box.textContent = labels.location_status_incomplete || 'Enter both latitude (-90..90) and longitude (-180..180).';
    return;
  }
  box.classList.remove('is-warning');
  const obs = getObserverCoords();
  const coordsStr = `(${obs.latDeg.toFixed(2)}°, ${obs.lonDeg.toFixed(2)}°)`;
  if (obs.source === 'manual') {
    box.textContent = `${labels.location_status_manual || 'Active: Manual'} ${coordsStr}`;
  } else {
    const tzLabel = obs.timeZone ? ` · ${obs.timeZone}` : '';
    box.textContent = `${labels.location_status_auto || 'Active: Auto'}${tzLabel} ${coordsStr}`;
  }
}

function updateObserverCoordsUI(dict = getActiveDictionary()) {
  const latInput = document.getElementById('input-observer-lat');
  const lonInput = document.getElementById('input-observer-lon');
  const activeEl = typeof document.activeElement !== 'undefined' ? document.activeElement : null;
  if (latInput && activeEl !== latInput) {
    latInput.value = appState.observerLat !== null ? String(appState.observerLat) : '';
  }
  if (lonInput && activeEl !== lonInput) {
    lonInput.value = appState.observerLon !== null ? String(appState.observerLon) : '';
  }
  const latRaw = latInput ? latInput.value.trim() : '';
  const lonRaw = lonInput ? lonInput.value.trim() : '';
  const hasAnyTyped = Boolean(latRaw || lonRaw);
  const latNum = parseObserverCoord(latRaw);
  const lonNum = parseObserverCoord(lonRaw);
  const typedValidPair =
    latNum !== null &&
    lonNum !== null &&
    latNum >= -90 &&
    latNum <= 90 &&
    lonNum >= -180 &&
    lonNum <= 180;
  updateObserverCoordsStatus(dict, hasAnyTyped && !typedValidPair);
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

  updateObserverCoordsUI(dict);

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

  // Appearance: Theme & Font Size
  const isLightTheme = appState.theme === 'light';
  const btnThemeDark = document.getElementById('theme-btn-dark');
  const btnThemeLight = document.getElementById('theme-btn-light');
  if (btnThemeDark) btnThemeDark.classList.toggle('active', !isLightTheme);
  if (btnThemeLight) btnThemeLight.classList.toggle('active', isLightTheme);

  const fontSize =
    appState.fontSize === 'large' || appState.fontSize === 'xlarge'
      ? appState.fontSize
      : 'normal';
  const btnFontNormal = document.getElementById('font-btn-normal');
  const btnFontLarge = document.getElementById('font-btn-large');
  const btnFontXlarge = document.getElementById('font-btn-xlarge');
  if (btnFontNormal) btnFontNormal.classList.toggle('active', fontSize === 'normal');
  if (btnFontLarge) btnFontLarge.classList.toggle('active', fontSize === 'large');
  if (btnFontXlarge) btnFontXlarge.classList.toggle('active', fontSize === 'xlarge');

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
  const isoDate = parseDisplayOrIsoDate(val);
  const parsed = isoDate ? parseBirthDateString(isoDate) : null;
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

function formatIcsUtc(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = n => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeIcsText(str) {
  return String(str ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function unescapeIcsText(str) {
  return String(str ?? '')
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function foldIcsLine(line) {
  const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
  const chunks = [];
  let current = '';
  let currentBytes = 0;
  for (const ch of String(line)) {
    const chBytes = encoder ? encoder.encode(ch).length : (ch.charCodeAt(0) > 127 ? 2 : 1);
    if (current && currentBytes + chBytes > 72) {
      chunks.push(current);
      current = ` ${ch}`;
      currentBytes = 1 + chBytes;
    } else {
      current += ch;
      currentBytes += chBytes;
    }
  }
  if (current) chunks.push(current);
  return chunks.join('\r\n');
}

function parseIcsDateValue(raw) {
  const val = String(raw || '').trim();
  const dtMatch = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(val);
  if (dtMatch) {
    const y = Number(dtMatch[1]);
    const m = Number(dtMatch[2]) - 1;
    const d = Number(dtMatch[3]);
    const hh = Number(dtMatch[4]);
    const mm = Number(dtMatch[5]);
    const ss = Number(dtMatch[6]);
    const dt = dtMatch[7] === 'Z'
      ? new Date(Date.UTC(y, m, d, hh, mm, ss))
      : new Date(y, m, d, hh, mm, ss);
    return Number.isNaN(dt.getTime()) ? null : { date: dt, hasTime: true };
  }
  const dMatch = /^(\d{4})(\d{2})(\d{2})$/.exec(val);
  if (dMatch) {
    const y = Number(dMatch[1]);
    const m = Number(dMatch[2]) - 1;
    const d = Number(dMatch[3]);
    const dt = new Date(y, m, d, 9, 0, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : { date: dt, hasTime: false };
  }
  return null;
}

function reminderDedupeKey(rem) {
  const textKey = String(rem?.text || '').trim().toLowerCase();
  if (rem?.mode === 'lunar') {
    return `lunar|${Number(rem.lunarDay) || 1}|${rem.repeatMonthly ? 1 : 0}|${textKey}`;
  }
  return `date|${String(rem?.dateISO || '')}|${textKey}`;
}

function buildRemindersIcs(reminders, dict) {
  const labels = getUILabels(dict);
  const now = new Date();
  const stamp = formatIcsUtc(now);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lunar Rhythm Navigator//Lunar Alarm//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(labels.reminders_heading || 'Lunar Alarm')}`
  ];

  reminders.forEach((rem, rIdx) => {
    if (!rem || !String(rem.text || '').trim()) return;
    const text = String(rem.text).trim();
    const mode = rem.mode === 'date' ? 'date' : 'lunar';
    const repeatMonthly = mode === 'lunar' && Boolean(rem.repeatMonthly);
    const enabled = rem.enabled !== false;
    const groupId = String(rem.id || `rem_${Date.now()}_${rIdx}`);
    let lunarDay = Number(rem.lunarDay) || 1;

    const occurrences = [];
    if (mode === 'lunar') {
      const count = repeatMonthly ? 12 : 1;
      let cursor = new Date(now.getTime());
      for (let i = 0; i < count; i++) {
        let occ;
        if (!repeatMonthly && rem.nextTriggerAt && rem.nextTriggerAt > now.getTime()) {
          occ = new Date(rem.nextTriggerAt);
        } else {
          occ = findNextDateForLunarDay(lunarDay, cursor);
        }
        occurrences.push(occ);
        cursor = new Date(occ.getTime() + 5 * 86400000);
      }
    } else {
      const parsed = rem.dateISO ? parseBirthDateString(rem.dateISO) : null;
      const targetAt = parsed
        ? new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 9, 0, 0, 0)
        : (rem.nextTriggerAt ? new Date(rem.nextTriggerAt) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0));
      if (!Number(rem.lunarDay)) {
        lunarDay = getCalendarDayLunarSummary(targetAt, targetAt).activeLunarDay;
      }
      occurrences.push(targetAt);
    }

    const desc =
      mode === 'lunar'
        ? `${lunarDay} ${labels.lunar_day_full}${repeatMonthly ? ` (${labels.label_every_month})` : ''} · Lunar Rhythm Navigator`
        : `${rem.dateISO || toISODate(occurrences[0])} (${lunarDay} ${labels.lunar_day_short}) · Lunar Rhythm Navigator`;

    occurrences.forEach((occ, idx) => {
      const endDt = new Date(occ.getTime() + 3600000);
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${groupId}-${idx}@lunar-rhythm.local`);
      lines.push(`DTSTAMP:${stamp}`);
      lines.push(`DTSTART:${formatIcsUtc(occ)}`);
      lines.push(`DTEND:${formatIcsUtc(endDt)}`);
      lines.push(`SUMMARY:${escapeIcsText(text)}`);
      lines.push(`DESCRIPTION:${escapeIcsText(desc)}`);
      lines.push('CATEGORIES:LUNAR-RHYTHM');
      lines.push(`X-LUNAR-RHYTHM-ID:${escapeIcsText(groupId)}`);
      lines.push(`X-LUNAR-MODE:${mode}`);
      lines.push(`X-LUNAR-DAY:${lunarDay}`);
      lines.push(`X-LUNAR-REPEAT:${repeatMonthly ? '1' : '0'}`);
      lines.push(`X-LUNAR-ENABLED:${enabled ? '1' : '0'}`);
      if (mode === 'date' && rem.dateISO) {
        lines.push(`X-LUNAR-DATE:${rem.dateISO}`);
      }
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:${escapeIcsText(text)}`);
      lines.push('TRIGGER:-PT0M');
      lines.push('END:VALARM');
      lines.push('END:VEVENT');
    });
  });

  lines.push('END:VCALENDAR');
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

function parseRemindersImportText(rawText) {
  const cleaned = String(rawText || '').replace(/^\uFEFF/, '');
  const trimmed = cleaned.trim();
  if (!trimmed) {
    throw new Error('Empty file');
  }

  // 1. iCalendar (.ics)
  if (/BEGIN:VCALENDAR/i.test(trimmed) || /BEGIN:VEVENT/i.test(trimmed)) {
    const unfolded = cleaned.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
    const rawLines = unfolded.split(/\r?\n/);
    const imported = [];
    const seenGroups = new Set();
    let inEvent = false;
    let inAlarm = false;
    let props = null;
    const now = new Date();

    for (const rawLine of rawLines) {
      const line = rawLine.trim();
      if (!line) continue;
      const upper = line.toUpperCase();
      if (upper === 'BEGIN:VEVENT') {
        inEvent = true;
        inAlarm = false;
        props = {};
        continue;
      }
      if (upper === 'END:VEVENT') {
        if (inEvent && props) {
          const text = String(props['SUMMARY'] || props['DESCRIPTION'] || '').trim();
          if (text) {
            const xMode = String(props['X-LUNAR-MODE'] || '').trim().toLowerCase();
            const xDay = Number(props['X-LUNAR-DAY']);
            const xRepeat = props['X-LUNAR-REPEAT'] === '1' || String(props['X-LUNAR-REPEAT'] || '').toLowerCase() === 'true';
            const xEnabled = props['X-LUNAR-ENABLED'] === '0' || String(props['X-LUNAR-ENABLED'] || '').toLowerCase() === 'false' ? false : true;
            const xGroupId = String(props['X-LUNAR-RHYTHM-ID'] || '').trim();

            if (xMode === 'lunar' && Number.isInteger(xDay) && xDay >= 1 && xDay <= 30) {
              const groupKey = xGroupId || `lunar|${xDay}|${xRepeat ? 1 : 0}|${text.toLowerCase()}`;
              if (!seenGroups.has(groupKey)) {
                seenGroups.add(groupKey);
                const nextDate = findNextDateForLunarDay(xDay, now);
                imported.push({
                  id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                  mode: 'lunar',
                  lunarDay: xDay,
                  dateISO: toISODate(nextDate),
                  text,
                  repeatMonthly: xRepeat,
                  enabled: xEnabled,
                  nextTriggerAt: nextDate.getTime()
                });
              }
            } else {
              const dtParsed = parseIcsDateValue(props['DTSTART']);
              const dateISO = parseDisplayOrIsoDate(props['X-LUNAR-DATE'] || '') || (dtParsed ? toISODate(dtParsed.date) : null);
              if (dateISO) {
                const parsedDate = parseBirthDateString(dateISO) || (dtParsed ? dtParsed.date : now);
                const targetAt = dtParsed && dtParsed.hasTime && !props['X-LUNAR-DATE']
                  ? dtParsed.date
                  : new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 9, 0, 0, 0);
                const lunarDay =
                  Number.isInteger(xDay) && xDay >= 1 && xDay <= 30
                    ? xDay
                    : getCalendarDayLunarSummary(parsedDate, targetAt).activeLunarDay;
                const groupKey = xGroupId || `date|${dateISO}|${text.toLowerCase()}`;
                if (!seenGroups.has(groupKey)) {
                  seenGroups.add(groupKey);
                  imported.push({
                    id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    mode: 'date',
                    lunarDay,
                    dateISO,
                    text,
                    repeatMonthly: false,
                    enabled: xEnabled,
                    nextTriggerAt: targetAt.getTime()
                  });
                }
              }
            }
          }
        }
        inEvent = false;
        inAlarm = false;
        props = null;
        continue;
      }
      if (!inEvent) continue;
      if (upper === 'BEGIN:VALARM') {
        inAlarm = true;
        continue;
      }
      if (upper === 'END:VALARM') {
        inAlarm = false;
        continue;
      }
      if (inAlarm) continue;

      const colonIdx = line.indexOf(':');
      if (colonIdx <= 0) continue;
      const keyPart = line.slice(0, colonIdx);
      const valPart = line.slice(colonIdx + 1);
      const propName = keyPart.split(';')[0].trim().toUpperCase();
      if (!(propName in props)) {
        props[propName] = unescapeIcsText(valPart);
      }
    }
    return imported;
  }

  // 2. JSON fallback (array of reminders or { reminders: [...] })
  const parsed = JSON.parse(trimmed);
  const list = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.reminders) ? parsed.reminders : null);
  if (!list) {
    throw new Error('Unsupported format');
  }
  const now = new Date();
  const imported = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const text = String(item.text || '').trim();
    if (!text) continue;
    const mode = item.mode === 'date' ? 'date' : 'lunar';
    const enabled = item.enabled !== false;
    if (mode === 'lunar') {
      const lunarDay = Number(item.lunarDay);
      if (!Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > 30) continue;
      const nextDate = findNextDateForLunarDay(lunarDay, now);
      imported.push({
        id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        mode: 'lunar',
        lunarDay,
        dateISO: toISODate(nextDate),
        text,
        repeatMonthly: Boolean(item.repeatMonthly),
        enabled,
        nextTriggerAt: nextDate.getTime()
      });
    } else {
      const dateISO = parseDisplayOrIsoDate(item.dateISO || '');
      if (!dateISO) continue;
      const parsedDate = parseBirthDateString(dateISO) || now;
      const targetAt = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 9, 0, 0, 0);
      const rawDay = Number(item.lunarDay);
      const lunarDay =
        Number.isInteger(rawDay) && rawDay >= 1 && rawDay <= 30
          ? rawDay
          : getCalendarDayLunarSummary(parsedDate, targetAt).activeLunarDay;
      imported.push({
        id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        mode: 'date',
        lunarDay,
        dateISO,
        text,
        repeatMonthly: false,
        enabled,
        nextTriggerAt: targetAt.getTime()
      });
    }
  }
  return imported;
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
  const labels = getUILabels(dict);
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
  const labels = getUILabels(dict);
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
  if (state.notifications.alarmPushEnabled) {
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
  }

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
        text: fired.text || getUILabels(dict).reminder_prefix_tts || '',
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
  const applyActiveTab = (tabName) => {
    const allowed = ['today', 'reminders', 'settings'];
    const target = allowed.includes(tabName) ? tabName : 'today';
    activeTab = target;
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.toggle('active', b.dataset?.tab === target));
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${target}`);
    });
  };
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      applyActiveTab(btn.dataset.tab);
    });
  });
  const initialHash = String(window.location?.hash || '').replace(/^#/, '');
  if (initialHash === 'settings' || initialHash === 'reminders' || initialHash === 'today') {
    applyActiveTab(initialHash);
  }

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
    await speakText(alarmText, getUILabels(dict).reminder_prefix_tts);
  });

  // Hero Celestial Toggle (tap Moon/Sun to persist moon <-> solar mode)
  const heroToggleBtn = document.getElementById('hero-celestial-toggle');
  if (heroToggleBtn) {
    heroToggleBtn.addEventListener('click', async () => {
      const nextMode = appState.heroMode === 'solar' ? 'moon' : 'solar';
      appState.heroMode = nextMode;
      await stateStore.saveState({ heroMode: nextMode });
      renderHeroAndToday(getActiveDictionary());
    });
  }

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

  // Reminders Tab: Form toggle, Import/Export (.ics) & Mode switch
  const formEl = document.getElementById('reminder-form');
  const remindersStatusEl = document.getElementById('reminders-status-msg');
  const showRemindersStatus = (text, isError = false) => {
    if (!remindersStatusEl) return;
    remindersStatusEl.textContent = text;
    remindersStatusEl.classList.remove('hidden');
    remindersStatusEl.classList.toggle('error', Boolean(isError));
  };

  document.getElementById('btn-toggle-reminder-form').addEventListener('click', () => {
    formEl.classList.toggle('hidden');
    updateLunarDayNextPreview();
    updateCalendarDateCalcPreview();
  });
  document.getElementById('btn-cancel-reminder').addEventListener('click', () => {
    formEl.classList.add('hidden');
  });

  async function copyTextToClipboard(text) {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fallback below for older Android WebView
      }
    }
    if (typeof document !== 'undefined' && document.body && typeof document.createElement === 'function') {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        if (typeof ta.setSelectionRange === 'function') {
          ta.setSelectionRange(0, text.length);
        }
        const ok = typeof document.execCommand === 'function' ? document.execCommand('copy') : false;
        ta.remove();
        if (ok) return true;
      } catch {
        // Ignore execCommand error
      }
    }
    return false;
  }

  async function saveOrShareExportFile({ filename, content, mimeType, title }) {
    const capPlugins = typeof window !== 'undefined' ? window.Capacitor?.Plugins : null;

    // 1. Capacitor Filesystem (+ optional Share) if available in native shell
    if (capPlugins?.Filesystem && typeof capPlugins.Filesystem.writeFile === 'function') {
      try {
        if (typeof capPlugins.Filesystem.checkPermissions === 'function') {
          const perm = await capPlugins.Filesystem.checkPermissions();
          if (perm?.publicStorage !== 'granted' && typeof capPlugins.Filesystem.requestPermissions === 'function') {
            await capPlugins.Filesystem.requestPermissions();
          }
        }
      } catch {
        // Older/custom Filesystem plugins may not implement checkPermissions/requestPermissions
      }

      for (const dir of ['DOCUMENTS', 'EXTERNAL']) {
        try {
          const writeRes = await capPlugins.Filesystem.writeFile({
            path: filename,
            data: content,
            directory: dir,
            encoding: 'utf8',
            recursive: true
          });
          if (capPlugins.Share && typeof capPlugins.Share.share === 'function' && writeRes?.uri) {
            try {
              await capPlugins.Share.share({
                title: title || filename,
                url: writeRes.uri,
                dialogTitle: filename
              });
            } catch {
              // File is already written to device storage even if share sheet is dismissed
            }
          }
          return { ok: true, method: dir === 'DOCUMENTS' ? 'documents' : 'external', filename };
        } catch {
          // Try next accessible directory
        }
      }

      if (capPlugins.Share && typeof capPlugins.Share.share === 'function') {
        try {
          const cacheRes = await capPlugins.Filesystem.writeFile({
            path: filename,
            data: content,
            directory: 'CACHE',
            encoding: 'utf8',
            recursive: true
          });
          await capPlugins.Share.share({
            title: title || filename,
            url: cacheRes?.uri,
            dialogTitle: filename
          });
          return { ok: true, method: 'share', filename };
        } catch (shareErr) {
          if (shareErr?.name === 'AbortError' || /cancel/i.test(String(shareErr?.message || ''))) {
            return { ok: false, aborted: true, filename };
          }
        }
      }
    }

    // 2. Web Share API Level 2 with file (modern Android Chrome / WebView / iOS)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      if (typeof File === 'function') {
        try {
          const file = new File([content], filename, { type: mimeType });
          if (!navigator.canShare || navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: title || filename
            });
            return { ok: true, method: 'share', filename };
          }
        } catch (err) {
          if (err?.name === 'AbortError') {
            return { ok: false, aborted: true, filename };
          }
        }
      }

      // 2b. Web Share text fallback when file sharing isn't supported
      try {
        await navigator.share({
          title: title || filename,
          text: content
        });
        return { ok: true, method: 'share', filename };
      } catch (err) {
        if (err?.name === 'AbortError') {
          return { ok: false, aborted: true, filename };
        }
      }
    }

    // 3. Capacitor Share plugin without Filesystem
    if (capPlugins?.Share && typeof capPlugins.Share.share === 'function') {
      try {
        await capPlugins.Share.share({ title: filename, text: content, dialogTitle: filename });
        return { ok: true, method: 'share', filename };
      } catch (err) {
        if (err?.name === 'AbortError' || /cancel/i.test(String(err?.message || ''))) {
          return { ok: false, aborted: true, filename };
        }
      }
    }

    // 4. Native WebView without file/share plugins: copy to clipboard cleanly for inline backup drawer
    if (isNativePlatform()) {
      const copied = await copyTextToClipboard(content);
      return { ok: copied, method: 'clipboard', filename };
    }

    // 5. Desktop / Mobile Browser download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true, method: 'download', filename };
  }

  const backupCardEl = document.getElementById('reminders-backup-card');
  const backupTextareaEl = document.getElementById('reminders-backup-textarea');
  const toggleBackupBtn = document.getElementById('btn-toggle-reminders-backup');
  const closeBackupBtn = document.getElementById('btn-close-reminders-backup');
  const copyBackupBtn = document.getElementById('btn-copy-backup-text');
  const importBackupTextBtn = document.getElementById('btn-import-backup-text');

  async function importRemindersFromText(rawText) {
    const labels = getUILabels();
    const parsedList = parseRemindersImportText(rawText);
    if (!parsedList.length) {
      showRemindersStatus(labels.msg_reminders_import_empty, true);
      return false;
    }
    const existingKeys = new Set(appState.reminders.map(reminderDedupeKey));
    const added = [];
    let skipped = 0;
    for (const rem of parsedList) {
      const key = reminderDedupeKey(rem);
      if (existingKeys.has(key)) {
        skipped += 1;
        continue;
      }
      existingKeys.add(key);
      added.push(rem);
    }
    if (!added.length) {
      showRemindersStatus(labels.msg_reminders_none_added, false);
      return true;
    }
    await persistReminders([...added, ...appState.reminders]);
    const skipPart = skipped > 0 ? ` (${labels.msg_reminders_skipped_dups}: ${skipped})` : '';
    showRemindersStatus(`${labels.msg_reminders_imported}: ${added.length}${skipPart}`, false);
    renderUI();
    return true;
  }

  if (toggleBackupBtn && backupCardEl) {
    toggleBackupBtn.addEventListener('click', () => {
      const isHidden = backupCardEl.classList.contains('hidden');
      if (isHidden) {
        formEl.classList.add('hidden');
        if (backupTextareaEl && !backupTextareaEl.value.trim() && appState.reminders.length) {
          backupTextareaEl.value = buildRemindersIcs(appState.reminders, getActiveDictionary());
        }
        backupCardEl.classList.remove('hidden');
      } else {
        backupCardEl.classList.add('hidden');
      }
    });
  }
  if (closeBackupBtn && backupCardEl) {
    closeBackupBtn.addEventListener('click', () => {
      backupCardEl.classList.add('hidden');
    });
  }
  if (copyBackupBtn && backupTextareaEl) {
    copyBackupBtn.addEventListener('click', async () => {
      const labels = getUILabels();
      const text = backupTextareaEl.value.trim() || (appState.reminders.length ? buildRemindersIcs(appState.reminders, getActiveDictionary()) : '');
      if (!text) {
        showRemindersStatus(labels.msg_reminders_export_empty, true);
        return;
      }
      backupTextareaEl.value = text;
      const ok = await copyTextToClipboard(text);
      showRemindersStatus(ok ? (labels.msg_backup_copied || labels.msg_reminders_export_clipboard) : labels.msg_reminders_import_error, !ok);
    });
  }
  if (importBackupTextBtn && backupTextareaEl) {
    importBackupTextBtn.addEventListener('click', async () => {
      const ok = await importRemindersFromText(backupTextareaEl.value);
      if (ok && backupCardEl) {
        backupCardEl.classList.add('hidden');
      }
    });
  }

  const exportRemindersBtn = document.getElementById('btn-export-reminders');
  if (exportRemindersBtn) {
    exportRemindersBtn.addEventListener('click', async () => {
      const dict = getActiveDictionary();
      const labels = getUILabels(dict);
      if (!appState.reminders.length) {
        showRemindersStatus(labels.msg_reminders_export_empty, true);
        return;
      }
      const icsContent = buildRemindersIcs(appState.reminders, dict);
      const filename = `lunar-rhythm-reminders-${toISODate(new Date())}.ics`;
      const result = await saveOrShareExportFile({
        filename,
        content: icsContent,
        mimeType: 'text/calendar;charset=utf-8',
        title: `${labels.hero_alarm_title} (.ics)`
      });
      if (!result.ok && result.aborted) {
        showRemindersStatus(labels.msg_reminders_export_cancelled || labels.btn_cancel, true);
        return;
      }
      const count = appState.reminders.length;
      if (result.method === 'documents') {
        showRemindersStatus(`${labels.msg_reminders_exported_docs || labels.msg_reminders_exported}: ${filename} (${count})`, false);
      } else if (result.method === 'external') {
        showRemindersStatus(`${labels.msg_reminders_exported_external || labels.msg_reminders_exported}: ${filename} (${count})`, false);
      } else if (result.method === 'share') {
        showRemindersStatus(`${labels.msg_reminders_exported_shared || labels.msg_reminders_exported}: ${filename} (${count})`, false);
      } else if (result.method === 'clipboard') {
        if (backupTextareaEl) backupTextareaEl.value = icsContent;
        if (backupCardEl) {
          formEl.classList.add('hidden');
          backupCardEl.classList.remove('hidden');
        }
        showRemindersStatus(`${labels.msg_reminders_export_clipboard || labels.msg_reminders_exported}: ${filename} (${count})`, false);
      } else {
        showRemindersStatus(`${labels.msg_reminders_exported}: ${filename} (${count})`, false);
      }
    });
  }

  const importRemindersInput = document.getElementById('input-import-reminders');
  if (importRemindersInput) {
    importRemindersInput.addEventListener('change', async (e) => {
      const labels = getUILabels();
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        await importRemindersFromText(text);
      } catch (err) {
        showRemindersStatus(`${labels.msg_reminders_import_error}: ${err?.message || 'Read error'}`, true);
      } finally {
        e.target.value = '';
      }
    });
  }

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

  const todayIso = toISODate(new Date());
  const calInput = document.getElementById('input-calendar-date');
  const calPicker = document.getElementById('input-calendar-date-picker');
  calInput.value = formatIsoToDisplayDate(todayIso);
  if (calPicker) calPicker.value = todayIso;

  calInput.addEventListener('input', (e) => {
    const rawVal = e.target.value;
    const directIso = /^\d{4}-\d{2}-\d{2}$/.test(rawVal.trim()) ? parseDisplayOrIsoDate(rawVal) : null;
    if (directIso) {
      e.target.value = formatIsoToDisplayDate(directIso);
      if (calPicker) calPicker.value = directIso;
      updateCalendarDateCalcPreview();
      return;
    }

    const digits = rawVal.replace(/\D/g, '').slice(0, 8);
    const formatted = maskBirthDateDigits(digits);
    if (e.target.value !== formatted) {
      e.target.value = formatted;
    }

    if (digits.length === 0) {
      if (calPicker) calPicker.value = '';
      updateCalendarDateCalcPreview();
      return;
    }

    if (digits.length === 8) {
      const parsedIso = parseDisplayOrIsoDate(formatted);
      if (calPicker) calPicker.value = parsedIso || '';
    }
    updateCalendarDateCalcPreview();
  });

  const handleCalDateCommit = (e) => {
    const trimmed = e.target.value.trim();
    if (!trimmed) {
      if (calPicker) calPicker.value = '';
      updateCalendarDateCalcPreview();
      return;
    }
    const parsedIso = parseDisplayOrIsoDate(trimmed);
    if (parsedIso) {
      e.target.value = formatIsoToDisplayDate(parsedIso);
      if (calPicker) calPicker.value = parsedIso;
    }
    updateCalendarDateCalcPreview();
  };
  calInput.addEventListener('blur', handleCalDateCommit);
  calInput.addEventListener('change', handleCalDateCommit);

  if (calPicker) {
    calPicker.addEventListener('change', (e) => {
      const iso = e.target.value || toISODate(new Date());
      calInput.value = formatIsoToDisplayDate(iso);
      updateCalendarDateCalcPreview();
    });
  }

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
      const rawDate = calInput.value.trim();
      const parsedIso = rawDate ? parseDisplayOrIsoDate(rawDate) : toISODate(new Date());
      if (!parsedIso) {
        updateCalendarDateCalcPreview();
        calInput.focus();
        return;
      }
      const dateStr = parsedIso;
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
    if (remindersStatusEl) remindersStatusEl.classList.add('hidden');
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
        void rescheduleNotifications();
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
        void rescheduleNotifications();
      }
      return;
    }

    if (digits.length === 8) {
      const parsedIso = parseDisplayOrIsoDate(formatted);
      if (parsedIso && appState.birthDate !== parsedIso) {
        appState.birthDate = parsedIso;
        await stateStore.saveState({ birthDate: parsedIso });
        renderUI();
        void rescheduleNotifications();
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
        void rescheduleNotifications();
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
        void rescheduleNotifications();
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
      void rescheduleNotifications();
    });
  }

  document.getElementById('input-birth-time').addEventListener('change', async (e) => {
    appState.birthTime = e.target.value || null;
    await stateStore.saveState({ birthTime: appState.birthTime });
    renderUI();
    void rescheduleNotifications();
  });

  document.getElementById('btn-clear-birth').addEventListener('click', async () => {
    appState.birthDate = null;
    appState.birthTime = null;
    await stateStore.saveState({ birthDate: null, birthTime: null });
    renderUI();
    void rescheduleNotifications();
  });

  // Settings Tab: Manual Observer Latitude & Longitude override (auto IANA when empty)
  const latInputEl = document.getElementById('input-observer-lat');
  const lonInputEl = document.getElementById('input-observer-lon');
  const handleObserverCoordsEdit = async (commitCleanup = false) => {
    const latRaw = latInputEl.value.trim();
    const lonRaw = lonInputEl.value.trim();

    if (!latRaw && !lonRaw) {
      if (appState.observerLat !== null || appState.observerLon !== null) {
        appState.observerLat = null;
        appState.observerLon = null;
        setObserverCoords(null, null);
        await stateStore.saveState({ observerLat: null, observerLon: null });
        renderUI();
        void rescheduleNotifications();
      } else {
        updateObserverCoordsStatus(getActiveDictionary(), false);
      }
      return;
    }

    const latNum = parseObserverCoord(latRaw);
    const lonNum = parseObserverCoord(lonRaw);
    const isValidPair =
      latNum !== null &&
      lonNum !== null &&
      latNum >= -90 &&
      latNum <= 90 &&
      lonNum >= -180 &&
      lonNum <= 180;

    if (isValidPair) {
      const nextLat = Number(latNum.toFixed(4));
      const nextLon = Number(lonNum.toFixed(4));
      if (commitCleanup) {
        latInputEl.value = String(nextLat);
        lonInputEl.value = String(nextLon);
      }
      if (appState.observerLat !== nextLat || appState.observerLon !== nextLon) {
        appState.observerLat = nextLat;
        appState.observerLon = nextLon;
        setObserverCoords(nextLat, nextLon);
        await stateStore.saveState({ observerLat: nextLat, observerLon: nextLon });
        renderUI();
        void rescheduleNotifications();
      } else {
        updateObserverCoordsStatus(getActiveDictionary(), false);
      }
      return;
    }

    if (commitCleanup && appState.observerLat !== null && appState.observerLon !== null) {
      latInputEl.value = String(appState.observerLat);
      lonInputEl.value = String(appState.observerLon);
      updateObserverCoordsStatus(getActiveDictionary(), false);
      return;
    }

    updateObserverCoordsStatus(getActiveDictionary(), true);
  };

  if (latInputEl && lonInputEl) {
    latInputEl.addEventListener('input', () => { handleObserverCoordsEdit(false); });
    lonInputEl.addEventListener('input', () => { handleObserverCoordsEdit(false); });
    latInputEl.addEventListener('blur', () => { handleObserverCoordsEdit(true); });
    lonInputEl.addEventListener('blur', () => { handleObserverCoordsEdit(true); });
  }

  const clearCoordsBtn = document.getElementById('btn-clear-coords');
  if (clearCoordsBtn) {
    clearCoordsBtn.addEventListener('click', async () => {
      if (latInputEl) latInputEl.value = '';
      if (lonInputEl) lonInputEl.value = '';
      appState.observerLat = null;
      appState.observerLon = null;
      setObserverCoords(null, null);
      await stateStore.saveState({ observerLat: null, observerLon: null });
      renderUI();
      void rescheduleNotifications();
    });
  }

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
    void rescheduleNotifications();
  });

  document.getElementById('dict-mode-default').addEventListener('click', async () => {
    appState.dictionaryMode = 'default';
    await stateStore.saveState({ dictionaryMode: 'default' });
    renderUI();
    void rescheduleNotifications();
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
    void rescheduleNotifications();
  });

  document.getElementById('btn-download-template').addEventListener('click', async () => {
    const baseDict = getActiveBaseDictionary();
    const labels = getUILabels();
    const langCode = appState.builtinLang || detectDefaultLang();
    const filename = `base_default_${langCode}.json`;
    const result = await saveOrShareExportFile({
      filename,
      content: JSON.stringify(baseDict, null, 2),
      mimeType: 'application/json;charset=utf-8',
      title: filename
    });
    const status = document.getElementById('dict-status-msg');
    if (status && result.ok) {
      status.classList.remove('hidden', 'error');
      const prefix = result.method === 'documents'
        ? (labels.msg_reminders_exported_docs || labels.msg_reminders_exported)
        : result.method === 'external'
        ? (labels.msg_reminders_exported_external || labels.msg_reminders_exported)
        : result.method === 'share'
        ? (labels.msg_reminders_exported_shared || labels.msg_reminders_exported)
        : result.method === 'clipboard'
        ? (labels.msg_backup_copied || labels.msg_reminders_export_clipboard || labels.msg_reminders_exported)
        : labels.msg_reminders_exported;
      status.textContent = `${prefix}: ${filename}`;
    }
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
        'aspect_dynamics', 'maneuvers', 'actor_maneuver_matrix', 'lifestyle_tips',
        'day_themes', 'phase_variants', 'role_tone', 'window_focus', 'ui_labels', 'help'
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
      void rescheduleNotifications();
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

  // Appearance: Theme & Font Size controls
  document.querySelectorAll('[data-theme]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const nextTheme = btn.dataset.theme === 'light' ? 'light' : 'dark';
      if (appState.theme === nextTheme) return;
      appState.theme = nextTheme;
      applyAppearanceSettings();
      await stateStore.saveState({ theme: nextTheme });
      renderUI();
    });
  });

  document.querySelectorAll('[data-font]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = btn.dataset.font;
      const nextFont = val === 'large' || val === 'xlarge' ? val : 'normal';
      if (appState.fontSize === nextFont) return;
      appState.fontSize = nextFont;
      applyAppearanceSettings();
      await stateStore.saveState({ fontSize: nextFont });
      renderUI();
    });
  });

  // Open standalone interactive Help page (help.html)
  const openHelpBtn = document.getElementById('btn-open-help');
  if (openHelpBtn) {
    openHelpBtn.addEventListener('click', () => {
      const params = new URLSearchParams();
      if (Number.isFinite(appState.observerLat) && Number.isFinite(appState.observerLon)) {
        params.set('lat', String(appState.observerLat));
        params.set('lon', String(appState.observerLon));
      }
      if (appState.birthDate) {
        params.set('birth', appState.birthDate);
      }
      params.set('lang', appState.builtinLang || detectDefaultLang());
      if (appState.dictionaryMode === 'custom') {
        params.set('dict', 'custom');
      }
      params.set('theme', appState.theme === 'light' ? 'light' : 'dark');
      params.set('font', appState.fontSize || 'normal');
      params.set('back', 'index.html#settings');
      window.location.href = `help.html?${params.toString()}`;
    });
  }

  // Copy donation wallet address (ready when support block in Settings is enabled)
  document.querySelectorAll('[data-copy-wallet]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const addr = btn.getAttribute('data-copy-wallet') || '';
      if (!addr) return;
      await copyTextToClipboard(addr);
      const labels = getUILabels();
      btn.textContent = labels.support_copied_toast || 'Скопировано ✓';
      btn.classList.add('is-copied');
      if (btn._copyResetTimer) clearTimeout(btn._copyResetTimer);
      btn._copyResetTimer = setTimeout(() => {
        btn.classList.remove('is-copied');
        btn.textContent = getUILabels().btn_copy_backup || 'Копировать';
        btn._copyResetTimer = null;
      }, 1800);
    });
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
    await speakText(pending.text, getUILabels(dict).reminder_prefix_tts);
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
      await speakText(text, getUILabels(dict).reminder_prefix_tts || '');
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
  applyAppearanceSettings();
  setObserverCoords(appState.observerLat, appState.observerLon);

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
