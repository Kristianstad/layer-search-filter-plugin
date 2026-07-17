import assert from 'node:assert/strict';
import test from 'node:test';

import createAttributeService from '../src/attributes.js';
import createWfsClient from '../src/wfs-client.js';

test('normalizes configured attributes and preserves discovered type metadata', () => {
  const attributes = createAttributeService({
    attributeDisplayCollator: new Intl.Collator('sv', { sensitivity: 'base' }),
    getTypeName: layer => layer.get('name'),
    searchableAttributesMode: 'layer'
  });
  const layer = {
    get: key => ({
      attributes: [
        { name: 'name', title: 'Namn' },
        { name: 'count', title: 'Antal', type: 'number' },
        { name: 'geometry', title: 'Geometri' }
      ],
      name: 'places'
    })[key]
  };

  const configured = attributes.getConfiguredAttributes(layer);
  assert.deepEqual(configured, [
    { name: 'name', title: 'Namn', type: 'unknown' },
    { name: 'count', title: 'Antal', type: 'number' }
  ]);
  assert.deepEqual(
    attributes.getConfiguredSearchAttributes(configured, [
      { name: 'name', type: 'string' },
      { name: 'count', type: 'number' },
      { name: 'unconfigured', type: 'string' }
    ]),
    [
      { name: 'name', title: 'Namn', type: 'string' },
      { name: 'count', title: 'Antal', type: 'number' }
    ]
  );
  assert.match(attributes.getAttributeCacheKey(layer, configured), /^layer:places:/);
});

test('constructs characterized WFS requests and recognizes query-length failures', () => {
  const previousWindow = globalThis.window;
  globalThis.window = { location: { href: 'https://viewer.example/map/' } };
  const layer = {};
  const filterDialectCache = {};
  const client = createWfsClient({
    FILTER_DIALECTS: { cql: 'cql', qgis: 'qgis' },
    filterDialectCache,
    filterDialectRequestCache: {},
    getExplicitFilterDialect: () => 'cql',
    getFilterDialectCacheKey: () => 'places',
    getSearchTargetLayers: () => [layer],
    getSourceConfig: () => ({ queryParams: { token: 'public' } }),
    getSourceUrl: () => '/geoserver/wfs',
    getTypeName: () => 'workspace:places',
    getViewer: () => ({ getProjectionCode: () => 'EPSG:3006' }),
    name: 'layer_search_filter',
    requestQueryLengthLimit: 40,
    setFilterDialectCache: (_targetLayer, dialect) => {
      filterDialectCache.places = dialect;
    }
  });

  const url = new URL(client.createWfsUrl(layer, {
    bbox: '1,2,3,4,EPSG:3006',
    cqlFilter: "name ILIKE '%park%'",
    maxFeatures: 20,
    outputFormat: 'application/json',
    srsName: 'EPSG:3006'
  }));
  assert.equal(url.origin, 'https://viewer.example');
  assert.equal(url.pathname, '/geoserver/wfs');
  assert.equal(url.searchParams.get('service'), 'WFS');
  assert.equal(url.searchParams.get('typeName'), 'workspace:places');
  assert.equal(url.searchParams.get('CQL_FILTER'), "name ILIKE '%park%'");
  assert.equal(url.searchParams.get('token'), 'public');
  assert.equal(client.isFilterExpressionTooLong('cql', 'x'.repeat(80)), true);
  assert.equal(client.isLongRequestQueryError({ status: 414 }), true);
  assert.equal(client.isLongRequestQueryError(new Error('query string is too long')), true);

  globalThis.window = previousWindow;
});
