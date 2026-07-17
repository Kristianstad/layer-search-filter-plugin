import assert from 'node:assert/strict';
import test from 'node:test';
import createLayerContext from '../src/layer-context.js';
import createPluginOptions from '../src/plugin-options.js';
import createPluginServices from '../src/plugin-services.js';

function createFeature(id, name, population, extent) {
  const geometry = {
    getCoordinates: () => [extent[0], extent[1]],
    getExtent: () => extent,
    getType: () => 'Point'
  };
  const properties = { geometry, name, population };

  return {
    clone() {
      return createFeature(id, name, population, extent.slice());
    },
    get(key) {
      return properties[key];
    },
    getGeometry: () => geometry,
    getGeometryName: () => 'geometry',
    getId: () => id,
    getProperties: () => ({ ...properties }),
    setId() {}
  };
}

function createSource(featuresToLoad, { failOnce = false, initialFeatures = [] } = {}) {
  const listeners = new Map();
  let features = initialFeatures;
  let shouldFail = failOnce;

  function emit(eventName, event) {
    Array.from(listeners.get(eventName) || []).forEach(listener => listener(event));
  }

  return {
    loading: false,
    loadCalls: 0,
    refreshCalls: 0,
    getFeatures: () => features,
    getOptions: () => ({}),
    loadFeatures() {
      this.loadCalls += 1;
      this.loading = true;
      queueMicrotask(() => {
        this.loading = false;
        if (shouldFail) {
          shouldFail = false;
          emit('featuresloaderror', new Error('GeoJSON load failed'));
          return;
        }
        features = featuresToLoad;
        emit('featuresloadend', { features });
      });
    },
    on(eventName, listener) {
      if (!listeners.has(eventName)) listeners.set(eventName, new Set());
      listeners.get(eventName).add(listener);
    },
    refresh() {
      this.refreshCalls += 1;
      features = [];
    },
    un(eventName, listener) {
      if (listeners.has(eventName)) listeners.get(eventName).delete(listener);
    }
  };
}

function createHarness({ failOnce = false, inline = false } = {}) {
  const features = [
    createFeature(1, 'Karlstad', 65000, [1, 2, 1, 2]),
    createFeature(2, 'Hallstahammar', 11000, [5, 6, 5, 6]),
    createFeature(3, 'Uppsala', 180000, [9, 10, 9, 10])
  ];
  const source = createSource(features, {
    failOnce,
    initialFeatures: inline ? features : []
  });
  const clusterSource = { getSource: () => source };
  const originalStyle = feature => `original-${feature.get('features')[0].get('name')}`;
  const properties = {
    attributes: [{ name: 'name' }, { name: 'population' }],
    id: 'origo-cities',
    name: 'origo-cities',
    queryable: true,
    sourceName: inline ? 'none' : 'cities',
    type: 'GEOJSON'
  };
  let currentStyle = originalStyle;
  let fittedExtent;
  let renderedItems = [];
  const layer = {
    changed() {},
    get: propertyName => properties[propertyName],
    getSource: () => clusterSource,
    getStyle: () => currentStyle,
    getVisible: () => true,
    set(propertyName, value) {
      properties[propertyName] = value;
    },
    setStyle(style) {
      currentStyle = style;
    },
    setVisible() {}
  };
  const view = {
    calculateExtent: () => [0, 0, 10, 10],
    fit(extent) {
      fittedExtent = extent;
    },
    getProjection: () => ({ getCode: () => 'EPSG:3006' }),
    getResolution: () => 1
  };
  const map = {
    getSize: () => [800, 600],
    getView: () => view,
    on() {}
  };
  const viewer = {
    getControlByName: () => undefined,
    getExtent: () => [0, 0, 10, 10],
    getGroupLayers: () => [],
    getMap: () => map,
    getMapSource: () => ({ cities: { url: 'data/origo-cities-3857.geojson' } }),
    getProjectionCode: () => 'EPSG:3006',
    getResolutions: () => [4, 2, 1, 0.5]
  };
  const options = createPluginOptions({
    featureInfoForResultsLimit: 10,
    highlightOnSubmit: false,
    limit: 1,
    minLength: 1,
    searchableAttributes: 'layer',
    zoomToExtentLimit: 10
  });
  const runtime = {
    attributeCache: {},
    attributeRequestCache: {},
    featureInfo: {
      render(items) {
        renderedItems = items;
      }
    },
    filterDialectCache: {},
    filterDialectRequestCache: {},
    layerFilterStates: new WeakMap(),
    localFeatureLoadRequests: new WeakMap(),
    pluginGeneration: 0,
    viewer
  };
  const layerContext = createLayerContext({
    filterDialectCache: runtime.filterDialectCache,
    getViewer: () => viewer,
    includeExistingCqlFilter: options.includeExistingCqlFilter,
    layerFilterStates: runtime.layerFilterStates,
    layerSearchEnabled: options.layerSearchEnabled,
    localize: (_key, fallback) => fallback,
    options,
    queryableOnly: options.queryableOnly
  });
  const Origo = {
    getFeatureInfo: {
      createSelectedItem(feature, resultLayer) {
        return {
          createContentAsync: async () => undefined,
          feature,
          layer: resultLayer
        };
      }
    },
    ol: { format: { GeoJSON: class GeoJSON {} } },
    Style: { createGeometryStyle: () => ({}) },
    featurelayer: () => undefined
  };
  const services = createPluginServices({
    Origo,
    layerContext,
    localize: (_key, fallback) => fallback,
    options,
    runtime
  });

  return {
    features,
    getCurrentStyle: () => currentStyle,
    getFittedExtent: () => fittedExtent,
    getRenderedItems: () => renderedItems,
    layer,
    originalStyle,
    services,
    source
  };
}

