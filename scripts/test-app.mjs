/**
 * Интеграционный тест мобильного приложения.
 *
 * Поднимает статический сервер над ./www, подменяет нативный мост Capacitor
 * моками и проверяет в headless-браузере:
 *   - инициализацию приложения и отсутствие ошибок в консоли;
 *   - процедурную отрисовку Луны;
 *   - расписание уведомлений (чекпоинты + лунные будильники);
 *   - озвучку через нативный TTS-плагин;
 *   - индикатор 🔔 для сработавшего лунного будильника;
 *   - адаптивную вёрстку (отсутствие фиксированных 400x600).
 *
 * Запуск: node scripts/test-app.mjs
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '/usr/local/lib/node_modules/playwright/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WWW = path.resolve(__dirname, '../www');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png'
};

const CHROME =
  process.env.CHROME_PATH ||
  '/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome';

const results = [];
let failures = 0;

function check(name, condition, detail = '') {
  const ok = Boolean(condition);
  if (!ok) failures++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  return ok;
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      const rel = urlPath === '/' ? '/index.html' : urlPath;
      const filePath = path.join(WWW, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
      if (!filePath.startsWith(WWW) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

/**
 * Мок нативного моста Capacitor.
 *
 * Состояние мока (в т.ч. «хранилище» Preferences) живёт в sessionStorage,
 * чтобы переживать перезагрузку страницы — это нужно для проверки
 * сработавшего лунного будильника.
 */
const BRIDGE_MOCK = () => {
  const STATE_KEY = '__lunar_mock_state';

  const loadState = () => {
    try {
      return JSON.parse(window.sessionStorage.getItem(STATE_KEY) || '{}');
    } catch {
      return {};
    }
  };

  const m = Object.assign(
    {
      store: {},
      scheduled: [],
      cancelled: [],
      channels: [],
      spoken: [],
      spokenStopped: 0,
      listeners: {},
      permissionRequests: 0
    },
    loadState()
  );
  m.listeners = {};

  const persist = () => {
    try {
      window.sessionStorage.setItem(STATE_KEY, JSON.stringify(m));
    } catch {
      /* ignore */
    }
  };

  window.__mock = m;

  window.Capacitor = {
    DEBUG: false,
    isLoggingEnabled: false,
    isNativePlatform: () => true,
    getPlatform: () => 'android',
    isPluginAvailable: (name) => Boolean(window.Capacitor.Plugins[name]),
    Plugins: {
      Preferences: {
        get: async ({ key }) => ({
          value: Object.prototype.hasOwnProperty.call(m.store, key) ? m.store[key] : null
        }),
        set: async ({ key, value }) => {
          m.store[key] = value;
          persist();
        },
        remove: async ({ key }) => {
          delete m.store[key];
          persist();
        }
      },
      LocalNotifications: {
        requestPermissions: async () => {
          m.permissionRequests++;
          persist();
          return { display: 'granted' };
        },
        createChannel: async (channel) => {
          m.channels.push(channel);
          persist();
        },
        schedule: async ({ notifications }) => {
          m.scheduled.push(...notifications);
          persist();
          return { notifications: notifications.map((n) => ({ id: n.id })) };
        },
        cancel: async ({ notifications }) => {
          m.cancelled.push(...notifications);
          persist();
        },
        getPending: async () => ({ notifications: [] }),
        addListener: (event, cb) => {
          m.listeners[event] = cb;
          return { remove() {} };
        }
      },
      TextToSpeech: {
        speak: async (opts) => {
          m.spoken.push(opts);
          persist();
        },
        stop: async () => {
          m.spokenStopped++;
          persist();
        },
        isLanguageSupported: async ({ lang }) => ({ supported: true, lang }),
        getSupportedVoices: async () => ({
          voices: [
            { voiceURI: 'native:ru-RU', name: 'Русский', lang: 'ru-RU', default: true, localService: true },
            { voiceURI: 'native:en-US', name: 'English', lang: 'en-US', default: false, localService: true }
          ]
        }),
        getSupportedLanguages: async () => ({ languages: ['ru-RU', 'en-US'] })
      },
      App: {
        addListener: (event, cb) => {
          m.listeners[event] = cb;
          return { remove() {} };
        }
      }
    }
  };
};

