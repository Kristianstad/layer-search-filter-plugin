import assert from 'node:assert/strict';
import test from 'node:test';

import { JSDOM } from 'jsdom';

import createPluginOptions from '../src/plugin-options.js';
import createSearchExecution from '../src/search-execution.js';

function createResults(features) {
  return {
    attributes: features.map(() => []),
    features,
    jsonFeatures: features.map(() => ({})),
    layers: features.map(() => ({}))
  };
}

function createExecution({
  localize = (_key, fallback) => fallback,
  options = createPluginOptions(),
  showFeatureInfoForSearchResults = async () => undefined,
  statusEl,
  zoomToSearchResults
}) {
  const attributes = [{ name: 'name', type: 'string' }];
  const state = {
    currentNumericComparisonMode: options.defaultNumericComparisonMode,
    currentSearchMode: options.defaultSearchMode,
    currentSearchOperator: options.defaultSearchOperator,
    currentTextMatchMode: options.defaultTextMatchMode,
    discoveredAttributes: attributes,
    discoveryFailed: false,
    disposed: false,
    filterActive: false,
    selectedAttributeNames: new Set()
  };
  const searchExecution = createSearchExecution({
    actions: {
      persistUiState() {},
      updateFilterButtonState() {},
      updateSearchState() {}
    },
    layer: {},
    layerContext: {
      hasFilterableSearchTarget: () => true
    },
    localize,
    options,
    services: {
      applySearchLayerFilter: async () => true,
      clearHighlightedFeatures() {},
      clearLayerFilter: () => true,
      discoverAttributes: async () => attributes,
      getSearchInputHint: () => '',
      getSearchOperatorAttributes: () => attributes,
      hasNumericSearchAttributes: () => false,
      hasSearchableInput: () => true,
      hasTextSearchAttributes: () => true,
      isNumericInput: () => false,
      searchLayerWithFallback: async () => createResults([{}]),
      showFeatureInfoForSearchResults,
      zoomToSearchResults
    },
    state,
    suggestions: {
      clearResults() {},
      ensure() {},
      hide() {},
      render() {},
      setActiveInput() {},
      setStatus() {},
      show() {}
    },
    view: {
      elements: {
        betweenInputEl: { value: '' },
        inputEl: { value: 'park' },
        statusEl
      }
    }
  });

  return searchExecution;
}

async function withStatusElement(callback) {
  const dom = new JSDOM('<div class=o-layer_search_filter__status hidden></div>');
  const previousDocument = globalThis.document;
  globalThis.document = dom.window.document;
  try {
    await callback(dom.window.document.querySelector('div'));
  } finally {
    dom.window.close();
    globalThis.document = previousDocument;
  }
}

test('shows the configured singular zoom result status', async () => {
  await withStatusElement(async statusEl => {
    const options = createPluginOptions({
      zoomToResultStatusText: 'Markerad träff: {{count}}.'
    });
    const execution = createExecution({
      options,
      statusEl,
      zoomToSearchResults: async () => 1
    });

    await execution.execute({ zoomToResults: true });

    assert.equal(statusEl.textContent, 'Markerad träff: 1.');
    assert.equal(statusEl.classList.contains('success'), true);
    assert.equal(statusEl.hidden, false);
  });
});

test('shows the localized plural zoom result status', async () => {
  await withStatusElement(async statusEl => {
    const execution = createExecution({
      localize: (key, fallback) => (
        key === 'zoomToResultsStatusText' ? '{{count}} objekt markerades.' : fallback
      ),
      statusEl,
      zoomToSearchResults: async () => 4
    });

    await execution.execute({ zoomToResults: true });

    assert.equal(statusEl.textContent, '4 objekt markerades.');
    assert.equal(statusEl.classList.contains('success'), true);
  });
});

test('keeps an empty expanded zoom result out of the success state', async () => {
  await withStatusElement(async statusEl => {
    const execution = createExecution({
      statusEl,
      zoomToSearchResults: async () => 0
    });

    await execution.execute({ zoomToResults: true });

    assert.equal(statusEl.textContent, 'Inga träffar.');
    assert.equal(statusEl.classList.contains('empty'), true);
    assert.equal(statusEl.classList.contains('success'), false);
  });
});

test('does not show a status from an invalidated zoom request', async () => {
  await withStatusElement(async statusEl => {
    let resolveZoom;
    let markZoomStarted;
    const zoomStarted = new Promise(resolve => {
      markZoomStarted = resolve;
    });
    const zoomResult = new Promise(resolve => {
      resolveZoom = resolve;
    });
    const execution = createExecution({
      statusEl,
      zoomToSearchResults: async () => {
        markZoomStarted();
        return zoomResult;
      }
    });

    const runningExecution = execution.execute({ zoomToResults: true });
    await zoomStarted;
    execution.invalidate();
    resolveZoom(5);
    await runningExecution;

    assert.equal(statusEl.textContent, '');
    assert.equal(statusEl.hidden, true);
  });
});

test('shows the number of marked objects after the feature info action', async () => {
  await withStatusElement(async statusEl => {
    const execution = createExecution({
      showFeatureInfoForSearchResults: async () => ({
        count: 4,
        limit: 10,
        limitReached: false
      }),
      statusEl,
      zoomToSearchResults: async () => undefined
    });

    await execution.execute({ showFeatureInfoResults: true });

    assert.equal(statusEl.textContent, '4 objekt markerade.');
    assert.equal(statusEl.classList.contains('success'), true);
    assert.equal(statusEl.hidden, false);
  });
});

test('warns when the feature info result limit is reached', async () => {
  await withStatusElement(async statusEl => {
    const options = createPluginOptions({
      featureInfoResultsLimitReachedText: 'Gränsen {{limit}} är nådd; fler träffar kan finnas.'
    });
    const execution = createExecution({
      options,
      showFeatureInfoForSearchResults: async () => ({
        count: 3,
        limit: 3,
        limitReached: true
      }),
      statusEl,
      zoomToSearchResults: async () => undefined
    });

    await execution.execute({ showFeatureInfoResults: true });

    assert.equal(
      statusEl.textContent,
      '3 objekt markerade. Gränsen 3 är nådd; fler träffar kan finnas.'
    );
    assert.equal(statusEl.classList.contains('success'), true);
  });
});
