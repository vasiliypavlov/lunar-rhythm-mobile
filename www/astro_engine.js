// Autonomous Offline Astronomical & Aspect Graph Engine
// Based on Jean Meeus (Astronomical Algorithms) & Paul Schlyter orbital series

export const SYNODIC_MONTH = 29.530588853;
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const J2000 = 2451545.0;

export const ZODIAC_SIGNS = [
  'Овен', 'Телец', 'Близнецы', 'Рак',
  'Лев', 'Дева', 'Весы', 'Скорпион',
  'Стрелец', 'Козерог', 'Водолей', 'Рыбы'
];

export const PHASE_TONES = {
  neutral:         { hero: '#3F3F3F', bar: '#5A606D' },
  min_core:        { hero: '#6E261E', bar: '#D45547' }, // плотная обожжённая глина (минимум)
  min_to_rise:     { hero: '#723919', bar: '#DF7D35' }, // жёлто-красный (жжёная сиена)
  rise_core:       { hero: '#584517', bar: '#DBA832' }, // плотная охра (разгон)
  rise_to_peak:    { hero: '#384E1D', bar: '#8BB93E' }, // жёлто-зелёный (олива/мох)
  peak_core:       { hero: '#194D25', bar: '#32A85C' }, // глубокий хвойный (пик)
  peak_to_decline: { hero: '#14454A', bar: '#2B9EA3' }, // зелёно-синий (морская волна)
  decline_core:    { hero: '#193454', bar: '#4A89D6' }, // глубокий сланец/синий (спад)
  decline_to_min:  { hero: '#452348', bar: '#A45EC7' }  // красно-синий (сливовый)
};

export const PHASE_COLORS = {
  neutral: PHASE_TONES.neutral.hero,
  phase_peak: PHASE_TONES.peak_core.hero,
  phase_decline: PHASE_TONES.decline_core.hero,
  phase_minimum: PHASE_TONES.min_core.hero,
  phase_rise: PHASE_TONES.rise_core.hero
};

const TONE_ASPECT_VALENCE = {
  edge_sextile: 1,
  edge_trine: 1,
  edge_conjunction: 0,
  edge_square: -1,
  edge_opposition: -1
};
const TONE_ACTIVE_LUNAR_DAYS = new Set([3, 7, 8, 10, 11, 14, 17, 20, 21]);
const TONE_RESTRAINED_LUNAR_DAYS = new Set([9, 15, 19, 23, 25, 26, 29, 30]);

export function resolveForecastPhaseTone({
  phaseKey,
  phaseStageKey = 'middle',
  dailyFocusEdge = null,
  backgroundEdge = null,
  isBackgroundExactPeak = false,
  activeLunarDay = 1
}) {
  const focusValence = dailyFocusEdge ? (TONE_ASPECT_VALENCE[dailyFocusEdge.aspectKey] ?? 0) : 0;
  const bgWarning = Boolean(
    isBackgroundExactPeak &&
    backgroundEdge &&
    (TONE_ASPECT_VALENCE[backgroundEdge.aspectKey] ?? 0) < 0
  );
  const eff = bgWarning && focusValence >= 0 ? -1 : focusValence;
  const lunarPol = TONE_ACTIVE_LUNAR_DAYS.has(Number(activeLunarDay))
    ? 1
    : TONE_RESTRAINED_LUNAR_DAYS.has(Number(activeLunarDay))
    ? -1
    : 0;

  let toneKey = 'min_core';
  switch (phaseKey) {
    case 'phase_minimum':
      if (phaseStageKey === 'start') toneKey = eff > 0 && lunarPol >= 0 ? 'min_core' : 'decline_to_min';
      else if (phaseStageKey === 'middle') toneKey = eff < 0 && lunarPol < 0 ? 'decline_to_min' : 'min_core';
      else toneKey = eff < 0 || lunarPol < 0 ? 'min_core' : 'min_to_rise';
      break;
    case 'phase_rise':
      if (phaseStageKey === 'start') toneKey = eff > 0 && lunarPol > 0 ? 'rise_core' : 'min_to_rise';
      else if (phaseStageKey === 'middle') {
        if (eff < 0 || lunarPol < 0) toneKey = 'min_to_rise';
        else if (eff > 0 && lunarPol >= 0) toneKey = 'rise_to_peak';
        else toneKey = 'rise_core';
      } else {
        toneKey = eff < 0 ? 'rise_core' : 'rise_to_peak';
      }
      break;
    case 'phase_peak':
      if (phaseStageKey === 'start') toneKey = eff > 0 && lunarPol >= 0 ? 'peak_core' : 'rise_to_peak';
      else if (phaseStageKey === 'middle') {
        if (eff < 0) toneKey = lunarPol < 0 ? 'peak_to_decline' : 'rise_to_peak';
        else toneKey = 'peak_core';
      } else {
        toneKey = eff > 0 && lunarPol > 0 ? 'peak_core' : 'peak_to_decline';
      }
      break;
    case 'phase_decline':
    default:
      if (phaseStageKey === 'start') toneKey = eff < 0 ? 'decline_core' : 'peak_to_decline';
      else if (phaseStageKey === 'middle') {
        if (eff < 0) toneKey = 'decline_to_min';
        else if (eff > 0 && lunarPol > 0) toneKey = 'peak_to_decline';
        else toneKey = 'decline_core';
      } else {
        toneKey = eff > 0 && lunarPol >= 0 ? 'decline_core' : 'decline_to_min';
      }
      break;
  }

  const palette = PHASE_TONES[toneKey] || PHASE_TONES.neutral;
  return { key: toneKey, hero: palette.hero, bar: palette.bar };
}

export function norm360(deg) {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

export function signedAngleDiff(a, b) {
  let d = (a - b) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

function sinD(deg) { return Math.sin(deg * DEG2RAD); }
function cosD(deg) { return Math.cos(deg * DEG2RAD); }

export function toJulianDay(date) {
  const ms = date instanceof Date ? date.getTime() : Number(date);
  return ms / 86400000 + 2440587.5;
}

export function fromJulianDay(jd) {
  return new Date((jd - 2440587.5) * 86400000);
}

// High-precision Sun apparent ecliptic longitude (Meeus Ch. 25, <0.01 deg)
export function getSunPosition(jd) {
  const T = (jd - J2000) / 36525;
  const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * sinD(M) +
    (0.019993 - 0.000101 * T) * sinD(2 * M) +
    0.000289 * sinD(3 * M);
  const trueLon = L0 + C;
  const v = M + C;
  const R = (1.000001018 * (1 - e * e)) / (1 + e * cosD(v));
  const omega = 125.04 - 1934.136 * T;
  const apparentLon = norm360(trueLon - 0.00569 - 0.00478 * sinD(omega));
  return { lon: apparentLon, radiusAU: R };
}

// High-precision Moon ecliptic & equatorial coordinates (Meeus Ch. 47)
const MOON_LON_TERMS = [
  [0, 0, 1, 0, 6288774],
  [2, 0, -1, 0, 1274027],
  [2, 0, 0, 0, 658314],
  [0, 0, 2, 0, 213618],
  [0, 1, 0, 0, -185116],
  [0, 0, 0, 2, -114332],
  [2, 0, -2, 0, 58793],
  [2, -1, -1, 0, 57066],
  [2, 0, 1, 0, 53322],
  [2, -1, 0, 0, 45758],
  [0, 1, -1, 0, -40923],
  [1, 0, 0, 0, -34720],
  [0, 1, 1, 0, -30383],
  [2, 0, 0, -2, 15327],
  [0, 0, 1, 2, -12528],
  [0, 0, 1, -2, 10980],
  [4, 0, -1, 0, 10675],
  [0, 0, 3, 0, 10034],
  [4, 0, -2, 0, 8548],
  [2, 1, -1, 0, -7888],
  [2, 1, 0, 0, -6766],
  [1, 0, -1, 0, -5163],
  [1, 1, 0, 0, 4987],
  [2, -1, 1, 0, 4036]
];

const MOON_DIST_TERMS = [
  [0, 0, 1, 0, -20905355],
  [2, 0, -1, 0, -3699111],
  [2, 0, 0, 0, -2955968],
  [0, 0, 2, 0, -569925],
  [0, 1, 0, 0, 48888],
  [0, 0, 0, 2, -3149],
  [2, 0, -2, 0, 246158],
  [2, -1, -1, 0, -152138],
  [2, 0, 1, 0, -170733],
  [2, -1, 0, 0, -204586]
];

const MOON_LAT_TERMS = [
  [0, 0, 0, 1, 5128122],
  [0, 0, 1, 1, 280602],
  [0, 0, 1, -1, 277693],
  [2, 0, 0, -1, 173237],
  [2, 0, -1, 1, 55413],
  [2, 0, -1, -1, 46271],
  [2, 0, 0, 1, 32573],
  [0, 0, 2, 1, 17198],
  [2, 0, 1, -1, 9266],
  [0, 0, 2, -1, 8822]
];

export function getMoonPosition(jd) {
  const T = (jd - J2000) / 36525;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;

  const Lp = norm360(218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000);
  const D = norm360(297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000);
  const M = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000);
  const Mp = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000);
  const F = norm360(93.2720950 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000);

  const A1 = norm360(119.75 + 131.849 * T);
  const A2 = norm360(53.09 + 479264.290 * T);
  const A3 = norm360(313.45 + 481266.484 * T);
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const E2 = E * E;

  let sumL = 0;
  for (let i = 0; i < MOON_LON_TERMS.length; i++) {
    const [d, m, mp, f, coeff] = MOON_LON_TERMS[i];
    const mult = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E2 : 1;
    sumL += coeff * mult * sinD(d * D + m * M + mp * Mp + f * F);
  }
  sumL += 3958 * sinD(A1) + 1962 * sinD(Lp - F) + 318 * sinD(A2);

  let sumR = 0;
  for (let i = 0; i < MOON_DIST_TERMS.length; i++) {
    const [d, m, mp, f, coeff] = MOON_DIST_TERMS[i];
    const mult = Math.abs(m) === 1 ? E : 1;
    sumR += coeff * mult * cosD(d * D + m * M + mp * Mp + f * F);
  }

  let sumB = 0;
  for (let i = 0; i < MOON_LAT_TERMS.length; i++) {
    const [d, m, mp, f, coeff] = MOON_LAT_TERMS[i];
    const mult = Math.abs(m) === 1 ? E : 1;
    sumB += coeff * mult * sinD(d * D + m * M + mp * Mp + f * F);
  }
  sumB += -2235 * sinD(Lp) + 382 * sinD(A3) + 175 * sinD(A1 - F) + 175 * sinD(A1 + F);

  const lon = norm360(Lp + sumL / 1000000);
  const lat = sumB / 1000000;
  const distKm = 385000.56 + sumR / 1000;

  // Mean obliquity of ecliptic
  const eps = 23.439291 - 0.0130042 * T;
  const sinLambda = sinD(lon);
  const cosLambda = cosD(lon);
  const sinBeta = sinD(lat);
  const cosBeta = cosD(lat);
  const sinEps = sinD(eps);
  const cosEps = cosD(eps);

  const raRad = Math.atan2(sinLambda * cosEps - (sinBeta / cosBeta) * sinEps, cosLambda);
  const decRad = Math.asin(sinBeta * cosEps + cosBeta * sinEps * sinLambda);

  return {
    lon,
    lat,
    distKm,
    ra: norm360(raRad * RAD2DEG),
    dec: decRad * RAD2DEG
  };
}

