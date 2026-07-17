import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
const mojibakeMarkers = /[\u00c2\u00c3\u00e2\u00f0\ufffd]/u;

test('keeps plugin source text free from common UTF-8 mojibake markers', () => {
  fs.readdirSync(sourceRoot)
    .filter(fileName => fileName.endsWith('.js'))
    .forEach((fileName) => {
      const source = fs.readFileSync(path.join(sourceRoot, fileName), 'utf8');
      assert.doesNotMatch(source, mojibakeMarkers, `${fileName} contains scrambled UTF-8 text`);
    });
});
