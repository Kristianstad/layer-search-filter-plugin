import assert from 'node:assert/strict';
import test from 'node:test';

import { JSDOM } from 'jsdom';

import createSuggestionsPanel from '../src/suggestions-panel.js';

function createLayer() {
  return {
    get(key) {
      return {
        name: 'buildings',
        title: 'Buildings'
      }[key];
    },
    getVisible: () => true,
    setVisible() {}
  };
}

function createResults(value) {
  return {
    features: [{}],
    jsonFeatures: [{ properties: { description: value } }]
  };
}

test('renders safe result HTML and strips unsafe markup', () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="map"></div></body></html>', {
    url: 'https://example.test/map/'
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;

  try {
    const mapEl = document.getElementById('map');
    const layer = createLayer();
    const panel = createSuggestionsPanel({
      layerContext: { getGroupDescendantLayers: () => [] },
      localize: (_key, fallback) => fallback,
      options: {
        activateLayerOnSuggestionClick: true,
        defaultNumericComparisonMode: 'equals',
        defaultSearchMode: 'text',
        defaultTextMatchMode: 'contains',
        maxZoomLevel: 10,
        noResultsText: 'No results',
        suggestionsTitle: 'Results'
      },
      runtime: {
        viewer: {
          getMain: () => ({ getId: () => 'map' }),
          getMap: () => ({ getTargetElement: () => mapEl })
        }
      },
      services: {
        attributeValueMatchesSearch: () => true,
        getAttributeDisplayName: () => 'Description',
        getAttributeTitle: () => 'Description'
      }
    });
    const attributes = [{ name: 'description', type: 'string' }];

    panel.render(
      layer,
      createResults('&#8226; Bod<br>&#8226; Enkelstuga<br>&#8226; Fjäs/Fähus<br><br>Berörda byggnadstyper'),
      'Bod',
      attributes
    );

    let titleEl = document.querySelector('.o-layer_search_filter__result-title');
    assert.equal(titleEl.querySelectorAll('br').length, 4);
    assert.equal(titleEl.querySelector('strong').textContent, 'Bod');
    assert.match(titleEl.textContent, /^\u2022 Bod\u2022 Enkelstuga/);
    assert.doesNotMatch(titleEl.innerHTML, /&amp;#8226;|&lt;br/i);

    panel.render(
      layer,
      createResults('<strong onclick="alert(1)">Safe</strong><img src="x" onerror="alert(1)"><script>unsafe()</script><a href="javascript:alert(1)"> text</a>'),
      '',
      attributes
    );

    titleEl = document.querySelector('.o-layer_search_filter__result-title');
    assert.equal(titleEl.textContent, 'Safe text');
    assert.equal(titleEl.querySelector('strong').hasAttribute('onclick'), false);
    assert.equal(titleEl.querySelector('img, script, a'), null);
  } finally {
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
  }
});