export function getZodiacSign(lon) {
  const idx = Math.floor(norm360(lon) / 30) % 12;
  return ZODIAC_SIGNS[idx];
}

// Find exact New Moon JD near jdApprox
function refineNewMoon(jdCenter) {
  let lo = jdCenter - 2.0;
  let hi = jdCenter + 2.0;
  // Bracket sign change from negative to positive elongation
  const step = 0.25;
  for (let t = lo; t < hi; t += step) {
    const d1 = signedAngleDiff(getMoonPosition(t).lon, getSunPosition(t).lon);
    const d2 = signedAngleDiff(getMoonPosition(t + step).lon, getSunPosition(t + step).lon);
    if (d1 <= 0 && d2 >= 0) {
      lo = t;
      hi = t + step;
      break;
    }
  }
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) * 0.5;
    const dm = signedAngleDiff(getMoonPosition(mid).lon, getSunPosition(mid).lon);
    if (dm < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) * 0.5;
}

const lunationCache = new Map();

const IANA_ZONE_ALIASES = {
  'Europe/Kiev': 'Europe/Kyiv',
  'Europe/Uzhgorod': 'Europe/Kyiv',
  'Europe/Zaporozhye': 'Europe/Kyiv',
  'Europe/Simferopol': 'Europe/Moscow',
  'Europe/Kirov': 'Europe/Moscow',
  'Europe/Volgograd': 'Europe/Moscow',
  'Europe/Astrakhan': 'Europe/Samara',
  'Europe/Saratov': 'Europe/Samara',
  'Europe/Ulyanovsk': 'Europe/Samara',
  'Europe/Tiraspol': 'Europe/Chisinau',
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Asia/Rangoon': 'Asia/Yangon',
  'Asia/Chongqing': 'Asia/Shanghai',
  'Asia/Chungking': 'Asia/Shanghai',
  'Asia/Harbin': 'Asia/Shanghai',
  'Asia/Urumqi': 'Asia/Shanghai',
  'Asia/Ashkhabad': 'Asia/Ashgabat',
  'Asia/Qyzylorda': 'Asia/Almaty',
  'Asia/Astana': 'Asia/Almaty',
  'Asia/Novokuznetsk': 'Asia/Krasnoyarsk',
  'Asia/Barnaul': 'Asia/Novosibirsk',
  'Asia/Tomsk': 'Asia/Novosibirsk',
  'Asia/Chita': 'Asia/Yakutsk',
  'Asia/Khandyga': 'Asia/Yakutsk',
  'Asia/Ust-Nera': 'Asia/Vladivostok',
  'Asia/Srednekolymsk': 'Asia/Magadan',
  'Asia/Anadyr': 'Asia/Kamchatka',
  'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
  'America/Montreal': 'America/Toronto',
  'America/Indianapolis': 'America/Indiana/Indianapolis',
  'America/Indiana/Indianapolis': 'America/New_York',
  'America/Detroit': 'America/New_York',
  'Pacific/Auckland': 'Pacific/Auckland'
};

const IANA_ZONE_COORDS = {
  // Russia & CIS
  'Europe/Kaliningrad': { lat: 54.7104, lon: 20.4522 },
  'Europe/Moscow': { lat: 55.7558, lon: 37.6173 },
  'Europe/Samara': { lat: 53.1959, lon: 50.1002 },
  'Asia/Yekaterinburg': { lat: 56.8389, lon: 60.6057 },
  'Asia/Omsk': { lat: 54.9885, lon: 73.3242 },
  'Asia/Novosibirsk': { lat: 55.0084, lon: 82.9357 },
  'Asia/Krasnoyarsk': { lat: 56.0153, lon: 92.8932 },
  'Asia/Irkutsk': { lat: 52.2869, lon: 104.3050 },
  'Asia/Yakutsk': { lat: 62.0397, lon: 129.7422 },
  'Asia/Vladivostok': { lat: 43.1155, lon: 131.8855 },
  'Asia/Magadan': { lat: 59.5612, lon: 150.8301 },
  'Asia/Sakhalin': { lat: 46.9591, lon: 142.7380 },
  'Asia/Kamchatka': { lat: 53.0245, lon: 158.6435 },
  'Europe/Minsk': { lat: 53.9006, lon: 27.5590 },
  'Europe/Kyiv': { lat: 50.4501, lon: 30.5234 },
  'Europe/Chisinau': { lat: 47.0105, lon: 28.8638 },
  'Asia/Almaty': { lat: 43.2220, lon: 76.8512 },
  'Asia/Tashkent': { lat: 41.2995, lon: 69.2401 },
  'Asia/Tbilisi': { lat: 41.7151, lon: 44.8271 },
  'Asia/Baku': { lat: 40.4093, lon: 49.8671 },
  'Asia/Yerevan': { lat: 40.1872, lon: 44.5152 },
  'Asia/Bishkek': { lat: 42.8746, lon: 74.5698 },
  'Asia/Dushanbe': { lat: 38.5598, lon: 68.7870 },
  'Asia/Ashgabat': { lat: 37.9601, lon: 58.3261 },

  // Europe
  'Europe/London': { lat: 51.5074, lon: -0.1278 },
  'Europe/Dublin': { lat: 53.3498, lon: -6.2603 },
  'Europe/Lisbon': { lat: 38.7223, lon: -9.1393 },
  'Europe/Madrid': { lat: 40.4168, lon: -3.7038 },
  'Europe/Paris': { lat: 48.8566, lon: 2.3522 },
  'Europe/Brussels': { lat: 50.8503, lon: 4.3517 },
  'Europe/Amsterdam': { lat: 52.3676, lon: 4.9041 },
  'Europe/Berlin': { lat: 52.5200, lon: 13.4050 },
  'Europe/Zurich': { lat: 47.3769, lon: 8.5417 },
  'Europe/Vienna': { lat: 48.2082, lon: 16.3738 },
  'Europe/Rome': { lat: 41.9028, lon: 12.4964 },
  'Europe/Prague': { lat: 50.0755, lon: 14.4378 },
  'Europe/Warsaw': { lat: 52.2297, lon: 21.0122 },
  'Europe/Budapest': { lat: 47.4979, lon: 19.0402 },
  'Europe/Stockholm': { lat: 59.3293, lon: 18.0686 },
  'Europe/Oslo': { lat: 59.9139, lon: 10.7522 },
  'Europe/Copenhagen': { lat: 55.6761, lon: 12.5683 },
  'Europe/Helsinki': { lat: 60.1699, lon: 24.9384 },
  'Europe/Riga': { lat: 56.9496, lon: 24.1052 },
  'Europe/Vilnius': { lat: 54.6872, lon: 25.2797 },
  'Europe/Tallinn': { lat: 59.4370, lon: 24.7536 },
  'Europe/Bucharest': { lat: 44.4268, lon: 26.1025 },
  'Europe/Sofia': { lat: 42.6977, lon: 23.3219 },
  'Europe/Athens': { lat: 37.9838, lon: 23.7275 },
  'Europe/Belgrade': { lat: 44.7866, lon: 20.4489 },
  'Europe/Istanbul': { lat: 41.0082, lon: 28.9784 },
  'Atlantic/Reykjavik': { lat: 64.1466, lon: -21.9426 },

  // Middle East & Asia
  'Asia/Jerusalem': { lat: 31.7683, lon: 35.2137 },
  'Asia/Riyadh': { lat: 24.7136, lon: 46.6753 },
  'Asia/Dubai': { lat: 25.2048, lon: 55.2708 },
  'Asia/Tehran': { lat: 35.6892, lon: 51.3890 },
  'Asia/Karachi': { lat: 24.8607, lon: 67.0011 },
  'Asia/Kolkata': { lat: 28.6139, lon: 77.2090 },
  'Asia/Kathmandu': { lat: 27.7172, lon: 85.3240 },
  'Asia/Dhaka': { lat: 23.8103, lon: 90.4125 },
  'Asia/Yangon': { lat: 16.8409, lon: 96.1735 },
  'Asia/Bangkok': { lat: 13.7563, lon: 100.5018 },
  'Asia/Ho_Chi_Minh': { lat: 10.8231, lon: 106.6297 },
  'Asia/Jakarta': { lat: -6.2088, lon: 106.8456 },
  'Asia/Singapore': { lat: 1.3521, lon: 103.8198 },
  'Asia/Kuala_Lumpur': { lat: 3.1390, lon: 101.6869 },
  'Asia/Manila': { lat: 14.5995, lon: 120.9842 },
  'Asia/Shanghai': { lat: 31.2304, lon: 121.4737 },
  'Asia/Hong_Kong': { lat: 22.3193, lon: 114.1694 },
  'Asia/Taipei': { lat: 25.0330, lon: 121.5654 },
  'Asia/Seoul': { lat: 37.5665, lon: 126.9780 },
  'Asia/Tokyo': { lat: 35.6762, lon: 139.6503 },

  // Americas
  'America/New_York': { lat: 40.7128, lon: -74.0060 },
  'America/Toronto': { lat: 43.6532, lon: -79.3832 },
  'America/Chicago': { lat: 41.8781, lon: -87.6298 },
  'America/Mexico_City': { lat: 19.4326, lon: -99.1332 },
  'America/Denver': { lat: 39.7392, lon: -104.9903 },
  'America/Phoenix': { lat: 33.4484, lon: -112.0740 },
  'America/Los_Angeles': { lat: 34.0522, lon: -118.2437 },
  'America/Vancouver': { lat: 49.2827, lon: -123.1207 },
  'America/Anchorage': { lat: 61.2181, lon: -149.9003 },
  'Pacific/Honolulu': { lat: 21.3069, lon: -157.8583 },
  'America/Bogota': { lat: 4.7110, lon: -74.0721 },
  'America/Lima': { lat: -12.0464, lon: -77.0428 },
  'America/Santiago': { lat: -33.4489, lon: -70.6693 },
  'America/Sao_Paulo': { lat: -23.5505, lon: -46.6333 },
  'America/Argentina/Buenos_Aires': { lat: -34.6037, lon: -58.3816 },

  // Africa & Oceania
  'Africa/Casablanca': { lat: 33.5731, lon: -7.5898 },
  'Africa/Lagos': { lat: 6.5244, lon: 3.3792 },
  'Africa/Cairo': { lat: 30.0444, lon: 31.2357 },
  'Africa/Nairobi': { lat: -1.2921, lon: 36.8219 },
  'Africa/Johannesburg': { lat: -26.2041, lon: 28.0473 },
  'Australia/Perth': { lat: -31.9505, lon: 115.8605 },
  'Australia/Adelaide': { lat: -34.9285, lon: 138.6007 },
  'Australia/Melbourne': { lat: -37.8136, lon: 144.9631 },
  'Australia/Sydney': { lat: -33.8688, lon: 151.2093 },
  'Pacific/Auckland': { lat: -36.8485, lon: 174.7633 }
};

