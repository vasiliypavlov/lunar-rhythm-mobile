#!/usr/bin/env node
/**
 * Подготовка Android-проекта после `npx cap add android`.
 * =========================================================================
 *
 * Выполняет то, что невозможно задать через capacitor.config.json:
 *
 *   1. Добавляет в AndroidManifest.xml необходимые разрешения:
 *        - SCHEDULE_EXACT_ALARM  — точные alarm'ы для чекпоинтов и будильников;
 *        - USE_EXACT_ALARM       — автовыдача на Android 13+ для приложений-будильников;
 *        - POST_NOTIFICATIONS    — показ уведомлений в шторке (Android 13+);
 *        - RECEIVE_BOOT_COMPLETED — восстановление будильников после перезагрузки;
 *        - VIBRATE / WAKE_LOCK    — вибрация и работа в Doze.
 *
 *   2. Кладёт иконку уведомления (ic_stat_lunar) в res/drawable.
 *   3. Перезаписывает иконку приложения (adaptive icon + легаси-PNG).
 *
 * Скрипт идемпотентен: повторный запуск ничего не ломает.
 *
 * Запуск:  node scripts/prepare-android.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const ANDROID_DIR = path.join(ROOT, 'android');
const MANIFEST_PATH = path.join(
  ANDROID_DIR,
  'app/src/main/AndroidManifest.xml'
);

const REQUIRED_PERMISSIONS = [
  'android.permission.SCHEDULE_EXACT_ALARM',
  'android.permission.USE_EXACT_ALARM',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.VIBRATE',
  'android.permission.WAKE_LOCK'
];

const WWW_ICONS = path.join(ROOT, 'www/icons');
const NOTIFICATION_ICON = 'ic_stat_lunar';

/**
 * Адаптивная иконка приложения: векторная «полулуна» + тёмный фон.
 * Формируется как обычный Android VectorDrawable — внешние зависимости не нужны.
 * Полулуна центрирована в безопасной зоне 108dp (внутренние 72dp).
 */
const ADAPTIVE_FOREGROUND_XML = `<?xml version="1.0" encoding="utf-8"?>
<!-- Полулуна: внешняя дуга + внутренняя дуга, образующие серп -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#EAB32E"
        android:pathData="M69,24 A30,30 0 1,0 69,84 A38,38 0 0,1 69,24 Z" />
    <path
        android:fillColor="#F6C860"
        android:pathData="M69,33 A21,21 0 1,0 69,75 A27,27 0 0,1 69,33 Z" />
</vector>
`;

const ADAPTIVE_ICON_XML = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`;

const BACKGROUND_COLOR_XML = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0F1115</color>
</resources>
`;

function log(message) {
  process.stdout.write(`[prepare-android] ${message}\n`);
}

function fail(message) {
  process.stderr.write(`[prepare-android] ERROR: ${message}\n`);
  process.exitCode = 1;
}

/**
 * Добавляет недостающие uses-permission в AndroidManifest.xml.
 */
function patchManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    fail(
      `AndroidManifest.xml не найден: ${MANIFEST_PATH}\n` +
        '               Сначала выполните: npx cap add android'
    );
    return;
  }

  let manifest = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const added = [];

  for (const permission of REQUIRED_PERMISSIONS) {
    if (manifest.includes(`android:name="${permission}"`)) continue;
    const tag = `    <uses-permission android:name="${permission}" />`;
    if (manifest.includes('</manifest>')) {
      manifest = manifest.replace('</manifest>', `${tag}\n</manifest>`);
      added.push(permission);
    }
  }

  fs.writeFileSync(MANIFEST_PATH, manifest, 'utf8');
  log(
    added.length
      ? `Добавлены разрешения: ${added.join(', ')}`
      : 'Все необходимые разрешения уже присутствуют.'
  );
}

/**
 * Копирует иконку уведомления в res/drawable и заменяет иконку приложения.
 */