test('loads URL-backed clustered GeoJSON locally for search and result actions', async () => {
  const harness = createHarness();
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('WFS requests are not expected for GeoJSON layers');
  };

  try {
    const [attributes, suggestionResults] = await Promise.all([
      harness.services.discoverAttributes(harness.layer),
      harness.services.searchLayerWithFallback(
        harness.layer,
        'a',
        [{ name: 'name', type: 'string' }]
      )
    ]);
    assert.deepEqual(attributes, [
      { name: 'name', type: 'string' },
      { name: 'population', type: 'number' }
    ]);
    assert.equal(harness.source.loadCalls, 1);
    assert.equal(suggestionResults.features.length, 1);

    const zoomCount = await harness.services.zoomToSearchResults(
      harness.layer,
      'a',
      attributes,
      suggestionResults,
      () => true
    );
    assert.equal(zoomCount, 3);
    assert.deepEqual(harness.getFittedExtent(), [1, 2, 9, 10]);

    const infoResult = await harness.services.showFeatureInfoForSearchResults(
      harness.layer,
      'a',
      attributes,
      suggestionResults,
      () => true
    );
    assert.deepEqual(infoResult, { count: 3, limit: 10, limitReached: false });
    assert.equal(harness.getRenderedItems().length, 3);
    assert.ok(harness.getRenderedItems().every(item => item.layer === harness.layer));
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('filters clustered GeoJSON features locally and restores the original style', async () => {
  const harness = createHarness();
  const attributes = await harness.services.discoverAttributes(harness.layer);
  const applied = await harness.services.applySearchLayerFilter(
    harness.layer,
    'Karl',
    attributes
  );

  assert.equal(applied, true);
  assert.equal(harness.layer.get('filterActive'), true);
  const filteredStyle = harness.getCurrentStyle();
  const matchingCluster = { get: propertyName => (propertyName === 'features' ? [harness.features[0]] : undefined) };
  const nonMatchingCluster = { get: propertyName => (propertyName === 'features' ? [harness.features[1]] : undefined) };
  assert.equal(filteredStyle(matchingCluster, 1), 'original-Karlstad');
  assert.equal(filteredStyle(nonMatchingCluster, 1), null);

  assert.equal(harness.services.clearLayerFilter(harness.layer), true);
  assert.equal(harness.getCurrentStyle(), harness.originalStyle);
  assert.equal(harness.layer.get('filterActive'), false);
});

test('uses inline GeoJSON features without starting a source load', async () => {
  const harness = createHarness({ inline: true });
  const attributes = await harness.services.discoverAttributes(harness.layer);
  const results = await harness.services.searchLayerWithFallback(
    harness.layer,
    'Uppsala',
    attributes
  );

  assert.equal(harness.source.loadCalls, 0);
  assert.equal(results.features.length, 1);
  assert.equal(results.features[0].get('name'), 'Uppsala');
});

test('drops failed GeoJSON load requests so attribute discovery can retry', async () => {
  const harness = createHarness({ failOnce: true });

  await assert.rejects(
    harness.services.discoverAttributes(harness.layer),
    /GeoJSON load failed/
  );
  const attributes = await harness.services.discoverAttributes(harness.layer);

  assert.equal(harness.source.loadCalls, 2);
  assert.equal(attributes[0].name, 'name');
});
