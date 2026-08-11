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
    placeholder: 'Search this layer',
    showCloseSearchButton: false,
    showFeatureInfoForResultsButton: true,
    showFilterButton: false,
    showLayerVisibilityButton: false,
    showZoomToResultsButton: false,
    title: 'Search layer',
    ...overrides
  };
}

test('renders the activation button label before a trailing icon', () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="with-text"></div></body></html>', {
    url: 'https://example.test/map/'
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;

  try {
    const view = createSearchPanelView({
      cmp: { getId: () => 'with-text' },
      layer: createLayer(),
      layerContext: {
        getLayerVisibilityIcon: () => '#ic_visibility_24px',
        getLayerVisibilityLabel: () => 'Hide layer',
        hasQueryableSearchTarget: () => false
      },
      localize: (_key, fallback) => fallback,
      options: createOptions()
    });
    const { activateButtonEl } = view.elements;

    assert.equal(activateButtonEl.classList.contains('o-layer_search_filter__activate-button--icon-only'), false);
    assert.equal(activateButtonEl.getAttribute('aria-label'), 'Search');
    assert.equal(activateButtonEl.hasAttribute('title'), false);
    assert.equal(activateButtonEl.children.length, 2);
    assert.equal(activateButtonEl.children[0].classList.contains('o-layer_search_filter__activate-button-text'), true);
    assert.equal(activateButtonEl.children[0].textContent, 'Search');
    assert.equal(activateButtonEl.children[1].classList.contains('icon'), true);
  } finally {
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
  }
});

test('renders empty and whitespace activation labels as icon-only buttons', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://example.test/map/'
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;

  try {
    ['', '   '].forEach((buttonText, index) => {
      const id = `icon-only-${index}`;
      const targetEl = document.createElement('div');
      targetEl.id = id;
      document.body.appendChild(targetEl);
      const view = createSearchPanelView({
        cmp: { getId: () => id },
        layer: createLayer(),
        layerContext: {
          getLayerVisibilityIcon: () => '#ic_visibility_24px',
          getLayerVisibilityLabel: () => 'Hide layer',
          hasQueryableSearchTarget: () => false
        },
        localize: (_key, fallback) => fallback,
        options: createOptions({ buttonText })
      });
      const { activateButtonEl } = view.elements;

      assert.equal(activateButtonEl.classList.contains('o-layer_search_filter__activate-button--icon-only'), true);
      assert.equal(activateButtonEl.getAttribute('aria-label'), 'Search this layer');
      assert.equal(activateButtonEl.getAttribute('title'), 'Search this layer');
      assert.equal(activateButtonEl.querySelector('.o-layer_search_filter__activate-button-text'), null);
      assert.equal(activateButtonEl.children.length, 1);
      assert.equal(activateButtonEl.children[0].classList.contains('icon'), true);
    });
  } finally {
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
  }
});