let manualObserverCoords = null;

export function parseObserverCoord(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : null;
  }
  const cleaned = String(raw).trim().replace(',', '.').replace(/°/g, '');
  if (!cleaned) return null;
  if (!/^[+-]?\d+(\.\d+)?$/.test(cleaned)) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function setObserverCoords(latInput, lonInput) {
  const lat = parseObserverCoord(latInput);
  const lon = parseObserverCoord(lonInput);
  if (
    lat === null ||
    lon === null ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    manualObserverCoords = null;
    return getObserverCoords();
  }
  manualObserverCoords = {
    latDeg: Math.max(-89.5, Math.min(89.5, lat)),
    lonDeg: lon
  };
  return getObserverCoords();
}

function getSystemTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

function getStandardNonDstOffsetMinutes() {
  const yr = new Date().getFullYear();
  const jan = new Date(yr, 0, 1, 12, 0, 0, 0).getTimezoneOffset();
  const jul = new Date(yr, 6, 1, 12, 0, 0, 0).getTimezoneOffset();
  // DST shifts local clocks forward, making (UTC - local) smaller in summer in both hemispheres
  return Math.max(jan, jul);
}

function getRegionFallbackLat(tz) {
  if (!tz || typeof tz !== 'string') return 50.0;
  if (tz.startsWith('Europe/')) return 48.8;
  if (tz.startsWith('America/')) return 38.0;
  if (tz.startsWith('Asia/')) return 34.0;
  if (tz.startsWith('Australia/')) return -33.0;
  if (tz.startsWith('Africa/')) return 5.0;
  if (tz.startsWith('Pacific/')) return -18.0;
  return 50.0;
}

export function getObserverCoords(timeZoneOverride = null) {
  const tzRaw = timeZoneOverride || getSystemTimeZone();
  if (!timeZoneOverride && manualObserverCoords) {
    return {
      latDeg: manualObserverCoords.latDeg,
      lonDeg: manualObserverCoords.lonDeg,
      source: 'manual',
      timeZone: tzRaw
    };
  }
  const canonicalTz = tzRaw ? (IANA_ZONE_ALIASES[tzRaw] || tzRaw) : null;
  if (canonicalTz && IANA_ZONE_COORDS[canonicalTz]) {
    const entry = IANA_ZONE_COORDS[canonicalTz];
    return {
      latDeg: entry.lat,
      lonDeg: entry.lon,
      source: 'iana',
      timeZone: tzRaw
    };
  }
  if (!canonicalTz || canonicalTz === 'UTC' || canonicalTz === 'Etc/UTC' || canonicalTz === 'GMT') {
    return {
      latDeg: 51.5074,
      lonDeg: 0.0,
      source: 'fallback',
      timeZone: tzRaw
    };
  }
  const stdOffsetMin = getStandardNonDstOffsetMinutes();
  return {
    latDeg: getRegionFallbackLat(canonicalTz),
    lonDeg: -stdOffsetMin / 4,
    source: 'fallback',
    timeZone: tzRaw
  };
}

export function findNewMoonBefore(jd) {
  // Reference New Moon: Jan 6 2000 18:14 UT = 2451550.2597
  const kApprox = Math.floor((jd - 2451550.2597) / SYNODIC_MONTH);
  let nm = refineNewMoon(2451550.2597 + kApprox * SYNODIC_MONTH);
  if (nm > jd) {
    nm = refineNewMoon(2451550.2597 + (kApprox - 1) * SYNODIC_MONTH);
  }
  const nmNextCheck = refineNewMoon(nm + SYNODIC_MONTH);
  if (nmNextCheck <= jd) {
    nm = nmNextCheck;
  }
  return nm;
}

function getSunEquatorial(jd) {
  const sun = getSunPosition(jd);
  const T = (jd - J2000) / 36525;
  const eps = 23.439291 - 0.0130042 * T;
  const raRad = Math.atan2(sinD(sun.lon) * cosD(eps), cosD(sun.lon));
  const decDeg = Math.asin(Math.max(-1, Math.min(1, sinD(eps) * sinD(sun.lon)))) * RAD2DEG;
  return {
    ra: norm360(raRad * RAD2DEG),
    dec: decDeg
  };
}

function getSunAltitudeDeg(jd, latDeg, lonDeg) {
  const sunEq = getSunEquatorial(jd);
  const T = (jd - J2000) / 36525;
  const d = jd - J2000;
  const gmst = norm360(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T);
  const lst = norm360(gmst + lonDeg);
  const H = norm360(lst - sunEq.ra);
  const sinAlt = sinD(latDeg) * sinD(sunEq.dec) + cosD(latDeg) * cosD(sunEq.dec) * cosD(H);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD2DEG;
  return alt - (-0.8333);
}

function getMoonAltitudeDeg(jd, latDeg, lonDeg) {
  const moon = getMoonPosition(jd);
  const T = (jd - J2000) / 36525;
  const d = jd - J2000;
  const gmst = norm360(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T);
  const lst = norm360(gmst + lonDeg);
  const H = norm360(lst - moon.ra);
  const sinAlt = sinD(latDeg) * sinD(moon.dec) + cosD(latDeg) * cosD(moon.dec) * cosD(H);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD2DEG;
  // Apparent horizon target for Moon center (refraction + semidiameter - horizontal parallax ~ +0.125 deg)
  const parallax = Math.asin(6378.14 / moon.distKm) * RAD2DEG;
  const h0 = parallax - 0.5667 - 0.25;
  return alt - h0;
}

/**
 * Положение светила в горизонтальной системе координат для наблюдателя.
 * body: 'sun' | 'moon'.
 * Возвращает прямое восхождение, склонение, геометрическую высоту (без
 * рефракции) и видимую высоту (с рефракцией и полудиаметром — так же, как
 * считаются восходы/заходы), азимут от северного меридиана и часовой угол.
 */
export function getBodySkyPosition(jd, body = 'moon', latDeg = null, lonDeg = null) {
  const coords = getObserverCoords();
  const lat = latDeg === null || latDeg === undefined ? coords.latDeg : latDeg;
  const lon = lonDeg === null || lonDeg === undefined ? coords.lonDeg : lonDeg;
  const isSun = body === 'sun';

  const T = (jd - J2000) / 36525;
  const d = jd - J2000;
  const gmst = norm360(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T);
  const lst = norm360(gmst + lon);

  const eq = isSun ? getSunEquatorial(jd) : getMoonPosition(jd);
  const H = norm360(lst - eq.ra);
  const sinAlt = sinD(lat) * sinD(eq.dec) + cosD(lat) * cosD(eq.dec) * cosD(H);
  const geoAltDeg = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD2DEG;
  const cosAlt = Math.cos(geoAltDeg * DEG2RAD);

  let azDeg = 0;
  if (Math.abs(cosAlt) > 1e-9) {
    const sinA = (-cosD(eq.dec) * sinD(H)) / cosAlt;
    const cosA = (sinD(eq.dec) - sinD(lat) * Math.sin(geoAltDeg * DEG2RAD)) / (cosD(lat) * cosAlt);
    azDeg = norm360(Math.atan2(sinA, cosA) * RAD2DEG);
  }

  let altDeg = geoAltDeg;
  if (isSun) {
    altDeg = geoAltDeg + 0.8333;
  } else {
    const parallax = Math.asin(6378.14 / eq.distKm) * RAD2DEG;
    altDeg = geoAltDeg - (parallax - 0.5667 - 0.25);
  }

  return {
    body: isSun ? 'sun' : 'moon',
    ra: eq.ra,
    dec: eq.dec,
    geoAltDeg,
    altDeg,
    azDeg,
    hourAngleDeg: H,
    distKm: isSun ? null : eq.distKm
  };
}

export function findHorizonEventsForFn(altFn, jdStart, jdEnd, latDeg, lonDeg) {
  const rises = [];
  const sets = [];
  const step = 1 / 48; // 30 minutes
  let prevT = jdStart;
  let prevH = altFn(prevT, latDeg, lonDeg);

  for (let t = jdStart + step; t <= jdEnd + step; t += step) {
    const clampedT = Math.min(t, jdEnd);
    const curH = altFn(clampedT, latDeg, lonDeg);
    if (prevH <= 0 && curH > 0) {
      let lo = prevT;
      let hi = clampedT;
      for (let i = 0; i < 16; i++) {
        const mid = (lo + hi) * 0.5;
        if (altFn(mid, latDeg, lonDeg) <= 0) lo = mid;
        else hi = mid;
      }
      const riseJD = (lo + hi) * 0.5;
      if (riseJD > jdStart + 0.0007 && riseJD < jdEnd - 0.0007) {
        rises.push(riseJD);
      }
    } else if (prevH >= 0 && curH < 0) {
      let lo = prevT;
      let hi = clampedT;
      for (let i = 0; i < 16; i++) {
        const mid = (lo + hi) * 0.5;
        if (altFn(mid, latDeg, lonDeg) >= 0) lo = mid;
        else hi = mid;
      }
      const setJD = (lo + hi) * 0.5;
      if (setJD > jdStart + 0.0007 && setJD < jdEnd - 0.0007) {
        sets.push(setJD);
      }
    }
    prevT = clampedT;
    prevH = curH;
    if (clampedT >= jdEnd) break;
  }
  return { rises, sets };
}

function findMoonHorizonEventsBetween(jdStart, jdEnd, latDeg, lonDeg) {
  return findHorizonEventsForFn(getMoonAltitudeDeg, jdStart, jdEnd, latDeg, lonDeg);
}

function findMoonrisesBetween(jdStart, jdEnd, latDeg, lonDeg) {
  return findMoonHorizonEventsBetween(jdStart, jdEnd, latDeg, lonDeg).rises;
}

function findUpperTransitsBetween(raFn, jdStart, jdEnd, lonDeg) {
  const getHA = (jd) => {
    const T = (jd - J2000) / 36525;
    const d = jd - J2000;
    const gmst = norm360(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T);
    const lst = norm360(gmst + lonDeg);
    return signedAngleDiff(lst, raFn(jd));
  };
  const transits = [];
  const step = 1 / 48;
  let prevT = jdStart;
  let prevHA = getHA(prevT);
  for (let t = jdStart + step; t <= jdEnd + step; t += step) {
    const clampedT = Math.min(t, jdEnd);
    const curHA = getHA(clampedT);
    if (prevHA <= 0 && curHA > 0 && Math.abs(curHA - prevHA) < 90) {
      let lo = prevT;
      let hi = clampedT;
      for (let i = 0; i < 16; i++) {
        const mid = (lo + hi) * 0.5;
        if (getHA(mid) <= 0) lo = mid;
        else hi = mid;
      }
      const trJD = (lo + hi) * 0.5;
      if (trJD > jdStart + 0.0007 && trJD < jdEnd - 0.0007) {
        transits.push(trJD);
      }
    }
    prevT = clampedT;
    prevHA = curHA;
    if (clampedT >= jdEnd) break;
  }
  return transits;
}

