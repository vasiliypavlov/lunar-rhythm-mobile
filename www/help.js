import {
  SYNODIC_MONTH,
  getMoonPhaseInfo,
  getCalendarDayLunarSummary,
  getHorizonDayDetails,
  getObserverCoords,
  parseObserverCoord,
  setObserverCoords,
  parseBirthDateString
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

  return {
    lang,
    backUrl,
    dictModeParam,
    hasValidCoords,
    coords,
    birthISO: birthDate ? rawBirth : null,
    birthMoonAge
  };
}

const ctx = parseHelpQueryContext();
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

    if (activeTab === 'days') drawLunarDays(+document.getElementById('daySlider').value);
    if (activeTab === 'personal') drawPersonal();
  });
});

let currentElong = 0;
let horizonIsLiveToday = true;
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
  timeSlider.value = clamped.toFixed(1);
  timeVal.textContent = formatSliderHour(clamped);
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
    phaseSliderHorizon.value = currentElong;
  }
  const normElong = ((currentElong % 360) + 360) % 360;
  elongVal.textContent = Math.round(currentElong) + '°';
  phaseValHorizon.textContent = Math.round(currentElong) + '°';

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
  horizonIsLiveToday = false;
  updateUI(+e.target.value, true);
  phaseSliderHorizon.value = currentElong;
});
phaseSliderHorizon.addEventListener('input', (e) => {
  stopAnim();
  horizonIsLiveToday = false;
  updateUI(+e.target.value, true);
  elongSlider.value = currentElong;
});
timeSlider.addEventListener('input', (e) => {
  const hr = parseFloat(e.target.value);
  timeVal.textContent = formatSliderHour(hr);
  drawHorizon();
});

todayBtn.addEventListener('click', () => {
  stopAnim();
  horizonIsLiveToday = true;
  const now = new Date();
  const nowInfo = getMoonPhaseInfo(now);
  setTimeSliderHour(now.getHours() + now.getMinutes() / 60);
  updateUI(nowInfo.elong, false);
});

