import assert from 'node:assert/strict';
import test from 'node:test';

import createMapResultsService from '../src/map-results.js';

function createFeature(extent) {
  return {
    getGeometry() {
      return {
        getExtent: () => extent,
        getType: () => 'Point'
      };
    }
  };
}

function createResults(features) {
  return {
    attributes: features.map(() => []),
    features,
    jsonFeatures: features.map(() => ({})),
    layers: features.map(() => ({}))
  };
}

function createHarness(expandedFeatures) {
  const fitCalls = [];
  const highlightedFeatures = [];
  let requestedLimit;
  const map = {
    getView: () => ({
      fit(extent, options) {
        fitCalls.push({ extent, options });
      }
    })
  };
  const highlightSource = {
    addFeature(feature) {
      highlightedFeatures.push(feature);
    },
    clear() {
      highlightedFeatures.splice(0);
    }
  };
  const Origo = {
    featurelayer: () => ({
      getFeatureLayer: () => ({ setZIndex() {} }),
      getFeatureStore: () => highlightSource,
      setStyle() {}
    })
  };
  const service = createMapResultsService({
    Origo,
    defaultHighlightStyleOptions: {},
    defaultNumericComparisonMode: 'equals',
    defaultSearchMode: 'text',
    defaultTextMatchMode: 'contains',
    featureInfoForResultsLimit: 3,
    getFeatureInfo: () => undefined,
    getSearchOperatorFromModes: () => 'ilike',
    getViewer: () => ({ getMap: () => map }),
    highlightOnSubmit: true,
    highlightStyleOptions: {},
    highlightZIndex: 10,
    limit: 2,
    maxZoomLevel: 8,
    name: 'layer_search_filter',
    normalizeFeatureLimit: value => value,
    searchLayerWithFallback: async (...args) => {
      requestedLimit = args[3];
      return createResults(expandedFeatures);
    },
    zoomOnSubmit: true,
    zoomPadding: [10, 20, 30, 40],
    zoomToExtentLimit: 3
  });

  return {
    fitCalls,
    highlightedFeatures,
    requestedLimit: () => requestedLimit,
    service
  };
}

test('returns the expanded, limited zoom result count', async () => {
  const suggestedFeatures = [
    createFeature([0, 0, 1, 1]),
    createFeature([1, 1, 2, 2])
  ];
  const expandedFeatures = [
    ...suggestedFeatures,
    createFeature([2, 2, 3, 3]),
    createFeature([3, 3, 4, 4])
  ];
  const harness = createHarness(expandedFeatures);

  const resultCount = await harness.service.zoomToSearchResults(
    {},
    'park',
    [],
    createResults(suggestedFeatures),
    () => true
  );

  assert.equal(harness.requestedLimit(), 3);
  assert.equal(resultCount, 3);
  assert.deepEqual(harness.highlightedFeatures, expandedFeatures.slice(0, 3));
  assert.deepEqual(harness.fitCalls, [{
    extent: [0, 0, 3, 3],
    options: {
      maxZoom: 8,
      padding: [10, 20, 30, 40]
    }
  }]);
});

test('returns zero when the expanded zoom search no longer has results', async () => {
  const suggestedFeatures = [
    createFeature([0, 0, 1, 1]),
    createFeature([1, 1, 2, 2])
  ];
  const harness = createHarness([]);

  const resultCount = await harness.service.zoomToSearchResults(
    {},
    'park',
    [],
    createResults(suggestedFeatures),
    () => true
  );

  assert.equal(resultCount, 0);
  assert.deepEqual(harness.highlightedFeatures, []);
  assert.deepEqual(harness.fitCalls, []);
});

test('does not return or apply an outdated zoom result', async () => {
  const suggestedFeatures = [
    createFeature([0, 0, 1, 1]),
    createFeature([1, 1, 2, 2])
  ];
  const harness = createHarness(suggestedFeatures);
  let currentCheckCount = 0;

  const resultCount = await harness.service.zoomToSearchResults(
    {},
    'park',
    [],
    createResults(suggestedFeatures),
    () => {
      currentCheckCount += 1;
      return currentCheckCount === 1;
    }
  );

  assert.equal(resultCount, undefined);
  assert.deepEqual(harness.highlightedFeatures, []);
  assert.deepEqual(harness.fitCalls, []);
});

test('returns the marked feature info count and reports a reached limit', async () => {
  const queryableLayer = {
    get(key) {
      if (key === 'queryable') return true;
      if (key === 'name') return 'places';
      return undefined;
    }
  };
  const suggestedFeatures = [
    createFeature([0, 0, 1, 1]),
    createFeature([1, 1, 2, 2])
  ];
  const expandedFeatures = [
    ...suggestedFeatures,
    createFeature([2, 2, 3, 3]),
    createFeature([3, 3, 4, 4])
  ];
  const renderedItemCounts = [];
  const featureInfo = {
    render(items) {
      renderedItemCounts.push(items.length);
    }
  };
  const Origo = {
    getFeatureInfo: {
      createSelectedItem: () => ({
        async createContentAsync() {
          return undefined;
        }
      })
    }
  };
  const map = {};
  const service = createMapResultsService({
    Origo,
    defaultHighlightStyleOptions: {},
    defaultNumericComparisonMode: 'equals',
    defaultSearchMode: 'text',
    defaultTextMatchMode: 'contains',
    featureInfoForResultsLimit: 3,
    getFeatureInfo: () => featureInfo,
    getSearchOperatorFromModes: () => 'ilike',
    getViewer: () => ({
      getGroupLayers: () => [],
      getMap: () => map
    }),
    highlightOnSubmit: true,
    highlightStyleOptions: {},
    highlightZIndex: 10,
    limit: 2,
    name: 'layer_search_filter',
    normalizeFeatureLimit: value => value,
    searchLayerWithFallback: async () => ({
      ...createResults(expandedFeatures),
      layers: expandedFeatures.map(() => queryableLayer)
    }),
    zoomOnSubmit: true,
    zoomToExtentLimit: 3
  });
  const result = await service.showFeatureInfoForSearchResults(
    queryableLayer,
    'park',
    [],
    {
      ...createResults(suggestedFeatures),
      layers: suggestedFeatures.map(() => queryableLayer)
    },
    () => true
  );

  assert.deepEqual(result, {
    count: 3,
    limit: 3,
    limitReached: true
  });
  assert.deepEqual(renderedItemCounts, [3]);
});