function buildHorizonSegments(rises, sets, dayStartMs, startsAbove) {
  const events = [
    ...rises.map(jd => ({ h: (fromJulianDay(jd).getTime() - dayStartMs) / 3600000, type: 'rise' })),
    ...sets.map(jd => ({ h: (fromJulianDay(jd).getTime() - dayStartMs) / 3600000, type: 'set' }))
  ].sort((a, b) => a.h - b.h);
  const segs = [];
  let above = startsAbove;
  let curStart = 0;
  for (const ev of events) {
    const h = Math.max(0, Math.min(24, ev.h));
    if (ev.type === 'set' && above) {
      segs.push([curStart, h]);
      above = false;
    } else if (ev.type === 'rise' && !above) {
      curStart = h;
      above = true;
    }
  }
  if (above) segs.push([curStart, 24]);
  return segs;
}

function computeBodyArcProgress(altFn, refJD, latDeg, lonDeg) {
  if (altFn(refJD, latDeg, lonDeg) <= 0) {
    return { above: false, progress: null };
  }
  const win = findHorizonEventsForFn(altFn, refJD - 1.5, refJD + 1.5, latDeg, lonDeg);
  const prevRise = win.rises.filter(j => j <= refJD).pop();
  const nextSet = win.sets.find(j => j >= refJD);
  if (prevRise !== undefined && nextSet !== undefined && nextSet > prevRise) {
    const p = (refJD - prevRise) / (nextSet - prevRise);
    return { above: true, progress: Math.max(0.01, Math.min(0.99, p)) };
  }
  return { above: true, progress: 0.5 };
}

export function getHorizonDayDetails(referenceMoment = new Date()) {
  const ref = referenceMoment instanceof Date ? referenceMoment : new Date(referenceMoment);
  const dayStart = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59, 999);
  const startJD = toJulianDay(dayStart);
  const endJD = toJulianDay(dayEnd);
  const refJD = toJulianDay(ref);
  const dayStartMs = dayStart.getTime();
  const { latDeg, lonDeg } = getObserverCoords();

  const sunEvents = findHorizonEventsForFn(getSunAltitudeDeg, startJD, endJD, latDeg, lonDeg);
  const moonEvents = findHorizonEventsForFn(getMoonAltitudeDeg, startJD, endJD, latDeg, lonDeg);
  const sunTransits = findUpperTransitsBetween(jd => getSunEquatorial(jd).ra, startJD, endJD, lonDeg);
  const moonTransits = findUpperTransitsBetween(jd => getMoonPosition(jd).ra, startJD, endJD, lonDeg);

  const sunStartsAbove = getSunAltitudeDeg(startJD, latDeg, lonDeg) > 0;
  const moonStartsAbove = getMoonAltitudeDeg(startJD, latDeg, lonDeg) > 0;

  return {
    sunriseStr: sunEvents.rises.length ? formatHM(fromJulianDay(sunEvents.rises[0])) : '--:--',
    sunsetStr: sunEvents.sets.length ? formatHM(fromJulianDay(sunEvents.sets[0])) : '--:--',
    sunTransitStr: sunTransits.length ? formatHM(fromJulianDay(sunTransits[0])) : '--:--',
    moonriseStr: moonEvents.rises.length ? formatHM(fromJulianDay(moonEvents.rises[0])) : '--:--',
    moonsetStr: moonEvents.sets.length ? formatHM(fromJulianDay(moonEvents.sets[0])) : '--:--',
    moonTransitStr: moonTransits.length ? formatHM(fromJulianDay(moonTransits[0])) : '--:--',
    sunSegments: buildHorizonSegments(sunEvents.rises, sunEvents.sets, dayStartMs, sunStartsAbove),
    moonSegments: buildHorizonSegments(moonEvents.rises, moonEvents.sets, dayStartMs, moonStartsAbove),
    sunState: computeBodyArcProgress(getSunAltitudeDeg, refJD, latDeg, lonDeg),
    moonState: computeBodyArcProgress(getMoonAltitudeDeg, refJD, latDeg, lonDeg)
  };
}

export function getLunationIntervals(jd) {
  const nmPrev = findNewMoonBefore(jd);
  const { latDeg, lonDeg } = getObserverCoords();
  const cacheKey = `${Math.round(nmPrev * 100)}|${latDeg.toFixed(3)}|${lonDeg.toFixed(3)}`;
  if (lunationCache.has(cacheKey)) {
    return lunationCache.get(cacheKey);
  }
  const nmNext = refineNewMoon(nmPrev + SYNODIC_MONTH);
  const rises = findMoonrisesBetween(nmPrev, nmNext, latDeg, lonDeg);

  const intervals = [];
  let cursor = nmPrev;
  let dayNum = 1;
  for (let i = 0; i < rises.length && dayNum < 30; i++) {
    intervals.push({ day: dayNum, startJD: cursor, endJD: rises[i], startsBy: i === 0 ? 'new_moon' : 'moonrise' });
    cursor = rises[i];
    dayNum++;
  }
  intervals.push({ day: dayNum, startJD: cursor, endJD: nmNext, startsBy: 'moonrise' });

  const payload = { nmPrev, nmNext, intervals };
  if (lunationCache.size > 64) {
    lunationCache.clear();
  }
  lunationCache.set(cacheKey, payload);
  return payload;
}

export function getLunarDayAt(date) {
  const jd = toJulianDay(date);
  const { intervals } = getLunationIntervals(jd);
  for (let i = 0; i < intervals.length; i++) {
    if (jd >= intervals[i].startJD && jd < intervals[i].endJD) {
      return intervals[i];
    }
  }
  return intervals[intervals.length - 1];
}

export function formatHM(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function getMoonPhaseInfo(date) {
  const jd = toJulianDay(date);
  const sun = getSunPosition(jd);
  const moon = getMoonPosition(jd);
  const elong = norm360(moon.lon - sun.lon);
  const illumination = (1 - cosD(elong)) * 0.5;
  const isWaxing = elong < 180;
  const nmPrev = findNewMoonBefore(jd);
  const moonAge = Math.max(0, jd - nmPrev);

  let trend = isWaxing ? 'waxing' : 'waning';
  let trendGlyph = isWaxing ? '▲' : '▼';
  if (elong <= 7 || elong >= 353) {
    trend = 'new';
    trendGlyph = '○';
  } else if (Math.abs(elong - 180) <= 7) {
    trend = 'full';
    trendGlyph = '●';
  }

  let detailedTrend = 'waxing_gibbous';
  if (elong <= 7 || elong >= 353) {
    detailedTrend = 'new_moon';
  } else if (elong < 83) {
    detailedTrend = 'waxing_crescent';
  } else if (elong <= 97) {
    detailedTrend = 'first_quarter';
  } else if (elong < 173) {
    detailedTrend = 'waxing_gibbous';
  } else if (elong <= 187) {
    detailedTrend = 'full_moon';
  } else if (elong < 263) {
    detailedTrend = 'waning_gibbous';
  } else if (elong <= 277) {
    detailedTrend = 'last_quarter';
  } else {
    detailedTrend = 'waning_crescent';
  }

  return {
    jd,
    elong,
    illumination,
    illuminationPct: Math.round(illumination * 100),
    illuminationExact: Number((illumination * 100).toFixed(1)),
    isWaxing,
    trend,
    detailedTrend,
    trendGlyph,
    moonAge,
    moonLon: moon.lon,
    sunLon: sun.lon,
    zodiacSign: getZodiacSign(moon.lon)
  };
}

export function getCalendarDayLunarSummary(calendarDate, referenceMoment = null) {
  const dayStart = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate(), 23, 59, 59, 999);
  const ref = referenceMoment || new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate(), 12, 0, 0, 0);

  const startJD = toJulianDay(dayStart);
  const endJD = toJulianDay(dayEnd);
  const refJD = toJulianDay(ref);

  // Collect intervals spanning dayStart to dayEnd (may cross lunation boundary)
  const lun1 = getLunationIntervals(startJD);
  const lun2 = endJD >= lun1.nmNext ? getLunationIntervals(endJD) : null;
  const allIntervals = lun2 ? [...lun1.intervals, ...lun2.intervals] : lun1.intervals;

  let activeInterval = allIntervals.find(iv => refJD >= iv.startJD && refJD < iv.endJD) || allIntervals[0];

  // Find transition falling inside [startJD, endJD]
  let transitionInterval = null;
  for (let i = 0; i < allIntervals.length; i++) {
    const iv = allIntervals[i];
    if (iv.startJD > startJD && iv.startJD <= endJD) {
      transitionInterval = iv;
    }
  }

  let firstDay = activeInterval.day;
  let secondDay = activeInterval.day;
  let activeIndex = 0;
  let firstDayStartTimeStr = '';
  let secondDayStartTimeStr = '';
  let transitionTimeStr = '';

  if (transitionInterval) {
    const idx = allIntervals.indexOf(transitionInterval);
    const prevIv = idx > 0 ? allIntervals[idx - 1] : getLunarDayAt(fromJulianDay(transitionInterval.startJD - 0.05));
    firstDay = prevIv.day;
    secondDay = transitionInterval.day;
    activeIndex = refJD >= transitionInterval.startJD ? 1 : 0;
    firstDayStartTimeStr = formatHM(fromJulianDay(prevIv.startJD));
    secondDayStartTimeStr = formatHM(fromJulianDay(transitionInterval.startJD));
    transitionTimeStr = secondDayStartTimeStr;
  } else {
    const idx = allIntervals.indexOf(activeInterval);
    const nextIv = idx >= 0 && idx + 1 < allIntervals.length
      ? allIntervals[idx + 1]
      : getLunarDayAt(fromJulianDay(activeInterval.endJD + 0.01));
    firstDay = activeInterval.day;
    secondDay = nextIv.day;
    activeIndex = 0;
    firstDayStartTimeStr = formatHM(fromJulianDay(activeInterval.startJD));
    secondDayStartTimeStr = formatHM(fromJulianDay(nextIv.startJD));
    transitionTimeStr = formatHM(fromJulianDay(activeInterval.endJD));
  }

  const phaseInfo = getMoonPhaseInfo(ref);
  const { latDeg, lonDeg } = getObserverCoords();
  const horizonEvents = findMoonHorizonEventsBetween(startJD, endJD, latDeg, lonDeg);
  const moonriseStr = horizonEvents.rises.length
    ? formatHM(fromJulianDay(horizonEvents.rises[0]))
    : '--:--';
  const moonsetStr = horizonEvents.sets.length
    ? formatHM(fromJulianDay(horizonEvents.sets[0]))
    : '--:--';

  const mkWindow = (hour) => {
    const dt = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate(), hour, 0, 0, 0);
    const info = getMoonPhaseInfo(dt);
    return {
      hour,
      zodiacSign: info.zodiacSign,
      detailedTrend: info.detailedTrend,
      moonLon: Number(info.moonLon.toFixed(2))
    };
  };
  const windows = {
    morning: mkWindow(9),
    day: mkWindow(14),
    evening: mkWindow(20)
  };

  const signIngress = findMoonSignIngressBetween(dayStart, dayEnd);

  return {
    calendarDay: calendarDate.getDate(),
    activeLunarDay: activeInterval.day,
    firstDay,
    secondDay,
    activeIndex,
    firstDayStartTimeStr,
    secondDayStartTimeStr,
    transitionTimeStr,
    moonriseStr,
    moonsetStr,
    signIngress,
    windows,
    phaseInfo
  };
}

