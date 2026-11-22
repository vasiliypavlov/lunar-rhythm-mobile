#!/usr/bin/env node
/**
 * Проверка синтаксиса всех ES-модулей в каталоге www/.
 *
 * Модули используют нативный `import` / `export`, поэтому проверяются как
 * модули: `node --check` для .js трактует файл как CommonJS и падает на
 * `import`, поэтому каждый файл копируется во временную папку с расширением
 * .mjs и проверяется в отдельном процессе.
 *
 * Дополнительно проверяется, что все относительные импорты разрешаются.
 *
 * Запуск: node scripts/check-js.mjs
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WWW = path.resolve(__dirname, '../www');

function collectJsFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectJsFiles(full));
    else if (entry.name.endsWith('.js')) files.push(full);
  }
  return files;
}

function checkImports(file, source) {
  const problems = [];
  const dir = path.dirname(file);
  const specifiers = [
    ...source.matchAll(/from\s+'(\.[^']+)'/g),
    ...source.matchAll(/import\s+'(\.[^']+)'/g)
  ];
  for (const match of specifiers) {
    const target = path.resolve(dir, match[1]);
    if (!fs.existsSync(target)) {
      problems.push(`неразрешённый импорт: ${match[1]}`);
    }
  }
  return problems;
}

const files = collectJsFiles(WWW).sort();
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lunar-check-'));
let failures = 0;

try {
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const relative = path.relative(path.resolve(__dirname, '..'), file);
    const tmpFile = path.join(tmpDir, `${relative.replace(/[\\/]/g, '_')}.mjs`);

    fs.writeFileSync(tmpFile, source, 'utf8');

    try {
      execFileSync(process.execPath, ['--check', tmpFile], { stdio: 'pipe' });
    } catch (error) {
      failures++;
      const detail = (error.stderr || Buffer.from('')).toString().trim().split('\n').slice(0, 4).join('\n      ');
      process.stdout.write(`FAIL  ${relative}\n      ${detail}\n`);
      continue;
    }

    const problems = checkImports(file, source);
    if (problems.length) {
      failures++;
      process.stdout.write(`FAIL  ${relative}\n      ${problems.join('\n      ')}\n`);
      continue;
    }

    process.stdout.write(`OK    ${relative}\n`);
  }
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

process.stdout.write(`\nПроверено файлов: ${files.length}, ошибок: ${failures}\n`);
if (failures) process.exit(1);
