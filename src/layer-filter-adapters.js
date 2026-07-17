export default function createLayerFilterAdapters({
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
}) {
  function readConfiguredWmsFilter(layer, filterDialect = FILTER_DIALECTS.cql) {
    const source = layer.getSource && layer.getSource();
    const params = source && typeof source.getParams === 'function' ? source.getParams() : undefined;
    if (params && filterDialect === FILTER_DIALECTS.cql && params.CQL_FILTER) return params.CQL_FILTER;
    if (params && filterDialect === FILTER_DIALECTS.qgis && params.FILTER) return extractQgisWmsFilterExpression(layer, params.FILTER);
    return '';
  }

  function captureBaseWmsFilter(layer, state, filterDialect) {
    if (!filterDialect) return;
    const filterState = state;
    if (!filterState.baseWmsFilters) filterState.baseWmsFilters = {};
    if (Object.prototype.hasOwnProperty.call(filterState.baseWmsFilters, filterDialect)) return;
    filterState.baseWmsFilters[filterDialect] = readConfiguredWmsFilter(layer, filterDialect);
  }

  function getExistingWmsFilter(layer, filterDialect, state) {
    if (!includeExistingCqlFilter) return '';
    if (state && state.baseWmsFilters && Object.prototype.hasOwnProperty.call(state.baseWmsFilters, filterDialect)) {
      return state.baseWmsFilters[filterDialect];
    }
    return readConfiguredWmsFilter(layer, filterDialect);
  }

  function combineWithExistingWmsFilter(layer, filterDialect, filter, state) {
    if (!filter) return '';
    const existingFilter = getExistingWmsFilter(layer, filterDialect, state);
    return existingFilter ? `${existingFilter} AND ${filter}` : filter;
  }

  function getWmsQgisFilterParam(layer, filter) {
    const layerNames = getWmsLayerNames(layer);
    const layerName = layerNames.length > 0 ? layerNames[0] : getTypeName(layer);
    return `${layerName}:${filter}`;
  }

  function rememberOriginalWmsFilter(source, state, filterParam) {
    const filterState = state;
    if (!filterState.originalWmsFilters) filterState.originalWmsFilters = {};
    if (Object.prototype.hasOwnProperty.call(filterState.originalWmsFilters, filterParam)) return;

    const params = typeof source.getParams === 'function' ? source.getParams() : {};
    filterState.originalWmsFilters[filterParam] = params[filterParam];
  }

  function installWmsPostLoadFunction(source, state) {
    const filterState = state;
    let installed = false;

    if (typeof source.setImageLoadFunction === 'function') {
      if (!filterState.hasOriginalWmsImageLoadFunction) {
        filterState.originalWmsImageLoadFunction = typeof source.getImageLoadFunction === 'function'
          ? source.getImageLoadFunction()
          : undefined;
        filterState.hasOriginalWmsImageLoadFunction = true;
      }
      source.setImageLoadFunction(wmsPostImageLoadFunction);
      filterState.wmsPostImageLoadFunctionApplied = true;
      installed = true;
    }

    if (typeof source.setTileLoadFunction === 'function') {
      if (!filterState.hasOriginalWmsTileLoadFunction) {
        filterState.originalWmsTileLoadFunction = typeof source.getTileLoadFunction === 'function'
          ? source.getTileLoadFunction()
          : undefined;
        filterState.hasOriginalWmsTileLoadFunction = true;
      }
      source.setTileLoadFunction(wmsPostTileLoadFunction);
      filterState.wmsPostTileLoadFunctionApplied = true;
      installed = true;
    }

    return installed;
  }

  function restoreWmsLoadFunction(source, state) {
    const filterState = state;
    let restored = false;

    if (filterState.hasOriginalWmsImageLoadFunction && typeof source.setImageLoadFunction === 'function') {
      source.setImageLoadFunction(filterState.originalWmsImageLoadFunction);
      filterState.originalWmsImageLoadFunction = undefined;
      filterState.hasOriginalWmsImageLoadFunction = false;
      filterState.wmsPostImageLoadFunctionApplied = false;
      restored = true;
    }

    if (filterState.hasOriginalWmsTileLoadFunction && typeof source.setTileLoadFunction === 'function') {
      source.setTileLoadFunction(filterState.originalWmsTileLoadFunction);
      filterState.originalWmsTileLoadFunction = undefined;
      filterState.hasOriginalWmsTileLoadFunction = false;
      filterState.wmsPostTileLoadFunctionApplied = false;
      restored = true;
    }

    return restored;
  }

  function updateWmsFilterTransport(source, state, filterParams) {
    if (shouldUseWmsPostForFilter(source, filterParams)) {
      return installWmsPostLoadFunction(source, state);
    }

    restoreWmsLoadFunction(source, state);
    return true;
  }

  function getWfsOverlayZIndex() {
    const numericZIndex = Number(highlightZIndex);
    return Number.isFinite(numericZIndex) ? numericZIndex - 1 : 9;
  }

  function ensureWfsOverlayFilterLayer(state) {
    const filterState = state;
    if (!filterState.wfsOverlayLayer) {
      filterState.wfsOverlayLayer = Origo.featurelayer(null, getViewer().getMap());
      filterState.wfsOverlaySource = filterState.wfsOverlayLayer.getFeatureStore();
      filterState.wfsOverlayLayer.setStyle(getHighlightStyle);
      filterState.wfsOverlayLayer.getFeatureLayer().setZIndex(getWfsOverlayZIndex());
    }
    return filterState.wfsOverlayLayer;
  }

  async function applyWfsOverlayLayerFilter(
    layer,
    filter,
    filterDialect,
    state,
    searchText,
    attributes,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchModeValue = defaultSearchMode,
    rangeEndText = '',
    searchOperatorValue = getSearchOperatorFromModes(searchModeValue, matchMode, comparisonMode)
  ) {
    const filterState = state;
    if (getLayerType(layer) !== 'WMS' || filterDialect !== FILTER_DIALECTS.qgis) return false;

    let results;
    try {
      results = await searchSingleLayerWithFallback(
        layer,
        searchText,
        attributes,
        wmsOverlayFeatureLimit,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      );
    } catch (error) {
      console.warn(`${name}: QGIS WMS overlay filter search failed`, error);
      return false;
    }
    if (!results || !Array.isArray(results.features)) return false;

    ensureWfsOverlayFilterLayer(filterState);
    filterState.wfsOverlaySource.clear();
    results.features.forEach((feature) => {
      const overlayFeature = cloneFeatureForHighlight(feature);
      if (overlayFeature) filterState.wfsOverlaySource.addFeature(overlayFeature);
    });

    if (!filterState.hasOriginalWfsOverlayVisible && typeof layer.getVisible === 'function') {
      filterState.originalWfsOverlayVisible = layer.getVisible();
      filterState.hasOriginalWfsOverlayVisible = true;
    }
    if (typeof layer.setVisible === 'function') layer.setVisible(false);

    filterState.applied = true;
    filterState.appliedDialect = filterDialect;
    filterState.appliedFilter = filter || searchText;
    filterState.mode = 'wfsOverlay';
    return true;
  }

  function clearWfsOverlayLayerFilter(layer, state) {
    if (state.wfsOverlaySource) state.wfsOverlaySource.clear();
    if (state.wfsOverlayLayer && typeof state.wfsOverlayLayer.getFeatureLayer === 'function') {
      const featureLayer = state.wfsOverlayLayer.getFeatureLayer();
      if (featureLayer && typeof featureLayer.setMap === 'function') featureLayer.setMap(null);
    }
    state.wfsOverlayLayer = undefined;
    state.wfsOverlaySource = undefined;

    if (state.hasOriginalWfsOverlayVisible && typeof layer.setVisible === 'function') {
      layer.setVisible(Boolean(state.originalWfsOverlayVisible));
    }
    state.originalWfsOverlayVisible = undefined;
    state.hasOriginalWfsOverlayVisible = false;
    return true;
  }

  function applyWmsLayerFilter(
    layer,
    filter,
    filterDialect,
    state,
    searchText,
    attributes,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchModeValue = defaultSearchMode,
    rangeEndText = '',
    searchOperatorValue = getSearchOperatorFromModes(searchModeValue, matchMode, comparisonMode)
  ) {
    const filterState = state;
    if (getLayerType(layer) !== 'WMS' || !filterDialect) return false;

    const source = layer.getSource && layer.getSource();
    if (!source || typeof source.updateParams !== 'function') return false;

    captureBaseWmsFilter(layer, filterState, filterDialect);
    const appliedFilter = filterDialect === FILTER_DIALECTS.qgis
      ? combineWithExistingWmsFilter(layer, filterDialect, buildSearchQgisWmsFilter(
        attributes,
        searchText,
        true,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      ), filterState)
      : filter;
    if (!appliedFilter) return false;

    const filterParams = filterDialect === FILTER_DIALECTS.qgis
      ? { FILTER: getWmsQgisFilterParam(layer, appliedFilter) }
      : { CQL_FILTER: appliedFilter };
    const filterParam = filterDialect === FILTER_DIALECTS.qgis ? 'FILTER' : 'CQL_FILTER';

    rememberOriginalWmsFilter(source, filterState, filterParam);
    if (!updateWmsFilterTransport(source, filterState, filterParams)) return false;

    source.updateParams(filterParams);
    filterState.wmsFilterParam = filterParam;
    filterState.applied = true;
    filterState.appliedDialect = filterDialect;
    filterState.appliedFilter = appliedFilter;
    filterState.mode = 'wms';
    return true;
  }

  function clearWmsLayerFilter(layer, state) {
    const source = layer.getSource && layer.getSource();
    if (!source || typeof source.updateParams !== 'function') return false;

    const filterParam = state.wmsFilterParam || 'CQL_FILTER';
    const originalWmsFilters = state.originalWmsFilters || {};
    source.updateParams({
      [filterParam]: originalWmsFilters[filterParam] || null
    });
    restoreWmsLoadFunction(source, state);
    return true;
  }

  function applySourceLayerFilter(layer, filter, filterDialect, state) {
    const filterState = state;
    const source = getFilterableSource(layer);
    if (!source || typeof source.setFilter !== 'function' || !filterDialect) return false;

    const sourceOptions = typeof source.getOptions === 'function' ? source.getOptions() : {};
    if (!filterState.hasOriginalSourceFilter) {
      filterState.originalSourceFilter = sourceOptions.filter || '';
      filterState.originalSourceFilterType = sourceOptions.filterType;
      filterState.hasOriginalSourceFilter = true;
      filterState.hasOriginalSourceFilterType = true;
    }

    if (isFilterExpressionTooLong(filterDialect, filter) && String(sourceOptions.requestMethod || '').toLowerCase() !== 'post') return false;

    sourceOptions.filterType = filterDialect;
    source.setFilter(filter);
    filterState.applied = true;
    filterState.appliedDialect = filterDialect;
    filterState.appliedFilter = filter;
    filterState.mode = 'source';
    return true;
  }

  function clearSourceLayerFilter(layer, state) {
    const source = getFilterableSource(layer);
    if (!source) return false;

    const sourceOptions = typeof source.getOptions === 'function' ? source.getOptions() : undefined;
    if (sourceOptions && state.hasOriginalSourceFilterType) {
      sourceOptions.filterType = state.originalSourceFilterType;
    }

    if (state.originalSourceFilter) {
      source.setFilter(state.originalSourceFilter);
      return true;
    }

    if (typeof source.clearFilter === 'function') {
      source.clearFilter();
      return true;
    }

    if (typeof source.setFilter === 'function') {
      source.setFilter('');
      return true;
    }

    return false;
  }

  function getOriginalStyleValue(originalStyle, feature, resolution) {
    if (typeof originalStyle === 'function') return originalStyle(feature, resolution);
    return originalStyle;
  }

  function applyLocalFeatureLayerFilter(
    layer,
    searchText,
    attributes,
    state,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchModeValue = defaultSearchMode,
    rangeEndText = '',
    searchOperatorValue = getSearchOperatorFromModes(searchModeValue, matchMode, comparisonMode)
  ) {
    const filterState = state;
    if (typeof layer.setStyle !== 'function' || typeof layer.getStyle !== 'function') return false;

    if (!filterState.hasOriginalStyle) {
      filterState.originalStyle = layer.getStyle();
      filterState.hasOriginalStyle = true;
    }

    const originalStyle = filterState.originalStyle;
    layer.setStyle((feature, resolution) => {
      if (!featureMatchesSearchFilter(
        feature,
        attributes,
        searchText,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      )) return null;
      return getOriginalStyleValue(originalStyle, feature, resolution);
    });

    if (typeof layer.changed === 'function') layer.changed();
    filterState.applied = true;
    filterState.appliedFilter = searchText;
    filterState.mode = 'local';
    return true;
  }

  function clearLocalFeatureLayerFilter(layer, state) {
    if (typeof layer.setStyle !== 'function') return false;
    layer.setStyle(state.originalStyle);
    if (typeof layer.changed === 'function') layer.changed();
    return true;
  }

  return {
    applyLocalFeatureLayerFilter,
    applySourceLayerFilter,
    applyWfsOverlayLayerFilter,
    applyWmsLayerFilter,
    clearLocalFeatureLayerFilter,
    clearSourceLayerFilter,
    clearWfsOverlayLayerFilter,
    clearWmsLayerFilter
  };
}
