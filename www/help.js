import {
  SYNODIC_MONTH,
  getMoonPhaseInfo,
  getCalendarDayLunarSummary,
  getHorizonDayDetails,
  getObserverCoords,
  parseObserverCoord,
  setObserverCoords,
  parseBirthDateString,
  getBodySkyPosition,
  findHorizonEventsForFn,
  getLunationIntervals,
  getLunarDayAt,
  getMoonPosition,
  getSunPosition,
  toJulianDay,
  fromJulianDay
} from './astro_engine.js';
import {
  BUILTIN_DICTIONARIES,
  SUPPORTED_BUILTIN_LANGS,
  detectDefaultLang,
  deepMergeDictionary,
  getBuiltinDictionary
} from './dictionary_default.js';

const SAFE_BACK_TARGETS = new Set([
  'index.html',
  'index.html#settings',
  'index.html#reminders',
  'popup.html',
  'popup.html#settings',
  'popup.html#reminders'
]);

const PHASE_DEFS = [
  { key: 'new_moon', illum: '0–0,4%' },
  { key: 'waxing_crescent', illum: '0,4–44%' },
  { key: 'first_quarter', illum: '~50%' },
  { key: 'waxing_gibbous', illum: '56–99,6%' },
  { key: 'full_moon', illum: '99,6–100%' },
  { key: 'waning_gibbous', illum: '99,6–56%' },
  { key: 'last_quarter', illum: '~50%' },
  { key: 'waning_crescent', illum: '44–0,4%' }
];

function getPhaseIndex(E) {
  const e = ((E % 360) + 360) % 360;
  if (e >= 353 || e <= 7) return 0;
  if (e < 83) return 1;
  if (e < 97) return 2;
  if (e < 173) return 3;
  if (e <= 187) return 4;
  if (e < 263) return 5;
  if (e < 277) return 6;
  return 7;
}

function parseHelpQueryContext() {
  const params = new URLSearchParams(window.location.search);

  const rawLang = String(params.get('lang') || '').trim().toLowerCase();
  const lang = SUPPORTED_BUILTIN_LANGS.includes(rawLang) ? rawLang : detectDefaultLang();

  const rawBack = String(params.get('back') || '').trim();
  const backUrl = SAFE_BACK_TARGETS.has(rawBack) ? rawBack : 'index.html#settings';

  const dictModeParam = String(params.get('dict') || '').trim().toLowerCase();

  const latVal = parseObserverCoord(params.get('lat'));
  const lonVal = parseObserverCoord(params.get('lon'));
  const hasValidCoords =
    latVal !== null &&
    lonVal !== null &&
    latVal >= -90 &&
    latVal <= 90 &&
    lonVal >= -180 &&
    lonVal <= 180;

  if (hasValidCoords) {
    setObserverCoords(latVal, lonVal);
  } else {
    setObserverCoords(null, null);
  }
  const coords = getObserverCoords();

  const rawBirth = String(params.get('birth') || '').trim();
  const birthDate = parseBirthDateString(rawBirth);
  let birthMoonAge = 5.0;
  if (birthDate) {
    const info = getMoonPhaseInfo(birthDate);
    if (info && Number.isFinite(info.moonAge)) {
      birthMoonAge = info.moonAge;
    }
  }

  const rawTheme = String(params.get('theme') || '').trim().toLowerCase();
  const theme = rawTheme === 'light' || rawTheme === 'dark' ? rawTheme : null;

  const rawFont = String(params.get('font') || '').trim().toLowerCase();
  const fontSize = ['normal', 'large', 'xlarge'].includes(rawFont) ? rawFont : null;

  return {
    lang,
    backUrl,
    dictModeParam,
    hasValidCoords,
    coords,
    birthISO: birthDate ? rawBirth : null,
    birthMoonAge,
    theme,
    fontSize
  };
}

function applyHelpAppearance(theme, fontSize) {
  if (!document.documentElement) return;
  document.documentElement.dataset.theme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.fontSize = ['large', 'xlarge'].includes(fontSize) ? fontSize : 'normal';
}

const ctx = parseHelpQueryContext();
applyHelpAppearance(ctx.theme || 'dark', ctx.fontSize || 'normal');
const baseDict = BUILTIN_DICTIONARIES[ctx.lang] || getBuiltinDictionary(ctx.lang);
let activeDict = baseDict;

function hDict() {
  return (activeDict && activeDict.help) || (BUILTIN_DICTIONARIES.ru && BUILTIN_DICTIONARIES.ru.help) || {};
}

function moonAgeUnit() {
  return (activeDict && activeDict.ui_labels && activeDict.ui_labels.moon_age_unit) || 'дн.';
}

const backBtn = document.getElementById('btn-back-to-app');
if (backBtn) {
  backBtn.href = ctx.backUrl;
}

const tabs = document.querySelectorAll('.tab');
const sections = document.querySelectorAll('section');
let activeTab = 'orbital';

tabs.forEach(tabBtn => {
  tabBtn.addEventListener('click', () => {
    const key = tabBtn.dataset.tab;
    tabs.forEach(x => x.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));
    tabBtn.classList.add('active');
    const sec = document.getElementById(key);
    if (sec) sec.classList.add('active');
    activeTab = key;

    if (activeTab === 'horizon') { drawHorizon(); updateHorizonPanels(); }
    if (activeTab === 'days') { drawLunarDays(+document.getElementById('daySlider').value); updateLunarDayPanels(+document.getElementById('daySlider').value); }
    if (activeTab === 'personal') drawPersonal();
  });
});

let currentElong = 0;
let horizonDate = new Date();
let isPlaying = false;
let animFrame = null;
let lastTime = 0;
const CYCLE_MS = 20000;
const DEG_PER_MS = 360 / CYCLE_MS;

const elongSlider = document.getElementById('elongSlider');
const phaseSliderHorizon = document.getElementById('phaseSliderHorizon');
const elongVal = document.getElementById('elongVal');
const phaseValHorizon = document.getElementById('phaseValHorizon');
const timeSlider = document.getElementById('timeSlider');
const timeVal = document.getElementById('timeVal');
const orbitalTimeSlider = document.getElementById('orbitalTimeSlider');
const orbitalTimeVal = document.getElementById('orbitalTimeVal');
const cycleBtn = document.getElementById('cycleBtn');
const todayBtn = document.getElementById('todayBtn');
const orbitalEarthViewCanvas = document.getElementById('orbitalEarthViewCanvas');
const oevCtx = orbitalEarthViewCanvas ? orbitalEarthViewCanvas.getContext('2d') : null;

function formatSliderHour(hr) {
  const totalMin = Math.round(Math.max(0, Math.min(24, hr)) * 60);
  const hh = Math.floor(totalMin / 60) % 24;
  const mm = totalMin % 60;
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
}

function setTimeSliderHour(hr) {
  const clamped = Math.max(0, Math.min(24, Number(hr) || 0));
  const snapped = Math.round(clamped * 10) / 10;
  const valStr = snapped.toFixed(1);
  // Метка — по фактическому значению ползунка (шаг 0.1 ч), иначе расхождение в минуты.
  const clockStr = formatSliderHour(snapped);
  if (timeSlider) timeSlider.value = valStr;
  if (timeVal) timeVal.textContent = clockStr;
  if (orbitalTimeSlider) orbitalTimeSlider.value = valStr;
  if (orbitalTimeVal) orbitalTimeVal.textContent = clockStr;
}

function drawEarthViewMoon(ctx2d, cx, cy, moonR, elongDeg, opts = {}) {
  if (!ctx2d) return;
  const eNorm = ((elongDeg % 360) + 360) % 360;
  const rad = (eNorm * Math.PI) / 180;
  const isStrictNew = eNorm <= 2 || eNorm >= 358;
  const isNearSun = eNorm <= 7 || eNorm >= 353;

  ctx2d.save();
  ctx2d.translate(cx, cy);
  if (opts.dimNearSun && isNearSun) ctx2d.globalAlpha = 0.72;

  ctx2d.fillStyle = '#1b1f30';
  ctx2d.beginPath();
  ctx2d.arc(0, 0, moonR, 0, Math.PI * 2);
  ctx2d.fill();

  if (isStrictNew) {
    ctx2d.strokeStyle = '#6b7599';
    ctx2d.lineWidth = Math.max(1.25, moonR * 0.08);
    ctx2d.setLineDash([3, 3]);
    ctx2d.beginPath();
    ctx2d.arc(0, 0, moonR, 0, Math.PI * 2);
    ctx2d.stroke();
    ctx2d.setLineDash([]);
  } else {
    ctx2d.beginPath();
    const cosE = Math.cos(rad);
    const rx = Math.abs(cosE) * moonR;

    if (Math.abs(eNorm - 180) <= 2) {
      ctx2d.arc(0, 0, moonR, 0, Math.PI * 2);
    } else if (eNorm < 180) {
      ctx2d.arc(0, 0, moonR, -Math.PI / 2, Math.PI / 2, false);
      if (cosE > 0) {
        ctx2d.ellipse(0, 0, rx, moonR, 0, Math.PI / 2, -Math.PI / 2, true);
      } else {
        ctx2d.ellipse(0, 0, rx, moonR, 0, Math.PI / 2, -Math.PI / 2, false);
      }
    } else {
      ctx2d.arc(0, 0, moonR, Math.PI / 2, -Math.PI / 2, false);
      if (cosE < 0) {
        ctx2d.ellipse(0, 0, rx, moonR, 0, -Math.PI / 2, Math.PI / 2, false);
      } else {
        ctx2d.ellipse(0, 0, rx, moonR, 0, -Math.PI / 2, Math.PI / 2, true);
      }
    }

    ctx2d.fillStyle = '#e8e6d8';
    ctx2d.fill();
    ctx2d.shadowColor = '#e8e6d8';
    ctx2d.shadowBlur = opts.glow ?? 14;
    ctx2d.fill();
  }

  ctx2d.restore();
}

function drawOrbitalEarthView(elongDeg) {
  if (!oevCtx || !orbitalEarthViewCanvas) return;
  const W = orbitalEarthViewCanvas.width;
  const H = orbitalEarthViewCanvas.height;
  oevCtx.clearRect(0, 0, W, H);
  drawEarthViewMoon(oevCtx, W / 2, H / 2, Math.min(W, H) * 0.36, elongDeg, {
    glow: 10,
    dimNearSun: false
  });
}

function updateUI(E, isSlider) {
  const h = hDict();
  const unit = moonAgeUnit();
  currentElong = Math.max(0, Math.min(360, E));
  if (!isSlider) {
    elongSlider.value = currentElong;
  }
  const normElong = ((currentElong % 360) + 360) % 360;
  elongVal.textContent = Math.round(currentElong) + '°';

  const idx = getPhaseIndex(normElong);
  const def = PHASE_DEFS[idx];
  const phaseNames = (activeDict && activeDict.moon_phase_names) || {};
  const moonTrends = (activeDict && activeDict.moon_trends) || {};
  const approxAge = (normElong / 360) * SYNODIC_MONTH;
  const phaseTitle = phaseNames[def.key] || def.key;

  document.getElementById('phName').textContent = `${phaseTitle} · ~${approxAge.toFixed(1)} ${unit}`;
  document.getElementById('phIllum').textContent = def.illum;
  document.getElementById('phSky').textContent = h[`phase_sky_${def.key}`] || '';

  const trend = document.getElementById('phTrend');
  if (normElong <= 7 || normElong >= 353) {
    trend.textContent = `○ ${moonTrends.new || phaseTitle}`;
    trend.style.color = 'var(--dim)';
  } else if (Math.abs(normElong - 180) <= 7) {
    trend.textContent = `● ${moonTrends.full || phaseTitle}`;
    trend.style.color = 'var(--gold)';
  } else if (normElong < 180) {
    trend.textContent = `↗ ${moonTrends.waxing || (h.trend_waxing || 'Waxing')}`;
    trend.style.color = 'var(--blue)';
  } else {
    trend.textContent = `↘ ${moonTrends.waning || (h.trend_waning || 'Waning')}`;
    trend.style.color = 'var(--orange)';
  }

  drawOrbital();
  drawOrbitalEarthView(normElong);
  drawHorizon();
}