async function run() {
  const server = await startServer();
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}/index.html`;

  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    viewport: { width: 393, height: 851 }, // типичный смартфон (Pixel 7)
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    locale: 'ru-RU' // русский интерфейс: активный словарь ru-RU
  });
  await context.addInitScript(BRIDGE_MOCK);

  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  // --- 1. Инициализация ---
  check('Приложение инициализировано без JS-ошибок', pageErrors.length === 0, pageErrors.join(' | '));
  check('Нет ошибок в консоли', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

  const heroDay = await page.textContent('#hero-day');
  check('Шапка отображает лунный возраст', /^\d+\.\d$/.test((heroDay || '').trim()), `hero-day="${heroDay}"`);

  const illum = await page.textContent('#hero-illumination');
  check('Освещённость Луны рассчитана', /^\d+\.\d\s?%$/.test((illum || '').trim()), `"${illum}"`);

  // --- 2. Процедурная отрисовка Луны ---
  const moonPixels = await page.evaluate(() => {
    const canvas = document.getElementById('moon-canvas');
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let lit = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 10) lit++;
    return { lit, total: canvas.width * canvas.height };
  });
  check(
    'Процедурная отрисовка Луны заполняет пиксели',
    moonPixels.lit > moonPixels.total * 0.05,
    `lit=${moonPixels.lit}/${moonPixels.total}`
  );

  // --- 3. Уведомления ---
  const mock = await page.evaluate(() => window.__mock);
  check('Разрешение на уведомления запрошено при старте', mock.permissionRequests >= 1, `запросов: ${mock.permissionRequests}`);
  check('Созданы каналы уведомлений', mock.channels.length >= 2, `каналов: ${mock.channels.length}`);
  check(
    'Канал лунного будильника имеет системный звук',
    mock.channels.some((c) => c.id === 'lunar_alarm' && c.sound === 'default' && c.importance === 5),
    JSON.stringify(mock.channels.map((c) => ({ id: c.id, sound: c.sound, importance: c.importance })))
  );

  const checkpoints = mock.scheduled.filter((n) => n.extra?.kind === 'checkpoint');
  const alarms = mock.scheduled.filter((n) => n.extra?.kind === 'reminder');
  check('Запланированы ежедневные чекпоинты (3 слота × 30 дней)', checkpoints.length === 90, `чекпоинтов: ${checkpoints.length}`);
  check(
    'Чекпоинты разнесены по трём временным слотам',
    new Set(checkpoints.map((n) => n.extra.slot)).size === 3,
    [...new Set(checkpoints.map((n) => n.extra.slot))].join(',')
  );
  check(
    'Время чекпоинтов точное (без дрейфа)',
    checkpoints.every((n) => n.schedule.at.getMinutes() === 30 && n.schedule.at.getSeconds() === 0),
    'проверка минут/секунд'
  );
  check(
    'Уникальные id уведомлений',
    new Set(mock.scheduled.map((n) => n.id)).size === mock.scheduled.length,
    `всего: ${mock.scheduled.length}`
  );
  check('Идентификаторы уведомлений в диапазоне int32', mock.scheduled.every((n) => Math.abs(n.id) <= 2147483647));

  // --- 4. Напоминание → будильник в расписании ---
  await page.click('.nav-tab[data-tab="reminders"]');
  await page.click('#btn-toggle-reminder-form');
  await page.selectOption('#input-lunar-day', '15');
  await page.check('#input-repeat-monthly');
  await page.fill('#input-reminder-text', 'Проверка лунного будильника');
  await page.click('#btn-save-reminder');

  await page.waitForTimeout(600);
  const mock2 = await page.evaluate(() => window.__mock);
  const alarms2 = mock2.scheduled.filter((n) => n.extra?.kind === 'reminder');
  check('Лунный будильник попал в расписание уведомлений', alarms2.length >= 1, `будильников: ${alarms2.length}`);
  check(
    'Ежемесячный будильник запланирован на несколько срабатываний',
    alarms2.length === 3,
    `срабатываний: ${alarms2.length}`
  );
  check(
    'Текст напоминания перенесён в уведомление',
    alarms2.length > 0 && alarms2[0].body.includes('Проверка лунного будильника'),
    alarms2[0] ? alarms2[0].body : '—'
  );
  check(
    'Будильник использует отдельный канал',
    alarms2.length > 0 && alarms2[0].channelId === 'lunar_alarm',
    alarms2[0] ? alarms2[0].channelId : '—'
  );

  // --- 5. Сохранение состояния через Preferences ---
  const persisted = await page.evaluate(() => {
    const raw = window.__mock.store['lunar_rhythm_state_v1'];
    return raw ? JSON.parse(raw) : null;
  });
  check('Состояние сохранено через @capacitor/preferences', Boolean(persisted), 'lunar_rhythm_state_v1');
  check('Напоминание сохранено в состоянии', persisted?.reminders?.length === 1, `напоминаний: ${persisted?.reminders?.length}`);
  check(
    'Идентификаторы запланированных уведомлений сохранены',
    Array.isArray(persisted?.scheduledNotificationIds) && persisted.scheduledNotificationIds.length > 0,
    `id: ${persisted?.scheduledNotificationIds?.length}`
  );

  // --- 6. Озвучка через нативный TTS ---
  await page.click('.nav-tab[data-tab="today"]');
  await page.click('#btn-speak-briefing');
  await page.waitForTimeout(900);
  const mock3 = await page.evaluate(() => window.__mock);
  check('Озвучка сводки ушла в нативный TTS-плагин', mock3.spoken.length >= 1, `вызовов: ${mock3.spoken.length}`);
  check(
    'Язык озвучки подставлен из meta.lang словаря',
    mock3.spoken[0]?.lang === 'ru-RU',
    `lang=${mock3.spoken[0]?.lang}`
  );
  check('Скорость речи равна 1.0', mock3.spoken[0]?.rate === 1.0, `rate=${mock3.spoken[0]?.rate}`);
  check(
    'Текст озвучки непустой',
    typeof mock3.spoken[0]?.text === 'string' && mock3.spoken[0].text.length > 10,
    `длина: ${mock3.spoken[0]?.text?.length}`
  );

  // --- 7. Нажатие на уведомление в шторке ---
  await page.evaluate(() => {
    window.__mock.listeners['localNotificationActionPerformed']({
      actionId: '',
      notification: {
        id: 200000,
        title: 'Ритм Дня · 15 лунные сутки',
        body: 'Проверка лунного будильника',
        extra: { kind: 'reminder', reminderId: 'rem_x', text: 'Проверка лунного будильника', lunarDay: 15 }
      }
    });
  });
  await page.waitForTimeout(900);
  const mock4 = await page.evaluate(() => window.__mock);
  check(
    'Нажатие на уведомление запускает озвучку',
    mock4.spoken.length >= 2,
    `вызовов озвучки: ${mock4.spoken.length}`
  );
  check(
    'Озвучивается текст напоминания',
    mock4.spoken.some((s) => (s.text || '').includes('Проверка лунного будильника')),
    mock4.spoken[mock4.spoken.length - 1]?.text?.slice(0, 60) || '—'
  );

  // --- 8. Адаптивная вёрстка ---
  const layout = await page.evaluate(() => {
    const shell = document.getElementById('app');
    const nav = document.querySelector('.bottom-nav');
    const hero = document.querySelector('.hero-card');
    const tab = document.querySelector('.nav-tab');
    const shellRect = shell.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    return {
      innerWidth: window.innerWidth,
      docWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      shellWidth: shellRect.width,
      shellLeft: shellRect.left,
      navHeight: navRect.height,
      navBottom: Math.round(window.innerHeight - navRect.bottom),
      heroTop: hero.getBoundingClientRect().top,
      tabHeight: tab.getBoundingClientRect().height,
      mainOverflow: getComputedStyle(document.querySelector('.main-content')).overflowY
    };
  });
  check('Ширина документа равна ширине экрана', layout.docWidth <= layout.innerWidth, `doc=${layout.docWidth} vp=${layout.innerWidth}`);
  check('Оболочка приложения не фиксирована на 400px', layout.shellWidth > 380 && layout.shellWidth <= 540, `width=${layout.shellWidth}`);
  check('Оболочка приложения центрирована', Math.abs(layout.shellLeft) < 1, `left=${layout.shellLeft}`);
  check('Нижняя навигация закреплена у нижнего края', layout.navBottom <= 1, `отступ=${layout.navBottom}`);
  check('Высота вкладки навигации не меньше 44px', layout.tabHeight >= 44, `height=${layout.tabHeight}`);
  check('Основная область прокручивается внутри', layout.mainOverflow === 'auto', `overflow-y=${layout.mainOverflow}`);
  check('Шапка начинается у верхнего края', layout.heroTop <= 1, `top=${layout.heroTop}`);

  // --- 9. Touch targets не меньше 44px ---
  const smallTargets = await page.evaluate(() => {
    const selectors = [
      '.nav-tab', '.seg-btn', '.btn-primary-compact', '.btn-secondary-compact',
      '.btn-ghost-compact', '.hero-tts-btn', '.hero-prompt-btn', '.text-input', '.select-input'
    ];
    const bad = [];
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.height < 44 || r.width < 44) {
          bad.push(`${sel} ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      }
    }
    return bad;
  });
  check('Все интерактивные элементы ≥ 44px', smallTargets.length === 0, smallTargets.slice(0, 5).join(', '));

  // --- 10. Индикатор 🔔 для сработавшего будильника ---
  const page2 = await context.newPage();
  await page2.goto(base, { waitUntil: 'networkidle' });
  // Заранее кладём в хранилище напоминание, которое уже должно было сработать.
  await page2.evaluate(async () => {
    await window.Capacitor.Plugins.Preferences.set({
      key: 'lunar_rhythm_state_v1',
      value: JSON.stringify({
        reminders: [
          {
            id: 'rem_fired',
            mode: 'lunar',
            lunarDay: 15,
            dateISO: '2026-11-20',
            text: 'Сработавший будильник',
            repeatMonthly: false,
            enabled: true,
            nextTriggerAt: Date.now() - 60_000
          }
        ]
      })
    });
  });
  await page2.reload({ waitUntil: 'networkidle' });
  await page2.waitForTimeout(1500);

  const bellVisible = await page2.evaluate(() => {
    const btn = document.getElementById('btn-active-alarm');
    return !btn.classList.contains('hidden');
  });
  check('Индикатор 🔔 активен для сработавшего лунного будильника', bellVisible);

  const bellState = await page2.evaluate(() => {
    const raw = window.__mock.store['lunar_rhythm_state_v1'];
    return raw ? JSON.parse(raw) : null;
  });
  check(
    'Состояние будильника сохранено после срабатывания',
    Boolean(bellState?.activeAlarm?.id === 'rem_fired'),
    JSON.stringify(bellState?.activeAlarm || null)
  );
  check(
    'Сработавшее одноразовое напоминание отключено',
    bellState?.reminders?.[0]?.enabled === false,
    `enabled=${bellState?.reminders?.[0]?.enabled}`
  );

  await page2.screenshot({ path: '/tmp/app-mobile.png', fullPage: false });
  await page.screenshot({ path: '/tmp/app-mobile-today.png', fullPage: false });

  await browser.close();
  server.close();

  console.log('\n=== Результаты теста lunar-rhythm-mobile ===\n');
  for (const line of results) console.log(line);
  console.log(`\nИтого: ${results.length - failures}/${results.length} проверок пройдено.`);
  if (failures) {
    console.error(`\nПРОВАЛЕНО: ${failures}`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
