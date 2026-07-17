import assert from 'node:assert/strict';
import test from 'node:test';

import { JSDOM } from 'jsdom';

function withEvents(target = {}) {
  const listeners = new Map();
  return Object.assign(target, {
    emit(eventName, event) {
      (listeners.get(eventName) || []).slice().forEach(listener => listener(event));
    },
    listenerCount(eventName) {
      return (listeners.get(eventName) || []).length;
    },
    on(eventName, listener) {
      listeners.set(eventName, [...(listeners.get(eventName) || []), listener]);
    },
    un(eventName, listener) {
      listeners.set(eventName, (listeners.get(eventName) || []).filter(candidate => candidate !== listener));
    }
  });
}

test('registers with Origo, renders the layer UI, and releases lifecycle listeners', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="layer-panel"></div></body></html>', {
    url: 'https://example.test/map/'
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.MutationObserver = dom.window.MutationObserver;

  globalThis.Origo = {
    ol: {
      format: {},
      layer: {},
      source: {},
      style: {}
    },
    ui: {
      Component: configuration => withEvents({ ...configuration })
    }
  };

  const legend = withEvents();
  const map = withEvents({
    getLayers: () => ({ getArray: () => [] })
  });
  const viewer = {
    getControlByName: controlName => (controlName === 'legend' ? legend : undefined),
    getMap: () => map,
    getMapSource: () => ({}),
    getProjectionCode: () => 'EPSG:3006'
  };
  const layer = withEvents({
    get: key => ({ id: 'places', name: 'places', type: 'WFS' })[key],
    getSource: () => ({}),
    getVisible: () => true
  });
  const panel = withEvents({ getId: () => 'layer-panel' });

  const { default: LayerSearchFilter } = await import('../src/index.js');
  const component = LayerSearchFilter();
  assert.equal(component.name, 'layer_search_filter');

  component.onAdd({ target: viewer });
  assert.equal(legend.listenerCount('renderOverlayProperties'), 1);
  assert.equal(map.listenerCount('click'), 1);

  legend.emit('renderOverlayProperties', { cmp: panel, layer });
  await new Promise((resolve) => {
    setTimeout(resolve, 10);
  });

  assert.ok(document.querySelector('.o-layer_search_filter'));
  const activateButton = document.querySelector('.o-layer_search_filter__activate-button');
  assert.ok(activateButton);
  assert.equal(layer.listenerCount('change:visible'), 1);

  activateButton.click();
  await new Promise((resolve) => {
    setTimeout(resolve, 10);
  });
  assert.equal(document.querySelector('.o-layer_search_filter__form').classList.contains('hidden'), false);
  assert.equal(activateButton.getAttribute('aria-expanded'), 'true');

  component.emit('clear');
  assert.equal(legend.listenerCount('renderOverlayProperties'), 0);
  assert.equal(map.listenerCount('click'), 0);
  assert.equal(layer.listenerCount('change:visible'), 0);
  assert.equal(document.querySelector('.o-layer_search_filter__footer'), null);

  dom.window.close();
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.MutationObserver;
  delete globalThis.Origo;
});