function createSearchActivationHarness({ discoverAttributes }) {
  const attributesEl = document.createElement('div');
  const betweenInputEl = document.createElement('input');
  const inputEl = document.createElement('input');
  const statusEl = document.createElement('div');
  statusEl.hidden = true;

  const state = {
    activationStarted: false,
    currentSearchOperator: 'textIlike',
    discoveredAttributes: [],
    discoveryFailed: false,
    disposed: false,
    selectedAttributeNames: new Set()
  };
  const activation = createSearchActivation({
    actions: {
      persistUiState() {},
      suggestions: { hide() {} },
      updateActionsVisibility() {},
      updateFooterVisibility() {}
    },
    layer: {},
    localize: (_key, fallback) => fallback,
    operatorMenu: {
      setDisabled() {},
      updateState() {}
    },
    options: {
      attributeFilterTitle: 'Searchable attributes',
      discoveringAttributesText: 'Reading attributes...',
      name: 'layer_search_filter',
      noAttributesText: 'No searchable attributes.'
    },
    searchExecution: {
      hasCurrentSearchableInput: () => false,
      invalidate() {},
      schedule() {}
    },
    services: {
      clearHighlightedFeatures() {},
      discoverAttributes,
      getAttributeDisplayName: attribute => attribute.name,
      getSearchOperatorAttributes: attributes => attributes,
      hasSearchableLayerData: () => true,
      prewarmFilterDialects() {}
    },
    state,
    view: {
      targetEl: document.createElement('div'),
      elements: {
        activateButtonEl: document.createElement('button'),
        attributesEl,
        betweenInputEl,
        featureInfoForResultsButtonEl: null,
        filterButtonEl: null,
        formEl: document.createElement('div'),
        inputEl,
        statusEl,
        zoomToResultsButtonEl: null
      }
    }
  });

  return { activation, attributesEl, statusEl };
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
      { name: 'fallback', title: '<br><em> </em>', type: 'string' },
      { name: 'population', title: 'Population', type: 'number' },
      { name: 'elevation', title: 'Elevation', type: 'number' }
    ];
    const attributesEl = document.createElement('div');
    const state = {
      currentSearchOperator: 'textIlike',
      discoveredAttributes,
      selectedAttributeNames: new Set()
    };
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
        getSearchOperatorAttributes: (values, operator) => attributes.getSortedAttributes(
          values.filter(attribute => (operator === 'numericEquals'
            ? attribute.type === 'number'
            : attribute.type !== 'number'))
        )
      },
      state,
      view: { elements: { attributesEl } }
    });

    activation.renderAttributeButtons(discoveredAttributes);

    const buttons = Array.from(attributesEl.querySelectorAll('.o-layer_search_filter__attribute-button'));
    assert.deepEqual(buttons.map(button => button.textContent), ['Alpha', 'fallback', 'Information -', 'Zulu']);
    assert.equal(attributesEl.querySelector('.o-layer_search_filter__attributes-title').textContent, 'Searchable attributes (4)');
    assert.equal(attributesEl.querySelector('.o-layer_search_filter__attributes-list').getAttribute('aria-label'), 'Searchable attributes (4)');
    buttons.forEach((button) => {
      assert.equal(button.children.length, 0);
      assert.doesNotMatch(button.textContent, /<[^>]*>/);
    });

    state.currentSearchOperator = 'numericEquals';
    activation.renderAttributeButtons(discoveredAttributes);

    const numericButtons = Array.from(attributesEl.querySelectorAll('.o-layer_search_filter__attribute-button'));
    assert.deepEqual(numericButtons.map(button => button.textContent), ['Elevation', 'Population']);
    assert.equal(attributesEl.querySelector('.o-layer_search_filter__attributes-title').textContent, 'Searchable attributes (2)');
  } finally {
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
  }
});

test('clears the discovery status when attributes are ready and preserves loading and error states', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://example.test/map/'
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;

  try {
    const readyHarness = createSearchActivationHarness({
      discoverAttributes: async () => [
        { name: 'name', type: 'string' },
        { name: 'population', type: 'number' },
        { name: 'region', type: 'string' }
      ]
    });

    readyHarness.activation.activate();
    assert.equal(readyHarness.statusEl.textContent, 'Reading attributes...');
    assert.equal(readyHarness.statusEl.hidden, false);

    await Promise.resolve();

    assert.equal(readyHarness.attributesEl.querySelector('.o-layer_search_filter__attributes-title').textContent, 'Searchable attributes (3)');
    assert.equal(readyHarness.statusEl.textContent, '');
    assert.equal(readyHarness.statusEl.hidden, true);

    const errorHarness = createSearchActivationHarness({
      discoverAttributes: async () => []
    });

    errorHarness.activation.activate();
    assert.equal(errorHarness.statusEl.textContent, 'Reading attributes...');
    assert.equal(errorHarness.statusEl.hidden, false);

    await Promise.resolve();

    assert.equal(errorHarness.statusEl.textContent, 'No searchable attributes.');
    assert.equal(errorHarness.statusEl.classList.contains('error'), true);
    assert.equal(errorHarness.statusEl.hidden, false);
  } finally {
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
  }
});