elongSlider.addEventListener('input', (e) => {
  stopAnim();
  updateUI(+e.target.value, true);
});
// Ползунок фазы в разделе «Восход и заход» выбирает реальную дату:
// модельной «усреднённой» картинки больше нет (задание В1).
phaseSliderHorizon.addEventListener('input', (e) => {
  stopAnim();
  const target = +e.target.value;
  setHorizonDate(findDateForElongation(target, horizonDate));
});
function onTimeSliderInput(e) {
  setTimeSliderHour(parseFloat(e.target.value));
  drawOrbital();
  drawHorizon();
  updateHorizonPanels();
}

timeSlider.addEventListener('input', onTimeSliderInput);
if (orbitalTimeSlider) {
  orbitalTimeSlider.addEventListener('input', onTimeSliderInput);
}

const horizonDateInput = document.getElementById('horizonDateInput');
if (horizonDateInput) {
  horizonDateInput.addEventListener('change', () => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(horizonDateInput.value || '').trim());
    if (!m) return;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    if (Number.isNaN(d.getTime())) return;
    setHorizonDate(d);
  });
}

function resetHorizonToToday() {
  stopAnim();
  const now = new Date();
  const nowInfo = getMoonPhaseInfo(now);
  setTimeSliderHour(now.getHours() + now.getMinutes() / 60);
  setHorizonDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  updateUI(nowInfo.elong, false);
}

todayBtn.addEventListener('click', resetHorizonToToday);

const horizonTodayBtn = document.getElementById('horizonTodayBtn');
if (horizonTodayBtn) {
  horizonTodayBtn.addEventListener('click', resetHorizonToToday);
}

function startAnim() {
  isPlaying = true;
  cycleBtn.textContent = hDict().btn_pause || '⏸ Pause';
  lastTime = performance.now();
  const loop = (ts) => {
    if (!isPlaying) return;
    const dt = ts - lastTime;
    lastTime = ts;
    let nextElong = currentElong + dt * DEG_PER_MS;
    if (nextElong > 360) nextElong -= 360;
    updateUI(nextElong, false);
    animFrame = requestAnimationFrame(loop);
  };
  animFrame = requestAnimationFrame(loop);
}

function stopAnim() {
  isPlaying = false;
  cycleBtn.textContent = hDict().btn_play || '▶ Animate';
  if (animFrame) cancelAnimationFrame(animFrame);
}

cycleBtn.addEventListener('click', () => (isPlaying ? stopAnim() : startAnim()));

/* ═══════════ ОРБИТАЛЬНЫЙ CANVAS ═══════════ */
const orbitalCanvas = document.getElementById('orbitalCanvas');
const octx = orbitalCanvas.getContext('2d');

function drawOutlinedText(ctx2d, text, x, y, fill, font, align, maxWidth) {
  ctx2d.save();
  ctx2d.font = font;
  ctx2d.textAlign = align || 'center';
  ctx2d.lineJoin = 'round';
  ctx2d.lineWidth = 4;
  ctx2d.strokeStyle = 'rgba(13, 17, 34, 0.9)';
  if (maxWidth) {
    ctx2d.strokeText(text, x, y, maxWidth);
  } else {
    ctx2d.strokeText(text, x, y);
  }
  ctx2d.fillStyle = fill;
  if (maxWidth) {
    ctx2d.fillText(text, x, y, maxWidth);
  } else {
    ctx2d.fillText(text, x, y);
  }
  ctx2d.restore();
}

function drawOrbital() {
  const h = hDict();
  const W = orbitalCanvas.width;
  const H = orbitalCanvas.height;
  const cx = W / 2;
  const cy = H / 2 - 4;
  const earthR = 20;
  const moonOrbitR = 116;
  const moonR = 19;
  const rad = (currentElong * Math.PI) / 180;

  octx.clearRect(0, 0, W, H);

  octx.fillStyle = 'rgba(170, 178, 213, 0.4)';
  for (let i = 0; i < 22; i++) {
    octx.beginPath();
    octx.arc((i * 47) % W, (i * 83) % H, (i % 2) + 0.6, 0, Math.PI * 2);
    octx.fill();
  }

  const sunGrad = octx.createLinearGradient(0, 0, 145, 0);
  sunGrad.addColorStop(0, 'rgba(232, 230, 216, 0.5)');
  sunGrad.addColorStop(1, 'rgba(232, 230, 216, 0)');
  octx.fillStyle = sunGrad;
  octx.fillRect(0, 0, 145, H);

  octx.fillStyle = '#e8e6d8';
  octx.font = 'bold 16px sans-serif';
  octx.textAlign = 'left';
  octx.fillText(h.canvas_sun || 'SUN', 14, 26, 125);

  octx.strokeStyle = 'rgba(232, 230, 216, 0.14)';
  octx.lineWidth = 1;
  octx.setLineDash([4, 4]);
  for (let y = 44; y < H; y += 44) {
    octx.beginPath();
    octx.moveTo(20, y);
    octx.lineTo(W - 20, y);
    octx.stroke();
  }
  octx.setLineDash([]);

  // Базовая окружность орбиты Луны
  octx.strokeStyle = '#2a3152';
  octx.lineWidth = 1.5;
  octx.beginPath();
  octx.arc(cx, cy, moonOrbitR, 0, Math.PI * 2);
  octx.stroke();

  // Дуга угла элонгации на орбите Луны
  if (currentElong >= 359.5) {
    octx.beginPath();
    octx.arc(cx, cy, moonOrbitR, 0, Math.PI * 2);
    octx.strokeStyle = 'rgba(205, 212, 232, 0.72)';
    octx.lineWidth = 3.5;
    octx.stroke();
  } else if (currentElong > 0.5) {
    octx.beginPath();
    octx.arc(cx, cy, moonOrbitR, Math.PI, Math.PI - rad, true);
    octx.strokeStyle = 'rgba(205, 212, 232, 0.72)';
    octx.lineWidth = 3.5;
    octx.stroke();
  }

  octx.fillStyle = '#8b91a8';
  [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach(a => {
    const px = cx + Math.cos(a) * moonOrbitR;
    const py = cy - Math.sin(a) * moonOrbitR;
    octx.beginPath();
    octx.arc(px, py, 2.8, 0, Math.PI * 2);
    octx.fill();
  });

  // Направление на Солнце — влево (угол Math.PI). 0° = Новолуние слева между Солнцем и Землёй;
  // движение против часовой стрелки: 0° (лево) -> 90° (низ) -> 180° (право, Полнолуние) -> 270° (верх).
  const mx = -Math.cos(rad);
  const my = Math.sin(rad);
  const moonX = cx + mx * moonOrbitR;
  const moonY = cy + my * moonOrbitR;

  // Ось Земля — Солнце (пунктир влево от Земли)
  octx.strokeStyle = 'rgba(245, 183, 62, 0.38)';
  octx.lineWidth = 1.5;
  octx.setLineDash([4, 4]);
  octx.beginPath();
  octx.moveTo(cx, cy);
  octx.lineTo(Math.max(20, cx - moonOrbitR - 22), cy);
  octx.stroke();
  octx.setLineDash([]);

  // Вектор Земля — Луна
  octx.strokeStyle = '#7f9cf5';
  octx.lineWidth = 2.2;
  octx.beginPath();
  octx.moveTo(cx, cy);
  octx.lineTo(moonX, moonY);
  octx.stroke();

  // Земля в центре с дневной (слева к Солнцу) и ночной (справа) полусферами
  const earthGrad = octx.createLinearGradient(cx - earthR, cy, cx + earthR, cy);
  earthGrad.addColorStop(0, '#78b0ff');
  earthGrad.addColorStop(0.42, '#4a85ea');
  earthGrad.addColorStop(0.58, '#1d3260');
  earthGrad.addColorStop(1, '#111a36');
  octx.fillStyle = earthGrad;
  octx.beginPath();
  octx.arc(cx, cy, earthR, 0, Math.PI * 2);
  octx.fill();
  octx.strokeStyle = 'rgba(130, 175, 255, 0.38)';
  octx.lineWidth = 1.2;
  octx.stroke();

  // Динамическое положение наблюдателя («Вы») по местному солнечному времени (12:00 — слева к Солнцу, против часовой)
  const hr = timeSlider ? parseFloat(timeSlider.value) : 12;
  const obsRad = ((hr - 12) / 24) * Math.PI * 2;
  const ux = -Math.cos(obsRad);
  const uy = Math.sin(obsRad);

  const dotX = cx + ux * earthR;
  const dotY = cy + uy * earthR;
  const tipX = cx + ux * (earthR + 5);
  const tipY = cy + uy * (earthR + 5);
  const tailX = cx + ux * (earthR + 27);
  const tailY = cy + uy * (earthR + 27);

  // Маркер наблюдателя на поверхности Земли
  octx.fillStyle = '#ffd76a';
  octx.beginPath();
  octx.arc(dotX, dotY, 3.6, 0, Math.PI * 2);
  octx.fill();
  octx.strokeStyle = '#0d1122';
  octx.lineWidth = 1.2;
  octx.stroke();

  // Стрелка на наблюдателя
  const arrowAngle = Math.atan2(tipY - tailY, tipX - tailX);
  const headLen = 8.5;
  octx.strokeStyle = '#dce0ef';
  octx.fillStyle = '#dce0ef';
  octx.lineWidth = 2;
  octx.beginPath();
  octx.moveTo(tailX, tailY);
  octx.lineTo(tipX + Math.cos(arrowAngle) * 2.5, tipY + Math.sin(arrowAngle) * 2.5);
  octx.stroke();

  octx.beginPath();
  octx.moveTo(tipX, tipY);
  octx.lineTo(tipX - headLen * Math.cos(arrowAngle - 0.45), tipY - headLen * Math.sin(arrowAngle - 0.45));
  octx.lineTo(tipX - headLen * Math.cos(arrowAngle + 0.45), tipY - headLen * Math.sin(arrowAngle + 0.45));
  octx.closePath();
  octx.fill();

  // Предварительная позиция подписи Луны для взаимной разводки
  const labelX = Math.max(48, Math.min(W - 48, moonX));
  const nameY = moonY + moonR + 20;
  const degY = moonY + moonR + 39;

  // Подпись «Вы» (с защитой от пересечения с осью Солнца, вектором Луны и подписью Луны)
  let lblX = cx + ux * (earthR + 40);
  let lblY = cy + uy * (earthR + 40) + 5;
  const tx = -uy;
  const ty = ux;

  // Отводим от пунктирной оси Солнца слева
  if (ux < -0.2 && Math.abs(uy) < 0.38) {
    lblY += uy >= 0 ? 15 : -15;
  }
  // Отводим от вектора Земля — Луна при совпадении направлений
  const dotMoon = ux * mx + uy * my;
  const crossMoon = ux * my - uy * mx;
  if (dotMoon > 0.35 && Math.abs(crossMoon) < 0.42) {
    const side = crossMoon >= 0 ? -1 : 1;
    lblX += tx * side * 18;
    lblY += ty * side * 18;
  }
  // Защита от наложения на блок подписи Луны
  if (Math.hypot(lblX - labelX, lblY - (nameY + degY) / 2) < 42) {
    const side = (lblX - labelX) * tx + (lblY - nameY) * ty >= 0 ? 1 : -1;
    lblX += tx * side * 24;
    lblY += ty * side * 24;
  }

  drawOutlinedText(octx, h.canvas_you || 'You', lblX, lblY, '#e8e9f0', 'bold 15px sans-serif', 'center', 75);

  // Физический вид сверху на орбите (Вариант Б): левая полусфера Луны всегда обращена к Солнцу и освещена,
  // правая — в тени; фактическая фаза «как видна с Земли» показана на мини-диске в карточке ниже.
  octx.save();
  octx.translate(moonX, moonY);

  octx.fillStyle = '#20222e';
  octx.beginPath();
  octx.arc(0, 0, moonR, 0, Math.PI * 2);
  octx.fill();

  octx.strokeStyle = 'rgba(139, 145, 168, 0.38)';
  octx.lineWidth = 1.2;
  octx.stroke();

  octx.beginPath();
  octx.arc(0, 0, moonR, Math.PI / 2, -Math.PI / 2, false);
  octx.closePath();
  octx.fillStyle = '#e8e6d8';
  octx.shadowColor = '#e8e6d8';
  octx.shadowBlur = 12;
  octx.fill();
  octx.restore();

  // Подпись Луны и угла у самого диска Луны
  drawOutlinedText(octx, h.canvas_moon || 'Moon', labelX, nameY, '#e8e9f0', 'bold 17px sans-serif', 'center', 95);
  drawOutlinedText(octx, Math.round(currentElong) + '°', labelX, degY, '#f5a47f', 'bold 15.5px sans-serif', 'center', 70);
}

/* ═══════════ ГОРИЗОНТ CANVAS ═══════════ */
const horizonCanvas = document.getElementById('horizonCanvas');
const hctx = horizonCanvas.getContext('2d');

function lerpColor(c1, c2, p) {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * p),
    Math.round(c1[1] + (c2[1] - c1[1]) * p),
    Math.round(c1[2] + (c2[2] - c1[2]) * p)
  ];
}
function rgbStr(c) { return `rgb(${c[0]},${c[1]},${c[2]})`; }

