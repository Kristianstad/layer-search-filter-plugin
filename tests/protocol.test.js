import assert from 'node:assert/strict';
import test from 'node:test';

import createAttributeDiscovery from '../src/attribute-discovery.js';
import createAttributeService from '../src/attributes.js';
import createWfsClient from '../src/wfs-client.js';

function createLayer(properties, children = []) {
  return {
    get: key => properties[key],
    getLayers: children.length > 0 ? () => ({ getArray: () => children }) : undefined
  };
}

function createFeature(properties) {
  return {
    getGeometryName: () => 'geometry',
    getProperties: () => ({ geometry: {}, ...properties })
  };
}

function createLocalAttributeHarness({ featuresByLayer, searchableAttributesMode = 'layer' }) {
  const attributeService = createAttributeService({
    attributeDisplayCollator: new Intl.Collator('sv', { sensitivity: 'base' }),
    getTypeName: layer => layer.get('name'),
    searchableAttributesMode
  });
  const getSearchTargetLayers = (layer) => {
    const layers = typeof layer.getLayers === 'function' ? layer.getLayers().getArray() : [];
    return layers.length > 0 ? layers : [layer];
  };
  const discovery = createAttributeDiscovery({
    applyConfiguredAttributeMetadata: attributeService.applyConfiguredAttributeMetadata,
    attributeCache: {},
    attributeRequestCache: {},
    createWfsUrl: () => undefined,
    getAttributeCacheKey: attributeService.getAttributeCacheKey,
    getConfiguredAttributes: attributeService.getConfiguredAttributes,
    getConfiguredSearchAttributes: attributeService.getConfiguredSearchAttributes,
    getLocalFeatures: layer => featuresByLayer.get(layer) || [],
    getPluginGeneration: () => 0,
    getSearchTargetLayers,
    getSourceUrl: () => undefined,
    getTypeFromXsd: attributeService.getTypeFromXsd,
    getTypeName: layer => layer.get('name'),
    getValueType: attributeService.getValueType,
    getViewer: () => ({ getProjectionCode: () => 'EPSG:3006' }),
    hasMissingConfiguredAttributes: attributeService.hasMissingConfiguredAttributes,
    hasUnknownAttributeTypes: attributeService.hasUnknownAttributeTypes,
    isClientFeatureLayer: layer => layer.get('type') === 'GEOJSON',
    isSearchableAttribute: attributeService.isSearchableAttribute,
    isSearchingChildLayers: (layer, targets) => targets.length !== 1 || targets[0] !== layer,
    loadClientFeatures: async () => undefined,
    mergeAttributes: attributeService.mergeAttributes,
    name: 'layer_search_filter',
    requestJson: async () => ({}),
    usesConfiguredAttributesOnly: attributeService.usesConfiguredAttributesOnly
  });

  return { attributeService, discovery };
}

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

test('uses layer search attributes as an exact allowlist independent of displayed attributes', async () => {
  const layer = createLayer({
    attributes: [
      { name: 'name', title: 'Namn' },
      { name: 'description', title: 'Beskrivning' }
    ],
    layerSearchAttributes: [
      { name: 'name', title: 'Namn' },
      { name: 'search_alias', title: 'Alternativt namn' },
      { name: 'missing', title: 'Saknas' },
      { name: 'geometry', title: 'Geometri' }
    ],
    name: 'places',
    type: 'GEOJSON'
  });
  const featuresByLayer = new Map([
    [layer, [createFeature({ description: 'Visible only', name: 'Park', search_alias: 'Green space' })]]
  ]);
  const { attributeService, discovery } = createLocalAttributeHarness({ featuresByLayer });

  assert.deepEqual(attributeService.getConfiguredAttributes(layer), [
    { name: 'name', title: 'Namn', type: 'unknown' },
    { name: 'search_alias', title: 'Alternativt namn', type: 'unknown' },
    { name: 'missing', title: 'Saknas', type: 'unknown' }
  ]);
  assert.deepEqual(await discovery.discoverAttributes(layer), [
    { name: 'name', title: 'Namn', type: 'string' },
    { name: 'search_alias', title: 'Alternativt namn', type: 'string' }
  ]);
});

