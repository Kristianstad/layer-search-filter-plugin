import {
  isEqualsSearchOperator,
  isNumericOnlySearchOperator
} from './search-operators.js';
import { setPanelStatus } from './search-panel-view.js';

export default function createSearchExecution({
  actions,
  layer,
  layerContext,
  localize,
  options,
  services,
  state,
  suggestions,
  view
}) {
  const {
    betweenInputEl,
    inputEl,
    statusEl
  } = view.elements;
  let debounceTimer;
  let requestId = 0;

  function clearDebounce() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = undefined;
    }
  }

  function invalidate() {
    clearDebounce();
    requestId += 1;
  }

  function getActiveSearchAttributes() {
    const modeAttributes = services.getSearchOperatorAttributes(
      state.discoveredAttributes,
      state.currentSearchOperator
    );
    const selectedModeAttributes = modeAttributes.filter(attribute => (
      state.selectedAttributeNames.has(attribute.name)
    ));
    if (state.selectedAttributeNames.size === 0 || selectedModeAttributes.length === 0) return modeAttributes;
    return selectedModeAttributes;
  }

  const getBetweenEndText = () => betweenInputEl.value.trim();

  const hasCurrentSearchableInput = searchText => services.hasSearchableInput(
    searchText,
    state.currentSearchMode,
    getBetweenEndText(),
    state.currentSearchOperator
  );

  function getCurrentSearchInputHint(searchText) {
    const activeAttributes = getActiveSearchAttributes();
    if (isEqualsSearchOperator(state.currentSearchOperator)
      && searchText
      && !services.isNumericInput(searchText)
      && services.hasNumericSearchAttributes(activeAttributes)
      && !services.hasTextSearchAttributes(activeAttributes)) {
      return localize('numericComparisonNeedsNumberText', options.numericComparisonNeedsNumberText);
    }
    return services.getSearchInputHint(
      searchText,
      state.currentSearchMode,
      getBetweenEndText(),
      state.currentSearchOperator
    );
  }

  function getZoomResultStatusText(resultCount) {
    const singular = resultCount === 1;
    const key = singular ? 'zoomToResultStatusText' : 'zoomToResultsStatusText';
    const fallback = singular ? options.zoomToResultStatusText : options.zoomToResultsStatusText;
    return localize(key, fallback).replace('{{count}}', resultCount);
  }

  function getFeatureInfoResultStatusText({ count, limit, limitReached }) {
    const singular = count === 1;
    const key = singular ? 'featureInfoResultStatusText' : 'featureInfoResultsStatusText';
    const fallback = singular ? options.featureInfoResultStatusText : options.featureInfoResultsStatusText;
    const statusText = localize(key, fallback).replace('{{count}}', count);
    if (!limitReached) return statusText;

    const limitReachedText = localize(
      'featureInfoResultsLimitReachedText',
      options.featureInfoResultsLimitReachedText
    ).replace('{{limit}}', limit);
    return `${statusText} ${limitReachedText}`;
  }

  async function applyLayerFilterFromAttributes(searchText, attributes, { silent = false } = {}) {
    if (!layerContext.hasFilterableSearchTarget(layer)) {
      if (!silent) setPanelStatus(statusEl, localize('filterUnsupportedText', options.filterUnsupportedText), 'error');
      return false;
    }

    const rangeEndText = betweenInputEl.value.trim();
    if (!await services.applySearchLayerFilter(
      layer,
      searchText,
      attributes,
      state.currentTextMatchMode,
      state.currentNumericComparisonMode,
      state.currentSearchMode,
      rangeEndText,
      state.currentSearchOperator
    )) {
      if (!silent) setPanelStatus(statusEl, localize('filterUnsupportedText', options.filterUnsupportedText), 'error');
      return false;
    }

    state.filterActive = true;
    actions.updateFilterButtonState();
    actions.persistUiState();
    if (!silent) setPanelStatus(statusEl, localize('filterAppliedText', options.filterAppliedText), 'success');
    return true;
  }

  function clearActiveLayerFilter({ silent = false } = {}) {
    if (!services.clearLayerFilter(layer)) {
      if (!silent) setPanelStatus(statusEl, localize('filterUnsupportedText', options.filterUnsupportedText), 'error');
      return false;
    }

    state.filterActive = false;
    actions.updateFilterButtonState();
    actions.persistUiState();
    if (!silent) setPanelStatus(statusEl, localize('filterClearedText', options.filterClearedText), 'success');
    return true;
  }

  async function applyCurrentLayerFilter({ silent = false } = {}) {
    if (state.disposed) return false;
    const searchText = inputEl.value.trim();
    if (!hasCurrentSearchableInput(searchText)) {
      if (!silent) setPanelStatus(statusEl, getCurrentSearchInputHint(searchText), 'error');
      return false;
    }

    if (state.discoveredAttributes.length === 0) {
      state.discoveredAttributes = await services.discoverAttributes(layer);
      if (state.disposed) return false;
      actions.persistUiState();
    }

    const attributes = getActiveSearchAttributes();
    if (attributes.length === 0) {
      if (!silent) setPanelStatus(statusEl, localize('noAttributesText', options.noAttributesText), 'error');
      return false;
    }

    if (isNumericOnlySearchOperator(state.currentSearchOperator)
      && !services.hasNumericSearchAttributes(attributes)) {
      if (!silent) setPanelStatus(statusEl, localize('numericComparisonNoAttributesText', options.numericComparisonNoAttributesText), 'error');
      return false;
    }

    if (isEqualsSearchOperator(state.currentSearchOperator)
      && !services.isNumericInput(searchText)
      && !services.hasTextSearchAttributes(attributes)) {
      if (!silent) setPanelStatus(statusEl, localize('numericComparisonNeedsNumberText', options.numericComparisonNeedsNumberText), 'error');
      return false;
    }

    return applyLayerFilterFromAttributes(searchText, attributes, { silent });
  }

  async function execute({
    zoomToResults = false,
    showFeatureInfoResults = false,
    keepSuggestionsClosed = false
  } = {}) {
    if (state.disposed) return;
    clearDebounce();
    const searchText = inputEl.value.trim();
    const shouldKeepSuggestionsClosed = keepSuggestionsClosed || zoomToResults || showFeatureInfoResults;
    suggestions.setActiveInput(inputEl);
    actions.updateSearchState();
    actions.persistUiState();
    requestId += 1;
    const currentRequestId = requestId;
    if (shouldKeepSuggestionsClosed) suggestions.hide({ clearResults: false });
    if (zoomToResults || showFeatureInfoResults) services.clearHighlightedFeatures();

    if (state.discoveryFailed) {
      services.clearHighlightedFeatures();
      suggestions.hide();
      setPanelStatus(statusEl, localize('noAttributesText', options.noAttributesText), 'error');
      return;
    }

    if (!hasCurrentSearchableInput(searchText)) {
      services.clearHighlightedFeatures();
      suggestions.hide();
      setPanelStatus(statusEl, getCurrentSearchInputHint(searchText), 'hint');
      return;
    }

    try {
      if (state.discoveredAttributes.length === 0) {
        state.discoveredAttributes = await services.discoverAttributes(layer);
        if (state.disposed) return;
        actions.persistUiState();
      }
      if (state.disposed || currentRequestId !== requestId) return;

      const attributes = getActiveSearchAttributes();
      if (attributes.length === 0) {
        services.clearHighlightedFeatures();
        suggestions.hide();
        setPanelStatus(statusEl, localize('noAttributesText', options.noAttributesText), 'error');
        return;
      }
      if (isNumericOnlySearchOperator(state.currentSearchOperator)
        && !services.hasNumericSearchAttributes(attributes)) {
        services.clearHighlightedFeatures();
        suggestions.hide();
        setPanelStatus(statusEl, localize('numericComparisonNoAttributesText', options.numericComparisonNoAttributesText), 'error');
        return;
      }
      if (isEqualsSearchOperator(state.currentSearchOperator)
        && !services.isNumericInput(searchText)
        && !services.hasTextSearchAttributes(attributes)) {
        services.clearHighlightedFeatures();
        suggestions.hide();
        setPanelStatus(statusEl, localize('numericComparisonNeedsNumberText', options.numericComparisonNeedsNumberText), 'error');
        return;
      }

      if (state.filterActive) {
        await applyLayerFilterFromAttributes(searchText, attributes, { silent: true });
        if (state.disposed || currentRequestId !== requestId) return;
      }

      setPanelStatus(statusEl, localize('loadingText', options.loadingText), 'loading');
      if (shouldKeepSuggestionsClosed) {
        suggestions.ensure();
      } else {
        suggestions.show(layer, undefined);
        suggestions.setStatus(localize('loadingText', options.loadingText), 'loading');
      }
      suggestions.clearResults();

      const results = await services.searchLayerWithFallback(
        layer,
        searchText,
        attributes,
        options.limit,
        state.currentTextMatchMode,
        state.currentNumericComparisonMode,
        state.currentSearchMode,
        getBetweenEndText(),
        state.currentSearchOperator
      );

      if (state.disposed || currentRequestId !== requestId) return;
      if (results.features.length === 0) {
        services.clearHighlightedFeatures();
        setPanelStatus(statusEl, localize('noResultsText', options.noResultsText), 'empty');
        if (shouldKeepSuggestionsClosed) {
          suggestions.ensure();
          suggestions.hide({ clearResults: false });
        } else {
          suggestions.show(layer, 0);
          suggestions.setStatus(localize('noResultsText', options.noResultsText), 'empty');
        }
        suggestions.clearResults();
        return;
      }

      setPanelStatus(statusEl, '', 'success');
      suggestions.setStatus('', 'success');
      suggestions.render(
        layer,
        results,
        searchText,
        attributes,
        state.currentTextMatchMode,
        state.currentNumericComparisonMode,
        state.currentSearchMode,
        getBetweenEndText(),
        state.currentSearchOperator,
        { showPanel: !shouldKeepSuggestionsClosed }
      );

      if (zoomToResults) {
        const zoomResultCount = await services.zoomToSearchResults(
          layer,
          searchText,
          attributes,
          results,
          () => currentRequestId === requestId,
          state.currentTextMatchMode,
          state.currentNumericComparisonMode,
          state.currentSearchMode,
          getBetweenEndText(),
          state.currentSearchOperator
        );
        if (state.disposed || currentRequestId !== requestId) return;
        if (zoomResultCount === 0) {
          setPanelStatus(statusEl, localize('noResultsText', options.noResultsText), 'empty');
        } else if (Number.isFinite(zoomResultCount)) {
          setPanelStatus(statusEl, getZoomResultStatusText(zoomResultCount), 'success');
        }
      }
      if (showFeatureInfoResults) {
        const featureInfoResult = await services.showFeatureInfoForSearchResults(
          layer,
          searchText,
          attributes,
          results,
          () => currentRequestId === requestId,
          state.currentTextMatchMode,
          state.currentNumericComparisonMode,
          state.currentSearchMode,
          getBetweenEndText(),
          state.currentSearchOperator
        );
        if (state.disposed || currentRequestId !== requestId) return;
        if (featureInfoResult && Number.isFinite(featureInfoResult.count)) {
          setPanelStatus(
            statusEl,
            getFeatureInfoResultStatusText(featureInfoResult),
            featureInfoResult.count === 0 ? 'empty' : 'success'
          );
        }
      }
      if (zoomToResults || showFeatureInfoResults) {
        if (state.disposed || currentRequestId !== requestId) return;
        suggestions.hide({ clearResults: false });
      }
    } catch (error) {
      console.error(`${options.name}: layer search failed`, error);
      if (!state.disposed && currentRequestId === requestId) {
        services.clearHighlightedFeatures();
        setPanelStatus(statusEl, localize('searchErrorText', options.searchErrorText), 'error');
        if (shouldKeepSuggestionsClosed) {
          suggestions.ensure();
          suggestions.hide({ clearResults: false });
        } else {
          suggestions.show(layer, undefined);
          suggestions.setStatus(localize('searchErrorText', options.searchErrorText), 'error');
        }
        suggestions.clearResults();
      }
    }
  }

  function schedule() {
    if (state.disposed) return;
    clearDebounce();
    requestId += 1;
    const searchText = inputEl.value.trim();
    suggestions.setActiveInput(inputEl);
    actions.updateSearchState();
    services.clearHighlightedFeatures();
    actions.persistUiState();
    if (!hasCurrentSearchableInput(searchText)) {
      if (state.filterActive) clearActiveLayerFilter({ silent: true });
      suggestions.hide();
      setPanelStatus(statusEl, getCurrentSearchInputHint(searchText), 'hint');
      return;
    }

    setPanelStatus(statusEl, localize('loadingText', options.loadingText), 'loading');
    debounceTimer = setTimeout(execute, options.debounceDelay);
  }

  return {
    applyCurrentLayerFilter,
    clearActiveLayerFilter,
    execute,
    getActiveSearchAttributes,
    hasCurrentSearchableInput,
    invalidate,
    schedule
  };
}
