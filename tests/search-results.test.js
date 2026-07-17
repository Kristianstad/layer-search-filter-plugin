import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeProjectionCode, stableStringify } from '../src/search-results.js';

test('normalizes common GeoJSON CRS identifiers', () => {
  assert.equal(normalizeProjectionCode('CRS:84'), 'EPSG:4326');
  assert.equal(normalizeProjectionCode('urn:ogc:def:crs:EPSG::3006'), 'EPSG:3006');
  assert.equal(normalizeProjectionCode('http://www.opengis.net/def/crs/EPSG/0/3857'), 'EPSG:3857');
});

test('creates stable property keys regardless of object key order', () => {
  assert.equal(
    stableStringify({ second: [2, 1], first: { value: true } }),
    stableStringify({ first: { value: true }, second: [2, 1] })
  );
});
