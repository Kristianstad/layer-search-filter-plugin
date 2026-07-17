import createLayerFilterAdapters from './layer-filter-adapters.js';
import createLayerFilterIndicators from './layer-filter-indicators.js';

export default function createLayerFilterService({
  FILTER_DIALECTS,
  Origo,
  buildSearchFilter,
  buildSearchQgisWmsFilter,
  defaultNumericComparisonMode,
  defaultSearchMode,
  defaultSearchOperator,
  defaultTextMatchMode,
  extractQgisWmsFilterExpression,
  featureMatchesSearchFilter,
  getFilterableSource,
  getGroupChildLayers,
  getHighlightStyle,
  getLayerFilterDialect,
  getLayerType,
  getLegend,
  getSearchOperatorFromModes,
  getSearchAttributesForTargetLayer,
  getSearchTargetLayers,
  getTypeName,
  getViewer,
  getWmsLayerNames,
  hasFilterableSearchTarget,
  highlightZIndex,
  includeExistingCqlFilter,
  isClientFeatureLayer,
  isFilterExpressionTooLong,
  isLayerFilterable,
  isSearchingChildLayers,
  layerFilterActiveClass,
  layerFilterStates,
  pluginLayerFilterActiveClass,
  readConfiguredFilter,
  cloneFeatureForHighlight,
  combineWithExistingFilter,
  name,
  normalizeNumericComparisonMode,
  normalizeSearchMode,
  normalizeSearchOperator,
  normalizeTextMatchMode,
  searchSingleLayerWithFallback,
  shouldUseWmsPostForFilter,
  wmsOverlayFeatureLimit,
  wmsPostImageLoadFunction,
  wmsPostTileLoadFunction
}) {
  function getLayerFilterState(layer) {
    let state = layerFilterStates.get(layer);
    if (!state) {
      state = {
        applied: false,
        appliedDialect: undefined,
        appliedFilter: '',
        baseFilters: {},
        baseWmsFilters: {},
        filteredLayers: [],
        hasOriginalSourceFilter: false,
        hasOriginalSourceFilterType: false,
        hasOriginalStyle: false,
        hasOriginalWfsOverlayVisible: false,
        mode: undefined,
        numericComparisonBetweenEndText: '',
        numericComparisonMode: defaultNumericComparisonMode,
        originalSourceFilter: '',
        originalSourceFilterType: undefined,
        originalStyle: undefined,
        originalWfsOverlayVisible: undefined,
        originalWmsFilters: {},
        searchOperator: defaultSearchOperator,
        searchMode: defaultSearchMode,
        textMatchMode: defaultTextMatchMode,
        wfsOverlayLayer: undefined,
        wfsOverlaySource: undefined
      };
      layerFilterStates.set(layer, state);
    }
    return state;
  }

  const {
    scheduleLayerFilterLegendIndicatorSync,
    setLayerFilterActive
  } = createLayerFilterIndicators({
    getLegend,
    getViewer,
    layerFilterActiveClass,
    pluginLayerFilterActiveClass
  });

  function captureBaseFilter(layer, state, filterDialect) {
    if (!filterDialect) return;
    const filterState = state;
    if (!filterState.baseFilters) filterState.baseFilters = {};
    if (Object.prototype.hasOwnProperty.call(filterState.baseFilters, filterDialect)) return;
    filterState.baseFilters[filterDialect] = readConfiguredFilter(layer, filterDialect);
  }

  const {
    applyLocalFeatureLayerFilter,
    applySourceLayerFilter,
    applyWfsOverlayLayerFilter,
    applyWmsLayerFilter,
    clearLocalFeatureLayerFilter,
    clearSourceLayerFilter,
    clearWfsOverlayLayerFilter,
    clearWmsLayerFilter
  } = createLayerFilterAdapters({
    FILTER_DIALECTS,
    Origo,
    buildSearchQgisWmsFilter,
    cloneFeatureForHighlight,
    defaultNumericComparisonMode,
    defaultSearchMode,
    defaultTextMatchMode,
    extractQgisWmsFilterExpression,
    featureMatchesSearchFilter,
    getFilterableSource,
    getHighlightStyle,
    getLayerType,
    getSearchOperatorFromModes,
    getTypeName,
    getViewer,
    getWmsLayerNames,
    highlightZIndex,
    includeExistingCqlFilter,
    isFilterExpressionTooLong,
    name,
    searchSingleLayerWithFallback,
    shouldUseWmsPostForFilter,
    wmsOverlayFeatureLimit,
    wmsPostImageLoadFunction,
    wmsPostTileLoadFunction
  });

  async function applyLayerFilter(
    layer,
    filter,
    filterDialect,
    searchText,
    attributes,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchModeValue = defaultSearchMode,
    rangeEndText = '',
    searchOperatorValue = getSearchOperatorFromModes(searchModeValue, matchMode, comparisonMode)
  ) {
    if (!isLayerFilterable(layer)) return false;

    const state = getLayerFilterState(layer);
    captureBaseFilter(layer, state, filterDialect);
    const isQgisWmsLayerFilter = getLayerType(layer) === 'WMS' && filterDialect === FILTER_DIALECTS.qgis;
    const applyLocalFilter = () => applyLocalFeatureLayerFilter(
      layer,
      searchText,
      attributes,
      state,
      matchMode,
      comparisonMode,
      searchModeValue,
      rangeEndText,
      searchOperatorValue
    );

    const applied = isClientFeatureLayer(layer)
      ? applyLocalFilter()
      : (await applyWfsOverlayLayerFilter(
        layer,
        filter,
        filterDialect,
        state,
        searchText,
        attributes,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      ))
        || (!isQgisWmsLayerFilter && applyWmsLayerFilter(
          layer,
          filter,
          filterDialect,
          state,
          searchText,
          attributes,
          matchMode,
          comparisonMode,
          searchModeValue,
          rangeEndText,
          searchOperatorValue
        ))
        || applySourceLayerFilter(layer, filter, filterDialect, state)
        || applyLocalFilter();

    if (applied) {
      state.filteredLayers = [];
      state.numericComparisonBetweenEndText = rangeEndText;
      state.numericComparisonMode = normalizeNumericComparisonMode(comparisonMode);
      state.searchOperator = normalizeSearchOperator(searchOperatorValue, searchModeValue, matchMode, comparisonMode);
      state.searchMode = normalizeSearchMode(searchModeValue);
      state.textMatchMode = normalizeTextMatchMode(matchMode);
    }
    if (applied) setLayerFilterActive(layer, true);
    return applied;
  }

  async function getSearchFilterForLayer(
    layer,
    attributes,
    searchText,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchModeValue = defaultSearchMode,
    rangeEndText = '',
    searchOperatorValue = getSearchOperatorFromModes(searchModeValue, matchMode, comparisonMode)
  ) {
    const filterDialect = await getLayerFilterDialect(layer);
    const expressionDialect = filterDialect || FILTER_DIALECTS.cql;
    const searchFilter = buildSearchFilter(
      expressionDialect,
      attributes,
      searchText,
      true,
      matchMode,
      comparisonMode,
      searchModeValue,
      rangeEndText,
      searchOperatorValue
    );
    if (!searchFilter) return undefined;

    return {
      filter: filterDialect ? combineWithExistingFilter(layer, filterDialect, searchFilter) : searchFilter,
      filterDialect
    };
  }

  async function applySearchLayerFilter(
    layer,
    searchText,
    attributes,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchModeValue = defaultSearchMode,
    rangeEndText = '',
    searchOperatorValue = getSearchOperatorFromModes(searchModeValue, matchMode, comparisonMode)
  ) {
    const searchTargetLayers = getSearchTargetLayers(layer);
    if (searchTargetLayers.length === 0) return false;
    if (!hasFilterableSearchTarget(layer)) return false;

    if (!isSearchingChildLayers(layer, searchTargetLayers)) {
      if (!isLayerFilterable(layer)) return false;
      const searchFilter = await getSearchFilterForLayer(
        layer,
        attributes,
        searchText,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      );
      if (!searchFilter) return false;

      return applyLayerFilter(
        layer,
        searchFilter.filter,
        searchFilter.filterDialect,
        searchText,
        attributes,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      );
    }

    const applyResults = await Promise.all(searchTargetLayers.map(async (targetLayer) => {
      if (!isLayerFilterable(targetLayer)) return false;
      const targetAttributes = await getSearchAttributesForTargetLayer(targetLayer, attributes);
      const searchFilter = await getSearchFilterForLayer(
        targetLayer,
        targetAttributes,
        searchText,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      );
      if (!searchFilter) return false;

      return applyLayerFilter(
        targetLayer,
        searchFilter.filter,
        searchFilter.filterDialect,
        searchText,
        targetAttributes,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      );
    }));

    const filteredLayers = searchTargetLayers.filter((targetLayer, index) => applyResults[index]);
    if (filteredLayers.length === 0) return false;

    const state = getLayerFilterState(layer);
    state.applied = true;
    state.appliedFilter = searchText;
    state.filteredLayers = filteredLayers;
    state.mode = 'group';
    state.numericComparisonBetweenEndText = rangeEndText;
    state.numericComparisonMode = normalizeNumericComparisonMode(comparisonMode);
    state.searchOperator = normalizeSearchOperator(searchOperatorValue, searchModeValue, matchMode, comparisonMode);
    state.searchMode = normalizeSearchMode(searchModeValue);
    state.textMatchMode = normalizeTextMatchMode(matchMode);
    setLayerFilterActive(layer, true);
    return true;
  }

  function clearLayerFilter(layer) {
    const state = layerFilterStates.get(layer);
    if (!state || !state.applied) {
      if (getGroupChildLayers(layer).length > 0) {
        getSearchTargetLayers(layer).forEach(targetLayer => clearLayerFilter(targetLayer));
      }
      setLayerFilterActive(layer, false);
      return true;
    }

    let cleared = false;
    if (state.mode === 'group') {
      const filteredLayers = state.filteredLayers && state.filteredLayers.length > 0
        ? state.filteredLayers
        : getSearchTargetLayers(layer);
      cleared = filteredLayers
        .map(targetLayer => clearLayerFilter(targetLayer))
        .every(Boolean);
    } else {
      cleared = (state.mode === 'wms' && clearWmsLayerFilter(layer, state))
        || (state.mode === 'wfsOverlay' && clearWfsOverlayLayerFilter(layer, state))
        || (state.mode === 'source' && clearSourceLayerFilter(layer, state))
        || (state.mode === 'local' && clearLocalFeatureLayerFilter(layer, state));
    }

    if (cleared) {
      state.applied = false;
      state.appliedDialect = undefined;
      state.appliedFilter = '';
      state.filteredLayers = [];
      state.mode = undefined;
      setLayerFilterActive(layer, false);
    }

    return cleared;
  }

  return {
    applySearchLayerFilter,
    clearLayerFilter,
    scheduleLayerFilterLegendIndicatorSync
  };
}