/* ═══════════ РЕАЛЬНЫЕ ДАННЫЕ: утилиты ═══════════ */
const MS_PER_MIN = 60000;

function dayKeyOf(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function formatDateShort(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}`;
}

function formatClock(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatClockJD(jd) {
  return jd === null || jd === undefined ? '--:--' : formatClock(fromJulianDay(jd));
}

function durUnitH() { return hDict().dur_h || 'ч'; }
function durUnitM() { return hDict().dur_m || 'мин'; }

function formatDurationMs(ms) {
  const total = Math.max(0, Math.round(ms / MS_PER_MIN));
  return `${Math.floor(total / 60)} ${durUnitH()} ${total % 60} ${durUnitM()}`;
}

function formatSignedMinutes(min) {
  const r = Math.round(min);
  if (!r) return `±0 ${durUnitM()}`;
  return `${r > 0 ? '+' : '−'}${Math.abs(r)} ${durUnitM()}`;
}

function formatMinutesDelta(min) {
  const r = Math.max(0, Math.round(min));
  const hh = Math.floor(r / 60);
  const mm = r % 60;
  return hh > 0 ? `${hh} ${durUnitH()} ${mm} ${durUnitM()}` : `${mm} ${durUnitM()}`;
}

// Реальная элонгация Луны на заданный момент (без «усреднённой модели»).
function elongAt(date) {
  const jd = toJulianDay(date);
  const m = getMoonPosition(jd).lon;
  const s = getSunPosition(jd).lon;
  return (((m - s) % 360) + 360) % 360;
}

// Ближайшая календарная дата с заданной реальной элонгацией (задание В1).
function findDateForElongation(targetElong, aroundDate) {
  const base = new Date(aroundDate.getFullYear(), aroundDate.getMonth(), aroundDate.getDate(), 12, 0, 0, 0);
  let best = null;
  let bestDiff = Infinity;
  for (let i = -20; i <= 20; i++) {
    const cand = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i, 12, 0, 0, 0);
    const diff = Math.abs(((elongAt(cand) - targetElong + 540) % 360) - 180);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = cand;
    }
  }
  return best || base;
}

/* ═══════════ ГОРИЗОНТ: реальные события дня ═══════════ */
const horizonDataCache = new Map();

function findUpperTransit(body, jdStart, jdEnd, latDeg, lonDeg) {
  const step = 1 / 96;
  let prev = getBodySkyPosition(jdStart, body, latDeg, lonDeg).hourAngleDeg;
  for (let t = jdStart + step; t <= jdEnd + step; t += step) {
    const tc = Math.min(t, jdEnd);
    const cur = getBodySkyPosition(tc, body, latDeg, lonDeg).hourAngleDeg;
    if (prev > 270 && cur < 90) {
      let lo = tc - step;
      let hi = tc;
      for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2;
        const ha = getBodySkyPosition(mid, body, latDeg, lonDeg).hourAngleDeg;
        const s = ha > 180 ? ha - 360 : ha;
        if (s < 0) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }
    prev = cur;
    if (tc >= jdEnd) break;
  }
  return null;
}

function buildDaySegments(rises, sets, jdDayStart, startsAbove) {
  const events = [
    ...rises.map((jd) => ({ h: (jd - jdDayStart) * 24, type: 'rise' })),
    ...sets.map((jd) => ({ h: (jd - jdDayStart) * 24, type: 'set' }))
  ].sort((a, b) => a.h - b.h);
  const segs = [];
  let above = startsAbove;
  let curStart = 0;
  for (const ev of events) {
    const hr = Math.max(0, Math.min(24, ev.h));
    if (ev.type === 'set' && above) {
      segs.push([curStart, hr]);
      above = false;
    } else if (ev.type === 'rise' && !above) {
      curStart = hr;
      above = true;
    }
  }
  if (above) segs.push([curStart, 24]);
  return segs;
}

function formatHorizonMetricJD(disp) {
  if (!disp || disp.jd === null || disp.jd === undefined) return '--:--';
  const d = fromJulianDay(disp.jd);
  return disp.sameDay ? formatClock(d) : `${formatClock(d)} (${formatDateShort(d)})`;
}

function computeHorizonData(date, lite) {
  const key = `${dayKeyOf(date)}|${lite ? 'L' : 'F'}`;
  const cached = horizonDataCache.get(key);
  if (cached) return cached;

  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const dayStart = new Date(y, m, d, 0, 0, 0, 0);
  const dayEnd = new Date(y, m, d, 23, 59, 59, 999);
  const jdStart = toJulianDay(dayStart);
  const jdEnd = toJulianDay(dayEnd);
  const { latDeg, lonDeg } = getObserverCoords();

  const sunPos = (jd) => getBodySkyPosition(jd, 'sun', latDeg, lonDeg);
  const moonPos = (jd) => getBodySkyPosition(jd, 'moon', latDeg, lonDeg);

  const data = { date: dayStart, dayStart, dayEnd, jdStart, jdEnd, latDeg, lonDeg };

  const moonEvents = findHorizonEventsForFn(
    (jd) => moonPos(jd).altDeg, jdStart, jdEnd, latDeg, lonDeg
  );
  data.moonRise = moonEvents.rises[0] || null;
  data.moonSet = moonEvents.sets[0] || null;
  data.moonRise2 = moonEvents.rises[1] || null;

  if (!lite) {
    const sunEvents = findHorizonEventsForFn(
      (jd) => sunPos(jd).altDeg, jdStart, jdEnd, latDeg, lonDeg
    );
    const civilEvents = findHorizonEventsForFn(
      (jd) => sunPos(jd).geoAltDeg + 6, jdStart, jdEnd, latDeg, lonDeg
    );
    const nauticalEvents = findHorizonEventsForFn(
      (jd) => sunPos(jd).geoAltDeg + 12, jdStart, jdEnd, latDeg, lonDeg
    );

    data.sunRise = sunEvents.rises[0] || null;
    data.sunSet = sunEvents.sets[0] || null;
    data.civilDawn = civilEvents.rises[0] || null;
    data.civilDusk = civilEvents.sets[0] || null;
    data.nauticalDawn = nauticalEvents.rises[0] || null;
    data.nauticalDusk = nauticalEvents.sets[0] || null;
    data.sunTransit = findUpperTransit('sun', jdStart, jdEnd, latDeg, lonDeg);
    data.moonTransit = findUpperTransit('moon', jdStart, jdEnd, latDeg, lonDeg);

    // Если событие Луны перешагнуло через полночь (например, кульминация в 00:54 на следующие сутки),
    // находим ближайшее соответствующее событие за границей суток, чтобы не показывать ложное «--:--».
    if (data.moonTransit !== null) {
      data.moonTransitDisplay = { jd: data.moonTransit, sameDay: true };
    } else {
      let adjTransit = null;
      if (data.moonRise !== null) {
        adjTransit = findUpperTransit('moon', data.moonRise, jdEnd + 1.08, latDeg, lonDeg);
      }
      if (adjTransit === null && data.moonSet !== null) {
        adjTransit = findUpperTransit('moon', jdStart - 1.08, data.moonSet, latDeg, lonDeg);
      }
      if (adjTransit === null) {
        adjTransit =
          findUpperTransit('moon', jdEnd, jdEnd + 1.08, latDeg, lonDeg) ||
          findUpperTransit('moon', jdStart - 1.08, jdStart, latDeg, lonDeg);
      }
      data.moonTransitDisplay = adjTransit !== null ? { jd: adjTransit, sameDay: false } : null;
    }

    if (data.moonRise !== null) {
      data.moonRiseDisplay = { jd: data.moonRise, sameDay: true };
    } else {
      const nextMoonEv = findHorizonEventsForFn(
        (jd) => moonPos(jd).altDeg, jdEnd, jdEnd + 1.15, latDeg, lonDeg
      );
      const prevMoonEv = findHorizonEventsForFn(
        (jd) => moonPos(jd).altDeg, jdStart - 1.15, jdStart, latDeg, lonDeg
      );
      const adjRise = nextMoonEv.rises[0] || prevMoonEv.rises[prevMoonEv.rises.length - 1] || null;
      data.moonRiseDisplay = adjRise !== null ? { jd: adjRise, sameDay: false } : null;
    }

    if (data.moonSet !== null) {
      data.moonSetDisplay = { jd: data.moonSet, sameDay: true };
    } else {
      const nextMoonEv = findHorizonEventsForFn(
        (jd) => moonPos(jd).altDeg, jdEnd, jdEnd + 1.15, latDeg, lonDeg
      );
      const prevMoonEv = findHorizonEventsForFn(
        (jd) => moonPos(jd).altDeg, jdStart - 1.15, jdStart, latDeg, lonDeg
      );
      const adjSet = nextMoonEv.sets[0] || prevMoonEv.sets[prevMoonEv.sets.length - 1] || null;
      data.moonSetDisplay = adjSet !== null ? { jd: adjSet, sameDay: false } : null;
    }

    data.sunStartsAbove = sunPos(jdStart).altDeg > 0;
    data.moonStartsAbove = moonPos(jdStart).altDeg > 0;
    data.sunSegments = buildDaySegments(sunEvents.rises, sunEvents.sets, jdStart, data.sunStartsAbove);
    data.moonSegments = buildDaySegments(moonEvents.rises, moonEvents.sets, jdStart, data.moonStartsAbove);
    data.civilSegments = buildDaySegments(
      civilEvents.rises, civilEvents.sets, jdStart, sunPos(jdStart).geoAltDeg + 6 > 0
    );
    data.nauticalSegments = buildDaySegments(
      nauticalEvents.rises, nauticalEvents.sets, jdStart, sunPos(jdStart).geoAltDeg + 12 > 0
    );
  }

  horizonDataCache.set(key, data);
  if (horizonDataCache.size > 160) horizonDataCache.clear();
  return data;
}

// Цвет неба — по реальной высоте Солнца (с настоящими сумерками).
const SKY_BY_ALT = [
  { alt: 90, top: [26, 43, 94], bot: [74, 111, 165] },
  { alt: 8, top: [26, 43, 94], bot: [74, 111, 165] },
  { alt: 0, top: [40, 40, 80], bot: [120, 80, 100] },
  { alt: -6, top: [50, 30, 60], bot: [180, 80, 60] },
  { alt: -12, top: [14, 18, 44], bot: [34, 34, 78] },
  { alt: -18, top: [5, 8, 20], bot: [16, 21, 48] }
];

function skyColorsForAlt(alt) {
  if (alt >= SKY_BY_ALT[0].alt) return { top: SKY_BY_ALT[0].top, bot: SKY_BY_ALT[0].bot };
  for (let i = 0; i < SKY_BY_ALT.length - 1; i++) {
    const a = SKY_BY_ALT[i];
    const b = SKY_BY_ALT[i + 1];
    if (alt <= a.alt && alt >= b.alt) {
      const p = (a.alt - alt) / (a.alt - b.alt);
      return { top: lerpColor(a.top, b.top, p), bot: lerpColor(a.bot, b.bot, p) };
    }
  }
  const last = SKY_BY_ALT[SKY_BY_ALT.length - 1];
  return { top: last.top, bot: last.bot };
}

// Азимут 90° (восток) — левый край, 270° (запад) — правый: вид на юг.
function horizonAzToX(az) {
  const W = horizonCanvas.width;
  return 42 + ((az - 90) / 180) * (W - 84);
}

function horizonGroundY() {
  return Math.min(234, horizonCanvas.height - 234);
}

function horizonAltToY(alt) {
  const groundY = horizonGroundY();
  return groundY - (alt / 90) * (groundY - 22);
}

function drawDiurnalPath(body, data) {
  // Лунные сутки длятся ~24 ч 50 мин, поэтому охватываем 1.055 суток,
  // чтобы замкнуть верхнюю кульминацию без разрыва пунктирной дуги.
  const spanDays = body === 'moon' ? 1.055 : 1.002;
  const steps = 112;
  hctx.beginPath();
  let prevAz = null;
  for (let i = 0; i <= steps; i++) {
    const jd = data.jdStart + (spanDays * i) / steps;
    const p = getBodySkyPosition(jd, body, data.latDeg, data.lonDeg);
    const x = horizonAzToX(p.azDeg);
    const y = horizonAltToY(p.altDeg);
    if (i === 0 || (prevAz !== null && Math.abs(p.azDeg - prevAz) > 60)) {
      hctx.moveTo(x, y);
    } else {
      hctx.lineTo(x, y);
    }
    prevAz = p.azDeg;
  }
  hctx.stroke();
}

function drawSkyBody(pos, kind, elong, offArcY) {
  const h = hDict();
  const W = horizonCanvas.width;
  const groundY = horizonGroundY();
  const visible = pos.altDeg > 0 && pos.azDeg >= 90 && pos.azDeg <= 270;
  const label = kind === 'sun' ? (h.horizon_sun_label || 'Sun') : (h.canvas_moon || 'Moon');

  if (!visible) {
    const east = pos.azDeg < 180;
    const state = pos.altDeg <= 0
      ? (h.horizon_below || 'below horizon')
      : (h.horizon_behind || 'behind');
    const txt = `${label} — ${state} (${Math.round(pos.azDeg)}°)`;
    const color = kind === 'sun' ? '#ffd773' : '#d2d8ef';
    const xPos = east ? 18 : W - 18;
    const yPos = offArcY !== undefined ? offArcY : groundY - 14;
    drawOutlinedText(hctx, txt, xPos, yPos, color, 'bold 13px sans-serif', east ? 'left' : 'right', W / 2 + 30);
    return;
  }

  const x = horizonAzToX(pos.azDeg);
  const y = horizonAltToY(pos.altDeg);
  const safeX = Math.max(48, Math.min(W - 48, x));
  if (kind === 'sun') {
    const sunR = 26;
    const g = hctx.createRadialGradient(x, y, 4, x, y, sunR);
    g.addColorStop(0, '#fff3c4');
    g.addColorStop(0.5, '#ffd76a');
    g.addColorStop(1, 'rgba(245, 183, 62, 0)');
    hctx.fillStyle = g;
    hctx.beginPath();
    hctx.arc(x, y, sunR, 0, Math.PI * 2);
    hctx.fill();

    hctx.fillStyle = '#f5b73e';
    hctx.beginPath();
    hctx.arc(x, y, 13, 0, Math.PI * 2);
    hctx.fill();

    const lblY = y + 40 > groundY - 6 ? y - 24 : y + 40;
    drawOutlinedText(hctx, `${label} ${Math.round(pos.altDeg)}°`, safeX, lblY, '#ffd76a', 'bold 14.5px sans-serif', 'center', 130);
  } else {
    const isNearSun = elong <= 7 || elong >= 353;
    drawEarthViewMoon(hctx, x, y, 17, elong, { glow: 14, dimNearSun: true });
    const lblY = y + 34 > groundY - 6 ? y - 24 : y + 34;
    drawOutlinedText(hctx, `${label} ${Math.round(pos.altDeg)}°`, safeX, lblY, isNearSun ? '#b4bad0' : '#f0f2f8', 'bold 14.5px sans-serif', 'center', 130);
  }
}

function drawHorizon() {
  const h = hDict();
  const W = horizonCanvas.width;
  const H = horizonCanvas.height;
  const groundY = horizonGroundY();
  const data = computeHorizonData(horizonDate);
  const time = parseFloat(timeSlider.value);
  const totalMin = Math.round(Math.max(0, Math.min(23.98, time)) * 60);
  const refMoment = new Date(
    data.date.getFullYear(), data.date.getMonth(), data.date.getDate(), 0, totalMin, 0, 0
  );
  const refJD = toJulianDay(refMoment);
  const sunNow = getBodySkyPosition(refJD, 'sun', data.latDeg, data.lonDeg);
  const moonNow = getBodySkyPosition(refJD, 'moon', data.latDeg, data.lonDeg);
  const eNorm = elongAt(data.date);

  hctx.clearRect(0, 0, W, H);

  // ── Небо: реальная высота Солнца ──
  const sky = skyColorsForAlt(sunNow.geoAltDeg);
  const skyGrad = hctx.createLinearGradient(0, 0, 0, groundY);
  skyGrad.addColorStop(0, rgbStr(sky.top));
  skyGrad.addColorStop(1, rgbStr(sky.bot));
  hctx.fillStyle = skyGrad;
  hctx.fillRect(0, 0, W, groundY);

  const darkness = Math.max(0, Math.min(1, (-6 - sunNow.geoAltDeg) / 10));
  if (darkness > 0) {
    hctx.fillStyle = `rgba(255,255,255,${0.12 + 0.45 * darkness})`;
    for (let i = 0; i < 42; i++) {
      hctx.beginPath();
      hctx.arc((i * 61) % W, (i * 37) % (groundY - 12), ((i % 3) + 1) * 0.25, 0, Math.PI * 2);
      hctx.fill();
    }
  }

  // ── Суточные дуги: реальная геометрия для широты наблюдателя ──
  hctx.save();
  hctx.beginPath();
  hctx.rect(42, 0, W - 84, groundY);
  hctx.clip();
  hctx.setLineDash([5, 5]);
  hctx.lineWidth = 1.6;
  hctx.strokeStyle = 'rgba(245, 183, 62, 0.38)';
  drawDiurnalPath('sun', data);
  hctx.strokeStyle = 'rgba(127, 156, 245, 0.46)';
  drawDiurnalPath('moon', data);
  hctx.setLineDash([]);
  hctx.restore();

  const sunVis = sunNow.altDeg > 0 && sunNow.azDeg >= 90 && sunNow.azDeg <= 270;
  const moonVis = moonNow.altDeg > 0 && moonNow.azDeg >= 90 && moonNow.azDeg <= 270;
  const bothOffArc = !sunVis && !moonVis;
  drawSkyBody(sunNow, 'sun', eNorm, groundY - 14);
  drawSkyBody(moonNow, 'moon', eNorm, bothOffArc ? groundY - 38 : groundY - 14);

  // ── Дата и время в углах ──
  drawOutlinedText(hctx, formatDateShort(data.date), 16, 28, '#dbe0f2', 'bold 16px sans-serif', 'left');
  drawOutlinedText(hctx, formatSliderHour(time), W - 16, 30, '#f0f2f8', 'bold 22px monospace', 'right');

  // ── Нижняя панель ──
  hctx.fillStyle = '#0d111a';
  hctx.fillRect(0, groundY, W, H - groundY);
  hctx.strokeStyle = '#2a3152';
  hctx.lineWidth = 2;
  hctx.beginPath();
  hctx.moveTo(0, groundY);
  hctx.lineTo(W, groundY);
  hctx.stroke();

  hctx.fillStyle = '#9aa0b5';
  hctx.font = 'bold 13px sans-serif';
  hctx.textAlign = 'center';
  hctx.fillText(h.canvas_east || 'EAST', 42, groundY + 20, 76);
  hctx.fillText(h.canvas_south || 'SOUTH', W / 2, groundY + 20, 76);
  hctx.fillText(h.canvas_west || 'WEST', W - 42, groundY + 20, 76);

  const sunW = h.horizon_sun_label || 'Sun';
  const moonW = h.canvas_moon || 'Moon';
  const colRise = h.horizon_col_rise || 'Rise';
  const colCulm = h.horizon_col_culm || 'Culmination';
  const colSet = h.horizon_col_set || 'Set';

  // Таблица телеметрии: заголовки столбцов + строки Солнца и Луны с крупным читаемым шрифтом
  const colX = [164, 298, 430];
  hctx.fillStyle = '#8b91a8';
  hctx.font = '13px sans-serif';
  hctx.textAlign = 'center';
  hctx.fillText(colRise, colX[0], groundY + 44, 126);
  hctx.fillText(colCulm, colX[1], groundY + 44, 134);
  hctx.fillText(colSet, colX[2], groundY + 44, 126);

  const sunRowY = groundY + 68;
  const moonRowY = groundY + 95;

  hctx.font = 'bold 14.5px sans-serif';
  hctx.textAlign = 'left';
  hctx.fillStyle = '#f5b73e';
  hctx.fillText(sunW, 14, sunRowY, 78);
  hctx.fillStyle = '#7f9cf5';
  hctx.fillText(moonW, 14, moonRowY, 78);

  hctx.font = 'bold 15px sans-serif';
  hctx.textAlign = 'center';
  hctx.fillStyle = '#f5b73e';
  hctx.fillText(formatClockJD(data.sunRise), colX[0], sunRowY, 126);
  hctx.fillText(formatClockJD(data.sunTransit), colX[1], sunRowY, 134);
  hctx.fillText(formatClockJD(data.sunSet), colX[2], sunRowY, 126);

  hctx.fillStyle = '#7f9cf5';
  hctx.fillText(formatHorizonMetricJD(data.moonRiseDisplay), colX[0], moonRowY, 128);
  hctx.fillText(formatHorizonMetricJD(data.moonTransitDisplay), colX[1], moonRowY, 134);
  hctx.fillText(formatHorizonMetricJD(data.moonSetDisplay), colX[2], moonRowY, 128);

  // ── 24-часовая лента ──
  const tlX = 82;
  const tlW = W - 98;
  const tlTop = groundY + 120;
  const sunBarY = tlTop + 14;
  const moonBarY = tlTop + 40;
  const barH = 18;

  hctx.fillStyle = '#8b91a8';
  hctx.font = '13.5px sans-serif';
  hctx.textAlign = 'left';
  hctx.fillText(h.canvas_timeline_24h || 'Above horizon (24h)', tlX, tlTop + 2, tlW - 110);

  hctx.textAlign = 'right';
  hctx.fillStyle = '#7fd1ae';
  hctx.font = 'bold 13.5px sans-serif';
  hctx.fillText(`${h.horizon_fact_label || 'Fact'}: ${formatDateShort(data.date)}`, tlX + tlW, tlTop + 2, 110);

  hctx.font = 'bold 14px sans-serif';
  hctx.textAlign = 'right';
  hctx.fillStyle = '#f5b73e';
  hctx.fillText(sunW, tlX - 10, sunBarY + 14, 68);
  hctx.fillStyle = '#e8e6d8';
  hctx.fillText(moonW, tlX - 10, moonBarY + 14, 68);

  hctx.fillStyle = '#141828';
  hctx.fillRect(tlX, sunBarY, tlW, barH);
  hctx.fillRect(tlX, moonBarY, tlW, barH);

  // Сумерки (гражданские, Солнце ниже −6°) — подсветка за полосой Солнца
  hctx.fillStyle = 'rgba(245, 183, 62, 0.22)';
  for (const [s, e] of data.civilSegments) {
    hctx.fillRect(tlX + (s / 24) * tlW, sunBarY + 3, ((e - s) / 24) * tlW, barH - 6);
  }
  hctx.fillStyle = 'rgba(120, 140, 200, 0.2)';
  for (const [s, e] of data.nauticalSegments || []) {
    hctx.fillRect(tlX + (s / 24) * tlW, sunBarY + 3, ((e - s) / 24) * tlW, barH - 6);
  }

  hctx.fillStyle = 'rgba(245, 183, 62, 0.85)';
  for (const [s, e] of data.sunSegments) {
    hctx.fillRect(tlX + (s / 24) * tlW, sunBarY + 3, ((e - s) / 24) * tlW, barH - 6);
  }

  const isNearSun = eNorm <= 7 || eNorm >= 353;
  hctx.fillStyle = isNearSun ? 'rgba(139, 145, 168, 0.45)' : 'rgba(127, 156, 245, 0.85)';
  for (const [s, e] of data.moonSegments) {
    hctx.fillRect(tlX + (s / 24) * tlW, moonBarY + 3, ((e - s) / 24) * tlW, barH - 6);
  }

  hctx.font = '13px monospace';
  hctx.textAlign = 'center';
  for (let hr = 0; hr <= 24; hr += 6) {
    const gx = tlX + (hr / 24) * tlW;
    hctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    hctx.lineWidth = 1;
    hctx.beginPath();
    hctx.moveTo(gx, sunBarY);
    hctx.lineTo(gx, moonBarY + barH);
    hctx.stroke();

    hctx.fillStyle = '#8b91a8';
    hctx.fillText(String(hr).padStart(2, '0'), gx, moonBarY + barH + 17);
  }

  const curX = tlX + (time / 24) * tlW;
  hctx.strokeStyle = '#ffffff';
  hctx.lineWidth = 2.5;
  hctx.beginPath();
  hctx.moveTo(curX, sunBarY - 4);
  hctx.lineTo(curX, moonBarY + barH + 4);
  hctx.stroke();

  // Легенда сумерок
  const legendY = H - 14;
  hctx.fillStyle = 'rgba(245, 183, 62, 0.4)';
  hctx.fillRect(16, legendY - 10, 14, 10);
  hctx.fillStyle = '#8b91a8';
  hctx.font = '13px sans-serif';
  hctx.textAlign = 'left';
  hctx.fillText(h.horizon_twilight_label || 'twilight (−6°)', 36, legendY, W - 52);
}

/* ═══════════ ПАНЕЛИ РАЗДЕЛА «ВОСХОД И ЗАХОД» ═══════════ */
function horizonDriftSeries(fromDate, count) {
  const rows = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + i);
    const lite = computeHorizonData(d, true);
    rows.push({ date: d, rise: lite.moonRise });
  }
  return rows;
}

function drawHorizonDrift() {
  const c = document.getElementById('horizonDriftCanvas');
  if (!c) return;
  const h = hDict();
  const g = c.getContext('2d');
  const W = c.width;
  const H = c.height;
  g.clearRect(0, 0, W, H);

  const rows = horizonDriftSeries(horizonDate, 8);
  const items = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].rise === null || rows[i - 1].rise === null) continue;
    // Между восходами в соседних календарных сутках проходит ~1440 мин плюс сам сдвиг.
    const min = Math.round((rows[i].rise - rows[i - 1].rise) * 24 * 60) - 1440;
    items.push({ date: rows[i].date, min });
  }
  if (!items.length) return;

  const padL = 16;
  const padR = 16;
  const padT = 44;
  const padB = 34;
  const maxMin = Math.max(20, ...items.map((it) => it.min));
  const avg = items.reduce((a, b) => a + b.min, 0) / items.length;
  const barW = (W - padL - padR) / items.length;
  const yOf = (m) => padT + (1 - m / maxMin) * (H - padT - padB);

  g.fillStyle = '#8b91a8';
  g.font = '13.5px sans-serif';
  g.textAlign = 'left';
  g.fillText(`${h.horizon_drift_avg || 'average'} ${formatSignedMinutes(avg)}`, padL, 20, W * 0.6);

  g.textAlign = 'right';
  g.fillText(h.horizon_drift_unit || 'min/day', W - padR, 20, W * 0.35);

  g.strokeStyle = 'rgba(255,255,255,0.22)';
  g.lineWidth = 1.5;
  g.setLineDash([4, 4]);
  g.beginPath();
  g.moveTo(padL, yOf(avg));
  g.lineTo(W - padR, yOf(avg));
  g.stroke();
  g.setLineDash([]);

  items.forEach((it, i) => {
    const x = padL + i * barW + barW * 0.2;
    const bw = barW * 0.6;
    const y = yOf(it.min);
    const standstill = Math.abs(it.min) < 15;
    g.fillStyle = standstill ? 'rgba(127, 209, 174, 0.85)' : 'rgba(245, 164, 127, 0.85)';
    g.fillRect(x, y, bw, (H - padB) - y);

    drawOutlinedText(g, `${it.min > 0 ? '+' : ''}${it.min}`, x + bw / 2, y - 6, '#e8e9f0', 'bold 14.5px sans-serif', 'center', barW - 2);

    g.fillStyle = '#9aa0b5';
    g.font = '13.5px sans-serif';
    g.textAlign = 'center';
    g.fillText(formatDateShort(it.date), x + bw / 2, H - 10, barW - 2);
  });
}

function setHorizonDate(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  horizonDate = d;
  const e = elongAt(d);
  if (phaseSliderHorizon) {
    phaseSliderHorizon.value = String(Math.round(e));
    phaseValHorizon.textContent = Math.round(e) + '°';
  }
  const dateInput = document.getElementById('horizonDateInput');
  if (dateInput) {
    dateInput.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const dateVal = document.getElementById('horizonDateVal');
  if (dateVal) dateVal.textContent = formatDateShort(d);
  updateHorizonPanels();
  drawHorizon();
}

function createMetricCell(label, val, valColor) {
  const cell = document.createElement('div');
  cell.className = 'phase-metric-row';
  const lblEl = document.createElement('span');
  lblEl.className = 'phase-metric-label';
  lblEl.textContent = label;
  const valEl = document.createElement('span');
  valEl.className = 'phase-metric-val';
  valEl.textContent = val;
  if (valColor) valEl.style.color = valColor;
  cell.appendChild(lblEl);
  cell.appendChild(valEl);
  return cell;
}

function updateHorizonPanels() {
  const h = hDict();
  const data = computeHorizonData(horizonDate);
  const time = parseFloat(timeSlider.value);
  const totalMin = Math.round(Math.max(0, Math.min(23.98, time)) * 60);
  const refMoment = new Date(
    data.date.getFullYear(), data.date.getMonth(), data.date.getDate(), 0, totalMin, 0, 0
  );
  const refJD = toJulianDay(refMoment);

  const sunW = h.horizon_sun_label || 'Sun';
  const moonW = h.canvas_moon || 'Moon';
  const riseW = h.horizon_rise_word || 'rise';
  const setW = h.horizon_set_word || 'set';
  const transW = h.horizon_transit_word || 'culmination';
  const colRise = h.horizon_col_rise || 'Rise';
  const colCulm = h.horizon_col_culm || 'Culmination';
  const colSet = h.horizon_col_set || 'Set';

  const coordsBadge = document.getElementById('horizonCoordsBadge');
  if (coordsBadge) {
    coordsBadge.textContent = `${formatDateShort(data.date)} · ${data.latDeg.toFixed(2)}°, ${data.lonDeg.toFixed(2)}°`;
  }

  const obsEl = document.getElementById('horizonObserverInfo');
  if (obsEl) {
    obsEl.textContent = '';
    const list = document.createElement('div');
    list.className = 'body-summary-list';

    const buildBodyRow = (dotCls, name, rStr, cStr, sStr, color) => {
      const row = document.createElement('div');
      row.className = 'body-summary-row';
      const head = document.createElement('div');
      head.className = 'body-summary-name';
      const dot = document.createElement('span');
      dot.className = `body-dot ${dotCls}`;
      const nm = document.createElement('span');
      nm.textContent = name;
      head.appendChild(dot);
      head.appendChild(nm);

      const grid = document.createElement('div');
      grid.className = 'triple-metrics';
      grid.appendChild(createMetricCell(colRise, rStr, color));
      grid.appendChild(createMetricCell(colCulm, cStr, color));
      grid.appendChild(createMetricCell(colSet, sStr, color));
      row.appendChild(head);
      row.appendChild(grid);
      return row;
    };

    list.appendChild(
      buildBodyRow(
        'sun',
        sunW,
        formatClockJD(data.sunRise),
        formatClockJD(data.sunTransit),
        formatClockJD(data.sunSet),
        'var(--gold)'
      )
    );
    list.appendChild(
      buildBodyRow(
        'moon',
        moonW,
        formatHorizonMetricJD(data.moonRiseDisplay),
        formatHorizonMetricJD(data.moonTransitDisplay),
        formatHorizonMetricJD(data.moonSetDisplay),
        'var(--blue)'
      )
    );
    obsEl.appendChild(list);
  }

  const nextEl = document.getElementById('horizonNextEvent');
  if (nextEl) {
    const collect = (d) => ([
      { jd: d.sunRise, text: `${sunW} — ${riseW}` },
      { jd: d.sunTransit, text: `${sunW} — ${transW}` },
      { jd: d.sunSet, text: `${sunW} — ${setW}` },
      { jd: d.moonRise, text: `${moonW} — ${riseW}` },
      { jd: d.moonTransit, text: `${moonW} — ${transW}` },
      { jd: d.moonSet, text: `${moonW} — ${setW}` }
    ]);
    const tomorrow = new Date(
      data.date.getFullYear(), data.date.getMonth(), data.date.getDate() + 1
    );
    const events = [
      ...collect(data),
      ...collect(computeHorizonData(tomorrow))
    ].filter((e) => e.jd !== null && e.jd !== undefined && e.jd > refJD);
    events.sort((a, b) => a.jd - b.jd);
    if (events.length) {
      const ev = events[0];
      const delta = Math.round((ev.jd - refJD) * 24 * 60);
      const isTomorrow = ev.jd > toJulianDay(new Date(
        data.date.getFullYear(), data.date.getMonth(), data.date.getDate() + 1
      ));
      nextEl.textContent =
        `${ev.text} · ${formatDateShort(fromJulianDay(ev.jd))} ${formatClockJD(ev.jd)} ` +
        `(${h.horizon_after_label || 'in'} ${formatMinutesDelta(delta)}` +
        (isTomorrow ? `, ${h.horizon_tomorrow_word || 'tomorrow'}` : '') + ').';
    } else {
      nextEl.textContent = h.horizon_no_more_events || 'no more events today';
    }
  }

  const linkEl = document.getElementById('horizonLunarLink');
  if (linkEl) {
    const lun = getLunationIntervals(refJD);
    const iv =
      lun.intervals.find((x) => refJD >= x.startJD && refJD < x.endJD) ||
      lun.intervals[lun.intervals.length - 1];
    const sD = fromJulianDay(iv.startJD);
    const eD = fromJulianDay(iv.endJD);
    linkEl.textContent = '';
    const line1 = document.createElement('div');
    line1.style.color = 'var(--text)';
    line1.style.fontWeight = '600';
    line1.textContent =
      `${h.horizon_lunar_link_label || 'Lunar day'} ${iv.day}: ` +
      `${formatDateShort(sD)} ${formatClock(sD)} → ${formatDateShort(eD)} ${formatClock(eD)}`;
    const line2 = document.createElement('div');
    line2.className = 'step-subnote';
    line2.style.marginTop = '3px';
    line2.textContent = h.horizon_lunar_link_note || 'Lunar days run from moonrise to moonrise.';
    linkEl.appendChild(line1);
    linkEl.appendChild(line2);
  }

  const driftEl = document.getElementById('horizonDriftNote');
  if (driftEl) {
    const rows = horizonDriftSeries(horizonDate, 8);
    let firstDrift = null;
    let sum = 0;
    let n = 0;
    let minD = null;
    let maxD = null;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].rise === null || rows[i - 1].rise === null) continue;
      const min = Math.round((rows[i].rise - rows[i - 1].rise) * 24 * 60) - 1440;
      if (firstDrift === null) firstDrift = min;
      sum += min;
      n++;
      if (minD === null || min < minD.min) minD = { min };
      if (maxD === null || min > maxD.max) maxD = { max: min };
    }
    driftEl.textContent = '';
    driftEl.appendChild(
      createMetricCell(
        h.horizon_drift_tomorrow_label || h.horizon_drift_tomorrow || 'Tomorrow',
        firstDrift !== null ? formatSignedMinutes(firstDrift) : '—',
        'var(--orange)'
      )
    );
    driftEl.appendChild(
      createMetricCell(
        h.horizon_drift_avg_label || h.horizon_drift_avg || 'Average',
        n ? formatSignedMinutes(sum / n) : '—',
        'var(--teal)'
      )
    );
    driftEl.appendChild(
      createMetricCell(
        h.horizon_drift_range_label || h.horizon_drift_range || 'Range',
        n ? `${minD.min > 0 ? '+' : '−'}${Math.abs(minD.min)}…${maxD.max > 0 ? '+' : '−'}${Math.abs(maxD.max)}` : '—'
      )
    );
  }

  const tipEl = document.getElementById('horizonTip');
  if (tipEl) {
    const elong = elongAt(data.date);
    const parts = [];
    parts.push(
      `${formatDateShort(data.date)}: ${sunW} — ${riseW} ${formatClockJD(data.sunRise)}, ` +
      `${setW} ${formatClockJD(data.sunSet)}; ${moonW} (${h.horizon_elong_word || 'elongation'} ` +
      `${Math.round(elong)}°) — ${riseW} ${formatHorizonMetricJD(data.moonRiseDisplay)}`
    );
    if (data.sunRise !== null && data.moonRise !== null) {
      const diff = Math.round((data.moonRise - data.sunRise) * 24 * 60);
      parts.push(
        `(${formatMinutesDelta(Math.abs(diff))} ` +
        `${diff >= 0 ? (h.horizon_later_than || 'later than the Sun') : (h.horizon_earlier_than || 'earlier than the Sun')}).`
      );
    }
    const tomorrow = horizonDriftSeries(horizonDate, 2)[1];
    if (tomorrow && tomorrow.rise !== null) {
      parts.push(`${h.horizon_next_rise || 'Next moonrise'} ${formatDateShort(tomorrow.date)} ${formatClockJD(tomorrow.rise)}.`);
    }
    tipEl.textContent = parts.join(' ');
  }

  drawHorizonDrift();
}

/* ═══════════ ЛУННЫЕ СУТКИ ═══════════ */
const daySlider = document.getElementById('daySlider');
const dayVal = document.getElementById('dayVal');
const daysTodayBtn = document.getElementById('daysTodayBtn');

daySlider.addEventListener('input', (e) => {
  dayVal.textContent = e.target.value;
  drawLunarDays(+e.target.value);
  updateLunarDayPanels(+e.target.value);
});

if (daysTodayBtn) {
  daysTodayBtn.addEventListener('click', () => {
    const cur = currentLunarDayNumber();
    daySlider.value = String(cur);
    dayVal.textContent = String(cur);
    drawLunarDays(cur);
    updateLunarDayPanels(cur);
  });
}

function lunarCycle() {
  return getLunationIntervals(toJulianDay(new Date()));
}

function lunarCycleIntervals() {
  return lunarCycle().intervals;
}

function currentLunarDayNumber() {
  const jdNow = toJulianDay(new Date());
  const intervals = lunarCycleIntervals();
  const cur =
    intervals.find((x) => jdNow >= x.startJD && jdNow < x.endJD) ||
    intervals[intervals.length - 1];
  return cur.day;
}

/**
 * Лунные сутки в реальных границах: горизонтальная ось — календарное время,
 * строки — лунные сутки. Полоска идёт от восхода до восхода, точка — восход.
 */
function drawLunarDays(day) {
  const h = hDict();
  const c = document.getElementById('lunarDayCanvas');
  const g = c.getContext('2d');
  const W = c.width;
  const H = c.height;
  g.clearRect(0, 0, W, H);

  const lun = lunarCycle();
  const intervals = lun.intervals;
  let selIdx = intervals.findIndex((iv) => iv.day === day);
  if (selIdx < 0) selIdx = 0;
  const selected = intervals[selIdx];

  const rowCount = 5;
  const firstIdx = Math.max(0, Math.min(Math.max(0, intervals.length - rowCount), selIdx - 2));
  const rows = intervals.slice(firstIdx, firstIdx + rowCount);

  const winStart = selected.startJD - 0.6;
  const winEnd = selected.endJD + 0.6;
  const span = winEnd - winStart;

  const padL = 48;
  const padR = 14;
  const axisH = 68;
  const top = 34;
  const rowH = (H - top - axisH) / rowCount;
  const xOf = (jd) => padL + ((jd - winStart) / span) * (W - padL - padR);

  g.fillStyle = 'rgba(13, 17, 26, 0.9)';
  g.fillRect(0, 0, W, H);

  // ── Календарные полуночи и даты ──
  const midnights = [];
  const firstMid = startOfLocalDay(fromJulianDay(winStart));
  for (
    let d = new Date(firstMid.getTime());
    toJulianDay(d) <= winEnd + 1.0;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  ) {
    midnights.push(d);
  }

  // ── Сколько восходов в каждых календарных сутках ──
  const riseCount = new Array(Math.max(0, midnights.length - 1)).fill(0);
  for (const iv of intervals) {
    // Первые лунные сутки начинаются с новолуния, а не с восхода Луны.
    if (Math.abs(iv.startJD - lun.nmPrev) < 1e-6) continue;
    for (let i = 0; i < midnights.length - 1; i++) {
      const jd0 = toJulianDay(midnights[i]);
      const jd1 = toJulianDay(midnights[i + 1]);
      if (iv.startJD >= jd0 && iv.startJD < jd1) {
        riseCount[i]++;
        break;
      }
    }
  }

  const jdNow = toJulianDay(new Date());
  const todayIv = intervals.find((x) => jdNow >= x.startJD && jdNow < x.endJD);

  rows.forEach((iv, i) => {
    const y = top + i * rowH;
    const barH = rowH - 14;
    const barMidY = y + 5 + barH / 2;
    const x0 = xOf(iv.startJD);
    const x1 = xOf(iv.endJD);
    const isSel = iv.day === selected.day;
    const isToday = todayIv && todayIv.day === iv.day;
    const durMin = Math.round((iv.endJD - iv.startJD) * 24 * 60);
    const isNewMoonStart = Math.abs(iv.startJD - lun.nmPrev) < 1e-6;
    const isNewMoonEnd = Math.abs(iv.endJD - lun.nmNext) < 1e-6;
    const stepMin = iv.day > 1 && !isNewMoonEnd ? durMin - 1440 : null;
    const standstill = stepMin !== null && Math.abs(stepMin) < 15;

    g.fillStyle = isSel ? 'rgba(42, 49, 82, 0.55)' : 'rgba(20, 24, 40, 0.35)';
    g.fillRect(0, y, W, rowH);

    const drawX0 = Math.max(padL, x0);
    const drawX1 = Math.min(W - padR, x1);
    const drawW = Math.max(4, drawX1 - drawX0);

    g.fillStyle = isSel
      ? (standstill ? 'rgba(127, 209, 174, 0.9)' : 'rgba(127, 156, 245, 0.9)')
      : (standstill ? 'rgba(127, 209, 174, 0.35)' : 'rgba(127, 156, 245, 0.36)');
    g.fillRect(x0, y + 5, Math.max(4, x1 - x0), barH);

    // Номер лунных суток слева от полосы
    g.fillStyle = isSel ? '#f0f2f8' : '#9aa0b5';
    g.font = 'bold 16px sans-serif';
    g.textAlign = 'right';
    g.fillText(String(iv.day), padL - 10, barMidY + 5);

    // Граница суток: восход (точка) или новолуние (ромб)
    const markX = isNewMoonEnd ? x1 : x0;
    if (isNewMoonStart || isNewMoonEnd) {
      g.fillStyle = '#f5b73e';
      g.beginPath();
      g.moveTo(markX, barMidY - 7);
      g.lineTo(markX + 6.5, barMidY);
      g.lineTo(markX, barMidY + 7);
      g.lineTo(markX - 6.5, barMidY);
      g.closePath();
      g.fill();
      const nmAlign = isNewMoonEnd && markX > W - 120 ? 'right' : 'left';
      const nmX = nmAlign === 'right' ? markX - 10 : markX + 10;
      drawOutlinedText(g, h.days_new_moon || 'new moon', nmX, barMidY + 5, '#f5b73e', 'bold 13.5px sans-serif', nmAlign, 120);
    } else {
      g.fillStyle = isToday ? '#7fd1ae' : '#f5a47f';
      g.beginPath();
      g.arc(x0, barMidY, 5.5, 0, Math.PI * 2);
      g.fill();
    }

    // Длительность и сдвиг внутри видимой части полосы (без перекрытия)
    const durText = formatDurationMs(durMin * MS_PER_MIN);
    if (drawW >= 95 && x1 >= padL + 75) {
      drawOutlinedText(g, durText, Math.min(x1, W - padR) - 8, barMidY + 5, isSel ? '#ffffff' : '#c9cde0', 'bold 14px sans-serif', 'right', 110);
    }

    if (stepMin !== null && x0 >= padL - 2 && drawW >= 150) {
      drawOutlinedText(g, `${stepMin > 0 ? '+' : ''}${stepMin}`, x0 + 10, barMidY + 5, standstill ? '#7fd1ae' : '#f5a47f', 'bold 14px sans-serif', 'left', 48);
    }
  });

  // ── Сетка календаря ──
  const axisTop = H - axisH;
  midnights.forEach((d, i) => {
    const jd0 = toJulianDay(d);
    const x = xOf(jd0);
    if (x >= padL && x <= W - padR) {
      g.strokeStyle = 'rgba(255,255,255,0.14)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x, top - 6);
      g.lineTo(x, axisTop + 14);
      g.stroke();
    }

    if (x >= padL - 8 && x <= W - 6) {
      g.fillStyle = '#9aa0b5';
      g.font = 'bold 14px sans-serif';
      g.textAlign = 'center';
      g.fillText(formatDateShort(d), x, axisTop + 32);
    }

    if (i < midnights.length - 1) {
      const jd1 = toJulianDay(midnights[i + 1]);
      const nextX = xOf(jd1);
      const visLeft = Math.max(padL, x);
      const visRight = Math.min(W - padR, nextX);
      const visW = visRight - visLeft;
      const fullyInLunation = jd0 >= lun.nmPrev - 1e-6 && jd1 <= lun.nmNext + 1e-6;
      if (fullyInLunation && visW >= 40) {
        const colCenter = Math.max(padL + 42, Math.min(W - 42, (visLeft + visRight) / 2));
        if (riseCount[i] === 0) {
          g.fillStyle = '#e57c73';
          g.font = 'bold 13px sans-serif';
          g.textAlign = 'center';
          g.fillText(h.days_no_rise || 'no rise', colCenter, axisTop + 54, 110);
        } else if (riseCount[i] >= 2) {
          g.fillStyle = '#7fd1ae';
          g.font = 'bold 13px sans-serif';
          g.textAlign = 'center';
          g.fillText(h.days_two_rises || '2 rises', colCenter, axisTop + 54, 110);
        }
      }
    }
  });

  // ── Сегодня ──
  if (jdNow > winStart && jdNow < winEnd) {
    const x = xOf(jdNow);
    g.strokeStyle = '#7fd1ae';
    g.lineWidth = 2;
    g.setLineDash([4, 3]);
    g.beginPath();
    g.moveTo(x, top - 6);
    g.lineTo(x, axisTop + 14);
    g.stroke();
    g.setLineDash([]);

    // Подпись «сегодня» — над датами оси X, чтобы не пересекаться ни с полосами, ни с числами календаря
    const safeTodayX = Math.max(padL + 36, Math.min(W - 36, x));
    drawOutlinedText(g, h.days_today || 'today', safeTodayX, axisTop + 11, '#7fd1ae', 'bold 13.5px sans-serif', 'center', 90);
  }

  // ── Условные обозначения ──
  g.fillStyle = '#8b91a8';
  g.font = '13px sans-serif';
  g.textAlign = 'left';
  g.fillText(h.days_legend || 'bar = lunar day, dot = moonrise', padL, 21, W - padL - 12);
}

function updateLunarDayPanels(day) {
  const h = hDict();
  const intervals = lunarCycleIntervals();
  let selIdx = intervals.findIndex((iv) => iv.day === day);
  if (selIdx < 0) selIdx = 0;
  const iv = intervals[selIdx];
  const durMin = Math.round((iv.endJD - iv.startJD) * 24 * 60);
  const prev = selIdx > 0 ? intervals[selIdx - 1] : null;
  const stepMin = prev ? durMin - 1440 : null;
  const sD = fromJulianDay(iv.startJD);
  const eD = fromJulianDay(iv.endJD);

  const selectedPillEl = document.getElementById('daysSelectedPill');
  if (selectedPillEl) {
    selectedPillEl.textContent = `${h.days_summary_label || 'Lunar day'} ${iv.day}`;
  }

  const summaryEl = document.getElementById('lunarDaySummary');
  if (summaryEl) {
    summaryEl.textContent = '';
    const periodLine = document.createElement('div');
    periodLine.style.color = 'var(--text)';
    periodLine.style.fontWeight = '600';
    periodLine.style.marginBottom = '8px';
    periodLine.textContent =
      `${h.days_from_label || 'from'} ${formatDateShort(sD)} ${formatClock(sD)} ` +
      `${h.days_to_label || 'to'} ${formatDateShort(eD)} ${formatClock(eD)}`;

    const metrics = document.createElement('div');
    metrics.className = 'phase-info-metrics';
    metrics.appendChild(
      createMetricCell(
        h.days_duration_label || 'Duration',
        formatDurationMs(durMin * MS_PER_MIN),
        'var(--blue)'
      )
    );
    metrics.appendChild(
      createMetricCell(
        h.days_step_label || 'Shift per day',
        stepMin !== null ? formatSignedMinutes(stepMin) : '—',
        stepMin !== null && Math.abs(stepMin) < 15 ? 'var(--teal)' : 'var(--orange)'
      )
    );
    summaryEl.appendChild(periodLine);
    summaryEl.appendChild(metrics);
  }

  const jdNow = toJulianDay(new Date());
  const cur =
    intervals.find((x) => jdNow >= x.startJD && jdNow < x.endJD) ||
    intervals[intervals.length - 1];
  const isSel = cur.day === iv.day;

  const todayCardEl = document.getElementById('daysTodayCard');
  const todayPillEl = document.getElementById('daysTodayPill');
  if (todayCardEl) todayCardEl.classList.toggle('is-highlighted', isSel);
  if (todayPillEl) todayPillEl.classList.toggle('gold', isSel);

  const todayEl = document.getElementById('lunarDayToday');
  if (todayEl) {
    const cS = fromJulianDay(cur.startJD);
    const cE = fromJulianDay(cur.endJD);
    todayEl.textContent = '';
    const line1 = document.createElement('div');
    line1.style.color = 'var(--text)';
    line1.style.fontWeight = '600';
    line1.textContent =
      `${h.days_summary_label || 'Lunar day'} ${cur.day}: ` +
      `${formatDateShort(cS)} ${formatClock(cS)} → ${formatDateShort(cE)} ${formatClock(cE)}`;
    const line2 = document.createElement('div');
    line2.className = 'step-subnote';
    line2.style.marginTop = '4px';
    line2.textContent = isSel
      ? (h.days_today_is_selected || 'This is the day shown above.')
      : (h.days_today_other || 'Move the slider to it.');
    todayEl.appendChild(line1);
    todayEl.appendChild(line2);
  }

  const explainEl = document.getElementById('lunarDayExplain');
  if (explainEl) {
    const lun = lunarCycle();
    let minS = null;
    let maxS = null;
    let sum = 0;
    let n = 0;
    for (let i = 1; i < intervals.length; i++) {
      // Последние сутки цикла заканчиваются новолунием, а не восходом — сдвиг для них не определён.
      if (Math.abs(intervals[i].endJD - lun.nmNext) < 1e-6) continue;
      const st = Math.round((intervals[i].endJD - intervals[i].startJD) * 24 * 60) - 1440;
      sum += st;
      n++;
      if (minS === null || st < minS.min) minS = { min: st, day: intervals[i].day };
      if (maxS === null || st > maxS.max) maxS = { max: st, day: intervals[i].day };
    }
    const avg = n ? sum / n : 0;
    explainEl.textContent = '';

    const metrics = document.createElement('div');
    metrics.className = 'phase-info-metrics';
    metrics.style.borderTop = 'none';
    metrics.style.paddingTop = '0';
    metrics.style.marginBottom = '8px';
    metrics.appendChild(
      createMetricCell(
        h.horizon_drift_range_label || h.horizon_drift_range || 'Range',
        minS && maxS
          ? `${formatSignedMinutes(minS.min)} … ${formatSignedMinutes(maxS.max)}`
          : '—',
        'var(--orange)'
      )
    );
    metrics.appendChild(
      createMetricCell(
        h.days_explain_avg || 'Average',
        n ? formatSignedMinutes(avg) : '—',
        'var(--teal)'
      )
    );

    const body = document.createElement('div');
    body.textContent = h.days_explain_cause || 'The Moon moves around the Earth unevenly and its declination changes unevenly, so the shift is not constant.';
    explainEl.appendChild(metrics);
    explainEl.appendChild(body);
  }
}

/* ═══════════ ЛИЧНЫЙ РИТМ ═══════════ */
const birthASlider = document.getElementById('birthASlider');
const birthBSlider = document.getElementById('birthBSlider');
const currentDaySlider = document.getElementById('currentDaySlider');
const birthAVal = document.getElementById('birthAVal');
const birthBVal = document.getElementById('birthBVal');
const currentDayVal = document.getElementById('currentDayVal');

function getPhaseLabel(relDay) {
  const ph = (activeDict && activeDict.phases) || {};
  if (relDay < 7.38) return (ph.phase_peak && ph.phase_peak.badge) || 'Peak';
  if (relDay < 14.76) return (ph.phase_decline && ph.phase_decline.badge) || 'Decline';
  if (relDay < 22.14) return (ph.phase_minimum && ph.phase_minimum.badge) || 'Minimum';
  return (ph.phase_rise && ph.phase_rise.badge) || 'Rise';
}

function createPhaseGradient(g, x0, x1, birthDay) {
  const grad = g.createLinearGradient(x0, 0, x1, 0);
  const phases = [
    { rel: 0, color: '#2e8b57' },
    { rel: 7.38, color: '#4169e1' },
    { rel: 14.76, color: '#b33939' },
    { rel: 22.14, color: '#b8860b' },
    { rel: 29.5, color: '#2e8b57' }
  ];

  const stops = phases
    .map(p => {
      const day = (birthDay + p.rel) % 29.5;
      const x = x0 + (day / 29.5) * (x1 - x0);
      return { x, color: p.color };
    })
    .sort((a, b) => a.x - b.x);

  if (stops[0].x > x0) stops.unshift({ x: x0, color: stops[stops.length - 1].color });
  if (stops[stops.length - 1].x < x1) stops.push({ x: x1, color: stops[0].color });

  stops.forEach(s => {
    const offset = Math.max(0, Math.min(1, (s.x - x0) / (x1 - x0)));
    grad.addColorStop(offset, s.color);
  });

  return grad;
}

function drawPersonal() {
  const h = hDict();
  const unit = moonAgeUnit();
  const c = document.getElementById('personalCanvas');
  const g = c.getContext('2d');
  const W = c.width;
  const H = c.height;
  g.clearRect(0, 0, W, H);

  const birthA = parseFloat(birthASlider.value);
  const birthB = parseFloat(birthBSlider.value);
  const currentDay = parseFloat(currentDaySlider.value);

  birthAVal.textContent = `${birthA.toFixed(1)} ${unit}`;
  birthBVal.textContent = `${birthB.toFixed(1)} ${unit}`;
  currentDayVal.textContent = currentDay.toFixed(1);

  const relA = (currentDay - birthA + SYNODIC_MONTH) % SYNODIC_MONTH;
  const relB = (currentDay - birthB + SYNODIC_MONTH) % SYNODIC_MONTH;

  const pad = { l: 144, r: 24, t: 54, b: 48 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const cx = pad.l + plotW / 2;
  const cy = pad.t + plotH / 2;

  const tagA = h.canvas_user_a_short || 'A';
  const tagB = h.canvas_user_b_short || 'B';

  g.textAlign = 'left';
  g.font = 'bold 16px sans-serif';
  g.fillStyle = '#f5a47f';
  g.fillText(`${tagA}: ${getPhaseLabel(relA)}`, 12, 24, 128);
  g.fillStyle = '#7f9cf5';
  g.fillText(`${tagB}: ${getPhaseLabel(relB)}`, 12, 48, 128);

  const moonCx = 70;
  const moonCy = cy + 10;
  const moonR = 44;

  g.fillStyle = '#20222e';
  g.beginPath();
  g.arc(moonCx, moonCy, moonR, 0, Math.PI * 2);
  g.fill();

  g.beginPath();
  const personalElong = ctx.birthISO ? 180 : currentElong;
  const rad = (personalElong * Math.PI) / 180;
  const cosE = Math.cos(rad);
  const rx = Math.abs(cosE) * moonR;
  const sigma = personalElong < 180 ? 1 : -1;

  if (personalElong === 180) {
    g.arc(moonCx, moonCy, moonR, 0, Math.PI * 2);
  } else if (sigma > 0) {
    g.arc(moonCx, moonCy, moonR, -Math.PI / 2, Math.PI / 2, false);
    if (cosE > 0) {
      g.ellipse(moonCx, moonCy, rx, moonR, 0, Math.PI / 2, -Math.PI / 2, true);
    } else {
      g.ellipse(moonCx, moonCy, rx, moonR, 0, -Math.PI / 2, Math.PI / 2, false);
    }
  } else {
    g.arc(moonCx, moonCy, moonR, Math.PI / 2, -Math.PI / 2, false);
    if (cosE < 0) {
      g.ellipse(moonCx, moonCy, rx, moonR, 0, -Math.PI / 2, Math.PI / 2, false);
    } else {
      g.ellipse(moonCx, moonCy, rx, moonR, 0, Math.PI / 2, -Math.PI / 2, true);
    }
  }
  g.fillStyle = '#e8e6d8';
  g.fill();

  g.strokeStyle = '#2a3152';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(moonCx, moonCy, moonR + 5, 0, Math.PI * 2);
  g.stroke();

  const angleA = (birthA / 29.5) * Math.PI * 2 - Math.PI / 2;
  const xA = moonCx + Math.cos(angleA) * (moonR + 5);
  const yA = moonCy + Math.sin(angleA) * (moonR + 5);

  const angleB = (birthB / 29.5) * Math.PI * 2 - Math.PI / 2;
  const xB = moonCx + Math.cos(angleB) * (moonR + 5);
  const yB = moonCy + Math.sin(angleB) * (moonR + 5);

  g.fillStyle = '#f5a47f';
  g.beginPath();
  g.arc(xA, yA, 9, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#0b0e1a';
  g.font = 'bold 12px sans-serif';
  g.textAlign = 'center';
  g.fillText(tagA, xA, yA + 4, 14);

  g.fillStyle = '#7f9cf5';
  g.beginPath();
  g.arc(xB, yB, 9, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#0b0e1a';
  g.fillText(tagB, xB, yB + 4, 14);

  g.strokeStyle = '#2a3152';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(pad.l, cy);
  g.lineTo(pad.l + plotW, cy);
  g.stroke();

  g.fillStyle = '#8b91a8';
  g.font = '13.5px sans-serif';
  g.textAlign = 'center';
  g.fillText('0', pad.l, H - 27);
  g.fillText('15', cx, H - 27);
  g.fillText('29.5', pad.l + plotW, H - 27);
  g.fillText(h.canvas_cycle_days || 'Cycle days', cx, H - 7, plotW);

  for (let d = 0; d <= 29.5; d += 7.38) {
    const x = pad.l + (d / 29.5) * plotW;
    g.beginPath();
    g.moveTo(x, pad.t);
    g.lineTo(x, pad.t + plotH);
    g.strokeStyle = '#1b2138';
    g.stroke();
  }

  const drawWave = (birthDay, isUserA) => {
    const points = [];
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const day = (i / steps) * 29.5;
      const angle = (2 * Math.PI * (day - birthDay)) / 29.5;
      const energy = Math.cos(angle);
      const x = pad.l + (day / 29.5) * plotW;
      const y = cy - energy * (plotH / 2 - 10);
      points.push({ x, y });
    }

    g.beginPath();
    g.moveTo(points[0].x, cy);
    points.forEach(pt => g.lineTo(pt.x, pt.y));
    g.lineTo(points[points.length - 1].x, cy);
    g.closePath();
    g.fillStyle = isUserA ? 'rgba(245, 164, 127, 0.05)' : 'rgba(127, 156, 245, 0.05)';
    g.fill();

    g.strokeStyle = createPhaseGradient(g, pad.l, pad.l + plotW, birthDay);
    g.lineWidth = 3;
    g.beginPath();
    points.forEach((pt, i) => {
      if (i === 0) g.moveTo(pt.x, pt.y);
      else g.lineTo(pt.x, pt.y);
    });
    g.stroke();
  };

  drawWave(birthA, true);
  drawWave(birthB, false);

  const todayX = pad.l + (currentDay / 29.5) * plotW;
  g.strokeStyle = 'rgba(255,255,255,0.3)';
  g.setLineDash([4, 4]);
  g.beginPath();
  g.moveTo(todayX, pad.t);
  g.lineTo(todayX, pad.t + plotH);
  g.stroke();
  g.setLineDash([]);

  const angleAc = (2 * Math.PI * (currentDay - birthA)) / 29.5;
  const yAc = cy - Math.cos(angleAc) * (plotH / 2 - 10);
  g.fillStyle = '#f5a47f';
  g.beginPath();
  g.arc(todayX, yAc, 6, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#141828';
  g.lineWidth = 2;
  g.stroke();

  const angleBc = (2 * Math.PI * (currentDay - birthB)) / 29.5;
  const yBc = cy - Math.cos(angleBc) * (plotH / 2 - 10);
  g.fillStyle = '#7f9cf5';
  g.beginPath();
  g.arc(todayX, yBc, 6, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#141828';
  g.lineWidth = 2;
  g.stroke();
}

birthASlider.addEventListener('input', drawPersonal);
birthBSlider.addEventListener('input', drawPersonal);
currentDaySlider.addEventListener('input', drawPersonal);

/* ═══════════ ЛОКАЛИЗАЦИЯ ИЗ СЛОВАРЯ ═══════════ */
function applyDictionaryLocalization() {
  const h = hDict();
  const unit = moonAgeUnit();
  const langTag = (activeDict && activeDict.meta && activeDict.meta.lang) || ctx.lang;
  if (document.documentElement) {
    document.documentElement.lang = String(langTag).split(/[-_]/)[0] || ctx.lang;
  }
  if (typeof document.title === 'string' && h.page_title) {
    document.title = h.page_title;
  }

  if (typeof document.querySelectorAll === 'function') {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset && el.dataset.i18n;
      if (key && typeof h[key] === 'string') {
        el.textContent = h[key];
      }
    });

    const phases = (activeDict && activeDict.phases) || {};
    document.querySelectorAll('[data-phase-badge]').forEach(el => {
      const key = el.dataset && el.dataset.phaseBadge;
      if (key && phases[key] && phases[key].badge) {
        el.textContent = phases[key].badge;
      }
    });

    const roles = (activeDict && activeDict.roles) || {};
    document.querySelectorAll('[data-role]').forEach(el => {
      const key = el.dataset && el.dataset.role;
      if (key && roles[key] && roles[key].title) {
        el.textContent = roles[key].title;
      }
    });

    const profiles = (activeDict && activeDict.profiles) || {};
    const activeProfileKey = ctx.birthISO
      ? (ctx.birthMoonAge <= 3.7 || ctx.birthMoonAge >= 25.8
          ? 'profile_async'
          : ctx.birthMoonAge < 11.1
            ? 'profile_waxing'
            : ctx.birthMoonAge <= 18.5
              ? 'profile_sync'
              : 'profile_waning')
      : null;

    document.querySelectorAll('.profile-card').forEach(card => {
      const key = card.dataset && card.dataset.profile;
      const p = key ? profiles[key] : null;
      if (p && card.querySelector) {
        const titleEl = card.querySelector('[data-profile-title]');
        const descEl = card.querySelector('[data-profile-desc]');
        if (titleEl && p.title) titleEl.textContent = p.title;
        if (descEl && p.full_desc) descEl.textContent = p.full_desc;
      }
      if (card.classList && typeof card.classList.toggle === 'function') {
        card.classList.toggle('is-user-profile', Boolean(activeProfileKey && key === activeProfileKey));
      }
    });
  }

  if (backBtn && h.back_btn) backBtn.textContent = h.back_btn;
  if (cycleBtn) cycleBtn.textContent = isPlaying ? (h.btn_pause || '⏸ Pause') : (h.btn_play || '▶ Animate');
  if (todayBtn && h.btn_today) todayBtn.textContent = h.btn_today;

  const now = new Date();
  const coordPrefix = ctx.hasValidCoords ? (h.coords_manual || 'Coords') : (h.coords_auto || 'Auto TZ');
  const coordTag = `${coordPrefix}: ${ctx.coords.latDeg.toFixed(2)}°, ${ctx.coords.lonDeg.toFixed(2)}°`;

  const topMetaEl = document.getElementById('help-context-meta');
  if (topMetaEl) {
    topMetaEl.textContent = ctx.birthISO
      ? `${coordTag} · ${ctx.birthISO}`
      : `${coordTag} · ${h.guest_mode || 'Guest mode'}`;
  }

  updateHorizonPanels();
  updateLunarDayPanels(+daySlider.value || currentLunarDayNumber());

  const personalNoteEl = document.getElementById('personalContextNote');
  const birthALabelEl = document.getElementById('birthALabel');
  const birthBLabelEl = document.getElementById('birthBLabel');
  if (birthBLabelEl) birthBLabelEl.textContent = h.label_user_b_anti || 'User B (antiphase)';
  if (ctx.birthISO) {
    if (birthALabelEl) birthALabelEl.textContent = h.label_user_a_birth || 'You (Moon age at birth)';
    if (personalNoteEl) personalNoteEl.textContent = `${h.personal_profile_prefix || 'Your profile'}: ${ctx.birthISO} (${ctx.birthMoonAge.toFixed(1)} ${unit})`;
  } else {
    if (birthALabelEl) birthALabelEl.textContent = h.label_user_a_demo || 'User A (Moon age at birth)';
    if (personalNoteEl) personalNoteEl.textContent = h.personal_demo_note || 'Guest demo';
  }
}

async function loadCustomDictOverride() {
  let stateData = null;

  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      stateData = await chrome.storage.local.get(['dictionaryMode', 'customDictionary', 'theme', 'fontSize']);
    }
  } catch {
    // Ignore extension storage unavailability
  }

  if (!stateData) {
    try {
      const storagePath = './platform/' + 'storage.js';
      const storageMod = await import(storagePath);
      if (storageMod && typeof storageMod.readState === 'function') {
        stateData = await storageMod.readState();
      }
    } catch {
      // platform/storage.js is only present in mobile runtime
    }
  }

  if (!stateData && typeof localStorage !== 'undefined') {
    for (const key of ['lunar_rhythm_mobile_state_v1', 'lunar_rhythm_ext_state_v1']) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            stateData = parsed;
            break;
          }
        }
      } catch {
        // Ignore malformed localStorage state
      }
    }
  }

  if (stateData) {
    const resolvedTheme = ctx.theme || (stateData.theme === 'light' || stateData.theme === 'dark' ? stateData.theme : 'dark');
    const resolvedFont = ctx.fontSize || (['normal', 'large', 'xlarge'].includes(stateData.fontSize) ? stateData.fontSize : 'normal');
    applyHelpAppearance(resolvedTheme, resolvedFont);
  }

  const shouldUseCustom =
    stateData &&
    stateData.customDictionary &&
    typeof stateData.customDictionary === 'object' &&
    (stateData.dictionaryMode === 'custom' || ctx.dictModeParam === 'custom');

  if (shouldUseCustom) {
    activeDict = deepMergeDictionary(baseDict, stateData.customDictionary);
    applyDictionaryLocalization();
    updateUI(currentElong, false);
    drawPersonal();
    drawLunarDays(+daySlider.value || 1);
    updateLunarDayPanels(+daySlider.value || currentLunarDayNumber());
  }
}

/* ═══════════ ИНИЦИАЛИЗАЦИЯ ═══════════ */
(function init() {
  const now = new Date();
  const nowInfo = getMoonPhaseInfo(now);
  const todaySummary = getCalendarDayLunarSummary(now, now);
  const currentLunarDay = Math.max(
    1,
    Math.min(30, (todaySummary && todaySummary.activeLunarDay) || Math.round(nowInfo.moonAge) || 1)
  );
  const antiphaseMoonAge = (ctx.birthMoonAge + SYNODIC_MONTH / 2) % SYNODIC_MONTH;

  if (ctx.birthISO) {
    currentDaySlider.value = (SYNODIC_MONTH / 2).toFixed(1);
  } else {
    currentDaySlider.value = Math.min(29.5, Math.max(0, nowInfo.moonAge)).toFixed(1);
  }

  birthASlider.value = Math.min(29.5, Math.max(0, ctx.birthMoonAge)).toFixed(1);
  birthBSlider.value = Math.min(29.5, Math.max(0, antiphaseMoonAge)).toFixed(1);

  horizonDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  setTimeSliderHour(now.getHours() + now.getMinutes() / 60);
  const horizonDateInputEl = document.getElementById('horizonDateInput');
  if (horizonDateInputEl) {
    horizonDateInputEl.value =
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  daySlider.value = String(currentLunarDay);
  dayVal.textContent = String(currentLunarDay);

  applyDictionaryLocalization();
  setHorizonDate(horizonDate);
  updateUI(nowInfo.elong, false);
  drawPersonal();
  drawLunarDays(currentLunarDay);
  updateLunarDayPanels(currentLunarDay);

  void loadCustomDictOverride();
})();
