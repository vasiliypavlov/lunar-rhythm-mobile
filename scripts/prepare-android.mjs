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
 *   3. Копирует набор иконок под все плотности (mdpi..xxxhdpi) для legacy и Android 8+ adaptive.
 *   4. Синхронизирует versionName и versionCode в android/app/build.gradle из manifest/package.json.
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
  { name: 'android.permission.SCHEDULE_EXACT_ALARM' },
  { name: 'android.permission.USE_EXACT_ALARM' },
  { name: 'android.permission.POST_NOTIFICATIONS' },
  { name: 'android.permission.RECEIVE_BOOT_COMPLETED' },
  { name: 'android.permission.VIBRATE' },
  { name: 'android.permission.WAKE_LOCK' },
  { name: 'android.permission.READ_EXTERNAL_STORAGE', maxSdkVersion: 32 },
  { name: 'android.permission.WRITE_EXTERNAL_STORAGE', maxSdkVersion: 32 }
];

const WWW_ICONS = path.join(ROOT, 'www/icons');
const ANDROID_DENSITY_ICONS = path.join(WWW_ICONS, 'android');
const NOTIFICATION_ICON = 'ic_stat_lunar';

const ADAPTIVE_ICON_XML = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;

const BACKGROUND_COLOR_XML = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0A0E1C</color>
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
 * Определяет версию приложения из www/manifest.webmanifest или package.json.
 */
function resolveAppVersion() {
  const candidates = [
    path.join(ROOT, 'www/manifest.webmanifest'),
    path.join(ROOT, 'package.json')
  ];
  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const ver = String(parsed?.version || '').trim();
      if (/^\d+\.\d+\.\d+/.test(ver)) {
        const [maj, min, pat] = ver.split('.').map((n) => parseInt(n, 10) || 0);
        return {
          versionName: ver,
          versionCode: Math.max(2, maj * 10000 + min * 100 + pat)
        };
      }
    } catch {
      // Ignore malformed candidate and try next
    }
  }
  return { versionName: '1.1.0', versionCode: 10100 };
}

/**
 * Обновляет versionCode и versionName в android/app/build.gradle.
 */
function patchAppVersion() {
  const gradlePath = path.join(ANDROID_DIR, 'app/build.gradle');
  if (!fs.existsSync(gradlePath)) {
    log('Предупреждение: android/app/build.gradle не найден — пропуск обновления версии.');
    return;
  }
  const { versionName, versionCode } = resolveAppVersion();
  let gradle = fs.readFileSync(gradlePath, 'utf8');
  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${versionName}"`);
  fs.writeFileSync(gradlePath, gradle, 'utf8');
  log(`Версия APK обновлена: versionName "${versionName}", versionCode ${versionCode}.`);
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
  for (const entry of REQUIRED_PERMISSIONS) {
    const permission = typeof entry === 'string' ? entry : entry.name;
    const maxSdk =
      typeof entry === 'object' && entry.maxSdkVersion
        ? ` android:maxSdkVersion="${entry.maxSdkVersion}"`
        : '';
    if (manifest.includes(`android:name="${permission}"`)) continue;
    const tag = `    <uses-permission android:name="${permission}"${maxSdk} />`;
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
 * Копирует иконку уведомления в res/drawable и обновляет иконки приложения под все плотности.
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

  // 2) Удаляем устаревшие XML-foreground от шаблона Capacitor / прежней версии,
  //    чтобы Android 8+ использовал растровый @mipmap/ic_launcher_foreground.
  for (const staleRel of [
    'drawable/ic_launcher_foreground.xml',
    'drawable-v24/ic_launcher_foreground.xml'
  ]) {
    const stalePath = path.join(resDir, staleRel);
    if (fs.existsSync(stalePath)) {
      fs.rmSync(stalePath);
      log(`Удалён устаревший ${staleRel}.`);
    }
  }

  // 3) Плотности mipmap-mdpi .. mipmap-xxxhdpi (legacy + adaptive foreground PNG).
  const densities = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
  if (fs.existsSync(ANDROID_DENSITY_ICONS)) {
    for (const dir of densities) {
      const srcDir = path.join(ANDROID_DENSITY_ICONS, dir);
      if (!fs.existsSync(srcDir)) continue;
      const dstDir = path.join(resDir, dir);
      fs.mkdirSync(dstDir, { recursive: true });
      for (const fileName of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) {
        const srcFile = path.join(srcDir, fileName);
        if (fs.existsSync(srcFile)) {
          fs.copyFileSync(srcFile, path.join(dstDir, fileName));
        }
      }
    }
    log('Иконки приложения (mdpi–xxxhdpi, включая adaptive foreground) скопированы из www/icons/android.');
  } else {
    const legacy = [
      { dir: 'mipmap-mdpi', file: 'icon48.png' },
      { dir: 'mipmap-hdpi', file: 'icon128.png' },
      { dir: 'mipmap-xhdpi', file: 'icon128.png' },
      { dir: 'mipmap-xxhdpi', file: 'icon192.png' },
      { dir: 'mipmap-xxxhdpi', file: 'icon192.png' }
    ];
    for (const { dir, file } of legacy) {
      const targetDir = path.join(resDir, dir);
      const source = path.join(WWW_ICONS, file);
      if (!fs.existsSync(source)) continue;
      fs.mkdirSync(targetDir, { recursive: true });
      for (const name of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) {
        fs.copyFileSync(source, path.join(targetDir, name));
      }
    }
    log('Иконки приложения (fallback из www/icons) обновлены.');
  }

  // 4) Adaptive icon (Android 8+): @mipmap/ic_launcher_foreground + фон #0A0E1C.
  const anydpiDir = path.join(resDir, 'mipmap-anydpi-v26');
  fs.mkdirSync(anydpiDir, { recursive: true });
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), ADAPTIVE_ICON_XML, 'utf8');
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), ADAPTIVE_ICON_XML, 'utf8');

  const valuesDir = path.join(resDir, 'values');
  fs.mkdirSync(valuesDir, { recursive: true });
  fs.writeFileSync(path.join(valuesDir, 'ic_launcher_background.xml'), BACKGROUND_COLOR_XML, 'utf8');
  log('Adaptive icon настроен: @mipmap/ic_launcher_foreground + фон #0A0E1C.');
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

/**
 * Понижает minSdkVersion в android/variables.gradle до 26 (Android 8.0),
 * сохраняя высокий targetSdkVersion / compileSdkVersion.
 */
function patchGradleSdk() {
  const varsPath = path.join(ANDROID_DIR, 'variables.gradle');
  if (!fs.existsSync(varsPath)) {
    log('Предупреждение: variables.gradle не найден — пропуск настройки minSdkVersion.');
    return;
  }
  let content = fs.readFileSync(varsPath, 'utf8');
  if (/minSdkVersion\s*=\s*\d+/.test(content)) {
    content = content.replace(/minSdkVersion\s*=\s*\d+/, 'minSdkVersion = 26');
    fs.writeFileSync(varsPath, content, 'utf8');
    log('minSdkVersion установлен в 26 (Android 8.0+).');
  }
}

patchManifest();
patchAppVersion();
patchIcons();
patchAppName();
patchGradleSdk();
log('Готово.');
