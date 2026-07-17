import createLayerContext from './layer-context.js';
import createPluginOptions, { createSearchOperatorOptions } from './plugin-options.js';
import createPluginServices from './plugin-services.js';
import createSearchPanel from './search-panel.js';
import createSuggestionsPanel from './suggestions-panel.js';

const { Component } = Origo.ui;

const LayerSearchFilter = function LayerSearchFilter(rawOptions = {}) {
  const options = createPluginOptions(rawOptions);
  const runtime = {
    attributeCache: {},
    attributeRequestCache: {},
    featureInfo: undefined,
    filterDialectCache: {},
    filterDialectRequestCache: {},
    layerFilterStates: new WeakMap(),
    localFeatureLoadRequests: new WeakMap(),
    layerPanelCleanups: new Set(),
    layerSearchUiStates: new WeakMap(),
    legend: undefined,
    pluginClearHandlerRegistered: false,
    pluginGeneration: 0,
    viewer: undefined
  };

  function localize(key, fallback) {
    if (!options.localization) return fallback;
    return options.localization.getStringByKeys({
      targetParentKey: options.name,
      targetKey: key
    }) || fallback;
  }

  function createLayerSearchUiState() {
    return {
      activated: false,
      discoveredAttributes: [],
      discoveryFailed: false,
      hasDiscoveredAttributes: false,
      searchMode: options.defaultSearchMode,
      searchText: '',
      selectedAttributeNames: [],
      searchOperator: options.defaultSearchOperator,
      numericComparisonMode: options.defaultNumericComparisonMode,
      numericComparisonBetweenEndText: '',
      textMatchMode: options.defaultTextMatchMode
    };
  }

  function getLayerSearchUiState(layer) {
    let state = runtime.layerSearchUiStates.get(layer);
    if (!state) {
      state = createLayerSearchUiState();
      runtime.layerSearchUiStates.set(layer, state);
    }
    return state;
  }

  const layerContext = createLayerContext({
    filterDialectCache: runtime.filterDialectCache,
    getViewer: () => runtime.viewer,
    includeExistingCqlFilter: options.includeExistingCqlFilter,
    layerFilterStates: runtime.layerFilterStates,
    layerSearchEnabled: options.layerSearchEnabled,
    localize,
    options,
    queryableOnly: options.queryableOnly
  });
  const services = createPluginServices({
    Origo,
    layerContext,
    localize,
    options,
    runtime
  });
  const suggestions = createSuggestionsPanel({
    layerContext,
    localize,
    options,
    runtime,
    services
  });
  const searchOperatorOptions = createSearchOperatorOptions(options);

  function onRenderOverlayProperties(evt) {
    const { cmp, layer } = evt;
    if (!cmp || !layer) return;
    setTimeout(() => createSearchPanel({
      cmp,
      getLayerSearchUiState,
      layer,
      layerContext,
      localize,
      options,
      runtime,
      searchOperatorOptions,
      services,
      suggestions
    }), 0);
  }

  function cleanupPlugin() {
    runtime.pluginGeneration += 1;
    if (runtime.legend && typeof runtime.legend.un === 'function') {
      runtime.legend.un('renderOverlayProperties', onRenderOverlayProperties);
    }
    if (runtime.viewer && typeof runtime.viewer.getMap === 'function') {
      const map = runtime.viewer.getMap();
      if (map && typeof map.un === 'function') map.un('click', services.clearHighlightedFeatures);
    }
    if (runtime.featureInfo && typeof runtime.featureInfo.un === 'function') {
      runtime.featureInfo.un('changeselection', services.clearHighlightedFeatures);
      runtime.featureInfo.un('clearselection', services.clearHighlightedFeatures);
    }

    Array.from(runtime.layerPanelCleanups).forEach(cleanupSearch => cleanupSearch());
    suggestions.clearSlidenavListeners();
    suggestions.destroy();
    services.destroyHighlightLayer();
    services.clearCaches();

    runtime.legend = undefined;
    runtime.featureInfo = undefined;
    runtime.viewer = undefined;
  }

  return Component({
    name: options.name,
    onAdd(evt) {
      if (!runtime.pluginClearHandlerRegistered) {
        this.on('clear', cleanupPlugin);
        runtime.pluginClearHandlerRegistered = true;
      }
      if (runtime.viewer) cleanupPlugin();

      runtime.viewer = evt.target;
      runtime.legend = runtime.viewer.getControlByName('legend');
      runtime.featureInfo = runtime.viewer.getControlByName('featureInfo');

      if (!runtime.legend) {
        console.warn(`${options.name} requires the legend control`);
        return;
      }

      runtime.legend.on('renderOverlayProperties', onRenderOverlayProperties);
      runtime.viewer.getMap().on('click', services.clearHighlightedFeatures);

      if (runtime.featureInfo) {
        runtime.featureInfo.on('changeselection', services.clearHighlightedFeatures);
        runtime.featureInfo.on('clearselection', services.clearHighlightedFeatures);
      }
    }
  });
};

export default LayerSearchFilter;
