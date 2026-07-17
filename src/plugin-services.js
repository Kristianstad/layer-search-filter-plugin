import createAttributeDiscovery from './attribute-discovery.js';
import createAttributeService from './attributes.js';
import createLayerFilterService from './layer-filter.js';
import createLocalFeatureSource from './local-feature-source.js';
import createMapResultsService from './map-results.js';
import { FILTER_DIALECTS, defaultHighlightStyleOptions } from './plugin-options.js';
import createSearchFilterRules from './search-filter.js';
import {
  getSearchOperatorFromModes,
  normalizeFeatureLimit,
  normalizeNumericComparisonMode,
  normalizeSearchMode,
  normalizeSearchOperator,
  normalizeTextMatchMode
} from './search-operators.js';
import createSearchResultsService from './search-results.js';
import createSearchService from './search-service.js';
import createWfsClient from './wfs-client.js';

export default function createPluginServices({
  Origo,
  layerContext,
  localize,
  options,
  runtime
}) {
  const getViewer = () => runtime.viewer;
  const {
    defaultNumericComparisonMode,
    defaultSearchMode,
    defaultSearchOperator,
    defaultTextMatchMode,
    featureInfoForResultsLimit,
    highlightOnSubmit,
    highlightStyleOptions,
    highlightZIndex,
    includeExistingCqlFilter,
    limit,
    maxZoomLevel,
    minLength,
    name,
    numericComparisonBetweenNeedsNumberText,
    numericComparisonNeedsNumberText,
    requestQueryLengthLimit,
    searchableAttributesMode,
    typeMoreText,
    useCurrentExtent,
    wmsOverlayFeatureLimit,
    zoomOnSubmit,
    zoomPadding,
    zoomToExtentLimit
  } = options;
  const attributeDisplayCollator = typeof Intl !== 'undefined' && typeof Intl.Collator === 'function'
    ? new Intl.Collator('sv', { numeric: true, sensitivity: 'base' })
    : null;

  const attributeService = createAttributeService({
    attributeDisplayCollator,
    getTypeName: layerContext.getTypeName,
    searchableAttributesMode
  });

  const localFeatureSource = createLocalFeatureSource({
    getFilterableSource: layerContext.getFilterableSource,
    getLayerType: layerContext.getLayerType,
    getSourceConfig: layerContext.getSourceConfig,
    getViewer,
    loadRequestCache: runtime.localFeatureLoadRequests,
    name
  });

  const wfsClient = createWfsClient({
    FILTER_DIALECTS,
    filterDialectCache: runtime.filterDialectCache,
    filterDialectRequestCache: runtime.filterDialectRequestCache,
    getExplicitFilterDialect: layerContext.getExplicitFilterDialect,
    getFilterDialectCacheKey: layerContext.getFilterDialectCacheKey,
    getSearchTargetLayers: layerContext.getSearchTargetLayers,
    getSourceConfig: layerContext.getSourceConfig,
    getSourceUrl: layerContext.getSourceUrl,
    getTypeName: layerContext.getTypeName,
    getViewer,
    isClientFeatureLayer: localFeatureSource.isClientFeatureLayer,
    name,
    requestQueryLengthLimit,
    setFilterDialectCache: layerContext.setFilterDialectCache
  });

  const attributeDiscovery = createAttributeDiscovery({
    applyConfiguredAttributeMetadata: attributeService.applyConfiguredAttributeMetadata,
    attributeCache: runtime.attributeCache,
    attributeRequestCache: runtime.attributeRequestCache,
    createWfsUrl: wfsClient.createWfsUrl,
    getAttributeCacheKey: attributeService.getAttributeCacheKey,
    getConfiguredAttributes: attributeService.getConfiguredAttributes,
    getConfiguredSearchAttributes: attributeService.getConfiguredSearchAttributes,
    getLocalFeatures: localFeatureSource.getLocalFeatures,
    getPluginGeneration: () => runtime.pluginGeneration,
    getSearchTargetLayers: layerContext.getSearchTargetLayers,
    getSourceUrl: layerContext.getSourceUrl,
    getTypeFromXsd: attributeService.getTypeFromXsd,
    getTypeName: layerContext.getTypeName,
    getValueType: attributeService.getValueType,
    getViewer,
    hasMissingConfiguredAttributes: attributeService.hasMissingConfiguredAttributes,
    hasUnknownAttributeTypes: attributeService.hasUnknownAttributeTypes,
    isClientFeatureLayer: localFeatureSource.isClientFeatureLayer,
    isSearchableAttribute: attributeService.isSearchableAttribute,
    isSearchingChildLayers: layerContext.isSearchingChildLayers,
    loadClientFeatures: localFeatureSource.loadClientFeatures,
    mergeAttributes: attributeService.mergeAttributes,
    name,
    requestJson: wfsClient.requestJson,
    searchableAttributesMode
  });

  const searchFilterRules = createSearchFilterRules({
    defaultNumericComparisonMode,
    defaultSearchMode,
    defaultSearchOperator,
    defaultTextMatchMode,
    getSortedAttributes: attributeService.getSortedAttributes,
    localize,
    minLength,
    numericComparisonBetweenNeedsNumberText,
    numericComparisonNeedsNumberText,
    typeMoreText
  });

  const searchService = createSearchService({
    FILTER_DIALECTS,
    Origo,
    attributeValueMatchesSearch: searchFilterRules.attributeValueMatchesSearch,
    buildSearchFilter: searchFilterRules.buildSearchFilter,
    combineWithExistingFilter: layerContext.combineWithExistingFilter,
    createSearchResultsService,
    createWfsUrl: wfsClient.createWfsUrl,
    defaultNumericComparisonMode,
    defaultSearchMode,
    defaultTextMatchMode,
    getFallbackFilterDialect: wfsClient.getFallbackFilterDialect,
    getFeatureProperties: attributeDiscovery.getFeatureProperties,
    getLayerFilterDialect: wfsClient.getLayerFilterDialect,
    getLocalFeatures: localFeatureSource.getLocalFeatures,
    getSearchAttributesForTargetLayer: attributeDiscovery.getSearchAttributesForTargetLayer,
    getSearchOperatorFromModes,
    getSearchTargetLayers: layerContext.getSearchTargetLayers,
    getSourceUrl: layerContext.getSourceUrl,
    getTypeName: layerContext.getTypeName,
    getViewer,
    isClientFeatureLayer: localFeatureSource.isClientFeatureLayer,
    isLongRequestQueryError: wfsClient.isLongRequestQueryError,
    isRequestQueryTooLong: wfsClient.isRequestQueryTooLong,
    isSearchingChildLayers: layerContext.isSearchingChildLayers,
    limit,
    loadClientFeatures: localFeatureSource.loadClientFeatures,
    name,
    requestJson: wfsClient.requestJson,
    useCurrentExtent
  });

  const mapResults = createMapResultsService({
    Origo,
    defaultHighlightStyleOptions,
    defaultNumericComparisonMode,
    defaultSearchMode,
    defaultTextMatchMode,
    featureInfoForResultsLimit,
    getFeatureInfo: () => runtime.featureInfo,
    getSearchOperatorFromModes,
    getViewer,
    highlightOnSubmit,
    highlightStyleOptions,
    highlightZIndex,
    localization: options.localization,
    limit,
    maxZoomLevel,
    name,
    normalizeFeatureLimit,
    searchLayerWithFallback: searchService.searchLayerWithFallback,
    zoomOnSubmit,
    zoomPadding,
    zoomToExtentLimit
  });

  const layerFilter = createLayerFilterService({
    FILTER_DIALECTS,
    Origo,
    buildSearchFilter: searchFilterRules.buildSearchFilter,
    buildSearchQgisWmsFilter: searchFilterRules.buildSearchQgisWmsFilter,
    cloneFeatureForHighlight: mapResults.cloneFeatureForHighlight,
    combineWithExistingFilter: layerContext.combineWithExistingFilter,
    defaultNumericComparisonMode,
    defaultSearchMode,
    defaultSearchOperator,
    defaultTextMatchMode,
    extractQgisWmsFilterExpression: layerContext.extractQgisWmsFilterExpression,
    featureMatchesSearchFilter: searchService.featureMatchesSearchFilter,
    getFilterableSource: layerContext.getFilterableSource,
    getGroupChildLayers: layerContext.getGroupChildLayers,
    getHighlightStyle: mapResults.getHighlightStyle,
    getLayerFilterDialect: wfsClient.getLayerFilterDialect,
    getLayerType: layerContext.getLayerType,
    getLegend: () => runtime.legend,
    getSearchAttributesForTargetLayer: attributeDiscovery.getSearchAttributesForTargetLayer,
    getSearchOperatorFromModes,
    getSearchTargetLayers: layerContext.getSearchTargetLayers,
    getTypeName: layerContext.getTypeName,
    getViewer,
    getWmsLayerNames: layerContext.getWmsLayerNames,
    hasFilterableSearchTarget: layerContext.hasFilterableSearchTarget,
    highlightZIndex,
    includeExistingCqlFilter,
    isClientFeatureLayer: localFeatureSource.isClientFeatureLayer,
    isFilterExpressionTooLong: wfsClient.isFilterExpressionTooLong,
    isLayerFilterable: layerContext.isLayerFilterable,
    isSearchingChildLayers: layerContext.isSearchingChildLayers,
    layerFilterActiveClass: 'o-layer-filter-active',
    layerFilterStates: runtime.layerFilterStates,
    name,
    normalizeNumericComparisonMode,
    normalizeSearchMode,
    normalizeSearchOperator,
    normalizeTextMatchMode,
    pluginLayerFilterActiveClass: 'o-layer_search_filter__legend-filter-active',
    readConfiguredFilter: layerContext.readConfiguredFilter,
    searchSingleLayerWithFallback: searchService.searchSingleLayerWithFallback,
    shouldUseWmsPostForFilter: wfsClient.shouldUseWmsPostForFilter,
    wmsOverlayFeatureLimit,
    wmsPostImageLoadFunction: wfsClient.wmsPostImageLoadFunction,
    wmsPostTileLoadFunction: wfsClient.wmsPostTileLoadFunction
  });

  function clearCaches() {
    [
      runtime.attributeCache,
      runtime.attributeRequestCache,
      runtime.filterDialectCache,
      runtime.filterDialectRequestCache
    ].forEach((cache) => {
      Object.keys(cache).forEach((cacheKey) => delete cache[cacheKey]);
    });
  }

  return {
    applySearchLayerFilter: layerFilter.applySearchLayerFilter,
    attributeValueMatchesSearch: searchFilterRules.attributeValueMatchesSearch,
    canOpenFeatureInfo: mapResults.canOpenFeatureInfo,
    clearCaches,
    clearHighlightedFeatures: mapResults.clearHighlightedFeatures,
    clearLayerFilter: layerFilter.clearLayerFilter,
    destroyHighlightLayer: mapResults.destroyHighlightLayer,
    discoverAttributes: attributeDiscovery.discoverAttributes,
    getAttributeDisplayName: attributeService.getAttributeDisplayName,
    getAttributeTitle: attributeService.getAttributeTitle,
    getSearchInputHint: searchFilterRules.getSearchInputHint,
    getSearchOperatorAttributes: searchFilterRules.getSearchOperatorAttributes,
    hasNumericSearchAttributes: searchFilterRules.hasNumericSearchAttributes,
    hasSearchableInput: searchFilterRules.hasSearchableInput,
    hasSearchableLayerData: attributeDiscovery.hasSearchableLayerData,
    hasTextSearchAttributes: searchFilterRules.hasTextSearchAttributes,
    isNumericInput: searchFilterRules.isNumericInput,
    prewarmFilterDialects: wfsClient.prewarmFilterDialects,
    scheduleLayerFilterLegendIndicatorSync: layerFilter.scheduleLayerFilterLegendIndicatorSync,
    searchLayerWithFallback: searchService.searchLayerWithFallback,
    setHighlightedFeatures: mapResults.setHighlightedFeatures,
    showFeatureInfoForSearchResults: mapResults.showFeatureInfoForSearchResults,
    zoomToFeatures: mapResults.zoomToFeatures,
    zoomToSearchResults: mapResults.zoomToSearchResults
  };
}