export function findMoonSignIngressBetween(startDate, endDate) {
  const startSign = getZodiacSign(getMoonPosition(toJulianDay(startDate)).lon);
  const endSign = getZodiacSign(getMoonPosition(toJulianDay(endDate)).lon);
  if (startSign === endSign) return null;

  let lo = startDate.getTime();
  let hi = endDate.getTime();
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) * 0.5;
    const midSign = getZodiacSign(getMoonPosition(toJulianDay(new Date(mid))).lon);
    if (midSign === startSign) lo = mid;
    else hi = mid;
  }
  const ingressDate = new Date((lo + hi) * 0.5);
  return {
    fromSign: startSign,
    toSign: endSign,
    timeStr: formatHM(ingressDate),
    timestamp: ingressDate.getTime()
  };
}

export function findNextDateForLunarDay(targetLunarDay, afterDate = new Date()) {
  const startMs = afterDate.getTime();
  // Search up to 62 days forward in 2-hour increments to catch short lunar days accurately
  for (let h = 1; h <= 62 * 24; h += 2) {
    const checkDate = new Date(startMs + h * 3600000);
    const iv = getLunarDayAt(checkDate);
    if (iv.day === targetLunarDay) {
      const exactStart = fromJulianDay(iv.startJD);
      if (exactStart.getTime() > startMs) {
        return exactStart;
      }
      return checkDate;
    }
  }
  return new Date(startMs + 86400000);
}

// =========================================================================
// Planetary Geocentric Longitudes (Schlyter / Meeus Keplerian + Perturbations)
// =========================================================================

const PLANET_ELEMENTS = {
  Mercury: {
    N: [48.3313, 3.24587e-5],
    i: [7.0047, 5.00e-8],
    w: [29.1241, 1.01444e-5],
    a: 0.387098,
    e: [0.205635, 5.59e-10],
    M: [168.6562, 4.0923344368]
  },
  Venus: {
    N: [76.6799, 2.46590e-5],
    i: [3.3946, 2.75e-8],
    w: [54.8910, 1.38374e-5],
    a: 0.723330,
    e: [0.006773, -1.302e-9],
    M: [48.0052, 1.6021302244]
  },
  Mars: {
    N: [49.5574, 2.11081e-5],
    i: [1.8497, -1.78e-8],
    w: [286.5016, 2.92961e-5],
    a: 1.523688,
    e: [0.093405, 2.516e-9],
    M: [18.6021, 0.5240207766]
  },
  Jupiter: {
    N: [100.4542, 2.76854e-5],
    i: [1.3030, -1.557e-7],
    w: [273.8777, 1.64505e-5],
    a: 5.20256,
    e: [0.048498, 4.469e-9],
    M: [19.8950, 0.0830853001]
  },
  Saturn: {
    N: [113.6634, 2.38980e-5],
    i: [2.4886, -1.081e-7],
    w: [339.3939, 2.97661e-5],
    a: 9.55475,
    e: [0.055546, -9.499e-9],
    M: [316.9670, 0.0334442282]
  },
  Uranus: {
    N: [74.0005, 1.3978e-5],
    i: [0.7733, 1.9e-8],
    w: [96.6612, 3.0565e-5],
    a: 19.18171,
    e: [0.047318, 7.45e-9],
    M: [142.5905, 0.011725806]
  },
  Neptune: {
    N: [131.7806, 3.0173e-5],
    i: [1.7700, -2.55e-7],
    w: [272.8461, -6.027e-6],
    a: 30.05826,
    e: [0.008606, 2.15e-9],
    M: [260.2471, 0.005995147]
  },
  Pluto: {
    N: [110.30347, 0],
    i: [17.14175, 0],
    w: [113.76329, 0],
    a: 39.48168677,
    e: [0.24880766, 0],
    M: [14.86205, 0.00396608]
  }
};

function getHeliocentricXYZ(planetName, d) {
  const el = PLANET_ELEMENTS[planetName];
  const N = norm360(el.N[0] + el.N[1] * d);
  const i = el.i[0] + el.i[1] * d;
  const w = norm360(el.w[0] + el.w[1] * d);
  const a = el.a;
  const e = el.e[0] + el.e[1] * d;
  const M = norm360(el.M[0] + el.M[1] * d);

  const Mrad = M * DEG2RAD;
  let E = Mrad + e * Math.sin(Mrad) * (1 + e * Math.cos(Mrad));
  for (let iter = 0; iter < 6; iter++) {
    const dE = (E - e * Math.sin(E) - Mrad) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-7) break;
  }

  const xv = a * (Math.cos(E) - e);
  const yv = a * (Math.sqrt(1 - e * e) * Math.sin(E));
  const v = Math.atan2(yv, xv) * RAD2DEG;
  const r = Math.sqrt(xv * xv + yv * yv);

  const vw = (v + w) * DEG2RAD;
  const Nrad = N * DEG2RAD;
  const irad = i * DEG2RAD;

  let xh = r * (Math.cos(Nrad) * Math.cos(vw) - Math.sin(Nrad) * Math.sin(vw) * Math.cos(irad));
  let yh = r * (Math.sin(Nrad) * Math.cos(vw) + Math.cos(Nrad) * Math.sin(vw) * Math.cos(irad));
  const zh = r * (Math.sin(vw) * Math.sin(irad));

  // Perturbations for Jupiter, Saturn, Uranus
  if (planetName === 'Jupiter' || planetName === 'Saturn' || planetName === 'Uranus') {
    const Mj = norm360(19.8950 + 0.0830853001 * d);
    const Ms = norm360(316.9670 + 0.0334442282 * d);
    const Mu = norm360(142.5905 + 0.011725806 * d);
    let dLon = 0;
    if (planetName === 'Jupiter') {
      dLon = -0.332 * sinD(2 * Mj - 5 * Ms - 67.6) - 0.056 * sinD(2 * Mj - 2 * Ms + 21) + 0.042 * sinD(3 * Mj - 5 * Ms + 21);
    } else if (planetName === 'Saturn') {
      dLon = 0.812 * sinD(2 * Mj - 5 * Ms - 67.6) - 0.229 * cosD(2 * Mj - 4 * Ms - 2) + 0.119 * sinD(Mj - 2 * Ms - 3);
    } else if (planetName === 'Uranus') {
      dLon = 0.040 * sinD(Ms - 2 * Mu + 6) + 0.035 * sinD(Ms - 3 * Mu + 33) - 0.015 * sinD(Mj - Mu + 20);
    }
    if (dLon !== 0) {
      const lonH = Math.atan2(yh, xh) * RAD2DEG + dLon;
      const radXY = Math.sqrt(xh * xh + yh * yh);
      xh = radXY * cosD(lonH);
      yh = radXY * sinD(lonH);
    }
  }

  return { xh, yh, zh };
}

export function getPlanetLongitudes(date, planetList) {
  const jd = toJulianDay(date);
  // Schlyter epoch d = days since 1999 Dec 31 00:00 UT (JD 2451543.5)
  const d = jd - 2451543.5;
  const sun = getSunPosition(jd);
  const earthLon = norm360(sun.lon + 180);
  const xe = sun.radiusAU * cosD(earthLon);
  const ye = sun.radiusAU * sinD(earthLon);

  const result = {};
  for (const name of planetList) {
    if (name === 'Sun') {
      result.Sun = sun.lon;
    } else if (name === 'Moon') {
      result.Moon = getMoonPosition(jd).lon;
    } else {
      const p = getHeliocentricXYZ(name, d);
      result[name] = norm360(Math.atan2(p.yh - ye, p.xh - xe) * RAD2DEG);
    }
  }
  return result;
}

// =========================================================================
// Personal Rhythm & Aspect Graph Builder (State B)
// =========================================================================

const NATAL_TARGETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'];
const FAST_PLANETS = ['Moon', 'Mercury', 'Venus', 'Mars'];
const SLOW_PLANETS = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const TRANSIT_PLANETS = [...FAST_PLANETS, ...SLOW_PLANETS];

export const ASPECTS = [
  { key: 'edge_conjunction', angle: 0 },
  { key: 'edge_sextile', angle: 60 },
  { key: 'edge_square', angle: 90 },
  { key: 'edge_trine', angle: 120 },
  { key: 'edge_opposition', angle: 180 }
];

const PLANET_GROUP_WEIGHT = {
  Moon: 2.2,
  Mercury: 1.0,
  Venus: 1.0,
  Mars: 1.0,
  Jupiter: 1.5,
  Saturn: 1.5,
  Uranus: 2.0,
  Neptune: 2.0,
  Pluto: 2.0
};

export const PLANET_ORB = {
  Moon: 2.2,
  Mercury: 1.0,
  Venus: 1.0,
  Mars: 1.0,
  Jupiter: 1.5,
  Saturn: 1.5,
  Uranus: 1.5,
  Neptune: 1.5,
  Pluto: 1.5
};

const PLANET_TO_ACTOR = {
  Moon: 'actor_moon',
  Mercury: 'actor_mercury',
  Venus: 'actor_venus',
  Mars: 'actor_mars',
  Jupiter: 'actor_jupiter',
  Saturn: 'actor_saturn',
  Uranus: 'actor_outer',
  Neptune: 'actor_outer',
  Pluto: 'actor_outer'
};

function getAngleDiffForPair(lonA, lonB, targetAngle) {
  let dist = Math.abs(lonA - lonB) % 360;
  if (dist > 180) dist = 360 - dist;
  return Math.abs(dist - targetAngle);
}

function getDailyPlanetSpeed(planetName, targetDateObj) {
  const tPrev = new Date(targetDateObj.getTime() - 12 * 3600000);
  const tNext = new Date(targetDateObj.getTime() + 12 * 3600000);
  const lonPrev = getPlanetLongitudes(tPrev, [planetName])[planetName];
  const lonNext = getPlanetLongitudes(tNext, [planetName])[planetName];
  return Math.abs(signedAngleDiff(lonNext, lonPrev));
}