function startAnim() {
  isPlaying = true;
  horizonIsLiveToday = false;
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

function drawOrbital() {
  const h = hDict();
  const W = orbitalCanvas.width;
  const H = orbitalCanvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const earthR = 18;
  const moonOrbitR = 110;
  const moonR = 18;
  const rad = (currentElong * Math.PI) / 180;

  octx.clearRect(0, 0, W, H);

  octx.fillStyle = 'rgba(170, 178, 213, 0.4)';
  for (let i = 0; i < 20; i++) {
    octx.beginPath();
    octx.arc((i * 47) % W, (i * 83) % H, (i % 2) + 0.5, 0, Math.PI * 2);
    octx.fill();
  }

  const sunGrad = octx.createLinearGradient(0, 0, 140, 0);
  sunGrad.addColorStop(0, 'rgba(232, 230, 216, 0.5)');
  sunGrad.addColorStop(1, 'rgba(232, 230, 216, 0)');
  octx.fillStyle = sunGrad;
  octx.fillRect(0, 0, 140, H);

  octx.fillStyle = '#e8e6d8';
  octx.font = 'bold 12px sans-serif';
  octx.textAlign = 'left';
  octx.fillText(h.canvas_sun || 'SUN', 10, 20, 110);

  octx.strokeStyle = 'rgba(232, 230, 216, 0.15)';
  octx.lineWidth = 1;
  octx.setLineDash([4, 4]);
  for (let y = 40; y < H; y += 40) {
    octx.beginPath();
    octx.moveTo(20, y);
    octx.lineTo(W - 20, y);
    octx.stroke();
  }
  octx.setLineDash([]);

  octx.strokeStyle = '#2a3152';
  octx.lineWidth = 1;
  octx.beginPath();
  octx.ellipse(cx, cy, moonOrbitR, moonOrbitR, 0, 0, Math.PI * 2);
  octx.stroke();

  octx.fillStyle = '#8b91a8';
  octx.font = '10px sans-serif';
  octx.textAlign = 'center';
  [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach(a => {
    const px = cx + Math.cos(a) * moonOrbitR;
    const py = cy - Math.sin(a) * moonOrbitR;
    octx.beginPath();
    octx.arc(px, py, 2, 0, Math.PI * 2);
    octx.fill();
  });

  octx.fillStyle = '#5b8def';
  octx.beginPath();
  octx.arc(cx, cy, earthR, 0, Math.PI * 2);
  octx.fill();
  octx.fillStyle = '#e8e9f0';
  octx.font = 'bold 13px sans-serif';
  octx.fillText(h.canvas_earth || 'EARTH', cx, cy + earthR + 14, 90);

  // Направление на Солнце — влево (угол Math.PI). 0° = Новолуние слева между Солнцем и Землёй;
  // движение против часовой стрелки: 0° (лево) -> 90° (низ) -> 180° (право, Полнолуние) -> 270° (верх).
  const moonX = cx - Math.cos(rad) * moonOrbitR;
  const moonY = cy + Math.sin(rad) * moonOrbitR;

  // Ось Земля — Солнце (пунктир влево от Земли)
  octx.strokeStyle = 'rgba(245, 183, 62, 0.35)';
  octx.lineWidth = 1.25;
  octx.setLineDash([3, 4]);
  octx.beginPath();
  octx.moveTo(cx, cy);
  octx.lineTo(Math.max(20, cx - moonOrbitR - 24), cy);
  octx.stroke();
  octx.setLineDash([]);

  // Вектор Земля — Луна
  octx.strokeStyle = '#7f9cf5';
  octx.lineWidth = 2;
  octx.beginPath();
  octx.moveTo(cx, cy);
  octx.lineTo(moonX, moonY);
  octx.stroke();

  if (currentElong > 0.5) {
    octx.beginPath();
    octx.arc(cx, cy, 35, Math.PI, Math.PI - rad, true);
    octx.strokeStyle = '#f5a47f';
    octx.lineWidth = 2;
    octx.stroke();
  }

  const midAngle = Math.PI - rad / 2;
  const degLabelX = cx + Math.cos(midAngle) * 55;
  const rawDegY = cy + Math.sin(midAngle) * 55 + 4;
  const degLabelY = Math.abs(Math.sin(midAngle)) < 0.22 ? cy - 12 : rawDegY;
  octx.fillStyle = '#f5a47f';
  octx.font = 'bold 12px sans-serif';
  octx.textAlign = 'center';
  octx.fillText(Math.round(currentElong) + '°', degLabelX, degLabelY);

  // Физический вид сверху на орбите (Вариант Б): левая полусфера Луны всегда обращена к Солнцу и освещена,
  // правая — в тени; фактическая фаза «как видна с Земли» показана на мини-диске в карточке ниже.
  octx.save();
  octx.translate(moonX, moonY);

  octx.fillStyle = '#20222e';
  octx.beginPath();
  octx.arc(0, 0, moonR, 0, Math.PI * 2);
  octx.fill();

  octx.strokeStyle = 'rgba(139, 145, 168, 0.35)';
  octx.lineWidth = 1;
  octx.stroke();

  octx.beginPath();
  octx.arc(0, 0, moonR, Math.PI / 2, -Math.PI / 2, false);
  octx.closePath();
  octx.fillStyle = '#e8e6d8';
  octx.shadowColor = '#e8e6d8';
  octx.shadowBlur = 12;
  octx.fill();
  octx.restore();

  octx.fillStyle = '#e8e9f0';
  octx.font = 'bold 13px sans-serif';
  octx.textAlign = 'center';
  octx.fillText(h.canvas_moon || 'Moon', moonX, moonY + moonR + 16, 80);
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

const skyKeys = [
  { t: 0, top: [5, 8, 20], bot: [16, 21, 48] },
  { t: 5, top: [5, 8, 20], bot: [16, 21, 48] },
  { t: 7, top: [40, 40, 80], bot: [120, 80, 100] },
  { t: 9, top: [26, 43, 94], bot: [74, 111, 165] },
  { t: 17, top: [26, 43, 94], bot: [74, 111, 165] },
  { t: 19, top: [50, 30, 60], bot: [180, 80, 60] },
  { t: 21, top: [5, 8, 20], bot: [16, 21, 48] },
  { t: 24, top: [5, 8, 20], bot: [16, 21, 48] }
];

function formatApproxHour(hourFloat) {
  const norm = ((hourFloat % 24) + 24) % 24;
  let hh = Math.floor(norm);
  let mm = Math.round((norm - hh) * 60);
  if (mm >= 60) {
    mm = 0;
    hh = (hh + 1) % 24;
  }
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
}

function drawHorizon() {
  const h = hDict();
  const W = horizonCanvas.width;
  const H = horizonCanvas.height;
  const time = parseFloat(timeSlider.value);
  const eNorm = ((currentElong % 360) + 360) % 360;
  const groundY = Math.min(230, H - 150);

  let liveDetails = null;
  if (horizonIsLiveToday) {
    const nowDate = new Date();
    const totalMin = Math.round(Math.max(0, Math.min(24, time)) * 60);
    const refMoment = new Date(
      nowDate.getFullYear(),
      nowDate.getMonth(),
      nowDate.getDate(),
      0,
      totalMin,
      0,
      0
    );
    liveDetails = getHorizonDayDetails(refMoment);
  }

  hctx.clearRect(0, 0, W, H);

  let k1 = skyKeys[0];
  let k2 = skyKeys[skyKeys.length - 1];
  for (let i = 0; i < skyKeys.length - 1; i++) {
    if (time >= skyKeys[i].t && time <= skyKeys[i + 1].t) {
      k1 = skyKeys[i];
      k2 = skyKeys[i + 1];
      break;
    }
  }
  const p = (time - k1.t) / (k2.t - k1.t);
  const topColor = rgbStr(lerpColor(k1.top, k2.top, p));
  const botColor = rgbStr(lerpColor(k1.bot, k2.bot, p));

  const skyGrad = hctx.createLinearGradient(0, 0, 0, groundY);
  skyGrad.addColorStop(0, topColor);
  skyGrad.addColorStop(1, botColor);
  hctx.fillStyle = skyGrad;
  hctx.fillRect(0, 0, W, groundY);

  const isSunUp = liveDetails ? liveDetails.sunState.above : (time >= 6 && time <= 18);
  if (!isSunUp) {
    const nightAlpha = liveDetails ? 0.55 : 0.6 * (time < 6 ? 1 - time / 6 : (time - 18) / 6);
    hctx.fillStyle = `rgba(255,255,255,${nightAlpha})`;
    for (let i = 0; i < 30; i++) {
      hctx.beginPath();
      hctx.arc((i * 61) % W, (i * 37) % (groundY - 14), (i % 2) * 0.8 + 0.5, 0, Math.PI * 2);
      hctx.fill();
    }
  }

  const sunRx = W / 2 - 42;
  const sunRy = groundY - 36;
  const moonRx = W / 2 - 42;
  const moonRy = groundY - 76;

  // Траектории Солнца и Луны над горизонтом (разделены по высоте)
  hctx.save();
  hctx.setLineDash([4, 5]);
  hctx.lineWidth = 1.25;
  hctx.strokeStyle = 'rgba(245, 183, 62, 0.25)';
  hctx.beginPath();
  hctx.ellipse(W / 2, groundY, sunRx, sunRy, 0, Math.PI, Math.PI * 2, false);
  hctx.stroke();

  hctx.strokeStyle = 'rgba(127, 156, 245, 0.3)';
  hctx.beginPath();
  hctx.ellipse(W / 2, groundY, moonRx, moonRy, 0, Math.PI, Math.PI * 2, false);
  hctx.stroke();
  hctx.setLineDash([]);
  hctx.restore();

  // Солнце
  let drawSun = false;
  let sunAngle = 0;
  if (liveDetails) {
    if (liveDetails.sunState.above) {
      drawSun = true;
      sunAngle = liveDetails.sunState.progress * Math.PI;
    }
  } else if (time >= 5.5 && time <= 18.5) {
    sunAngle = ((time - 6) / 12) * Math.PI;
    drawSun = true;
  }

  if (drawSun) {
    const sunX = W / 2 - Math.cos(sunAngle) * sunRx;
    const sunY = groundY - Math.sin(sunAngle) * sunRy;
    if (sunY < groundY + 12) {
      const sunR = 28;
      const sunG = hctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, sunR);
      sunG.addColorStop(0, '#fff3c4');
      sunG.addColorStop(0.5, '#ffd76a');
      sunG.addColorStop(1, 'rgba(245, 183, 62, 0)');
      hctx.fillStyle = sunG;
      hctx.beginPath();
      hctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      hctx.fill();

      hctx.fillStyle = '#f5b73e';
      hctx.beginPath();
      hctx.arc(sunX, sunY, 13, 0, Math.PI * 2);
      hctx.fill();
    }
  }

  // Луна
  let moonAbove = false;
  let moonAngle = 0;
  if (liveDetails) {
    if (liveDetails.moonState.above) {
      moonAbove = true;
      moonAngle = liveDetails.moonState.progress * Math.PI;
    }
  } else {
    let moonTime = time - (eNorm / 360) * 24;
    if (moonTime < 0) moonTime += 24;
    if (moonTime > 24) moonTime -= 24;
    moonAngle = ((moonTime - 6) / 12) * Math.PI;
    if (Math.sin(moonAngle) > 0) {
      moonAbove = true;
    }
  }

  const moonR = 17;
  const isNearSun = eNorm <= 7 || eNorm >= 353;

  if (moonAbove) {
    const moonX = W / 2 - Math.cos(moonAngle) * moonRx;
    const moonY = groundY - Math.sin(moonAngle) * moonRy;
    drawEarthViewMoon(hctx, moonX, moonY, moonR, eNorm, { glow: 14, dimNearSun: true });

    hctx.fillStyle = isNearSun ? '#9aa0b5' : '#e8e9f0';
    hctx.font = '11.5px sans-serif';
    hctx.textAlign = 'center';
    const moonLabel = isNearSun ? (h.canvas_moon_hidden || 'Moon (hidden)') : (h.canvas_moon || 'Moon');
    hctx.fillText(moonLabel, moonX, moonY + moonR + 14, 130);
  } else {
    hctx.fillStyle = 'rgba(154, 160, 181, 0.55)';
    hctx.font = '12px sans-serif';
    hctx.textAlign = 'center';
    hctx.fillText(h.canvas_moon_below || 'Moon below horizon', W / 2, groundY - 16, W - 40);
  }

  // Текущее время в углу неба
  hctx.fillStyle = 'rgba(232, 233, 240, 0.85)';
  hctx.font = 'bold 18px monospace';
  hctx.textAlign = 'right';
  hctx.fillText(formatSliderHour(time), W - 16, 28);

  // Нижняя панель: горизонт, восход/кульминация/заход и 24ч шкала
  hctx.fillStyle = '#0d111a';
  hctx.fillRect(0, groundY, W, H - groundY);
  hctx.strokeStyle = '#2a3152';
  hctx.lineWidth = 2;
  hctx.beginPath();
  hctx.moveTo(0, groundY);
  hctx.lineTo(W, groundY);
  hctx.stroke();

  hctx.fillStyle = '#8b91a8';
  hctx.font = '11px sans-serif';
  hctx.textAlign = 'center';
  hctx.fillText(h.canvas_east || 'EAST', 42, groundY + 18, 72);
  hctx.fillText(h.canvas_south || 'SOUTH', W / 2, groundY + 18, 72);
  hctx.fillText(h.canvas_west || 'WEST', W - 42, groundY + 18, 72);

  const elongHours = (eNorm / 360) * 24;
  const riseH = (6 + elongHours) % 24;
  const transitH = (12 + elongHours) % 24;
  const setH = (18 + elongHours) % 24;

  const riseText = liveDetails
    ? `${h.canvas_rise_exact_prefix || 'Rise '}${liveDetails.moonriseStr}`
    : `${h.canvas_rise_prefix || 'Rise ~'}${formatApproxHour(riseH)}`;
  const transitText = liveDetails
    ? `${h.canvas_culmination_exact_prefix || 'South '}${liveDetails.moonTransitStr}`
    : `${h.canvas_culmination_prefix || 'South ~'}${formatApproxHour(transitH)}`;
  const setText = liveDetails
    ? `${h.canvas_set_exact_prefix || 'Set '}${liveDetails.moonsetStr}`
    : `${h.canvas_set_prefix || 'Set ~'}${formatApproxHour(setH)}`;

  hctx.font = 'bold 11.5px sans-serif';
  hctx.fillStyle = '#f5a47f';
  hctx.fillText(riseText, 86, groundY + 42, 145);
  hctx.fillStyle = '#7f9cf5';
  hctx.fillText(transitText, W / 2, groundY + 42, 145);
  hctx.fillStyle = '#9aa0b5';
  hctx.fillText(setText, W - 86, groundY + 42, 145);

  // 24-часовая лента видимости над горизонтом
  const tlX = 64;
  const tlW = W - 80;
  const tlTop = groundY + 62;
  const sunBarY = tlTop + 10;
  const moonBarY = tlTop + 32;
  const barH = 14;

  hctx.fillStyle = '#6b7190';
  hctx.font = '10.5px sans-serif';
  hctx.textAlign = 'left';
  hctx.fillText(h.canvas_timeline_24h || 'Above horizon (24h)', tlX, tlTop + 2, tlW - 95);

  hctx.textAlign = 'right';
  hctx.fillStyle = liveDetails ? '#7fd1ae' : '#f5a47f';
  hctx.fillText(
    liveDetails ? (h.horizon_live_mode || 'Live (today)') : (h.horizon_model_mode || 'Model ~'),
    tlX + tlW,
    tlTop + 2,
    95
  );

  // Метки строк шкалы
  hctx.font = '10.5px sans-serif';
  hctx.textAlign = 'right';
  hctx.fillStyle = '#f5b73e';
  hctx.fillText(h.canvas_sun || 'SUN', tlX - 8, sunBarY + 11, 52);
  hctx.fillStyle = '#e8e6d8';
  hctx.fillText(h.canvas_moon || 'Moon', tlX - 8, moonBarY + 11, 52);

  // Фон дорожек
  hctx.fillStyle = '#141828';
  hctx.fillRect(tlX, sunBarY, tlW, barH);
  hctx.fillRect(tlX, moonBarY, tlW, barH);

  // Полоса Солнца
  hctx.fillStyle = 'rgba(245, 183, 62, 0.72)';
  if (liveDetails) {
    for (const [s, e] of liveDetails.sunSegments) {
      hctx.fillRect(tlX + (s / 24) * tlW, sunBarY + 2, ((e - s) / 24) * tlW, barH - 4);
    }
  } else {
    hctx.fillRect(tlX + (6 / 24) * tlW, sunBarY + 2, (12 / 24) * tlW, barH - 4);
  }

  // Полоса Луны
  hctx.fillStyle = isNearSun ? 'rgba(139, 145, 168, 0.45)' : 'rgba(127, 156, 245, 0.85)';
  if (liveDetails) {
    for (const [s, e] of liveDetails.moonSegments) {
      hctx.fillRect(tlX + (s / 24) * tlW, moonBarY + 2, ((e - s) / 24) * tlW, barH - 4);
    }
  } else if (riseH < setH) {
    hctx.fillRect(tlX + (riseH / 24) * tlW, moonBarY + 2, ((setH - riseH) / 24) * tlW, barH - 4);
  } else {
    hctx.fillRect(tlX + (riseH / 24) * tlW, moonBarY + 2, ((24 - riseH) / 24) * tlW, barH - 4);
    hctx.fillRect(tlX, moonBarY + 2, (setH / 24) * tlW, barH - 4);
  }

  // Сетка 00 / 06 / 12 / 18 / 24
  hctx.font = '10px monospace';
  hctx.textAlign = 'center';
  for (let hr = 0; hr <= 24; hr += 6) {
    const gx = tlX + (hr / 24) * tlW;
    hctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    hctx.lineWidth = 1;
    hctx.beginPath();
    hctx.moveTo(gx, sunBarY);
    hctx.lineTo(gx, moonBarY + barH);
    hctx.stroke();

    hctx.fillStyle = '#6b7190';
    hctx.fillText(hr.toString().padStart(2, '0'), gx, moonBarY + barH + 13);
  }

  // Маркер текущего времени на шкале
  const curX = tlX + (time / 24) * tlW;
  hctx.strokeStyle = '#ffffff';
  hctx.lineWidth = 2;
  hctx.beginPath();
  hctx.moveTo(curX, sunBarY - 3);
  hctx.lineTo(curX, moonBarY + barH + 3);
  hctx.stroke();
}

/* ═══════════ ЛУННЫЕ СУТКИ ═══════════ */
const daySlider = document.getElementById('daySlider');
const dayVal = document.getElementById('dayVal');

daySlider.addEventListener('input', (e) => {
  dayVal.textContent = e.target.value;
  drawLunarDays(+e.target.value);
});

function drawLunarDays(day) {
  const h = hDict();
  const c = document.getElementById('lunarDayCanvas');
  const g = c.getContext('2d');
  const W = c.width;
  const H = c.height;
  g.clearRect(0, 0, W, H);

  let startDay = day - 1;
  if (startDay < 1) startDay = 1;
  if (startDay > 28) startDay = 28;
  const showCount = 3;
  const colW = W / showCount;

  const baseMoonrise = 6;
  const shiftPerDay = 50 / 60;

  for (let i = 0; i < showCount; i++) {
    const d = startDay + i;
    const x = i * colW;

    g.fillStyle = d === day ? 'rgba(42, 49, 82, 0.4)' : 'rgba(20, 24, 40, 0.4)';
    g.fillRect(x, 0, colW, H);
    g.strokeStyle = '#262c45';
    g.beginPath();
    g.moveTo(x + colW, 0);
    g.lineTo(x + colW, H);
    g.stroke();

    g.fillStyle = '#8b91a8';
    g.font = '11px sans-serif';
    g.textAlign = 'center';
    g.fillText(`${h.canvas_day_prefix || 'Day'} ${d}`, x + colW / 2, 20, colW - 16);

    for (let hr = 0; hr <= 24; hr += 6) {
      const y = 40 + (hr / 24) * (H - 70);
      g.fillStyle = '#4a5378';
      g.textAlign = 'left';
      g.fillText(`${hr.toString().padStart(2, '0')}:00`, x + 6, y);

      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + colW, y);
      g.strokeStyle = '#1b2138';
      g.stroke();
    }
  }

  for (let i = 0; i < showCount; i++) {
    const d = startDay + i;
    const x = i * colW;

    const absoluteRise = baseMoonrise + (d - 1) * shiftPerDay;
    const riseTimeOfDay = absoluteRise % 24;
    const y = 40 + (riseTimeOfDay / 24) * (H - 70);

    g.fillStyle = '#f5a47f';
    g.beginPath();
    g.arc(x + colW / 2, y, 5, 0, Math.PI * 2);
    g.fill();

    g.font = 'bold 10px sans-serif';
    g.textAlign = 'left';
    const rHH = Math.floor(riseTimeOfDay).toString().padStart(2, '0');
    const rMM = Math.floor((riseTimeOfDay % 1) * 60).toString().padStart(2, '0');
    g.fillText(
      `${h.canvas_rise_prefix || 'Rise ~'}${rHH}:${rMM}`,
      x + colW / 2 + 10,
      y + 4,
      colW / 2 - 14
    );

    if (i > 0) {
      const prevD = d - 1;
      const prevAbsoluteRise = baseMoonrise + (prevD - 1) * shiftPerDay;
      const prevRiseTimeOfDay = prevAbsoluteRise % 24;
      const prevY = 40 + (prevRiseTimeOfDay / 24) * (H - 70);
      const prevX = (i - 1) * colW + colW / 2;

      g.strokeStyle = 'rgba(245, 164, 127, 0.3)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(prevX, prevY);
      g.lineTo(x + colW / 2, y);
      g.stroke();

      if (prevRiseTimeOfDay > 20 && riseTimeOfDay < 4) {
        g.setLineDash([3, 3]);
        g.beginPath();
        g.moveTo(prevX, prevY);
        g.lineTo(prevX, H);
        g.moveTo(x + colW / 2, 0);
        g.lineTo(x + colW / 2, y);
        g.stroke();
        g.setLineDash([]);
      }
    }
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

  const pad = { l: 120, r: 20, t: 40, b: 30 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const cx = pad.l + plotW / 2;
  const cy = pad.t + plotH / 2;

  const tagA = h.canvas_user_a_short || 'A';
  const tagB = h.canvas_user_b_short || 'B';

  g.textAlign = 'left';
  g.font = 'bold 13px sans-serif';
  g.fillStyle = '#f5a47f';
  g.fillText(`${tagA}: ${getPhaseLabel(relA)}`, 10, 20, 105);
  g.fillStyle = '#7f9cf5';
  g.fillText(`${tagB}: ${getPhaseLabel(relB)}`, 10, 40, 105);

  const moonCx = 60;
  const moonCy = cy;
  const moonR = 40;

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
  g.arc(moonCx, moonCy, moonR + 4, 0, Math.PI * 2);
  g.stroke();

  const angleA = (birthA / 29.5) * Math.PI * 2 - Math.PI / 2;
  const xA = moonCx + Math.cos(angleA) * (moonR + 4);
  const yA = moonCy + Math.sin(angleA) * (moonR + 4);

  const angleB = (birthB / 29.5) * Math.PI * 2 - Math.PI / 2;
  const xB = moonCx + Math.cos(angleB) * (moonR + 4);
  const yB = moonCy + Math.sin(angleB) * (moonR + 4);

  g.fillStyle = '#f5a47f';
  g.beginPath();
  g.arc(xA, yA, 6, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#0b0e1a';
  g.font = 'bold 9px sans-serif';
  g.textAlign = 'center';
  g.fillText(tagA, xA, yA + 3, 10);

  g.fillStyle = '#7f9cf5';
  g.beginPath();
  g.arc(xB, yB, 6, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#0b0e1a';
  g.fillText(tagB, xB, yB + 3, 10);

  g.strokeStyle = '#2a3152';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(pad.l, cy);
  g.lineTo(pad.l + plotW, cy);
  g.stroke();

  g.fillStyle = '#6b7190';
  g.font = '10px sans-serif';
  g.textAlign = 'center';
  g.fillText('0', pad.l, H - 10);
  g.fillText('15', cx, H - 10);
  g.fillText('29.5', pad.l + plotW, H - 10);
  g.fillText(h.canvas_cycle_days || 'Cycle days', cx, H - 2, plotW - 80);

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
  const todaySummary = getCalendarDayLunarSummary(now, now);
  const coordPrefix = ctx.hasValidCoords ? (h.coords_manual || 'Coords') : (h.coords_auto || 'Auto TZ');
  const coordTag = `${coordPrefix}: ${ctx.coords.latDeg.toFixed(2)}°, ${ctx.coords.lonDeg.toFixed(2)}°`;

  const topMetaEl = document.getElementById('help-context-meta');
  if (topMetaEl) {
    topMetaEl.textContent = ctx.birthISO
      ? `${coordTag} · ${ctx.birthISO}`
      : `${coordTag} · ${h.guest_mode || 'Guest mode'}`;
  }

  const horizonObsEl = document.getElementById('horizonObserverInfo');
  if (horizonObsEl && todaySummary) {
    const liveDetails = getHorizonDayDetails(now);
    const moonWord = h.canvas_moon || 'Moon';
    const sunWord = h.horizon_sun_label || 'Sun';
    const riseW = h.horizon_rise_word || 'rise';
    const setW = h.horizon_set_word || 'set';
    horizonObsEl.textContent =
      `${h.horizon_today_prefix || 'Today'} (${coordTag}): ` +
      `${moonWord} — ${riseW} ${liveDetails.moonriseStr}, ${setW} ${liveDetails.moonsetStr}; ` +
      `${sunWord} — ${riseW} ${liveDetails.sunriseStr}, ${setW} ${liveDetails.sunsetStr}.`;
  }

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
      stateData = await chrome.storage.local.get(['dictionaryMode', 'customDictionary']);
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

  horizonIsLiveToday = true;
  setTimeSliderHour(now.getHours() + now.getMinutes() / 60);

  daySlider.value = String(currentLunarDay);
  dayVal.textContent = String(currentLunarDay);

  applyDictionaryLocalization();
  updateUI(nowInfo.elong, false);
  drawPersonal();
  drawLunarDays(currentLunarDay);

  void loadCustomDictOverride();
})();