function patchIcons() {
  const resDir = path.join(ANDROID_DIR, 'app/src/main/res');
  if (!fs.existsSync(resDir)) {
    fail(`Каталог ресурсов не найден: ${resDir}`);
    return;
  }

  // 1) Иконка уведомления (smallIcon в LocalNotifications).
  const drawableDir = path.join(resDir, 'drawable');
  fs.mkdirSync(drawableDir, { recursive: true });

  const notificationSource = path.join(WWW_ICONS, 'icon48.png');
  if (fs.existsSync(notificationSource)) {
    fs.copyFileSync(
      notificationSource,
      path.join(drawableDir, `${NOTIFICATION_ICON}.png`)
    );
    log(`Иконка уведомления: res/drawable/${NOTIFICATION_ICON}.png`);
  } else {
    log('Предупреждение: www/icons/icon48.png не найден — иконка уведомления пропущена.');
  }

  // 2) Легаси-иконки (используются на Android < 26).
  const legacy = [
    { dir: 'mipmap-mdpi', file: 'icon48.png' },
    { dir: 'mipmap-hdpi', file: 'icon128.png' },
    { dir: 'mipmap-xhdpi', file: 'icon128.png' },
    { dir: 'mipmap-xxhdpi', file: 'icon128.png' },
    { dir: 'mipmap-xxxhdpi', file: 'icon128.png' }
  ];

  for (const { dir, file } of legacy) {
    const targetDir = path.join(resDir, dir);
    const source = path.join(WWW_ICONS, file);
    if (!fs.existsSync(targetDir) || !fs.existsSync(source)) continue;
    fs.mkdirSync(targetDir, { recursive: true });
    for (const name of ['ic_launcher.png', 'ic_launcher_round.png']) {
      fs.copyFileSync(source, path.join(targetDir, name));
    }
  }
  log('Легаси-иконки приложения обновлены.');

  // 3) Adaptive icon (Android 8+): собственный вектор + тёмный фон.
  const drawableDirIcon = path.join(resDir, 'drawable');
  fs.mkdirSync(drawableDirIcon, { recursive: true });
  fs.writeFileSync(
    path.join(drawableDirIcon, 'ic_launcher_foreground.xml'),
    ADAPTIVE_FOREGROUND_XML,
    'utf8'
  );

  // Шаблон Capacitor содержит запасной вектор в drawable-v24 с тем же именем
  // ресурса — он больше не используется, поэтому удаляется, чтобы не было
  // двух разных foreground для одного и того же адаптивного значка.
  const staleForeground = path.join(resDir, 'drawable-v24/ic_launcher_foreground.xml');
  if (fs.existsSync(staleForeground)) {
    fs.rmSync(staleForeground);
    log('Удалён устаревший drawable-v24/ic_launcher_foreground.xml.');
  }

  const anydpiDir = path.join(resDir, 'mipmap-anydpi-v26');
  fs.mkdirSync(anydpiDir, { recursive: true });
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), ADAPTIVE_ICON_XML, 'utf8');
  fs.writeFileSync(
    path.join(anydpiDir, 'ic_launcher_round.xml'),
    ADAPTIVE_ICON_XML,
    'utf8'
  );

  const valuesDir = path.join(resDir, 'values');
  fs.mkdirSync(valuesDir, { recursive: true });
  fs.writeFileSync(
    path.join(valuesDir, 'ic_launcher_background.xml'),
    BACKGROUND_COLOR_XML,
    'utf8'
  );
  log('Adaptive icon: векторная полулуна + фон #0F1115.');
}

/**
 * Проверяет, что название приложения в strings.xml соответствует capacitor.config.json.
 */
function patchAppName() {
  const stringsPath = path.join(
    ANDROID_DIR,
    'app/src/main/res/values/strings.xml'
  );
  if (!fs.existsSync(stringsPath)) return;

  let strings = fs.readFileSync(stringsPath, 'utf8');
  let changed = false;

  if (/<string name="app_name">My App<\/string>/.test(strings)) {
    strings = strings.replace(
      '<string name="app_name">My App</string>',
      '<string name="app_name">Ритм Дня</string>'
    );
    changed = true;
  }
  if (/<string name="title_activity_main">My App<\/string>/.test(strings)) {
    strings = strings.replace(
      '<string name="title_activity_main">My App</string>',
      '<string name="title_activity_main">Ритм Дня</string>'
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(stringsPath, strings, 'utf8');
    log('Название приложения в strings.xml обновлено.');
  }
}

patchManifest();
patchIcons();
patchAppName();
log('Готово.');