// Find the closest exact Moon aspect falling within the calendar day [00:00..23:59]
function findDailyMoonAspects(natal, targetDateObj, refMoment) {
  const dayStart = new Date(
    targetDateObj.getFullYear(),
    targetDateObj.getMonth(),
    targetDateObj.getDate(),
    0, 0, 0, 0
  );
  const dayEndMs = dayStart.getTime() + 24 * 3600000;
  const refMs = refMoment ? refMoment.getTime() : dayStart.getTime() + 12 * 3600000;
  const stepHours = 2;
  const moonOrbsMax = PLANET_ORB.Moon;
  const bestByPair = [];

  // Sample Moon longitude every 2 hours across the calendar day
  const samples = [];
  for (let h = 0; h <= 24; h += stepHours) {
    const t = new Date(dayStart.getTime() + h * 3600000);
    samples.push({ tMs: t.getTime(), lon: getMoonPosition(toJulianDay(t)).lon });
  }

  for (const nPlanet of NATAL_TARGETS) {
    const nLon = natal[nPlanet];
    for (const asp of ASPECTS) {
      let bestDiff = Infinity;
      let bestIdx = 0;
      for (let i = 0; i < samples.length; i++) {
        const d = getAngleDiffForPair(samples[i].lon, nLon, asp.angle);
        if (d < bestDiff) {
          bestDiff = d;
          bestIdx = i;
        }
      }

      if (bestDiff <= moonOrbsMax) {
        // Ternary refinement around bestIdx to pinpoint the exact aspect time within the day
        let lo = Math.max(dayStart.getTime(), samples[Math.max(0, bestIdx - 1)].tMs);
        let hi = Math.min(dayEndMs, samples[Math.min(samples.length - 1, bestIdx + 1)].tMs);
        for (let iter = 0; iter < 12; iter++) {
          const m1 = lo + (hi - lo) / 3;
          const m2 = hi - (hi - lo) / 3;
          const d1 = getAngleDiffForPair(getMoonPosition(toJulianDay(new Date(m1))).lon, nLon, asp.angle);
          const d2 = getAngleDiffForPair(getMoonPosition(toJulianDay(new Date(m2))).lon, nLon, asp.angle);
          if (d1 < d2) hi = m2;
          else lo = m1;
        }
        const peakMs = (lo + hi) * 0.5;
        const peakDiff = getAngleDiffForPair(getMoonPosition(toJulianDay(new Date(peakMs))).lon, nLon, asp.angle);

        if (peakDiff <= 0.55) {
          const refDiff = getAngleDiffForPair(getMoonPosition(toJulianDay(new Date(refMs))).lon, nLon, asp.angle);
          const laterDiff = getAngleDiffForPair(
            getMoonPosition(toJulianDay(new Date(refMs + 2 * 3600000))).lon,
            nLon,
            asp.angle
          );
          const deltaFromRefHours = (peakMs - refMs) / 3600000;
          const isApplying = Math.abs(deltaFromRefHours) <= 1.5
            ? laterDiff < refDiff
            : deltaFromRefHours > 0;
          const dynamicKey = Math.abs(deltaFromRefHours) <= 2.0
            ? 'exact'
            : isApplying
            ? 'applying'
            : 'separating';

          const kTarget = nPlanet === 'Sun' || nPlanet === 'Moon' ? 1.2 : 1.0;
          const proximityBonus = 1 - Math.min(1, peakDiff / 0.6);
          const recencyBonus = 1 - Math.min(0.45, Math.abs(deltaFromRefHours) / 28);
          const weight = PLANET_GROUP_WEIGHT.Moon * (0.55 + 0.45 * proximityBonus) * recencyBonus * kTarget;
          const focusActorKey =
            nPlanet === 'Mercury' || nPlanet === 'Venus' || nPlanet === 'Mars'
              ? PLANET_TO_ACTOR[nPlanet]
              : 'actor_moon';

          bestByPair.push({
            transit: 'Moon',
            natal: nPlanet,
            aspectKey: asp.key,
            angle: asp.angle,
            diff: Number(peakDiff.toFixed(2)),
            weight: Number(weight.toFixed(4)),
            actorKey: focusActorKey,
            layer: 'fast',
            isApplying,
            dynamicKey,
            peakHour: new Date(peakMs).getHours()
          });
        }
      }
    }
  }

  bestByPair.sort((a, b) => b.weight - a.weight);
  return bestByPair;
}

export function getBirthProfileKey(birthMoonAge) {
  if (birthMoonAge <= 3.7 || birthMoonAge >= 25.8) return 'profile_async';
  if (birthMoonAge < 11.1) return 'profile_waxing';
  if (birthMoonAge <= 18.5) return 'profile_sync';
  return 'profile_waning';
}

export function getPersonalPhaseKey(personalPhase) {
  if (personalPhase <= 3.7 || personalPhase >= 25.8) return 'phase_peak';
  if (personalPhase <= 11.1) return 'phase_decline';
  if (personalPhase <= 18.5) return 'phase_minimum';
  return 'phase_rise';
}

export function getPhaseStage(personalPhase, phaseKey) {
  let elapsed = 0;
  let span = 7.4;

  if (phaseKey === 'phase_peak') {
    elapsed = personalPhase >= 25.8 ? personalPhase - 25.8 : personalPhase + (SYNODIC_MONTH - 25.8);
    span = SYNODIC_MONTH - 25.8 + 3.7;
  } else if (phaseKey === 'phase_decline') {
    elapsed = personalPhase - 3.7;
    span = 7.4;
  } else if (phaseKey === 'phase_minimum') {
    elapsed = personalPhase - 11.1;
    span = 7.4;
  } else {
    elapsed = personalPhase - 18.5;
    span = 7.3;
  }

  const ratio = Math.max(0, Math.min(1, elapsed / span));
  const dayInPhase = Math.min(8, Math.max(1, Math.floor(elapsed) + 1));
  const totalDays = 8;

  if (ratio < 0.34) {
    return {
      key: 'start',
      dayInPhase,
      totalDays,
      label: 'начало такта',
      hint: 'Начало такта: плавно входите в ритм этапа и задавайте основной вектор без перегрузок.'
    };
  }
  if (ratio < 0.67) {
    return {
      key: 'middle',
      dayInPhase,
      totalDays,
      label: 'середина такта',
      hint: 'Середина такта: устойчивое время для последовательной работы над ключевыми задачами.'
    };
  }
  return {
    key: 'end',
    dayInPhase,
    totalDays,
    label: 'финал такта',
    hint: 'Финал такта: фиксируйте промежуточные результаты и готовьте переход к следующему этапу.'
  };
}

export function getAgeClassKey(birthDateObj, targetDateObj) {
  let age = targetDateObj.getFullYear() - birthDateObj.getFullYear();
  const mDiff = targetDateObj.getMonth() - birthDateObj.getMonth();
  if (mDiff < 0 || (mDiff === 0 && targetDateObj.getDate() < birthDateObj.getDate())) {
    age--;
  }
  if (age <= 25) return 'age_18_25';
  if (age <= 40) return 'age_26_40';
  if (age <= 55) return 'age_41_55';
  return 'age_55_plus';
}

export function parseBirthDateString(birthDateStr, birthTimeStr = null) {
  if (!birthDateStr || typeof birthDateStr !== 'string') return null;
  const parts = birthDateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  let hours = 12;
  let minutes = 0;
  if (birthTimeStr && typeof birthTimeStr === 'string') {
    const tParts = birthTimeStr.split(':').map(Number);
    if (tParts.length >= 2 && !isNaN(tParts[0]) && !isNaN(tParts[1])) {
      hours = Math.max(0, Math.min(23, tParts[0]));
      minutes = Math.max(0, Math.min(59, tParts[1]));
    }
  }
  return new Date(parts[0], parts[1] - 1, parts[2], hours, minutes, 0, 0);
}

function buildRawNonMoonEdges(natal, targetDateObj, refMoment) {
  const checkDate = refMoment || targetDateObj;
  const laterDate = new Date(checkDate.getTime() + 2 * 3600000);
  const nonMoonPlanets = TRANSIT_PLANETS.filter(p => p !== 'Moon');
  const transitNow = getPlanetLongitudes(checkDate, nonMoonPlanets);
  const transitLater = getPlanetLongitudes(laterDate, nonMoonPlanets);

  const fastEdges = [];
  const backgroundEdges = [];

  for (const tPlanet of nonMoonPlanets) {
    const isFast = FAST_PLANETS.includes(tPlanet);
    const kGroup = PLANET_GROUP_WEIGHT[tPlanet];
    const orb = PLANET_ORB[tPlanet] || 1.5;
    const speed = isFast ? getDailyPlanetSpeed(tPlanet, checkDate) : 1.0;
    // Slow/stationary loop penalty for personal fast planets (< 0.75 deg/day)
    const loopMultiplier = isFast && speed < 0.75 ? 0.45 : 1.0;

    for (const nPlanet of NATAL_TARGETS) {
      for (const asp of ASPECTS) {
        const diff = getAngleDiffForPair(transitNow[tPlanet], natal[nPlanet], asp.angle);
        if (diff <= orb) {
          const diffLater = getAngleDiffForPair(transitLater[tPlanet], natal[nPlanet], asp.angle);
          const isApplying = diffLater < diff;
          const dynamicKey = diff <= 0.28 ? 'exact' : isApplying ? 'applying' : 'separating';
          const kTarget = nPlanet === 'Sun' || nPlanet === 'Moon' ? 1.2 : 1.0;
          const weight = kGroup * (1 - diff / orb) * kTarget * loopMultiplier;

          const edge = {
            transit: tPlanet,
            natal: nPlanet,
            aspectKey: asp.key,
            angle: asp.angle,
            diff: Number(diff.toFixed(2)),
            weight: Number(weight.toFixed(4)),
            actorKey: PLANET_TO_ACTOR[tPlanet],
            layer: isFast ? 'fast' : 'background',
            isApplying,
            dynamicKey
          };
          if (isFast) fastEdges.push(edge);
          else backgroundEdges.push(edge);
        }
      }
    }
  }

  fastEdges.sort((a, b) => b.weight - a.weight);
  backgroundEdges.sort((a, b) => b.weight - a.weight);
  return { fastEdges, backgroundEdges };
}

const ROLE_BASE_WEIGHTS = {
  role_agile: 0.25,
  role_drive: 0.20,
  role_diplomat: 0.25,
  role_heavy: 0.22,
  role_autonomous: 0.32
};

const PHASE_ROLE_BIAS = {
  phase_peak: { role_drive: 0.25, role_agile: 0.20, role_heavy: 0.18, role_diplomat: 0.15 },
  phase_decline: { role_diplomat: 0.22, role_heavy: 0.25, role_autonomous: 0.22 },
  phase_minimum: { role_autonomous: 0.45, role_diplomat: 0.15, role_heavy: 0.10, role_drive: -0.30, role_agile: -0.20 },
  phase_rise: { role_agile: 0.25, role_drive: 0.18, role_diplomat: 0.20, role_heavy: 0.12 }
};

