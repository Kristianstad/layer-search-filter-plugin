import {
  isBetweenSearchOperator,
  normalizeNumericComparisonMode,
  normalizeSearchMode,
  normalizeSearchOperator,
  normalizeTextMatchMode
} from './search-operators.js';
import createSearchActivation from './search-activation.js';
import createSearchExecution from './search-execution.js';
import createSearchOperatorMenu from './search-operator-menu.js';
import createSearchPanelView, { setPanelStatus } from './search-panel-view.js';

export default function createSearchPanel({
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
}) {
  if (!layerContext.isLayerSearchEnabled(layer)) return undefined;
  if (layerContext.getSearchTargetLayers(layer).length === 0) return undefined;

  const view = createSearchPanelView({ cmp, layer, layerContext, localize, options });
  if (!view) return undefined;
  suggestions.bindToSlidenav(view.targetEl);

  const { elements } = view;
  const uiState = getLayerSearchUiState(layer);
  const initialFilterState = runtime.layerFilterStates.get(layer);
  const filterActive = Boolean(initialFilterState && initialFilterState.applied);
  const state = {
    activationStarted: false,
    currentNumericComparisonMode: filterActive && initialFilterState
      ? normalizeNumericComparisonMode(initialFilterState.numericComparisonMode)
      : normalizeNumericComparisonMode(uiState.numericComparisonMode || options.defaultNumericComparisonMode),
    currentSearchMode: filterActive && initialFilterState
      ? normalizeSearchMode(initialFilterState.searchMode)
      : normalizeSearchMode(uiState.searchMode || options.defaultSearchMode),
    currentSearchOperator: undefined,
    currentTextMatchMode: filterActive && initialFilterState
      ? normalizeTextMatchMode(initialFilterState.textMatchMode)
      : normalizeTextMatchMode(uiState.textMatchMode || options.defaultTextMatchMode),
    discoveredAttributes: uiState.hasDiscoveredAttributes ? uiState.discoveredAttributes.slice() : [],
    discoveryFailed: Boolean(uiState.discoveryFailed),
    disposed: false,
    filterActive,
    layerPanelVisible: !view.layerPanelSlidenavEl
      || view.layerPanelSlidenavEl.classList.contains('slide-secondary'),
    operatorMenuOpen: false,
    selectedAttributeNames: new Set(uiState.selectedAttributeNames || [])
  };
  state.currentSearchOperator = filterActive && initialFilterState
    ? normalizeSearchOperator(
      initialFilterState.searchOperator,
      state.currentSearchMode,
      state.currentTextMatchMode,
      state.currentNumericComparisonMode
    )
    : normalizeSearchOperator(
      uiState.searchOperator,
      state.currentSearchMode,
      state.currentTextMatchMode,
      state.currentNumericComparisonMode
    );
  elements.inputEl.value = uiState.searchText || '';
  elements.betweenInputEl.value = filterActive && initialFilterState
    ? initialFilterState.numericComparisonBetweenEndText || ''
    : uiState.numericComparisonBetweenEndText || '';

  const actions = { suggestions };
  let layerPanelVisibilityObserver;

  actions.persistUiState = () => {
    uiState.activated = state.activationStarted;
    uiState.discoveredAttributes = state.discoveredAttributes.slice();
    uiState.discoveryFailed = state.discoveryFailed;
    uiState.hasDiscoveredAttributes = state.discoveredAttributes.length > 0;
    uiState.numericComparisonBetweenEndText = elements.betweenInputEl.value;
    uiState.searchMode = normalizeSearchMode(state.currentSearchMode);
    uiState.searchText = elements.inputEl.value;
    uiState.selectedAttributeNames = Array.from(state.selectedAttributeNames);
    uiState.searchOperator = normalizeSearchOperator(
      state.currentSearchOperator,
      state.currentSearchMode,
      state.currentTextMatchMode,
      state.currentNumericComparisonMode
    );
    uiState.numericComparisonMode = normalizeNumericComparisonMode(state.currentNumericComparisonMode);
    uiState.textMatchMode = normalizeTextMatchMode(state.currentTextMatchMode);
  };

  actions.updateSearchState = () => {
    const hasValue = Boolean(elements.inputEl.value
      || (isBetweenSearchOperator(state.currentSearchOperator) && elements.betweenInputEl.value));
    elements.controlEl.classList.toggle('o-search-true', hasValue);
    elements.controlEl.classList.toggle('o-search-false', !hasValue);
  };

  actions.updateLayerVisibilityButtonState = () => {
    if (state.disposed || !elements.layerVisibilityButtonEl || !elements.layerVisibilityIconUseEl) return;
    const visible = layer.getVisible();
    const icon = layerContext.getLayerVisibilityIcon(layer);
    const label = layerContext.getLayerVisibilityLabel(layer);
    elements.layerVisibilityButtonEl.classList.toggle('is-active', visible);
    elements.layerVisibilityButtonEl.setAttribute('aria-pressed', String(visible));
    elements.layerVisibilityButtonEl.setAttribute('aria-label', label);
    elements.layerVisibilityButtonEl.setAttribute('title', label);
    elements.layerVisibilityButtonEl.setAttribute('aria-disabled', String(layerContext.isSecureLayer(layer)));
    elements.layerVisibilityIconUseEl.setAttribute('href', icon);
    elements.layerVisibilityIconUseEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', icon);
  };

  actions.updateFilterButtonState = () => {
    if (!elements.filterButtonEl) return;
    const layerFilterable = layerContext.hasFilterableSearchTarget(layer);
    const filterButtonLabel = !layerFilterable
      ? localize('filterUnsupportedText', options.filterUnsupportedText)
      : state.filterActive
        ? localize('filterActiveTitle', options.filterActiveTitle)
        : localize('filterButtonTitle', options.filterButtonTitle);
    elements.filterButtonEl.classList.toggle('is-active', state.filterActive);
    elements.filterButtonEl.setAttribute('aria-pressed', String(state.filterActive));
    elements.filterButtonEl.setAttribute('aria-disabled', String(!layerFilterable));
    elements.filterButtonEl.setAttribute('aria-label', filterButtonLabel);
    elements.filterButtonEl.setAttribute('title', filterButtonLabel);
  };

  actions.updateActionsVisibility = () => {
    const operatorVisible = !elements.operatorEl.hidden && !elements.operatorEl.classList.contains('hidden');
    const visible = state.activationStarted && (view.hasActionButtons || operatorVisible);
    elements.actionsEl.hidden = !visible;
    elements.actionsEl.classList.toggle('hidden', !visible);
  };

  actions.updateFooterVisibility = () => {
    const visible = state.activationStarted && state.layerPanelVisible;
    elements.footerEl.hidden = !visible;
    elements.footerEl.classList.toggle('hidden', !visible);
  };

  const syncLayerPanelVisibility = () => {
    const visible = !view.layerPanelSlidenavEl
      || view.layerPanelSlidenavEl.classList.contains('slide-secondary');
    if (!visible) suggestions.hide();
    if (visible === state.layerPanelVisible) return;
    state.layerPanelVisible = visible;
    actions.updateFooterVisibility();
  };
  if (view.layerPanelSlidenavEl) {
    view.layerPanelSlidenavEl.addEventListener('slidenav:slide', syncLayerPanelVisibility);
    layerPanelVisibilityObserver = new MutationObserver(syncLayerPanelVisibility);
    layerPanelVisibilityObserver.observe(view.layerPanelSlidenavEl, {
      attributeFilter: ['class'],
      attributes: true
    });
    syncLayerPanelVisibility();
  }

  const operatorMenu = createSearchOperatorMenu({
    actions,
    localize,
    options,
    searchOperatorOptions,
    services,
    state,
    view
  });
  const searchExecution = createSearchExecution({
    actions,
    layer,
    layerContext,
    localize,
    options,
    services,
    state,
    suggestions,
    view
  });
  const activation = createSearchActivation({
    actions,
    layer,
    localize,
    operatorMenu,
    options,
    searchExecution,
    services,
    state,
    view
  });
  actions.renderAttributeButtons = activation.renderAttributeButtons;
  actions.scheduleSearch = searchExecution.schedule;

  function collapseSearch() {
    if (state.disposed || !state.activationStarted) return;
    searchExecution.invalidate();
    state.activationStarted = false;
    operatorMenu.close();
    suggestions.hide();
    suggestions.clearActiveInput(elements.inputEl);
    elements.activateButtonEl.classList.remove('hidden');
    elements.activateButtonEl.setAttribute('aria-expanded', 'false');
    elements.formEl.classList.add('hidden');
    elements.attributesEl.classList.add('hidden');
    setPanelStatus(elements.statusEl, '');
    actions.updateActionsVisibility();
    actions.updateFooterVisibility();
    actions.persistUiState();
    elements.activateButtonEl.focus();
  }

  function cleanup() {
    if (state.disposed) {
      runtime.layerPanelCleanups.delete(cleanup);
      return;
    }
    state.disposed = true;
    elements.footerEl.remove();
    if (view.footerScrollContainerEl) {
      view.footerScrollContainerEl.classList.remove('o-layer_search_filter__scroll-container--docked-footer');
    }
    searchExecution.invalidate();
    operatorMenu.destroy();
    if (view.layerPanelSlidenavEl) {
      view.layerPanelSlidenavEl.removeEventListener('slidenav:slide', syncLayerPanelVisibility);
    }
    if (layerPanelVisibilityObserver) layerPanelVisibilityObserver.disconnect();
    if (typeof layer.un === 'function' && elements.layerVisibilityButtonEl) {
      layer.un('change:visible', actions.updateLayerVisibilityButtonState);
    }
    if (suggestions.isActiveInput(elements.inputEl)) {
      suggestions.hide();
      suggestions.clearActiveInput(elements.inputEl);
    }
    runtime.layerPanelCleanups.delete(cleanup);
  }

  actions.updateSearchState();
  actions.updateLayerVisibilityButtonState();
  actions.updateFilterButtonState();
  operatorMenu.updateState();
  activation.setSearchControlsDisabled(true);
  operatorMenu.bind();

  elements.activateButtonEl.addEventListener('click', activation.activate);
  if (elements.layerVisibilityButtonEl) {
    elements.layerVisibilityButtonEl.addEventListener('click', (event) => {
      layerContext.toggleLayerVisibility(layer);
      actions.updateLayerVisibilityButtonState();
      if (event.detail > 0) elements.layerVisibilityButtonEl.blur();
    });
    layer.on('change:visible', actions.updateLayerVisibilityButtonState);
  }
  runtime.layerPanelCleanups.add(cleanup);
  if (cmp && typeof cmp.on === 'function') cmp.on('clear', cleanup);

  if (elements.filterButtonEl) {
    elements.filterButtonEl.addEventListener('click', async () => {
      suggestions.hide({ clearResults: false });
      if (state.filterActive) {
        searchExecution.clearActiveLayerFilter();
        return;
      }
      try {
        const applied = await searchExecution.applyCurrentLayerFilter();
        if (applied) searchExecution.execute({ keepSuggestionsClosed: true });
      } catch (error) {
        console.error(`${options.name}: layer filter failed`, error);
        setPanelStatus(elements.statusEl, localize('filterUnsupportedText', options.filterUnsupportedText), 'error');
      }
    });
  }
  if (elements.zoomToResultsButtonEl) {
    elements.zoomToResultsButtonEl.addEventListener('click', () => searchExecution.execute({ zoomToResults: true }));
  }
  if (elements.featureInfoForResultsButtonEl) {
    elements.featureInfoForResultsButtonEl.addEventListener('click', () => (
      searchExecution.execute({ showFeatureInfoResults: true })
    ));
  }
  if (elements.closeSearchButtonEl) elements.closeSearchButtonEl.addEventListener('click', collapseSearch);
  elements.inputEl.addEventListener('input', searchExecution.schedule);
  elements.inputEl.addEventListener('focus', () => {
    suggestions.setActiveInput(elements.inputEl);
    if (suggestions.hasResults()) suggestions.show(layer);
  });
  elements.betweenInputEl.addEventListener('input', searchExecution.schedule);
  elements.betweenInputEl.addEventListener('focus', () => {
    suggestions.setActiveInput(elements.inputEl);
    if (suggestions.hasResults()) suggestions.show(layer);
  });
  elements.clearButtonEl.addEventListener('click', () => {
    searchExecution.invalidate();
    elements.inputEl.value = '';
    elements.betweenInputEl.value = '';
    actions.updateSearchState();
    services.clearHighlightedFeatures();
    searchExecution.clearActiveLayerFilter({ silent: true });
    actions.persistUiState();
    suggestions.hide();
    setPanelStatus(elements.statusEl, '');
    elements.inputEl.focus();
  });
  elements.formEl.addEventListener('submit', (event) => {
    event.preventDefault();
    searchExecution.execute();
  });

  services.scheduleLayerFilterLegendIndicatorSync(layer, state.filterActive);
  if (uiState.activated) activation.activate({ restore: true });
  return cleanup;
}