test('treats an empty layer search attribute allowlist as no searchable attributes', async () => {
  const layer = createLayer({
    attributes: [{ name: 'name' }],
    layerSearchAttributes: [],
    name: 'places',
    type: 'GEOJSON'
  });
  const featuresByLayer = new Map([[layer, [createFeature({ name: 'Park' })]]]);
  const { attributeService, discovery } = createLocalAttributeHarness({
    featuresByLayer,
    searchableAttributesMode: 'all'
  });

  assert.equal(attributeService.usesConfiguredAttributesOnly(layer, []), true);
  assert.match(attributeService.getAttributeCacheKey(layer, []), /^layer:places:/);
  assert.deepEqual(await discovery.discoverAttributes(layer), []);
});

test('preserves layer and all fallback modes without a layer search allowlist', async () => {
  const layer = createLayer({
    attributes: [{ name: 'name', title: 'Namn' }],
    name: 'places',
    type: 'GEOJSON'
  });
  const featuresByLayer = new Map([
    [layer, [createFeature({ description: 'Visible only', name: 'Park', search_alias: 'Green space' })]]
  ]);
  const layerHarness = createLocalAttributeHarness({ featuresByLayer, searchableAttributesMode: 'layer' });
  const allHarness = createLocalAttributeHarness({ featuresByLayer, searchableAttributesMode: 'all' });

  assert.deepEqual(await layerHarness.discovery.discoverAttributes(layer), [
    { name: 'name', title: 'Namn', type: 'string' }
  ]);
  assert.deepEqual(await allHarness.discovery.discoverAttributes(layer), [
    { name: 'name', title: 'Namn', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'search_alias', type: 'string' }
  ]);
});

test('keeps descendant layer search allowlists isolated in grouped discovery', async () => {
  const firstLayer = createLayer({
    layerSearchAttributes: [{ name: 'name', title: 'Namn' }],
    name: 'first',
    type: 'GEOJSON'
  });
  const secondLayer = createLayer({
    layerSearchAttributes: [{ name: 'search_alias', title: 'Alternativt namn' }],
    name: 'second',
    type: 'GEOJSON'
  });
  const groupLayer = createLayer({ name: 'group', type: 'GROUP' }, [firstLayer, secondLayer]);
  const featuresByLayer = new Map([
    [firstLayer, [createFeature({ name: 'Park', search_alias: 'Must not leak' })]],
    [secondLayer, [createFeature({ name: 'Must not leak', search_alias: 'Green space' })]]
  ]);
  const { discovery } = createLocalAttributeHarness({ featuresByLayer });

  assert.deepEqual(await discovery.discoverAttributes(groupLayer), [
    { name: 'name', title: 'Namn', type: 'string' },
    { name: 'search_alias', title: 'Alternativt namn', type: 'string' }
  ]);
  assert.deepEqual(await discovery.getSearchAttributesForTargetLayer(firstLayer, [
    { name: 'name' },
    { name: 'search_alias' }
  ]), [{ name: 'name', title: 'Namn', type: 'string' }]);
  assert.deepEqual(await discovery.getSearchAttributesForTargetLayer(secondLayer, [
    { name: 'name' },
    { name: 'search_alias' }
  ]), [{ name: 'search_alias', title: 'Alternativt namn', type: 'string' }]);
});

test('uses normalized plain text for attribute display names without changing metadata', () => {
  const attributes = createAttributeService({
    attributeDisplayCollator: new Intl.Collator('sv', { sensitivity: 'base' }),
    getTypeName: layer => layer.get('name'),
    searchableAttributesMode: 'layer'
  });
  const titledAttribute = {
    name: 'information',
    title: '<br>  Information <strong>-</strong>  '
  };

  assert.equal(attributes.getAttributeTitle(titledAttribute), titledAttribute.title.trim());
  assert.equal(attributes.getAttributeDisplayName(titledAttribute), 'Information -');
  assert.equal(
    attributes.getAttributeDisplayName({ name: 'period', title: 'First<br><em>Second</em>' }),
    'First Second'
  );
  assert.equal(attributes.getAttributeDisplayName({ name: 'fallback', title: '<br><em> </em>' }), 'fallback');
  assert.equal(attributes.getAttributeDisplayName({ name: 'entity', title: 'A &amp; B' }), 'A &amp; B');
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