const SIGN_ROLE_BIAS = {
  'Овен': { role_drive: 0.65 },
  'Телец': { role_diplomat: 0.55, role_heavy: 0.30 },
  'Близнецы': { role_agile: 0.65 },
  'Рак': { role_autonomous: 0.70 },
  'Лев': { role_drive: 0.45, role_diplomat: 0.30 },
  'Дева': { role_agile: 0.45, role_heavy: 0.45 },
  'Весы': { role_diplomat: 0.70 },
  'Скорпион': { role_drive: 0.60, role_heavy: 0.20 },
  'Стрелец': { role_drive: 0.40, role_diplomat: 0.35 },
  'Козерог': { role_heavy: 0.85 },
  'Водолей': { role_agile: 0.60 },
  'Рыбы': { role_autonomous: 0.70 }
};

const TARGET_ROLE_BIAS = {
  Mercury: { role_agile: 0.85 },
  Venus: { role_diplomat: 0.85 },
  Mars: { role_drive: 0.85 },
  Sun: { role_drive: 0.42, role_heavy: 0.38 },
  Moon: { role_autonomous: 0.42, role_diplomat: 0.36 }
};

const PHASE_CORRIDOR_GATE = {
  phase_peak: { role_agile: 1.10, role_drive: 1.15, role_heavy: 1.05, role_diplomat: 1.00, role_autonomous: 0.75 },
  phase_decline: { role_agile: 0.90, role_drive: 0.80, role_heavy: 1.18, role_diplomat: 1.10, role_autonomous: 1.02 },
  phase_minimum: { role_agile: 0.55, role_drive: 0.40, role_heavy: 0.82, role_diplomat: 1.05, role_autonomous: 1.25 },
  phase_rise: { role_agile: 1.12, role_drive: 1.05, role_heavy: 1.02, role_diplomat: 1.05, role_autonomous: 0.90 }
};

function findSolunarBaselineEdge(natal, targetDateObj, refMoment) {
  const checkDate = refMoment || targetDateObj;
  const laterDate = new Date(checkDate.getTime() + 2 * 3600000);
  const moonNow = getMoonPosition(toJulianDay(checkDate)).lon;
  const moonLater = getMoonPosition(toJulianDay(laterDate)).lon;
  const targetLon = natal.Sun;

  let bestAsp = ASPECTS[0];
  let bestDiff = Infinity;
  for (const asp of ASPECTS) {
    const diff = getAngleDiffForPair(moonNow, targetLon, asp.angle);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestAsp = asp;
    }
  }

  const diffLater = getAngleDiffForPair(moonLater, targetLon, bestAsp.angle);
  const isApplying = diffLater < bestDiff;
  const dynamicKey = bestDiff <= 1.2 ? 'exact' : isApplying ? 'applying' : 'separating';
  const weight = Math.max(0.32, 0.52 * (1 - Math.min(bestDiff, 30) / 36));

  return {
    transit: 'Moon',
    natal: 'Sun',
    aspectKey: bestAsp.key,
    angle: bestAsp.angle,
    diff: Number(bestDiff.toFixed(2)),
    weight: Number(weight.toFixed(4)),
    actorKey: 'actor_moon',
    layer: 'baseline',
    isBaseline: true,
    isApplying,
    dynamicKey,
    peakHour: checkDate.getHours()
  };
}

export function scoreDailyRoles({
  phaseKey,
  moonSign,
  natalMoonSign = null,
  fastEdges = [],
  backgroundEdges = [],
  recentRoles = []
}) {
  const scores = { ...ROLE_BASE_WEIGHTS };

  const pBias = PHASE_ROLE_BIAS[phaseKey] || {};
  for (const [k, v] of Object.entries(pBias)) {
    scores[k] = (scores[k] || 0) + v;
  }

  const sBias = SIGN_ROLE_BIAS[moonSign] || {};
  for (const [k, v] of Object.entries(sBias)) {
    scores[k] = (scores[k] || 0) + v;
  }

  if (natalMoonSign && moonSign === natalMoonSign) {
    scores.role_autonomous += 0.55;
  }

  const consideredFast = fastEdges.slice(0, 3);
  consideredFast.forEach((edge, idx) => {
    const scale = idx === 0 ? 1.0 : idx === 1 ? 0.55 : 0.30;
    const wNorm = Math.min(2.2, edge.weight || 0.5) / 1.6;
    const tBias = TARGET_ROLE_BIAS[edge.natal] || {};
    for (const [role, val] of Object.entries(tBias)) {
      scores[role] = (scores[role] || 0) + val * scale * wNorm;
    }
    if (edge.aspectKey === 'edge_square' || edge.aspectKey === 'edge_opposition') {
      scores.role_heavy += 0.20 * scale;
    } else if (edge.aspectKey === 'edge_trine' || edge.aspectKey === 'edge_sextile') {
      scores.role_diplomat += 0.14 * scale;
    }
  });

  if (backgroundEdges.length > 0) {
    const topBg = backgroundEdges[0];
    if (topBg.actorKey === 'actor_saturn') {
      scores.role_heavy += 0.42;
    } else if (topBg.actorKey === 'actor_jupiter') {
      scores.role_diplomat += 0.25;
      scores.role_heavy += 0.15;
    } else if (topBg.actorKey === 'actor_outer') {
      scores.role_autonomous += 0.20;
    }
  }

  const gate = PHASE_CORRIDOR_GATE[phaseKey] || {};
  for (const k of Object.keys(scores)) {
    scores[k] = Math.max(0.05, scores[k]) * (gate[k] || 1.0);
  }

  // Smooth lookback rotation penalty so roles do not stick for 3-4 days in a row
  recentRoles.forEach((r, idx) => {
    if (r && scores[r] !== undefined) {
      scores[r] -= 0.42 * Math.pow(0.7, idx);
    }
  });

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  let winner = ranked[0][0];
  const twoInRow = recentRoles.length >= 2 && recentRoles[0] === winner && recentRoles[1] === winner;
  const swapThreshold = twoInRow ? 1.25 : 0.65;
  if (
    ranked.length > 1 &&
    recentRoles.slice(0, 2).includes(winner) &&
    ranked[0][1] - ranked[1][1] < swapThreshold
  ) {
    winner = ranked[1][0];
  }

  const roundedScores = {};
  for (const [k, v] of Object.entries(scores)) {
    roundedScores[k] = Number(v.toFixed(3));
  }

  return { roleKey: winner, scores: roundedScores };
}

export function buildLayeredAspectGraph(birthDateObj, targetDateObj, refMoment = targetDateObj) {
  const natal = getPlanetLongitudes(birthDateObj, NATAL_TARGETS);
  const natalMoonSign = getZodiacSign(natal.Moon);

  const buildDayCandidates = (dayDate, dayRef) => {
    const moonEdges = findDailyMoonAspects(natal, dayDate, dayRef);
    const { fastEdges: planetaryFast, backgroundEdges } = buildRawNonMoonEdges(natal, dayDate, dayRef);
    let combined = [...moonEdges, ...planetaryFast].sort((a, b) => b.weight - a.weight);
    if (combined.length === 0) {
      combined = [findSolunarBaselineEdge(natal, dayDate, dayRef)];
    }
    return { moonEdges, planetaryFast, combined, backgroundEdges };
  };

  // Compute previous 2 days sequentially to detect repeating planets/aspects & apply decay
  const prev2Date = new Date(targetDateObj.getFullYear(), targetDateObj.getMonth(), targetDateObj.getDate() - 2, 12, 0, 0, 0);
  const prev1Date = new Date(targetDateObj.getFullYear(), targetDateObj.getMonth(), targetDateObj.getDate() - 1, 12, 0, 0, 0);

  const prev2Raw = buildDayCandidates(prev2Date, prev2Date);
  const prev2Top = prev2Raw.combined[0] || null;
  const prev1Raw = buildDayCandidates(prev1Date, prev1Date);

  const prev1Edges = prev1Raw.combined.map(edge => {
    let w = edge.weight;
    if (prev2Top && edge.transit !== 'Moon') {
      if (edge.transit === prev2Top.transit) w *= 0.65;
    } else if (prev2Top && edge.transit === 'Moon' && edge.aspectKey === prev2Top.aspectKey && edge.natal === prev2Top.natal) {
      w *= 0.65;
    }
    return { ...edge, weight: Number(w.toFixed(4)) };
  }).sort((a, b) => b.weight - a.weight);
  const yesterdayFocus = prev1Edges[0] || null;

  const todayRaw = buildDayCandidates(targetDateObj, refMoment);
  const decayedFast = todayRaw.combined
    .map(edge => {
      let w = edge.weight;
      if (edge.transit !== 'Moon') {
        const wasActiveYesterday = prev1Raw.planetaryFast.some(
          pe => pe.transit === edge.transit && pe.natal === edge.natal && pe.aspectKey === edge.aspectKey
        );
        if (yesterdayFocus && edge.transit === yesterdayFocus.transit) {
          w *= 0.65;
        } else if (wasActiveYesterday) {
          w *= 0.75;
        }
        if (edge.dynamicKey === 'separating' && yesterdayFocus && edge.transit === yesterdayFocus.transit) {
          w *= 0.75;
        }
      } else if (yesterdayFocus && yesterdayFocus.transit === 'Moon') {
        if (edge.aspectKey === yesterdayFocus.aspectKey && edge.natal === yesterdayFocus.natal) {
          w *= 0.62;
        } else if (edge.aspectKey === yesterdayFocus.aspectKey) {
          w *= 0.78;
        }
      }
      // If both prev1 and prev2 had the exact same aspectKey, apply gentle rotation pressure
      if (prev2Top && yesterdayFocus && edge.aspectKey === yesterdayFocus.aspectKey && edge.aspectKey === prev2Top.aspectKey) {
        w *= 0.70;
      }
      return { ...edge, weight: Number(w.toFixed(4)) };
    })
    .filter(edge => edge.transit === 'Moon' || edge.weight >= 0.42)
    .sort((a, b) => b.weight - a.weight);

  // Guarantee non-empty daily focus via solunar baseline if filtering emptied planetary candidates
  const finalFast = decayedFast.length > 0 ? decayedFast : [findSolunarBaselineEdge(natal, targetDateObj, refMoment)];

  return {
    fastEdges: finalFast,
    backgroundEdges: todayRaw.backgroundEdges,
    prev2Raw,
    prev1Edges,
    prev1Raw,
    natalMoonSign
  };
}

export function buildAspectGraph(birthDateObj, targetDateObj) {
  const { fastEdges, backgroundEdges } = buildLayeredAspectGraph(birthDateObj, targetDateObj, targetDateObj);
  return [...fastEdges, ...backgroundEdges].sort((a, b) => b.weight - a.weight);
}

