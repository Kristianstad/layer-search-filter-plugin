import assert from 'node:assert/strict';
import test from 'node:test';

import { JSDOM } from 'jsdom';

import createAttributeService from '../src/attributes.js';
import createLayerContext from '../src/layer-context.js';
import createSearchActivation from '../src/search-activation.js';
import createSearchPanelView from '../src/search-panel-view.js';

function createLayer({ children, queryable, type = 'WFS' } = {}) {
  const properties = { queryable, type };
  return {
    get: key => properties[key],
    getLayers: children ? () => ({ getArray: () => children }) : undefined,
    getVisible: () => true
  };
}

function createOptions(overrides = {}) {
  return {
    buttonText: 'Search',
    showCloseSearchButton: false,
    showFeatureInfoForResultsButton: true,
    showFilterButton: false,
    showLayerVisibilityButton: false,
    showZoomToResultsButton: false,
    title: 'Search layer',
    ...overrides
  };
}

test('only renders the feature info action for queryable search targets', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://example.test/map/'
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;

  const layerContext = createLayerContext({
    filterDialectCache: {},
    getViewer: () => ({}),
    includeExistingCqlFilter: true,
    layerFilterStates: new WeakMap(),
    layerSearchEnabled: true,
    localize: (_key, fallback) => fallback,
    options: {},
    queryableOnly: false
  });
  const cases = [
    { id: 'false-layer', layer: createLayer({ queryable: false }), visible: false },
    { id: 'missing-layer', layer: createLayer(), visible: false },
    { id: 'true-layer', layer: createLayer({ queryable: true }), visible: true },
    {
      id: 'mixed-group',
      layer: createLayer({
        children: [createLayer({ queryable: false }), createLayer({ queryable: true })],
        type: 'GROUP'
      }),
      visible: true
    }
  ];

  cases.forEach(({ id, layer, visible }) => {
    const targetEl = document.createElement('div');
    targetEl.id = id;
    document.body.appendChild(targetEl);
    const view = createSearchPanelView({
      cmp: { getId: () => id },
      layer,
      layerContext,
      localize: (_key, fallback) => fallback,
      options: createOptions()
    });

    assert.equal(Boolean(view.elements.featureInfoForResultsButtonEl), visible, id);
  });

  const disabledTargetEl = document.createElement('div');
  disabledTargetEl.id = 'globally-disabled';
  document.body.appendChild(disabledTargetEl);
  const disabledView = createSearchPanelView({
    cmp: { getId: () => 'globally-disabled' },
    layer: createLayer({ queryable: true }),
    layerContext,
    localize: (_key, fallback) => fallback,
    options: createOptions({ showFeatureInfoForResultsButton: false })
  });
  assert.equal(disabledView.elements.featureInfoForResultsButtonEl, null);

  dom.window.close();
  delete globalThis.window;
  delete globalThis.document;
});

test('renders attribute chips as sorted plain text without HTML elements', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://example.test/map/'
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;

  try {
    const attributes = createAttributeService({
      attributeDisplayCollator: new Intl.Collator('sv', { sensitivity: 'base' }),
      getTypeName: () => 'places',
      searchableAttributesMode: 'layer'
    });
    const discoveredAttributes = [
      { name: 'zulu', title: '<br>Zulu', type: 'string' },
      { name: 'alpha', title: '<strong>Alpha</strong>', type: 'string' },
      { name: 'information', title: '<br>Information - ', type: 'string' },
      { name: 'fallback', title: '<br><em> </em>', type: 'string' }
    ];
    const attributesEl = document.createElement('div');
    const activation = createSearchActivation({
      actions: {
        persistUiState() {},
        suggestions: { hide() {} }
      },
      layer: {},
      localize: (_key, fallback) => fallback,
      operatorMenu: { setDisabled() {} },
      options: { attributeFilterTitle: 'Searchable attributes' },
      searchExecution: {
        invalidate() {},
        schedule() {}
      },
      services: {
        clearHighlightedFeatures() {},
        getAttributeDisplayName: attributes.getAttributeDisplayName,
        getSearchOperatorAttributes: values => attributes.getSortedAttributes(values)
      },
      state: {
        currentSearchOperator: 'textIlike',
        discoveredAttributes,
        selectedAttributeNames: new Set()
      },
      view: { elements: { attributesEl } }
    });

    activation.renderAttributeButtons(discoveredAttributes);

    const buttons = Array.from(attributesEl.querySelectorAll('.o-layer_search_filter__attribute-button'));
    assert.deepEqual(buttons.map(button => button.textContent), ['Alpha', 'fallback', 'Information -', 'Zulu']);
    buttons.forEach((button) => {
      assert.equal(button.children.length, 0);
      assert.doesNotMatch(button.textContent, /<[^>]*>/);
    });
  } finally {
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
  }
});