export function determineOperationalRole(phaseKey, topFastEdge, extraCtx = null) {
  if (extraCtx && extraCtx.moonSign) {
    return scoreDailyRoles({
      phaseKey,
      moonSign: extraCtx.moonSign,
      natalMoonSign: extraCtx.natalMoonSign || null,
      fastEdges: extraCtx.fastEdges || (topFastEdge ? [topFastEdge] : []),
      backgroundEdges: extraCtx.backgroundEdges || [],
      recentRoles: extraCtx.recentRoles || []
    }).roleKey;
  }
  if (phaseKey === 'phase_minimum' && (!topFastEdge || topFastEdge.weight < 1.15)) {
    return 'role_autonomous';
  }
  if (topFastEdge) {
    switch (topFastEdge.actorKey) {
      case 'actor_mercury': return 'role_agile';
      case 'actor_mars': return 'role_drive';
      case 'actor_venus': return 'role_diplomat';
      case 'actor_moon':
        if (phaseKey === 'phase_peak') return 'role_drive';
        if (phaseKey === 'phase_rise') return 'role_agile';
        if (phaseKey === 'phase_decline') return 'role_diplomat';
        return 'role_autonomous';
    }
  }
  switch (phaseKey) {
    case 'phase_peak': return 'role_drive';
    case 'phase_rise': return 'role_agile';
    case 'phase_decline': return 'role_diplomat';
    default: return 'role_autonomous';
  }
}

export function getTimeSlot(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'day';
  return 'evening';
}

export function computePersonalState(
  birthDateStr,
  targetDate = new Date(),
  momentForPhase = targetDate,
  birthTimeStr = null
) {
  const birthObj = parseBirthDateString(birthDateStr, birthTimeStr);
  if (!birthObj) return null;

  const birthMoonAge = getMoonPhaseInfo(birthObj).moonAge;
  const currentPhaseInfo = getMoonPhaseInfo(momentForPhase);
  const currentMoonAge = currentPhaseInfo.moonAge;
  const personalPhase = ((currentMoonAge - birthMoonAge) % SYNODIC_MONTH + SYNODIC_MONTH) % SYNODIC_MONTH;

  const profileKey = getBirthProfileKey(birthMoonAge);
  const phaseKey = getPersonalPhaseKey(personalPhase);
  const phaseStage = getPhaseStage(personalPhase, phaseKey);
  const ageClassKey = getAgeClassKey(birthObj, targetDate);

  const middayTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 12, 0, 0, 0);
  const graph = buildLayeredAspectGraph(birthObj, middayTarget, momentForPhase);
  const { fastEdges, backgroundEdges, prev2Raw, prev1Edges, prev1Raw, natalMoonSign } = graph;
  const dailyFocusEdge = fastEdges[0] || null;
  const backgroundEdge = backgroundEdges[0] || null;
  const isBackgroundExactPeak = Boolean(backgroundEdge && backgroundEdge.diff <= 0.25);

  // Sequential role resolution for prev2 -> prev1 -> today to prevent multi-day role stagnation
  const getPhaseAtDayOffset = (offsetDays) => {
    const dt = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + offsetDays, 12, 0, 0, 0);
    const info = getMoonPhaseInfo(dt);
    const pp = ((info.moonAge - birthMoonAge) % SYNODIC_MONTH + SYNODIC_MONTH) % SYNODIC_MONTH;
    return { phaseKey: getPersonalPhaseKey(pp), moonSign: info.zodiacSign };
  };

  const p2Info = getPhaseAtDayOffset(-2);
  const rolePrev2 = scoreDailyRoles({
    phaseKey: p2Info.phaseKey,
    moonSign: p2Info.moonSign,
    natalMoonSign,
    fastEdges: prev2Raw.combined,
    backgroundEdges: prev2Raw.backgroundEdges,
    recentRoles: []
  }).roleKey;

  const p1Info = getPhaseAtDayOffset(-1);
  const rolePrev1 = scoreDailyRoles({
    phaseKey: p1Info.phaseKey,
    moonSign: p1Info.moonSign,
    natalMoonSign,
    fastEdges: prev1Edges,
    backgroundEdges: prev1Raw.backgroundEdges,
    recentRoles: [rolePrev2]
  }).roleKey;

  const { roleKey, scores: roleScores } = scoreDailyRoles({
    phaseKey,
    moonSign: currentPhaseInfo.zodiacSign,
    natalMoonSign,
    fastEdges,
    backgroundEdges,
    recentRoles: [rolePrev1, rolePrev2]
  });

  const activeLunarDay = getLunarDayAt(momentForPhase).day;
  const forecastTone = resolveForecastPhaseTone({
    phaseKey,
    phaseStageKey: phaseStage.key,
    dailyFocusEdge,
    backgroundEdge,
    isBackgroundExactPeak,
    activeLunarDay
  });
  const headerColor = forecastTone.hero;
  const timelineColor = forecastTone.bar;
  const toneKey = forecastTone.key;

  const timeSlot = getTimeSlot(momentForPhase);

  return {
    birthMoonAge,
    currentMoonAge,
    personalPhase,
    profileKey,
    phaseKey,
    phaseStage,
    ageClassKey,
    roleKey,
    roleScores,
    toneKey,
    headerColor,
    timelineColor,
    fastEdges,
    backgroundEdges,
    dailyFocusEdge,
    backgroundEdge,
    isBackgroundExactPeak,
    topEdges: fastEdges.slice(0, 2),
    transitMoonZodiac: currentPhaseInfo.zodiacSign,
    timeSlot
  };
}

export function computeRawDiagnosticData(
  birthDateStr = null,
  birthTimeStr = null,
  targetDate = new Date(),
  refMoment = targetDate
) {
  const summary = getCalendarDayLunarSummary(targetDate, refMoment);
  const transitLongitudesRaw = getPlanetLongitudes(refMoment, TRANSIT_PLANETS);
  const transitPlanets = {};
  for (const name of TRANSIT_PLANETS) {
    const lon = norm360(transitLongitudesRaw[name]);
    transitPlanets[name] = {
      longitude: Number(lon.toFixed(4)),
      sign: getZodiacSign(lon)
    };
  }

  const birthObj = birthDateStr ? parseBirthDateString(birthDateStr, birthTimeStr) : null;
  let natalPlanets = null;
  let allFoundAspects = [];
  let personalSummary = null;

  if (birthObj) {
    const natalRaw = getPlanetLongitudes(birthObj, NATAL_TARGETS);
    natalPlanets = {};
    for (const name of NATAL_TARGETS) {
      const lon = norm360(natalRaw[name]);
      natalPlanets[name] = {
        longitude: Number(lon.toFixed(4)),
        sign: getZodiacSign(lon)
      };
    }

    const laterMoment = new Date(refMoment.getTime() + 2 * 3600000);
    const transitLaterRaw = getPlanetLongitudes(laterMoment, TRANSIT_PLANETS);
    for (const tPlanet of TRANSIT_PLANETS) {
      const isFast = FAST_PLANETS.includes(tPlanet);
      const orb = PLANET_ORB[tPlanet] || 1.5;
      const kGroup = PLANET_GROUP_WEIGHT[tPlanet] || 1.0;
      const speed = isFast && tPlanet !== 'Moon' ? getDailyPlanetSpeed(tPlanet, refMoment) : 1.0;
      const loopMultiplier = isFast && tPlanet !== 'Moon' && speed < 0.75 ? 0.45 : 1.0;

      for (const nPlanet of NATAL_TARGETS) {
        for (const asp of ASPECTS) {
          const diff = getAngleDiffForPair(transitLongitudesRaw[tPlanet], natalRaw[nPlanet], asp.angle);
          if (diff <= orb) {
            const diffLater = getAngleDiffForPair(transitLaterRaw[tPlanet], natalRaw[nPlanet], asp.angle);
            const isApplying = diffLater < diff;
            const dynamicKey = diff <= 0.28 ? 'exact' : isApplying ? 'applying' : 'separating';
            const kTarget = nPlanet === 'Sun' || nPlanet === 'Moon' ? 1.2 : 1.0;
            const weight = kGroup * (1 - diff / orb) * kTarget * loopMultiplier;
            allFoundAspects.push({
              transit: tPlanet,
              natal: nPlanet,
              aspectKey: asp.key,
              angle: asp.angle,
              orbLimit: orb,
              diff: Number(diff.toFixed(4)),
              weight: Number(weight.toFixed(4)),
              actorKey: PLANET_TO_ACTOR[tPlanet],
              layer: isFast ? 'fast' : 'background',
              dynamicKey,
              isApplying
            });
          }
        }
      }
    }
    allFoundAspects.sort((a, b) => b.weight - a.weight);

    const personal = computePersonalState(birthDateStr, targetDate, refMoment, birthTimeStr);
    if (personal) {
      personalSummary = {
        birthMoonAge: Number(personal.birthMoonAge.toFixed(4)),
        personalPhase: Number(personal.personalPhase.toFixed(4)),
        profileKey: personal.profileKey,
        phaseKey: personal.phaseKey,
        phaseStage: personal.phaseStage,
        ageClassKey: personal.ageClassKey,
        roleKey: personal.roleKey,
        roleScores: personal.roleScores,
        timeSlot: personal.timeSlot,
        dailyFocusEdge: personal.dailyFocusEdge,
        backgroundEdge: personal.backgroundEdge,
        prioritizedFastEdges: personal.fastEdges,
        prioritizedBackgroundEdges: personal.backgroundEdges
      };
    }
  }

  const observer = getObserverCoords();
  return {
    selectedDate: `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`,
    referenceTime: formatHM(refMoment),
    observer: {
      source: observer.source,
      timeZone: observer.timeZone,
      latitude: Number(observer.latDeg.toFixed(4)),
      longitude: Number(observer.lonDeg.toFixed(4))
    },
    input: {
      birthDate: birthDateStr || null,
      birthTime: birthDateStr ? (birthTimeStr || '12:00 (default)') : null
    },
    lunar: {
      moonAge: Number(summary.phaseInfo.moonAge.toFixed(4)),
      illuminationPct: summary.phaseInfo.illuminationExact,
      detailedTrend: summary.phaseInfo.detailedTrend,
      moonLongitude: Number(summary.phaseInfo.moonLon.toFixed(4)),
      sunLongitude: Number(summary.phaseInfo.sunLon.toFixed(4)),
      moonZodiacSign: summary.phaseInfo.zodiacSign,
      signIngress: summary.signIngress,
      windows: summary.windows,
      activeLunarDay: summary.activeLunarDay,
      firstDay: summary.firstDay,
      firstDayStartTime: summary.firstDayStartTimeStr,
      secondDay: summary.secondDay,
      secondDayStartTime: summary.secondDayStartTimeStr
    },
    natalPlanets,
    transitPlanets,
    allAspectsWithinOrb: allFoundAspects,
    personal: personalSummary
  };
}
