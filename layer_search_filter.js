var LayerSearchFilter;
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it declares 'LayerSearchFilter' on top-level, which conflicts with the current library output.
(() => {

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ src)
});

;// ./src/search-operators.js
const SEARCH_OPERATORS = {
  textIlike: 'textIlike',
  textStartsWith: 'textStartsWith',
  numericEquals: 'numericEquals',
  numericGreaterThan: 'numericGreaterThan',
  numericLessThan: 'numericLessThan',
  numericBetween: 'numericBetween'
};

function normalizeTextMatchMode(mode) {
  return mode === 'startsWith' ? 'startsWith' : 'contains';
}

function normalizeSearchMode(mode) {
  return mode === 'numeric' ? 'numeric' : 'text';
}

function normalizeNumericComparisonMode(mode) {
  if (mode === 'greaterThan' || mode === 'lessThan' || mode === 'between') return mode;
  return 'equals';
}

function getSearchOperatorFromModes(searchMode = 'text', matchMode = 'contains', comparisonMode = 'equals') {
  if (normalizeSearchMode(searchMode) === 'numeric') {
    const normalizedComparisonMode = normalizeNumericComparisonMode(comparisonMode);
    if (normalizedComparisonMode === 'greaterThan') return SEARCH_OPERATORS.numericGreaterThan;
    if (normalizedComparisonMode === 'lessThan') return SEARCH_OPERATORS.numericLessThan;
    if (normalizedComparisonMode === 'between') return SEARCH_OPERATORS.numericBetween;
    return SEARCH_OPERATORS.numericEquals;
  }

  return normalizeTextMatchMode(matchMode) === 'startsWith'
    ? SEARCH_OPERATORS.textStartsWith
    : SEARCH_OPERATORS.textIlike;
}

function normalizeSearchOperator(operator, searchMode = 'text', matchMode = 'contains', comparisonMode = 'equals') {
  if (operator === SEARCH_OPERATORS.textIlike || operator === 'ilike' || operator === 'contains') {
    return SEARCH_OPERATORS.textIlike;
  }
  if (operator === SEARCH_OPERATORS.textStartsWith || operator === 'startsWith') {
    return SEARCH_OPERATORS.textStartsWith;
  }
  if (operator === SEARCH_OPERATORS.numericEquals || operator === 'equals') {
    return SEARCH_OPERATORS.numericEquals;
  }
  if (operator === SEARCH_OPERATORS.numericGreaterThan || operator === 'greaterThan') {
    return SEARCH_OPERATORS.numericGreaterThan;
  }
  if (operator === SEARCH_OPERATORS.numericLessThan || operator === 'lessThan') {
    return SEARCH_OPERATORS.numericLessThan;
  }
  if (operator === SEARCH_OPERATORS.numericBetween || operator === 'between') {
    return SEARCH_OPERATORS.numericBetween;
  }

  return getSearchOperatorFromModes(searchMode, matchMode, comparisonMode);
}

function isNumericSearchOperator(operator) {
  const normalizedOperator = normalizeSearchOperator(operator);
  return normalizedOperator === SEARCH_OPERATORS.numericEquals
    || normalizedOperator === SEARCH_OPERATORS.numericGreaterThan
    || normalizedOperator === SEARCH_OPERATORS.numericLessThan
    || normalizedOperator === SEARCH_OPERATORS.numericBetween;
}

function isEqualsSearchOperator(operator) {
  return normalizeSearchOperator(operator) === SEARCH_OPERATORS.numericEquals;
}

function isNumericOnlySearchOperator(operator) {
  const normalizedOperator = normalizeSearchOperator(operator);
  return normalizedOperator === SEARCH_OPERATORS.numericGreaterThan
    || normalizedOperator === SEARCH_OPERATORS.numericLessThan
    || normalizedOperator === SEARCH_OPERATORS.numericBetween;
}

function isTextSearchOperator(operator) {
  return !isNumericSearchOperator(operator);
}

function isBetweenSearchOperator(operator) {
  return normalizeSearchOperator(operator) === SEARCH_OPERATORS.numericBetween;
}

function getSearchModeForOperator(operator) {
  return isNumericSearchOperator(operator) ? 'numeric' : 'text';
}

function getTextMatchModeForOperator(operator, fallbackMode = 'contains') {
  const normalizedOperator = normalizeSearchOperator(operator);
  if (normalizedOperator === SEARCH_OPERATORS.textStartsWith) return 'startsWith';
  if (isTextSearchOperator(normalizedOperator)) return 'contains';
  return normalizeTextMatchMode(fallbackMode);
}

function getNumericComparisonModeForOperator(operator, fallbackMode = 'equals') {
  const normalizedOperator = normalizeSearchOperator(operator);
  if (normalizedOperator === SEARCH_OPERATORS.numericGreaterThan) return 'greaterThan';
  if (normalizedOperator === SEARCH_OPERATORS.numericLessThan) return 'lessThan';
  if (normalizedOperator === SEARCH_OPERATORS.numericBetween) return 'between';
  if (normalizedOperator === SEARCH_OPERATORS.numericEquals) return 'equals';
  return normalizeNumericComparisonMode(fallbackMode);
}

function normalizeSearchableAttributesMode(mode) {
  return mode === 'layer' || mode === 'configured' ? 'layer' : 'all';
}

function normalizeFeatureLimit(value, fallback) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 1) return fallback;
  return Math.floor(numericValue);
}

function normalizeRequestQueryLength(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 1) return 1800;
  return Math.floor(numericValue);
}

;// ./src/plugin-options.js


const FILTER_DIALECTS = {
  cql: 'cql',
  qgis: 'qgis'
};

const defaultHighlightStyleOptions = {
  Point: [{
    circle: {
      radius: 8,
      stroke: {
        color: [255, 255, 255, 1],
        width: 3
      },
      fill: {
        color: [0, 153, 255, 0.9]
      }
    }
  }, {
    circle: {
      radius: 12,
      stroke: {
        color: [0, 153, 255, 1],
        width: 3
      },
      fill: {
        color: [0, 153, 255, 0.15]
      }
    }
  }],
  LineString: [{
    stroke: {
      color: [255, 255, 255, 1],
      width: 7
    }
  }, {
    stroke: {
      color: [0, 153, 255, 1],
      width: 4
    }
  }],
  Polygon: [{
    fill: {
      color: [0, 153, 255, 0.15]
    },
    stroke: {
      color: [255, 255, 255, 1],
      width: 7
    }
  }, {
    stroke: {
      color: [0, 153, 255, 1],
      width: 4
    }
  }]
};

function createPluginOptions(options = {}) {
  const {
    name = 'layer_search_filter',
    minLength = 2,
    limit = 20,
    debounceDelay = 300,
    title = 'Sök i lager',
    suggestionsTitle = 'Sökresultat',
    placeholder = 'Sök i detta lager',
    buttonText = '',
    attributeFilterTitle = 'Sökbara attribut',
    loadingText = 'Söker...',
    discoveringAttributesText = 'Läser attribut...',
    attributesReadyText = '{{count}} attribut hittade.',
    noAttributesText = 'Kunde inte hitta några sökbara attribut för lagret.',
    noResultsText = 'Inga träffar.',
    zoomToResultStatusText = '{{count}} träff markerad.',
    zoomToResultsStatusText = '{{count}} träffar markerade.',
    featureInfoResultStatusText = '{{count}} objekt markerat.',
    featureInfoResultsStatusText = '{{count}} objekt markerade.',
    featureInfoResultsLimitReachedText = 'Maximalt antal ({{limit}}) har nåtts; det kan finnas fler träffar.',
    typeMoreText = 'Skriv minst {{minLength}} tecken.',
    searchErrorText = 'Det gick inte att söka i lagret.',
    unsupportedLayerText = 'Lagret saknar källa som kan sökas.',
    filterActionsTitle = 'Lageråtgärder',
    showLayerVisibilityButton = true,
    showFilterButton = true,
    showZoomToResultsButton = true,
    showFeatureInfoForResultsButton = true,
    showCloseSearchButton = true,
    layerVisibleTitle = 'Släck lagret',
    layerHiddenTitle = 'Tänd lagret',
    layerLockedTitle = 'Lagret är låst',
    filterButtonTitle = 'Filtrera lagret',
    zoomToResultsButtonTitle = 'Markera och zooma till träffar',
    featureInfoForResultsButtonTitle = 'Visa info för träffar',
    closeSearchButtonTitle = 'Stäng sökning',
    filterActiveTitle = 'Ta bort lagerfilter',
    filterNeedsSearchText = 'Skriv en sökning innan du filtrerar lagret.',
    filterUnsupportedText = 'Lagret kan inte filtreras här.',
    filterAppliedText = 'Lagret är filtrerat.',
    filterClearedText = 'Lagerfiltret är borttaget.',
    searchMode = 'text',
    searchOperator,
    searchOperatorTitle = 'Sökalternativ',
    textMatchMode = 'contains',
    textMatchContainsTitle = 'Sökning: innehåller, oavsett stora eller små bokstäver',
    textMatchStartsWithTitle = 'Sökning: börjar med',
    textMatchContainsOptionText = 'Innehåller',
    textMatchStartsWithOptionText = 'Börjar med',
    numericComparisonMode = 'equals',
    numericComparisonEqualsTitle = 'Jämförelse: lika med',
    numericComparisonGreaterThanTitle = 'Numerisk jämförelse: större än',
    numericComparisonLessThanTitle = 'Numerisk jämförelse: mindre än',
    numericComparisonBetweenTitle = 'Numerisk jämförelse: mellan',
    numericComparisonEqualsOptionText = 'Lika med',
    numericComparisonGreaterThanOptionText = 'Större än',
    numericComparisonLessThanOptionText = 'Mindre än',
    numericComparisonBetweenOptionText = 'Mellan',
    numericComparisonNeedsNumberText = 'Skriv ett numeriskt värde för jämförelsen.',
    numericComparisonBetweenNeedsNumberText = 'Skriv två numeriska värden för mellan.',
    numericComparisonNoAttributesText = 'Välj ett numeriskt attribut för jämförelsen.',
    numericComparisonBetweenStartPlaceholder = 'Från',
    numericComparisonBetweenEndPlaceholder = 'Till',
    layerSearchEnabled = true,
    queryableOnly = false,
    activateLayerOnSuggestionClick = true,
    includeExistingCqlFilter = true,
    filterType,
    searchableAttributes = 'all',
    useCurrentExtent = false,
    maxRequestQueryLength,
    maxWfsQueryLength,
    maxZoomLevel,
    zoomOnSubmit = true,
    zoomToExtentLimit = 1000,
    wmsOverlayFilterLimit = zoomToExtentLimit,
    featureInfoForResultsLimit = zoomToExtentLimit,
    zoomPadding = [50, 50, 50, 50],
    highlightOnSubmit = true,
    highlightStyleOptions = defaultHighlightStyleOptions,
    highlightZIndex = 10,
    localization
  } = options;

  const defaultSearchMode = normalizeSearchMode(searchMode);
  const defaultTextMatchMode = normalizeTextMatchMode(textMatchMode);
  const defaultNumericComparisonMode = normalizeNumericComparisonMode(numericComparisonMode);
  const defaultSearchOperator = normalizeSearchOperator(
    searchOperator,
    defaultSearchMode,
    defaultTextMatchMode,
    defaultNumericComparisonMode
  );

  return {
    activateLayerOnSuggestionClick,
    attributeFilterTitle,
    attributesReadyText,
    buttonText,
    closeSearchButtonTitle,
    debounceDelay,
    defaultNumericComparisonMode,
    defaultSearchMode,
    defaultSearchOperator,
    defaultTextMatchMode,
    discoveringAttributesText,
    featureInfoForResultsButtonTitle,
    featureInfoForResultsLimit,
    featureInfoResultStatusText,
    featureInfoResultsLimitReachedText,
    featureInfoResultsStatusText,
    filterActionsTitle,
    filterActiveTitle,
    filterAppliedText,
    filterButtonTitle,
    filterClearedText,
    filterNeedsSearchText,
    filterType,
    filterUnsupportedText,
    highlightOnSubmit,
    highlightStyleOptions,
    highlightZIndex,
    includeExistingCqlFilter,
    layerHiddenTitle,
    layerLockedTitle,
    layerSearchEnabled,
    layerVisibleTitle,
    limit,
    loadingText,
    localization,
    maxRequestQueryLength,
    maxWfsQueryLength,
    maxZoomLevel,
    minLength,
    name,
    noAttributesText,
    noResultsText,
    numericComparisonBetweenEndPlaceholder,
    numericComparisonBetweenNeedsNumberText,
    numericComparisonBetweenOptionText,
    numericComparisonBetweenStartPlaceholder,
    numericComparisonBetweenTitle,
    numericComparisonEqualsOptionText,
    numericComparisonEqualsTitle,
    numericComparisonGreaterThanOptionText,
    numericComparisonGreaterThanTitle,
    numericComparisonLessThanOptionText,
    numericComparisonLessThanTitle,
    numericComparisonNeedsNumberText,
    numericComparisonNoAttributesText,
    placeholder,
    queryableOnly,
    requestQueryLengthLimit: normalizeRequestQueryLength(
      maxRequestQueryLength !== undefined ? maxRequestQueryLength : maxWfsQueryLength
    ),
    searchableAttributesMode: normalizeSearchableAttributesMode(searchableAttributes),
    searchErrorText,
    searchOperatorTitle,
    showCloseSearchButton,
    showFeatureInfoForResultsButton,
    showFilterButton,
    showLayerVisibilityButton,
    showZoomToResultsButton,
    suggestionsTitle,
    textMatchContainsOptionText,
    textMatchContainsTitle,
    textMatchStartsWithOptionText,
    textMatchStartsWithTitle,
    title,
    typeMoreText,
    unsupportedLayerText,
    useCurrentExtent,
    wmsOverlayFeatureLimit: normalizeFeatureLimit(wmsOverlayFilterLimit, zoomToExtentLimit),
    zoomOnSubmit,
    zoomPadding,
    zoomToExtentLimit,
    zoomToResultStatusText,
    zoomToResultsStatusText,
    zoomToResultsButtonTitle
  };
}

function createSearchOperatorOptions(options) {
  return [{
    value: SEARCH_OPERATORS.textIlike,
    type: 'text',
    titleKey: 'textMatchContainsTitle',
    titleFallback: options.textMatchContainsTitle,
    optionKey: 'textMatchContainsOptionText',
    optionFallback: options.textMatchContainsOptionText
  }, {
    value: SEARCH_OPERATORS.textStartsWith,
    type: 'text',
    titleKey: 'textMatchStartsWithTitle',
    titleFallback: options.textMatchStartsWithTitle,
    optionKey: 'textMatchStartsWithOptionText',
    optionFallback: options.textMatchStartsWithOptionText
  }, {
    value: SEARCH_OPERATORS.numericEquals,
    type: 'mixed',
    titleKey: 'numericComparisonEqualsTitle',
    titleFallback: options.numericComparisonEqualsTitle,
    optionKey: 'numericComparisonEqualsOptionText',
    optionFallback: options.numericComparisonEqualsOptionText
  }, {
    value: SEARCH_OPERATORS.numericGreaterThan,
    type: 'numeric',
    titleKey: 'numericComparisonGreaterThanTitle',
    titleFallback: options.numericComparisonGreaterThanTitle,
    optionKey: 'numericComparisonGreaterThanOptionText',
    optionFallback: options.numericComparisonGreaterThanOptionText
  }, {
    value: SEARCH_OPERATORS.numericLessThan,
    type: 'numeric',
    titleKey: 'numericComparisonLessThanTitle',
    titleFallback: options.numericComparisonLessThanTitle,
    optionKey: 'numericComparisonLessThanOptionText',
    optionFallback: options.numericComparisonLessThanOptionText
  }, {
    value: SEARCH_OPERATORS.numericBetween,
    type: 'numeric',
    titleKey: 'numericComparisonBetweenTitle',
    titleFallback: options.numericComparisonBetweenTitle,
    optionKey: 'numericComparisonBetweenOptionText',
    optionFallback: options.numericComparisonBetweenOptionText
  }];
}

;// ./src/layer-context.js


function createLayerContext({
  filterDialectCache,
  getViewer,
  includeExistingCqlFilter,
  layerFilterStates,
  layerSearchEnabled,
  localize,
  options,
  queryableOnly
}) {
  function getLayerType(layer) {
    return String(layer.get('type') || '').toUpperCase();
  }

  function getGroupChildLayers(layer) {
    if (!layer || typeof layer.get !== 'function' || getLayerType(layer) !== 'GROUP') return [];
    if (typeof layer.getLayers !== 'function') return [];

    const layers = layer.getLayers();
    if (!layers || typeof layers.getArray !== 'function') return [];
    return layers.getArray();
  }

  function getGroupDescendantLayers(layer) {
    return getGroupChildLayers(layer).reduce((descendants, childLayer) => {
      const childLayers = getGroupChildLayers(childLayer);
      if (childLayers.length > 0) {
        return descendants.concat(getGroupDescendantLayers(childLayer));
      }
      descendants.push(childLayer);
      return descendants;
    }, []);
  }

  function isExplicitlyFalse(value) {
    return value === false || String(value).toLowerCase() === 'false';
  }

  function isExplicitlyTrue(value) {
    return value === true || String(value).toLowerCase() === 'true';
  }

  function isLayerSearchEnabled(layer) {
    if (!layer || typeof layer.get !== 'function') return false;

    const layerValue = layer.get('layerSearchEnabled');
    if (isExplicitlyTrue(layerValue)) return true;
    if (isExplicitlyFalse(layerValue)) return false;
    return !isExplicitlyFalse(layerSearchEnabled);
  }

  function getSearchTargetLayers(layer) {
    const childLayers = getGroupChildLayers(layer);
    const targetLayers = childLayers.length > 0 ? getGroupDescendantLayers(layer) : [layer];
    return targetLayers.filter(targetLayer => targetLayer
      && typeof targetLayer.get === 'function'
      && isLayerSearchEnabled(targetLayer)
      && (!queryableOnly || targetLayer.get('queryable') !== false));
  }

  function isSearchingChildLayers(layer, searchTargetLayers = getSearchTargetLayers(layer)) {
    return searchTargetLayers.length !== 1 || searchTargetLayers[0] !== layer;
  }

  function hasQueryableSearchTarget(layer) {
    return getSearchTargetLayers(layer).some(targetLayer => targetLayer.get('queryable') === true);
  }

  function normalizeFilterDialect(value) {
    const normalizedValue = String(value || '').toLowerCase();
    if (normalizedValue === FILTER_DIALECTS.cql || normalizedValue === FILTER_DIALECTS.qgis) return normalizedValue;
    return undefined;
  }

  const defaultFilterDialect = normalizeFilterDialect(options.filterType);

  function getSourceName(layer) {
    return layer.get('sourceName') || layer.get('source');
  }

  function getSourceConfig(layer) {
    const sourceName = getSourceName(layer);
    if (!sourceName) return undefined;
    return getViewer().getMapSource()[sourceName];
  }

  function getSourceUrl(layer) {
    const sourceConfig = getSourceConfig(layer);
    if (sourceConfig && sourceConfig.url) return sourceConfig.url;

    const source = layer.getSource && layer.getSource();
    if (source && typeof source.getUrls === 'function') {
      const urls = source.getUrls();
      if (urls && urls.length > 0) return urls[0];
    }
    if (source && typeof source.getUrl === 'function') return source.getUrl();
    return undefined;
  }

  function getTypeName(layer) {
    return layer.get('id') || layer.get('name');
  }

  function getFilterableSource(layer) {
    const source = layer.getSource && layer.getSource();
    if (source && typeof source.getSource === 'function') return source.getSource();
    if (source && source.source) return source.source;
    return source;
  }

  function isLayerFilterable(layer) {
    if (!layer || typeof layer.get !== 'function') return false;
    if (isExplicitlyFalse(layer.get('filterable'))) return false;

    const sourceConfig = getSourceConfig(layer);
    if (sourceConfig && isExplicitlyFalse(sourceConfig.filterable)) return false;

    const source = getFilterableSource(layer);
    const sourceOptions = source && typeof source.getOptions === 'function'
      ? source.getOptions()
      : undefined;
    return !(sourceOptions && isExplicitlyFalse(sourceOptions.filterable));
  }

  function hasFilterableSearchTarget(layer) {
    return getSearchTargetLayers(layer).some(targetLayer => isLayerFilterable(targetLayer));
  }

  function getExplicitFilterDialect(layer) {
    const layerFilterDialect = normalizeFilterDialect(layer.get('filterType'));
    if (layerFilterDialect) return layerFilterDialect;

    const sourceConfig = getSourceConfig(layer);
    const sourceConfigFilterDialect = normalizeFilterDialect(sourceConfig && sourceConfig.filterType);
    if (sourceConfigFilterDialect) return sourceConfigFilterDialect;

    const source = getFilterableSource(layer);
    const sourceOptions = source && typeof source.getOptions === 'function'
      ? source.getOptions()
      : undefined;
    const sourceOptionFilterDialect = normalizeFilterDialect(sourceOptions && sourceOptions.filterType);
    if (sourceOptionFilterDialect === FILTER_DIALECTS.qgis) return sourceOptionFilterDialect;

    return defaultFilterDialect;
  }

  function getFilterDialectCacheKey(layer) {
    const sourceUrl = getSourceUrl(layer);
    if (!sourceUrl) return undefined;

    try {
      return `${new URL(sourceUrl, window.location.href).toString()}|${getTypeName(layer)}`;
    } catch {
      return `${sourceUrl}|${getTypeName(layer)}`;
    }
  }

  function setFilterDialectCache(layer, filterDialect) {
    const cacheKey = getFilterDialectCacheKey(layer);
    if (!cacheKey) return;
    if (filterDialect) {
      filterDialectCache[cacheKey] = filterDialect;
    } else {
      delete filterDialectCache[cacheKey];
    }
  }

  function getWmsLayerNames(layer) {
    const source = layer.getSource && layer.getSource();
    const params = source && typeof source.getParams === 'function' ? source.getParams() : {};
    return [
      params && params.LAYERS,
      getTypeName(layer),
      layer.get('name'),
      layer.get('id')
    ]
      .filter(Boolean)
      .flatMap(layerName => String(layerName).split(','))
      .map(layerName => layerName.trim())
      .filter((layerName, index, layerNames) => layerName && layerNames.indexOf(layerName) === index);
  }

  function extractQgisWmsFilterExpression(layer, filter) {
    const filterText = String(filter || '').trim();
    if (!filterText) return '';

    const layerNames = getWmsLayerNames(layer);
    const filterParts = filterText.split(';').map(filterPart => filterPart.trim()).filter(Boolean);
    if (filterParts.length === 1 && filterParts[0].indexOf(':') < 0) return filterParts[0];

    const matchingFilterPart = filterParts.find((filterPart) => {
      const separatorIndex = filterPart.indexOf(':');
      if (separatorIndex < 0) return false;

      const filterLayerNames = filterPart.substring(0, separatorIndex)
        .split(',')
        .map(filterLayerName => filterLayerName.trim());
      return filterLayerNames.some(filterLayerName => layerNames.includes(filterLayerName));
    });
    if (!matchingFilterPart) return '';

    return matchingFilterPart.substring(matchingFilterPart.indexOf(':') + 1).trim();
  }

  function readConfiguredFilter(layer, filterDialect = FILTER_DIALECTS.cql) {
    const filters = [];
    const source = layer.getSource && layer.getSource();
    const params = source && typeof source.getParams === 'function' ? source.getParams() : undefined;
    const filterableSource = getFilterableSource(layer);
    const sourceOptions = filterableSource && typeof filterableSource.getOptions === 'function'
      ? filterableSource.getOptions()
      : undefined;

    if (params && filterDialect === FILTER_DIALECTS.cql && params.CQL_FILTER) filters.push(params.CQL_FILTER);
    if (params && filterDialect === FILTER_DIALECTS.qgis && params.EXP_FILTER) filters.push(params.EXP_FILTER);
    if (params && filterDialect === FILTER_DIALECTS.qgis && params.FILTER) {
      const qgisWmsFilter = extractQgisWmsFilterExpression(layer, params.FILTER);
      if (qgisWmsFilter) filters.push(qgisWmsFilter);
    }
    if (sourceOptions && sourceOptions.filter) filters.push(sourceOptions.filter);
    if (layer.get('filter')) filters.push(layer.get('filter'));

    return filters
      .filter((filter, index, arr) => filter && arr.indexOf(filter) === index)
      .map(filter => `(${filter})`)
      .join(' AND ');
  }

  function getExistingFilter(layer, filterDialect = FILTER_DIALECTS.cql) {
    if (!includeExistingCqlFilter) return '';

    const state = layerFilterStates.get(layer);
    if (state && state.baseFilters && Object.prototype.hasOwnProperty.call(state.baseFilters, filterDialect)) {
      return state.baseFilters[filterDialect];
    }

    return readConfiguredFilter(layer, filterDialect);
  }

  function combineWithExistingFilter(layer, filterDialect, filter) {
    const existingFilter = getExistingFilter(layer, filterDialect);
    return existingFilter ? `${existingFilter} AND ${filter}` : filter;
  }

  function isSecureLayer(layer) {
    return Boolean(layer && typeof layer.get === 'function' && layer.get('secure'));
  }

  function getLayerVisibilityIcon(layer) {
    if (isSecureLayer(layer)) return '#ic_lock_outline_24px';
    return layer.getVisible() ? '#ic_check_circle_24px' : '#ic_radio_button_unchecked_24px';
  }

  function getLayerVisibilityLabel(layer) {
    if (isSecureLayer(layer)) return localize('layerLockedTitle', options.layerLockedTitle);
    return layer.getVisible()
      ? localize('layerVisibleTitle', options.layerVisibleTitle)
      : localize('layerHiddenTitle', options.layerHiddenTitle);
  }

  function toggleLayerVisibility(layer) {
    if (
      !layer
      || isSecureLayer(layer)
      || typeof layer.getVisible !== 'function'
      || typeof layer.setVisible !== 'function'
    ) return;

    const viewer = getViewer();
    const visible = layer.getVisible();
    const layerGroup = layer.get('group');
    const groupExclusive = viewer.getGroup(layerGroup) && viewer.getGroup(layerGroup).exclusive;
    if (!visible && groupExclusive) {
      const layers = viewer.getLayersByProperty('group', layerGroup);
      layers.forEach(l => l.setVisible(false));
    }
    layer.setVisible(!visible);
  }

  return {
    combineWithExistingFilter,
    extractQgisWmsFilterExpression,
    getExplicitFilterDialect,
    getFilterableSource,
    getFilterDialectCacheKey,
    getGroupChildLayers,
    getGroupDescendantLayers,
    getLayerType,
    getLayerVisibilityIcon,
    getLayerVisibilityLabel,
    getSearchTargetLayers,
    getSourceConfig,
    getSourceUrl,
    getTypeName,
    getWmsLayerNames,
    hasFilterableSearchTarget,
    hasQueryableSearchTarget,
    isLayerFilterable,
    isLayerSearchEnabled,
    isSearchingChildLayers,
    isSecureLayer,
    readConfiguredFilter,
    setFilterDialectCache,
    toggleLayerVisibility
  };
}

;// ./src/attribute-discovery.js
function createAttributeDiscovery({
  applyConfiguredAttributeMetadata,
  attributeCache,
  attributeRequestCache,
  createWfsUrl,
  getAttributeCacheKey,
  getConfiguredAttributes,
  getConfiguredSearchAttributes,
  getLocalFeatures,
  getPluginGeneration,
  getSearchTargetLayers,
  getSourceUrl,
  getTypeFromXsd,
  getTypeName,
  getValueType,
  getViewer,
  hasMissingConfiguredAttributes,
  hasUnknownAttributeTypes,
  isClientFeatureLayer,
  isSearchableAttribute,
  isSearchingChildLayers,
  loadClientFeatures,
  mergeAttributes,
  name,
  requestJson,
  searchableAttributesMode
}) {
  async function discoverAttributesFromSample(layer) {
    const url = createWfsUrl(layer, {
      outputFormat: 'application/json',
      srsName: getViewer().getProjectionCode(),
      maxFeatures: 1
    });

    if (!url) return [];

    const json = await requestJson(url);
    const feature = json.features && json.features[0];
    if (!feature || !feature.properties) return [];

    return Object.keys(feature.properties)
      .map(attributeName => ({
        name: attributeName,
        type: getValueType(feature.properties[attributeName])
      }))
      .filter(attribute => isSearchableAttribute(attribute, layer));
  }

  function hasSearchableLayerData(layer) {
    return getSearchTargetLayers(layer).some(targetLayer => (
      isClientFeatureLayer(targetLayer)
      || getSourceUrl(targetLayer)
      || getLocalFeatures(targetLayer).length > 0
    ));
  }

  function getFeatureProperties(feature) {
    if (!feature || typeof feature.getProperties !== 'function') return {};

    const properties = Object.assign({}, feature.getProperties());
    const geometryName = typeof feature.getGeometryName === 'function' ? feature.getGeometryName() : 'geometry';
    delete properties[geometryName];
    delete properties.geometry;
    return properties;
  }

  function discoverAttributesFromLocalFeatures(layer) {
    const feature = getLocalFeatures(layer)[0];
    const properties = getFeatureProperties(feature);

    return Object.keys(properties)
      .map(attributeName => ({
        name: attributeName,
        type: getValueType(properties[attributeName])
      }))
      .filter(attribute => isSearchableAttribute(attribute, layer));
  }

  async function discoverAttributesFromDescribeFeatureType(layer) {
    const url = createWfsUrl(layer, { request: 'DescribeFeatureType' });
    if (!url) return [];

    const response = await fetch(url, { method: 'GET' });
    const text = await response.text();
    if (!response.ok) return [];

    const doc = new DOMParser().parseFromString(text, 'application/xml');
    const typeName = getTypeName(layer).split(':').pop();
    const complexTypes = Array.from(doc.getElementsByTagNameNS('*', 'complexType'));
    const complexType = complexTypes.find((item) => {
      const complexTypeName = item.getAttribute('name') || '';
      return complexTypeName === `${typeName}Type` || complexTypeName.toLowerCase().includes(typeName.toLowerCase());
    });
    const elements = complexType
      ? Array.from(complexType.getElementsByTagNameNS('*', 'element'))
      : Array.from(doc.getElementsByTagNameNS('*', 'element'))
        .filter(element => !element.getAttribute('substitutionGroup') && element.getAttribute('name') !== typeName);

    return elements
      .map((element) => ({
        name: element.getAttribute('name'),
        type: getTypeFromXsd(element.getAttribute('type') || '')
      }))
      .filter(attribute => isSearchableAttribute(attribute, layer));
  }

  async function discoverWfsAttributes(layer, cacheKey, configuredAttributes = []) {
    let attributes = [];
    try {
      attributes = await discoverAttributesFromDescribeFeatureType(layer);
    } catch (error) {
      console.warn(`${name}: DescribeFeatureType attribute discovery failed for ${cacheKey}`, error);
    }

    if (
      attributes.length === 0
      || hasUnknownAttributeTypes(attributes)
      || hasMissingConfiguredAttributes(attributes, configuredAttributes)
    ) {
      try {
        attributes = mergeAttributes(
          attributes,
          await discoverAttributesFromSample(layer)
        );
      } catch (error) {
        console.warn(`${name}: sample attribute discovery failed for ${cacheKey}`, error);
      }
    }

    return attributes;
  }

  async function discoverAttributes(layer) {
    const searchTargetLayers = getSearchTargetLayers(layer);
    if (searchTargetLayers.length === 0) return [];
    if (isSearchingChildLayers(layer, searchTargetLayers)) {
      const attributeLists = await Promise.all(searchTargetLayers.map(searchTargetLayer => discoverAttributes(searchTargetLayer)));
      return mergeAttributes(...attributeLists);
    }

    const configuredAttributes = getConfiguredAttributes(layer);
    const useConfiguredAttributesOnly = searchableAttributesMode === 'layer' && configuredAttributes.length > 0;
    const cacheKey = getAttributeCacheKey(layer, configuredAttributes);
    if (attributeCache[cacheKey]) return attributeCache[cacheKey];
    if (attributeRequestCache[cacheKey]) return attributeRequestCache[cacheKey];

    const cacheGeneration = getPluginGeneration();
    const attributeRequest = (async () => {
      let discoveredAttributes = [];
      try {
        if (isClientFeatureLayer(layer)) {
          await loadClientFeatures(layer);
          discoveredAttributes = discoverAttributesFromLocalFeatures(layer);

          const attributes = useConfiguredAttributesOnly
            ? getConfiguredSearchAttributes(configuredAttributes, discoveredAttributes)
            : mergeAttributes(configuredAttributes, discoveredAttributes);

          if (cacheGeneration === getPluginGeneration()) attributeCache[cacheKey] = attributes;
          return attributes;
        }

        if (getSourceUrl(layer)) {
          discoveredAttributes = await discoverWfsAttributes(
            layer,
            cacheKey,
            useConfiguredAttributesOnly ? configuredAttributes : []
          );

          const attributes = useConfiguredAttributesOnly
            ? getConfiguredSearchAttributes(configuredAttributes, discoveredAttributes)
            : applyConfiguredAttributeMetadata(discoveredAttributes, configuredAttributes);

          if (cacheGeneration === getPluginGeneration()) attributeCache[cacheKey] = attributes;
          return attributes;
        }

        if (useConfiguredAttributesOnly) {
          const attributes = getConfiguredSearchAttributes(
            configuredAttributes,
            discoverAttributesFromLocalFeatures(layer)
          );

          if (cacheGeneration === getPluginGeneration()) attributeCache[cacheKey] = attributes;
          return attributes;
        }

        let attributes = mergeAttributes(configuredAttributes, discoveredAttributes);

        if (attributes.length === 0) {
          attributes = discoverAttributesFromLocalFeatures(layer);
        }

        if (attributes.length === 0) {
          try {
            attributes = mergeAttributes(
              attributes,
              await discoverAttributesFromSample(layer)
            );
          } catch (error) {
            console.warn(`${name}: sample attribute discovery failed for ${cacheKey}`, error);
          }
        }

        if (cacheGeneration === getPluginGeneration()) attributeCache[cacheKey] = attributes;
        return attributes;
      } finally {
        if (attributeRequestCache[cacheKey] === attributeRequest) {
          delete attributeRequestCache[cacheKey];
        }
      }
    })();

    attributeRequestCache[cacheKey] = attributeRequest;
    return attributeRequest;
  }

  async function getSearchAttributesForTargetLayer(targetLayer, attributes) {
    const requestedAttributeNames = new Set(attributes.map(attribute => attribute.name));
    const targetAttributes = await discoverAttributes(targetLayer);
    return targetAttributes.filter(attribute => requestedAttributeNames.has(attribute.name));
  }

  return {
    discoverAttributes,
    getFeatureProperties,
    getLocalFeatures,
    getSearchAttributesForTargetLayer,
    hasSearchableLayerData
  };
}

;// ./src/attributes.js
function createAttributeService({
  attributeDisplayCollator,
  getTypeName,
  searchableAttributesMode
}) {
  function getValueType(value) {
    if (value === null || value === undefined) return 'unknown';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    if (typeof value === 'string') return 'string';
    return 'unknown';
  }

  function getTypeFromXsd(type = '') {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('gml:') || lowerType.includes('geometry')) return 'geometry';
    if (lowerType.includes('string') || lowerType.includes('char') || lowerType.includes('text') || lowerType.includes('uri')) return 'string';
    if (lowerType.includes('int') || lowerType.includes('decimal') || lowerType.includes('double') || lowerType.includes('float') || lowerType.includes('long') || lowerType.includes('short') || lowerType.includes('byte')) return 'number';
    if (lowerType.includes('boolean')) return 'boolean';
    if (lowerType.includes('date') || lowerType.includes('time')) return 'date';
    return 'unknown';
  }

  function getGeometryNames(layer) {
    return [layer.get('geometryName'), 'geom', 'the_geom', 'geometry']
      .filter(Boolean)
      .map(value => value.toLowerCase());
  }

  function isSearchableAttribute(attribute, layer) {
    if (!attribute || !attribute.name) return false;
    if (attribute.type === 'geometry') return false;
    return !getGeometryNames(layer).includes(attribute.name.toLowerCase());
  }

  function getAttributeTitle(attribute) {
    if (!attribute || attribute.title === undefined || attribute.title === null) return '';
    return String(attribute.title).trim();
  }

  function getAttributeDisplayName(attribute) {
    return getAttributeTitle(attribute) || (attribute && attribute.name ? attribute.name : '');
  }

  function getAttributeByName(attributes, attributeName) {
    if (!Array.isArray(attributes) || !attributeName) return undefined;
    return attributes.find(attribute => attribute && attribute.name === attributeName);
  }

  function compareAttributeDisplayNames(a, b) {
    const firstDisplayName = getAttributeDisplayName(a);
    const secondDisplayName = getAttributeDisplayName(b);
    const displayNameComparison = attributeDisplayCollator
      ? attributeDisplayCollator.compare(firstDisplayName, secondDisplayName)
      : firstDisplayName.localeCompare(secondDisplayName, 'sv');

    if (displayNameComparison !== 0) return displayNameComparison;

    const firstAttributeName = a && a.name ? a.name : '';
    const secondAttributeName = b && b.name ? b.name : '';
    return attributeDisplayCollator
      ? attributeDisplayCollator.compare(firstAttributeName, secondAttributeName)
      : firstAttributeName.localeCompare(secondAttributeName, 'sv');
  }

  function getSortedAttributes(attributes) {
    return attributes.slice().sort(compareAttributeDisplayNames);
  }

  function getConfiguredAttributeCachePart(attribute) {
    return [
      attribute.name,
      attribute.type || 'unknown',
      getAttributeTitle(attribute)
    ].map(value => encodeURIComponent(value)).join(':');
  }

  function getConfiguredAttributes(layer) {
    const attributes = Array.isArray(layer.get('attributes')) ? layer.get('attributes') : [];
    return attributes
      .filter(attribute => attribute && attribute.name)
      .map((attribute) => {
        const configuredAttribute = {
          name: attribute.name,
          type: attribute.type || 'unknown'
        };
        const attributeTitle = getAttributeTitle(attribute);
        if (attributeTitle) configuredAttribute.title = attributeTitle;
        return configuredAttribute;
      })
      .filter(attribute => isSearchableAttribute(attribute, layer));
  }

  function getAttributeCacheKey(layer, configuredAttributes) {
    const configuredAttributesKey = configuredAttributes.map(getConfiguredAttributeCachePart).join('|');
    if (searchableAttributesMode !== 'layer' || configuredAttributes.length === 0) {
      return configuredAttributesKey
        ? `all:${getTypeName(layer)}:${configuredAttributesKey}`
        : `all:${getTypeName(layer)}`;
    }
    return `layer:${getTypeName(layer)}:${configuredAttributesKey}`;
  }

  function getConfiguredAttributesMatchingDiscoveredAttributes(configuredAttributes, discoveredAttributes) {
    return configuredAttributes
      .map((configuredAttribute) => {
        const discoveredAttribute = getAttributeByName(discoveredAttributes, configuredAttribute.name);
        if (!discoveredAttribute) return undefined;
        const configuredAttributeTitle = getAttributeTitle(configuredAttribute);
        const discoveredAttributeTitle = getAttributeTitle(discoveredAttribute);
        const matchedAttribute = {
          name: discoveredAttribute.name,
          type: discoveredAttribute.type && discoveredAttribute.type !== 'unknown'
            ? discoveredAttribute.type
            : configuredAttribute.type || discoveredAttribute.type || 'unknown'
        };
        if (configuredAttributeTitle || discoveredAttributeTitle) {
          matchedAttribute.title = configuredAttributeTitle || discoveredAttributeTitle;
        }
        return matchedAttribute;
      })
      .filter(Boolean);
  }

  function hasMissingConfiguredAttributes(attributes, configuredAttributes) {
    return configuredAttributes.some(configuredAttribute => !getAttributeByName(attributes, configuredAttribute.name));
  }

  function hasUnknownAttributeTypes(attributes) {
    return attributes.some(attribute => attribute.type === 'unknown');
  }

  function mergeAttributes(...attributeLists) {
    const attributesByName = {};

    attributeLists.flat().forEach((attribute) => {
      if (!attribute || !attribute.name) return;

      const currentAttribute = attributesByName[attribute.name];
      if (!currentAttribute) {
        const mergedAttribute = {
          name: attribute.name,
          type: attribute.type || 'unknown'
        };
        const attributeTitle = getAttributeTitle(attribute);
        if (attributeTitle) mergedAttribute.title = attributeTitle;
        attributesByName[attribute.name] = mergedAttribute;
        return;
      }

      if (currentAttribute.type === 'unknown' && attribute.type && attribute.type !== 'unknown') currentAttribute.type = attribute.type;
      if (!getAttributeTitle(currentAttribute)) {
        const attributeTitle = getAttributeTitle(attribute);
        if (attributeTitle) currentAttribute.title = attributeTitle;
      }
    });

    return Object.keys(attributesByName).map(attributeName => attributesByName[attributeName]);
  }

  function getConfiguredSearchAttributes(configuredAttributes, discoveredAttributes) {
    return getConfiguredAttributesMatchingDiscoveredAttributes(configuredAttributes, discoveredAttributes);
  }

  function applyConfiguredAttributeMetadata(discoveredAttributes, configuredAttributes) {
    return mergeAttributes(
      discoveredAttributes,
      getConfiguredAttributesMatchingDiscoveredAttributes(configuredAttributes, discoveredAttributes)
    );
  }

  return {
    applyConfiguredAttributeMetadata,
    getAttributeByName,
    getAttributeCacheKey,
    getAttributeDisplayName,
    getAttributeTitle,
    getConfiguredAttributes,
    getConfiguredAttributesMatchingDiscoveredAttributes,
    getConfiguredSearchAttributes,
    getSortedAttributes,
    getTypeFromXsd,
    getValueType,
    hasMissingConfiguredAttributes,
    hasUnknownAttributeTypes,
    isSearchableAttribute,
    mergeAttributes
  };
}

;// ./src/layer-filter-adapters.js
function createLayerFilterAdapters({
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

;// ./src/layer-filter-indicators.js
function createLayerFilterIndicators({
  getLegend,
  getViewer,
  layerFilterActiveClass,
  pluginLayerFilterActiveClass
}) {
  function normalizeLegendText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function getLayerLegendLabels(layer) {
    if (!layer || typeof layer.get !== 'function') return [];
    const displayLabels = [layer.get('title'), layer.get('name')]
      .map(normalizeLegendText)
      .filter(Boolean);
    if (displayLabels.length > 0) return displayLabels;
    return [layer.get('id')].map(normalizeLegendText).filter(Boolean);
  }

  function getLegendIconButton(itemEl) {
    if (!itemEl || typeof itemEl.querySelectorAll !== 'function') return undefined;
    return Array.from(itemEl.querySelectorAll('button')).find(button => (
      button.classList.contains('round')
      && button.classList.contains('compact')
      && button.classList.contains('icon-small')
      && !button.classList.contains('o-layer_search_filter__action-button')
    ));
  }

  function collectLayerLegendIconElements(component, layer, iconElements, seenComponents) {
    if (!component || seenComponents.has(component)) return;
    seenComponents.add(component);

    if (
      typeof component.getLayer === 'function'
      && component.getLayer() === layer
      && typeof component.getId === 'function'
    ) {
      const itemEl = document.getElementById(component.getId());
      const iconEl = getLegendIconButton(itemEl);
      if (iconEl && !iconElements.includes(iconEl)) iconElements.push(iconEl);
    }

    if (typeof component.getComponents === 'function') {
      component.getComponents().forEach(childComponent => collectLayerLegendIconElements(
        childComponent,
        layer,
        iconElements,
        seenComponents
      ));
    }
  }

  function findLayerLegendIconElementsByText(layer) {
    const labels = getLayerLegendLabels(layer);
    if (labels.length === 0) return [];

    const legendItems = Array.from(document.querySelectorAll('.o-legend li'));
    return legendItems.reduce((iconElements, itemEl) => {
      const itemText = normalizeLegendText(itemEl.textContent);
      const isLayerItem = labels.some(label => (
        itemText === label || itemText.indexOf(label) !== -1
      ));
      const iconEl = isLayerItem ? getLegendIconButton(itemEl) : undefined;
      if (iconEl && !iconElements.includes(iconEl)) iconElements.push(iconEl);
      return iconElements;
    }, []);
  }

  function findLayerLegendIconElements(layer) {
    if (typeof document === 'undefined') return [];

    const iconElements = [];
    const seenComponents = new Set();
    const legendControl = getLegend() || (getViewer() && typeof getViewer().getControlByName === 'function'
      ? getViewer().getControlByName('legend')
      : undefined);
    const legendRoots = [legendControl];

    if (legendControl && typeof legendControl.getOverlays === 'function') {
      legendRoots.push(legendControl.getOverlays());
    }
    if (legendControl && typeof legendControl.getLayerSwitcherCmp === 'function') {
      legendRoots.push(legendControl.getLayerSwitcherCmp());
    }

    legendRoots.forEach(rootComponent => collectLayerLegendIconElements(
      rootComponent,
      layer,
      iconElements,
      seenComponents
    ));

    if (iconElements.length > 0) return iconElements;
    return findLayerLegendIconElementsByText(layer);
  }

  function syncLayerFilterLegendIndicators(layer, active) {
    findLayerLegendIconElements(layer).forEach((iconEl) => {
      iconEl.classList.toggle(layerFilterActiveClass, active);
      iconEl.classList.toggle(pluginLayerFilterActiveClass, active);
      if (active) {
        iconEl.setAttribute('data-layer-search-filter-active', 'true');
      } else {
        iconEl.removeAttribute('data-layer-search-filter-active');
      }
    });
  }

  function scheduleLayerFilterLegendIndicatorSync(layer, active) {
    syncLayerFilterLegendIndicators(layer, active);
    if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') {
      window.setTimeout(() => syncLayerFilterLegendIndicators(layer, active), 0);
    }
  }

  function setLayerFilterActive(layer, active) {
    if (layer && typeof layer.set === 'function') {
      layer.set('filterActive', active);
      scheduleLayerFilterLegendIndicatorSync(layer, active);
    }
  }

  return {
    scheduleLayerFilterLegendIndicatorSync,
    setLayerFilterActive
  };
}

;// ./src/layer-filter.js



function createLayerFilterService({
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

;// ./src/local-feature-source.js
function createLocalFeatureSource({
  getFilterableSource,
  getLayerType,
  getSourceConfig,
  getViewer,
  loadRequestCache,
  name
}) {
  const loadRetrySources = new WeakSet();
  const loadTimeout = 15000;

  function getLocalFeatures(layer) {
    const source = getFilterableSource(layer);
    if (!source || typeof source.getFeatures !== 'function') return [];
    return source.getFeatures();
  }

  function isClientFeatureLayer(layer) {
    if (!layer || typeof layer.get !== 'function') return false;
    if (getLayerType(layer) !== 'GEOJSON') return false;

    const source = getFilterableSource(layer);
    return Boolean(source && typeof source.getFeatures === 'function');
  }

  function hasLoadableClientFeatureSource(layer) {
    if (!isClientFeatureLayer(layer)) return false;

    const source = getFilterableSource(layer);
    if (!source || typeof source.loadFeatures !== 'function') return false;

    const sourceName = layer.get('sourceName');
    const sourceConfig = getSourceConfig(layer);
    return Boolean(
      (sourceConfig && sourceConfig.url)
      || (sourceName && String(sourceName).toLowerCase() !== 'none')
    );
  }

  function getLoadParameters() {
    const viewer = getViewer();
    const map = viewer.getMap();
    const view = map.getView();
    const mapSize = typeof map.getSize === 'function' ? map.getSize() : undefined;
    const configuredExtent = typeof viewer.getExtent === 'function' ? viewer.getExtent() : undefined;
    const extent = mapSize && typeof view.calculateExtent === 'function'
      ? view.calculateExtent(mapSize)
      : configuredExtent || [0, 0, 0, 0];

    return {
      extent,
      projection: typeof view.getProjection === 'function' ? view.getProjection() : undefined,
      resolution: typeof view.getResolution === 'function' ? view.getResolution() : undefined
    };
  }

  function removeLoadListener(source, eventName, listener) {
    if (typeof source.un === 'function') source.un(eventName, listener);
  }

  function loadClientFeatures(layer) {
    const loadedFeatures = getLocalFeatures(layer);
    if (loadedFeatures.length > 0 || !hasLoadableClientFeatureSource(layer)) {
      return Promise.resolve(loadedFeatures);
    }

    const source = getFilterableSource(layer);
    const pendingRequest = loadRequestCache.get(source);
    if (pendingRequest) return pendingRequest;

    const loadRequest = new Promise((resolve, reject) => {
      let settled = false;
      let loadTimer;
      let onLoadEnd;
      let onLoadError;

      const cleanup = () => {
        if (loadTimer) clearTimeout(loadTimer);
        removeLoadListener(source, 'featuresloadend', onLoadEnd);
        removeLoadListener(source, 'featuresloaderror', onLoadError);
      };
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        cleanup();
        callback(value);
      };
      onLoadEnd = () => {
        loadRetrySources.delete(source);
        finish(resolve, getLocalFeatures(layer));
      };
      onLoadError = (error) => {
        loadRetrySources.add(source);
        finish(
          reject,
          error instanceof Error ? error : new Error(`${name}: GeoJSON feature loading failed`)
        );
      };

      if (typeof source.on !== 'function') {
        resolve(loadedFeatures);
        return;
      }

      source.on('featuresloadend', onLoadEnd);
      source.on('featuresloaderror', onLoadError);
      loadTimer = setTimeout(() => {
        onLoadError(new Error(`${name}: GeoJSON feature loading timed out`));
      }, loadTimeout);

      if (source.loading && !loadRetrySources.has(source)) return;

      try {
        if (typeof source.refresh === 'function') source.refresh();
        const { extent, resolution, projection } = getLoadParameters();
        source.loadFeatures(extent, resolution, projection);

        if (!source.loading && getLocalFeatures(layer).length > 0) onLoadEnd();
      } catch (error) {
        onLoadError(error);
      }
    });

    const cachedRequest = loadRequest.finally(() => {
      loadRequestCache.delete(source);
    });
    loadRequestCache.set(source, cachedRequest);
    return cachedRequest;
  }

  return {
    getLocalFeatures,
    isClientFeatureLayer,
    loadClientFeatures
  };
}

;// ./src/map-results.js
function createMapResultsService({
  Origo,
  defaultHighlightStyleOptions,
  defaultNumericComparisonMode,
  defaultSearchMode,
  defaultTextMatchMode,
  featureInfoForResultsLimit,
  getFeatureInfo,
  getSearchOperatorFromModes,
  getViewer,
  highlightOnSubmit,
  highlightStyleOptions,
  highlightZIndex,
  localization,
  limit,
  maxZoomLevel,
  name,
  normalizeFeatureLimit,
  searchLayerWithFallback,
  zoomOnSubmit,
  zoomPadding,
  zoomToExtentLimit
}) {
  let highlightSource;
  let highlightLayer;
  let highlightStyles;
  function isValidExtent(extent) {
    return extent && extent.length === 4 && extent.every(Number.isFinite);
  }

  function extendExtent(targetExtent, sourceExtent) {
    return [
      Math.min(targetExtent[0], sourceExtent[0]),
      Math.min(targetExtent[1], sourceExtent[1]),
      Math.max(targetExtent[2], sourceExtent[2]),
      Math.max(targetExtent[3], sourceExtent[3])
    ];
  }

  function getFeaturesExtent(features) {
    let extent;
    features.forEach((feature) => {
      const geometry = feature && typeof feature.getGeometry === 'function' ? feature.getGeometry() : undefined;
      const featureExtent = geometry && typeof geometry.getExtent === 'function' ? geometry.getExtent() : undefined;
      if (!isValidExtent(featureExtent)) return;

      if (!extent) {
        extent = featureExtent.slice();
      } else {
        extent = extendExtent(extent, featureExtent);
      }
    });
    return extent;
  }

  function zoomToFeatures(features) {
    const extent = getFeaturesExtent(features);
    if (!isValidExtent(extent)) return false;

    const fitOptions = {};
    const level = maxZoomLevel || getViewer().getResolutions().length - 2;
    if (zoomPadding) fitOptions.padding = zoomPadding;
    if (level !== undefined) fitOptions.maxZoom = level;

    getViewer().getMap().getView().fit(extent, fitOptions);
    return true;
  }

  function getHighlightStyles() {
    if (!highlightStyles) {
      highlightStyles = Origo.Style.createGeometryStyle({
        Point: highlightStyleOptions.Point || defaultHighlightStyleOptions.Point,
        LineString: highlightStyleOptions.LineString || defaultHighlightStyleOptions.LineString,
        Polygon: highlightStyleOptions.Polygon || defaultHighlightStyleOptions.Polygon
      });
    }
    return highlightStyles;
  }

  function getHighlightStyle(feature) {
    const geometry = feature && typeof feature.getGeometry === 'function' ? feature.getGeometry() : undefined;
    const geometryType = geometry && typeof geometry.getType === 'function' ? geometry.getType() : 'Point';
    const styles = getHighlightStyles();
    return styles[geometryType] || styles.Point;
  }

  function ensureHighlightLayer({ force = false } = {}) {
    if (!force && !highlightOnSubmit) return undefined;
    if (!highlightLayer) {
      highlightLayer = Origo.featurelayer(null, getViewer().getMap());
      highlightSource = highlightLayer.getFeatureStore();
      highlightLayer.setStyle(getHighlightStyle);
      highlightLayer.getFeatureLayer().setZIndex(highlightZIndex);
    }
    return highlightLayer;
  }

  function clearHighlightedFeatures() {
    if (highlightSource) {
      highlightSource.clear();
    }
  }

  function destroyHighlightLayer() {
    clearHighlightedFeatures();
    if (highlightLayer && typeof highlightLayer.getFeatureLayer === 'function') {
      const featureLayer = highlightLayer.getFeatureLayer();
      if (featureLayer && typeof featureLayer.setMap === 'function') {
        featureLayer.setMap(null);
      }
    }
    highlightLayer = undefined;
    highlightSource = undefined;
  }

  function cloneFeatureForHighlight(feature) {
    if (!feature || typeof feature.clone !== 'function') return feature;
    const clone = feature.clone();
    clone.setId(feature.getId());
    return clone;
  }

  function setHighlightedFeatures(features = [], { force = false } = {}) {
    if (!force && !highlightOnSubmit) return;
    ensureHighlightLayer({ force });
    clearHighlightedFeatures();
    features.forEach((feature) => {
      const highlightFeature = cloneFeatureForHighlight(feature);
      if (highlightFeature) highlightSource.addFeature(highlightFeature);
    });
  }

  function canOpenFeatureInfo(layer) {
    return Boolean(getFeatureInfo() && layer && typeof layer.get === 'function' && layer.get('queryable') === true);
  }

  function getFeatureInfoGroups(layer, results) {
    const groups = [];
    const groupsByLayerName = new Map();
    if (!results || !Array.isArray(results.features)) return groups;

    const resultLayers = Array.isArray(results.layers) ? results.layers : [];
    results.features.forEach((feature, index) => {
      const resultLayer = resultLayers[index] || layer;
      if (!feature || !canOpenFeatureInfo(resultLayer)) return;

      const layerName = resultLayer.get('name');
      if (!layerName) return;

      let group = groupsByLayerName.get(layerName);
      if (!group) {
        group = {
          layer: resultLayer,
          features: []
        };
        groupsByLayerName.set(layerName, group);
        groups.push(group);
      }
      group.features.push(feature);
    });

    return groups.filter(group => group.features.length > 0);
  }

  function getFeatureInfoCoordinate(features) {
    const firstFeature = features.find(feature => feature && typeof feature.getGeometry === 'function');
    const geometry = firstFeature && firstFeature.getGeometry();
    if (!geometry) return undefined;

    if (typeof geometry.getType === 'function' && geometry.getType() === 'Point' && typeof geometry.getCoordinates === 'function') {
      return geometry.getCoordinates();
    }

    const extent = getFeaturesExtent([firstFeature]);
    return isValidExtent(extent)
      ? [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2]
      : undefined;
  }

  function createSelectedItemsFromGroups(groups) {
    const featureInfoApi = Origo.getFeatureInfo;
    if (!featureInfoApi || typeof featureInfoApi.createSelectedItem !== 'function') return [];

    const map = getViewer().getMap();
    const groupLayers = typeof getViewer().getGroupLayers === 'function' ? getViewer().getGroupLayers() : [];
    const selectedItems = [];
    groups.forEach((group) => {
      group.features.forEach((feature) => {
        const item = featureInfoApi.createSelectedItem(feature, group.layer, map, groupLayers, localization);
        if (item) selectedItems.push(item);
      });
    });
    return selectedItems;
  }

  async function renderFeatureInfoGroups(groups) {
    if (!getFeatureInfo() || typeof getFeatureInfo().render !== 'function') return 0;

    const selectedItems = createSelectedItemsFromGroups(groups);
    if (selectedItems.length === 0) return 0;

    try {
      await Promise.all(selectedItems.map(item => (typeof item.createContentAsync === 'function' ? item.createContentAsync() : undefined)));
    } catch (error) {
      console.warn(`${name}: feature info content failed for result action`, error);
    }

    const features = groups.reduce((allFeatures, group) => allFeatures.concat(group.features), []);
    getFeatureInfo().render(selectedItems, 'infowindow', getFeatureInfoCoordinate(features), {
      ignorePan: true,
      suppressDialog: false
    });
    return selectedItems.length;
  }

  async function openFeatureInfoForResults(layer, results) {
    const groups = getFeatureInfoGroups(layer, results);
    if (groups.length === 0) return 0;

    return renderFeatureInfoGroups(groups);
  }

  function limitSearchResults(results, maxFeatures) {
    if (!results || !Array.isArray(results.features)) return results;
    if (results.features.length <= maxFeatures) return results;

    return {
      ...results,
      features: results.features.slice(0, maxFeatures),
      jsonFeatures: Array.isArray(results.jsonFeatures) ? results.jsonFeatures.slice(0, maxFeatures) : results.jsonFeatures,
      layers: Array.isArray(results.layers) ? results.layers.slice(0, maxFeatures) : results.layers,
      attributes: Array.isArray(results.attributes) ? results.attributes.slice(0, maxFeatures) : results.attributes
    };
  }

  async function getExpandedSearchResults(
    layer,
    searchText,
    attributes,
    suggestionResults,
    actionName,
    resultLimit = zoomToExtentLimit,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchModeValue = defaultSearchMode,
    rangeEndText = '',
    searchOperatorValue = getSearchOperatorFromModes(searchModeValue, matchMode, comparisonMode)
  ) {
    const maxFeatures = normalizeFeatureLimit(resultLimit, limit);
    let expandedResults = suggestionResults;
    const mayHaveMoreResults = suggestionResults.features.length >= limit;
    if (maxFeatures > limit && mayHaveMoreResults) {
      try {
        expandedResults = await searchLayerWithFallback(
          layer,
          searchText,
          attributes,
          maxFeatures,
          matchMode,
          comparisonMode,
          searchModeValue,
          rangeEndText,
          searchOperatorValue
        );
      } catch (error) {
        console.warn(`${name}: ${actionName} search failed, using suggestion results`, error);
      }
    }

    return limitSearchResults(expandedResults, maxFeatures);
  }

  async function zoomToSearchResults(
    layer,
    searchText,
    attributes,
    suggestionResults,
    isCurrent,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchModeValue = defaultSearchMode,
    rangeEndText = '',
    searchOperatorValue = getSearchOperatorFromModes(searchModeValue, matchMode, comparisonMode)
  ) {
    if (
      (!zoomOnSubmit && !highlightOnSubmit)
      || !suggestionResults
      || suggestionResults.features.length === 0
    ) return undefined;
    if (isCurrent && !isCurrent()) return undefined;

    const zoomResults = await getExpandedSearchResults(
      layer,
      searchText,
      attributes,
      suggestionResults,
      'zoom',
      zoomToExtentLimit,
      matchMode,
      comparisonMode,
      searchModeValue,
      rangeEndText,
      searchOperatorValue
    );

    if (!isCurrent || isCurrent()) {
      setHighlightedFeatures(zoomResults.features);
      if (zoomOnSubmit) zoomToFeatures(zoomResults.features);
      return zoomResults.features.length;
    }

    return undefined;
  }

  async function showFeatureInfoForSearchResults(
    layer,
    searchText,
    attributes,
    suggestionResults,
    isCurrent,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchModeValue = defaultSearchMode,
    rangeEndText = '',
    searchOperatorValue = getSearchOperatorFromModes(searchModeValue, matchMode, comparisonMode)
  ) {
    if (!suggestionResults || suggestionResults.features.length === 0) {
      return {
        count: 0,
        limit: normalizeFeatureLimit(featureInfoForResultsLimit, limit),
        limitReached: false
      };
    }
    if (isCurrent && !isCurrent()) return undefined;

    const infoResults = await getExpandedSearchResults(
      layer,
      searchText,
      attributes,
      suggestionResults,
      'feature info',
      featureInfoForResultsLimit,
      matchMode,
      comparisonMode,
      searchModeValue,
      rangeEndText,
      searchOperatorValue
    );

    if (!isCurrent || isCurrent()) {
      const resultLimit = normalizeFeatureLimit(featureInfoForResultsLimit, limit);
      const count = await openFeatureInfoForResults(layer, infoResults);
      return {
        count,
        limit: resultLimit,
        limitReached: count >= resultLimit
      };
    }

    return undefined;
  }

  return {
    canOpenFeatureInfo,
    clearHighlightedFeatures,
    cloneFeatureForHighlight,
    destroyHighlightLayer,
    getHighlightStyle,
    setHighlightedFeatures,
    showFeatureInfoForSearchResults,
    zoomToFeatures,
    zoomToSearchResults
  };
}

;// ./src/search-filter.js


function createSearchFilter({
  defaultNumericComparisonMode,
  defaultSearchMode,
  defaultSearchOperator,
  defaultTextMatchMode,
  getSortedAttributes,
  localize,
  minLength,
  numericComparisonBetweenNeedsNumberText,
  numericComparisonNeedsNumberText,
  typeMoreText
}) {
  function escapeCqlLiteral(value) {
    return String(value).replace(/'/g, "''");
  }

  function getTextSearchPattern(searchText, matchMode = defaultTextMatchMode) {
    const escapedSearchText = escapeCqlLiteral(searchText.trim());
    const normalizedMatchMode = normalizeTextMatchMode(matchMode);
    return normalizedMatchMode === 'startsWith'
      ? `'${escapedSearchText}%'`
      : `'%${escapedSearchText}%'`;
  }

  function getExactTextSearchLiteral(searchText) {
    return `'${escapeCqlLiteral(searchText.trim())}'`;
  }

  function getQgisTextSearchLiteral(searchText) {
    return `'${escapeCqlLiteral(searchText.trim().toLowerCase())}'`;
  }

  function formatAttributeName(attributeName) {
    if (/^[A-Za-z_][A-Za-z0-9_:.]*$/.test(attributeName)) return attributeName;
    return `"${String(attributeName).replace(/"/g, '""')}"`;
  }

  function formatQgisAttributeName(attributeName) {
    return `"${String(attributeName).replace(/"/g, '""')}"`;
  }

  function isNumericSearchMode(mode = defaultSearchMode) {
    return normalizeSearchMode(mode) === 'numeric';
  }

  function getNumericComparisonOperator(mode = defaultNumericComparisonMode) {
    const normalizedMode = normalizeNumericComparisonMode(mode);
    if (normalizedMode === 'greaterThan') return '>';
    if (normalizedMode === 'lessThan') return '<';
    if (normalizedMode === 'between') return 'BETWEEN';
    return '=';
  }

  function isNumericInput(value) {
    return /^-?\d+([.,]\d+)?$/.test(value.trim());
  }

  function getNormalizedNumericText(value) {
    return String(value).trim().replace(',', '.');
  }

  function getNumericValue(value) {
    const numericText = getNormalizedNumericText(value);
    if (!isNumericInput(numericText)) return undefined;
    const numericValue = Number(numericText);
    return Number.isFinite(numericValue) ? numericValue : undefined;
  }

  function getNumericRange(value, rangeEndValue) {
    const startValue = getNumericValue(value);
    const endValue = getNumericValue(rangeEndValue);
    if (startValue === undefined || endValue === undefined) return undefined;

    return {
      min: Math.min(startValue, endValue),
      max: Math.max(startValue, endValue)
    };
  }

  function getSearchMinimumLength(searchOperator) {
    if (isEqualsSearchOperator(searchOperator)) return 1;
    if (isTextSearchOperator(searchOperator)
      && getTextMatchModeForOperator(searchOperator, defaultTextMatchMode) === 'startsWith') return 1;
    return minLength;
  }

  function hasSearchableInput(
    value,
    searchMode = defaultSearchMode,
    rangeEndValue = '',
    searchOperator = getSearchOperatorFromModes(searchMode, defaultTextMatchMode, defaultNumericComparisonMode)
  ) {
    const searchText = String(value).trim();
    if (!searchText) return false;
    if (isBetweenSearchOperator(searchOperator)) return Boolean(getNumericRange(searchText, rangeEndValue));
    if (isEqualsSearchOperator(searchOperator)) return searchText.length >= getSearchMinimumLength(searchOperator);
    if (isNumericSearchMode(searchMode)) return isNumericInput(searchText);
    return searchText.length >= getSearchMinimumLength(searchOperator);
  }

  function getSearchInputHint(
    value,
    searchMode = defaultSearchMode,
    rangeEndValue = '',
    searchOperator = getSearchOperatorFromModes(searchMode, defaultTextMatchMode, defaultNumericComparisonMode)
  ) {
    const minimumLength = getSearchMinimumLength(searchOperator);
    if (isBetweenSearchOperator(searchOperator) && !getNumericRange(value, rangeEndValue)) {
      return localize('numericComparisonBetweenNeedsNumberText', numericComparisonBetweenNeedsNumberText);
    }
    if (isEqualsSearchOperator(searchOperator)) {
      return localize('typeMoreText', typeMoreText).replace('{{minLength}}', minimumLength);
    }
    if (isNumericSearchMode(searchMode) && !isNumericInput(String(value).trim())) {
      return localize('numericComparisonNeedsNumberText', numericComparisonNeedsNumberText);
    }
    return localize('typeMoreText', typeMoreText).replace('{{minLength}}', minimumLength);
  }

  function compareNumericValues(
    value,
    searchText,
    comparisonMode = defaultNumericComparisonMode,
    rangeEndText = '',
    searchOperator = getSearchOperatorFromModes('numeric', defaultTextMatchMode, comparisonMode)
  ) {
    const valueNumber = Number(String(value).replace(',', '.'));
    if (!Number.isFinite(valueNumber)) return false;

    if (isBetweenSearchOperator(searchOperator)) {
      const range = getNumericRange(searchText, rangeEndText);
      return Boolean(range && valueNumber >= range.min && valueNumber <= range.max);
    }

    const searchNumber = getNumericValue(searchText);
    if (searchNumber === undefined) return false;
    const normalizedMode = normalizeNumericComparisonMode(comparisonMode);
    if (normalizedMode === 'greaterThan') return valueNumber > searchNumber;
    if (normalizedMode === 'lessThan') return valueNumber < searchNumber;
    return valueNumber === searchNumber;
  }

  function isTextSearchAttribute(attribute) {
    return attribute && (attribute.type === 'string' || attribute.type === 'unknown');
  }

  function isNumericSearchAttribute(attribute) {
    return attribute && attribute.type === 'number';
  }

  function hasNumericSearchAttributes(attributes) {
    return attributes.some(attribute => isNumericSearchAttribute(attribute));
  }

  function hasTextSearchAttributes(attributes) {
    return attributes.some(attribute => isTextSearchAttribute(attribute));
  }

  function getSearchOperatorAttributes(attributes, searchOperator = defaultSearchOperator) {
    return getSortedAttributes(attributes.filter((attribute) => {
      if (isEqualsSearchOperator(searchOperator)) {
        return isNumericSearchAttribute(attribute) || isTextSearchAttribute(attribute);
      }
      return isNumericSearchOperator(searchOperator)
        ? isNumericSearchAttribute(attribute)
        : isTextSearchAttribute(attribute);
    }));
  }

  function getBuildContext(searchText, matchMode, comparisonMode, searchMode, rangeEndText, searchOperator) {
    const normalizedSearchOperator = normalizeSearchOperator(searchOperator, searchMode, matchMode, comparisonMode);
    return {
      bool: searchText.trim().toLowerCase(),
      exactTextLiteral: getExactTextSearchLiteral(searchText),
      normalizedMatchMode: getTextMatchModeForOperator(normalizedSearchOperator, matchMode),
      normalizedNumber: getNormalizedNumericText(searchText),
      normalizedSearchOperator,
      numeric: isNumericInput(searchText),
      numericComparison: getNumericComparisonModeForOperator(normalizedSearchOperator, comparisonMode),
      numericOnly: isNumericSearchOperator(normalizedSearchOperator),
      numericRange: getNumericRange(searchText, rangeEndText)
    };
  }

  function buildSearchCql(
    attributes,
    searchText,
    includeUnknownAttributes = true,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchMode = defaultSearchMode,
    rangeEndText = '',
    searchOperator = getSearchOperatorFromModes(searchMode, matchMode, comparisonMode)
  ) {
    const terms = [];
    const context = getBuildContext(searchText, matchMode, comparisonMode, searchMode, rangeEndText, searchOperator);
    const pattern = getTextSearchPattern(searchText, context.normalizedMatchMode);
    const numericOperator = getNumericComparisonOperator(context.numericComparison);

    attributes.forEach((attribute) => {
      const attributeName = formatAttributeName(attribute.name);
      if (isEqualsSearchOperator(context.normalizedSearchOperator)
        && (attribute.type === 'string' || (includeUnknownAttributes && attribute.type === 'unknown'))) {
        terms.push(`${attributeName} = ${context.exactTextLiteral}`);
      } else if (!context.numericOnly && (attribute.type === 'string' || (includeUnknownAttributes && attribute.type === 'unknown'))) {
        terms.push(`${attributeName} ILIKE ${pattern}`);
      } else if (isBetweenSearchOperator(context.normalizedSearchOperator) && attribute.type === 'number' && context.numericRange) {
        terms.push(`${attributeName} BETWEEN ${context.numericRange.min} AND ${context.numericRange.max}`);
      } else if (!isBetweenSearchOperator(context.normalizedSearchOperator) && context.numericOnly && attribute.type === 'number' && context.numeric) {
        terms.push(`${attributeName} ${numericOperator} ${context.normalizedNumber}`);
      } else if (!context.numericOnly && attribute.type === 'boolean' && ['true', 'false'].includes(context.bool)) {
        terms.push(`${attributeName} = ${context.bool}`);
      }
    });

    return terms.length > 0 ? `(${terms.join(' OR ')})` : '';
  }

  function buildSearchQgisExpression(
    attributes,
    searchText,
    includeUnknownAttributes = true,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchMode = defaultSearchMode,
    rangeEndText = '',
    searchOperator = getSearchOperatorFromModes(searchMode, matchMode, comparisonMode)
  ) {
    const terms = [];
    const context = getBuildContext(searchText, matchMode, comparisonMode, searchMode, rangeEndText, searchOperator);
    const textLiteral = getQgisTextSearchLiteral(searchText);
    const numericOperator = getNumericComparisonOperator(context.numericComparison);

    attributes.forEach((attribute) => {
      const attributeName = formatQgisAttributeName(attribute.name);
      if (isEqualsSearchOperator(context.normalizedSearchOperator)
        && (attribute.type === 'string' || (includeUnknownAttributes && attribute.type === 'unknown'))) {
        terms.push(`${attributeName} = ${context.exactTextLiteral}`);
      } else if (!context.numericOnly && (attribute.type === 'string' || (includeUnknownAttributes && attribute.type === 'unknown'))) {
        const textExpression = `strpos(lower(${attributeName}), ${textLiteral})`;
        terms.push(context.normalizedMatchMode === 'startsWith' ? `${textExpression} = 1` : `${textExpression} > 0`);
      } else if (isBetweenSearchOperator(context.normalizedSearchOperator) && attribute.type === 'number' && context.numericRange) {
        terms.push(`(${attributeName} >= ${context.numericRange.min} AND ${attributeName} <= ${context.numericRange.max})`);
      } else if (!isBetweenSearchOperator(context.normalizedSearchOperator) && context.numericOnly && attribute.type === 'number' && context.numeric) {
        terms.push(`${attributeName} ${numericOperator} ${context.normalizedNumber}`);
      } else if (!context.numericOnly && attribute.type === 'boolean' && ['true', 'false'].includes(context.bool)) {
        terms.push(`${attributeName} = ${context.bool}`);
      }
    });

    return terms.length > 0 ? `(${terms.join(' OR ')})` : '';
  }

  function buildSearchQgisWmsFilter(
    attributes,
    searchText,
    includeUnknownAttributes = true,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchMode = defaultSearchMode,
    rangeEndText = '',
    searchOperator = getSearchOperatorFromModes(searchMode, matchMode, comparisonMode)
  ) {
    const terms = [];
    const context = getBuildContext(searchText, matchMode, comparisonMode, searchMode, rangeEndText, searchOperator);
    const pattern = getTextSearchPattern(searchText, context.normalizedMatchMode);
    const numericOperator = getNumericComparisonOperator(context.numericComparison);

    attributes.forEach((attribute) => {
      const attributeName = formatQgisAttributeName(attribute.name);
      if (isEqualsSearchOperator(context.normalizedSearchOperator)
        && (attribute.type === 'string' || (includeUnknownAttributes && attribute.type === 'unknown'))) {
        terms.push(`${attributeName} = ${context.exactTextLiteral}`);
      } else if (!context.numericOnly && (attribute.type === 'string' || (includeUnknownAttributes && attribute.type === 'unknown'))) {
        terms.push(`${attributeName} ILIKE ${pattern}`);
      } else if (isBetweenSearchOperator(context.normalizedSearchOperator) && attribute.type === 'number' && context.numericRange) {
        terms.push(`(${attributeName} >= ${context.numericRange.min} AND ${attributeName} <= ${context.numericRange.max})`);
      } else if (!isBetweenSearchOperator(context.normalizedSearchOperator) && context.numericOnly && attribute.type === 'number' && context.numeric) {
        terms.push(`${attributeName} ${numericOperator} ${context.normalizedNumber}`);
      } else if (!context.numericOnly && attribute.type === 'boolean' && ['true', 'false'].includes(context.bool)) {
        terms.push(`${attributeName} = ${context.bool}`);
      }
    });

    return terms.length > 0 ? `(${terms.join(' OR ')})` : '';
  }

  function buildSearchFilter(filterDialect, ...args) {
    return filterDialect === 'qgis'
      ? buildSearchQgisExpression(...args)
      : buildSearchCql(...args);
  }

  function attributeValueMatchesSearch(
    attribute,
    value,
    searchText,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchMode = defaultSearchMode,
    rangeEndText = '',
    searchOperator = getSearchOperatorFromModes(searchMode, matchMode, comparisonMode)
  ) {
    if (value === null || value === undefined) return false;

    const normalizedOperator = normalizeSearchOperator(searchOperator, searchMode, matchMode, comparisonMode);
    const normalizedSearchText = String(searchText).trim();
    const searchTextLower = normalizedSearchText.toLowerCase();
    if (!normalizedSearchText) return false;

    if (isEqualsSearchOperator(normalizedOperator)) {
      if (attribute.type === 'string' || attribute.type === 'unknown') return String(value) === normalizedSearchText;
      if (attribute.type === 'number' && isNumericInput(normalizedSearchText)) {
        return compareNumericValues(value, normalizedSearchText, comparisonMode, rangeEndText, normalizedOperator);
      }
      return false;
    }

    if (isTextSearchOperator(normalizedOperator) && (attribute.type === 'string' || attribute.type === 'unknown')) {
      const valueLower = String(value).toLowerCase();
      return getTextMatchModeForOperator(normalizedOperator, matchMode) === 'startsWith'
        ? valueLower.startsWith(searchTextLower)
        : valueLower.includes(searchTextLower);
    }

    if (isNumericSearchOperator(normalizedOperator) && attribute.type === 'number' && isNumericInput(normalizedSearchText)) {
      return compareNumericValues(value, normalizedSearchText, comparisonMode, rangeEndText, normalizedOperator);
    }

    if (isTextSearchOperator(normalizedOperator) && attribute.type === 'boolean' && ['true', 'false'].includes(searchTextLower)) {
      return String(value).toLowerCase() === searchTextLower;
    }

    return false;
  }

  return {
    attributeValueMatchesSearch,
    buildSearchCql,
    buildSearchFilter,
    buildSearchQgisExpression,
    buildSearchQgisWmsFilter,
    getSearchInputHint,
    getSearchOperatorAttributes,
    hasNumericSearchAttributes,
    hasSearchableInput,
    hasTextSearchAttributes,
    isNumericInput
  };
}

;// ./src/search-results.js
function stableStringify(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${key}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return String(value);
}

function normalizeProjectionCode(value) {
  if (!value) return undefined;

  const projectionText = String(value);
  if (projectionText.toUpperCase() === 'CRS:84') return 'EPSG:4326';

  const epsgMatch = projectionText.match(/EPSG(?::|::|\/0\/)(\d+)/i);
  if (epsgMatch) return `EPSG:${epsgMatch[1]}`;
  return projectionText;
}

function createSearchResults({ getFeatureProperties, getViewer, limit, Origo }) {
  function getFeatureDedupKey(layer, feature, jsonFeature) {
    const layerName = layer && typeof layer.get === 'function'
      ? layer.get('name') || layer.get('title') || ''
      : '';
    const featureId = feature && typeof feature.getId === 'function' ? feature.getId() : undefined;
    if (featureId || featureId === 0) return `${layerName}:feature:${featureId}`;

    const jsonFeatureId = jsonFeature && (jsonFeature.id || jsonFeature.id === 0) ? jsonFeature.id : undefined;
    if (jsonFeatureId || jsonFeatureId === 0) return `${layerName}:json:${jsonFeatureId}`;

    const properties = jsonFeature && jsonFeature.properties ? jsonFeature.properties : getFeatureProperties(feature);
    return `${layerName}:properties:${stableStringify(properties)}`;
  }

  function getGeoJsonCrsProjection(json) {
    const crs = json && json.crs;
    if (!crs) return undefined;
    if (typeof crs === 'string') return normalizeProjectionCode(crs);
    if (crs.properties && crs.properties.name) return normalizeProjectionCode(crs.properties.name);
    if (crs.name) return normalizeProjectionCode(crs.name);
    return undefined;
  }

  function isFiniteCoordinate(coordinate) {
    if (!Array.isArray(coordinate) || coordinate.length < 2) return false;
    const x = Number(coordinate[0]);
    const y = Number(coordinate[1]);
    return Number.isFinite(x) && Number.isFinite(y);
  }

  function isLonLatCoordinate(coordinate) {
    if (!isFiniteCoordinate(coordinate)) return false;
    const x = Number(coordinate[0]);
    const y = Number(coordinate[1]);
    return Math.abs(x) <= 180 && Math.abs(y) <= 90;
  }

  function isLonLatBbox(bbox) {
    if (!Array.isArray(bbox) || bbox.length < 4) return false;
    const maxCoordinateOffset = Math.floor(bbox.length / 2);
    return isLonLatCoordinate([bbox[0], bbox[1]])
      && isLonLatCoordinate([bbox[maxCoordinateOffset], bbox[maxCoordinateOffset + 1]]);
  }

  function getGeoJsonCoordinateProjection(coordinate) {
    if (!isFiniteCoordinate(coordinate)) return undefined;
    return isLonLatCoordinate(coordinate) ? 'EPSG:4326' : getViewer().getProjectionCode();
  }

  function getGeoJsonBboxProjection(bbox) {
    if (!Array.isArray(bbox) || bbox.length < 4) return undefined;
    return isLonLatBbox(bbox) ? 'EPSG:4326' : getViewer().getProjectionCode();
  }

  function getFirstCoordinate(coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length === 0) return undefined;
    if (typeof coordinates[0] === 'number') return coordinates;
    return coordinates.map(getFirstCoordinate).find(Boolean);
  }

  function getFirstGeometryCoordinate(geometry) {
    if (!geometry) return undefined;
    if (geometry.type === 'GeometryCollection' && Array.isArray(geometry.geometries)) {
      return geometry.geometries.map(getFirstGeometryCoordinate).find(Boolean);
    }
    return getFirstCoordinate(geometry.coordinates);
  }

  function getFirstGeoJsonCoordinate(json) {
    const features = json && Array.isArray(json.features) ? json.features : [];
    return features.map(feature => getFirstGeometryCoordinate(feature && feature.geometry)).find(Boolean);
  }

  function getFirstGeoJsonBbox(json) {
    const features = json && Array.isArray(json.features) ? json.features : [];
    const featureBbox = features
      .map(feature => feature && feature.bbox)
      .find(bbox => Array.isArray(bbox) && bbox.length >= 4);
    return featureBbox || (json && json.bbox);
  }

  function getGeoJsonDataProjection(json) {
    const crsProjection = getGeoJsonCrsProjection(json);
    if (crsProjection) return crsProjection;

    const coordinateProjection = getGeoJsonCoordinateProjection(getFirstGeoJsonCoordinate(json));
    if (coordinateProjection) return coordinateProjection;

    return getGeoJsonBboxProjection(getFirstGeoJsonBbox(json)) || getViewer().getProjectionCode();
  }

  function createSearchResultsFromJson(layer, json, attributes) {
    const jsonFeatures = json && Array.isArray(json.features) ? json.features : [];
    const geoJsonFormat = new Origo.ol.format.GeoJSON();
    const features = geoJsonFormat.readFeatures(json || { type: 'FeatureCollection', features: [] }, {
      dataProjection: getGeoJsonDataProjection(json),
      featureProjection: getViewer().getProjectionCode()
    });

    return {
      features,
      jsonFeatures,
      layers: features.map(() => layer),
      attributes: features.map(() => attributes)
    };
  }

  function mergeSearchResults(results, maxFeatures = limit) {
    const mergedResults = {
      features: [],
      jsonFeatures: [],
      layers: [],
      attributes: []
    };
    const seenFeatureKeys = new Set();

    results.forEach((result) => {
      if (!result || !Array.isArray(result.features) || !Array.isArray(result.jsonFeatures)) return;
      const resultLayers = Array.isArray(result.layers) ? result.layers : [];
      const resultAttributes = Array.isArray(result.attributes) ? result.attributes : [];

      result.features.forEach((feature, index) => {
        if (mergedResults.features.length >= maxFeatures) return;
        const jsonFeature = result.jsonFeatures[index] || { properties: getFeatureProperties(feature) };
        const resultLayer = resultLayers[index];
        const featureKey = getFeatureDedupKey(resultLayer, feature, jsonFeature);
        if (seenFeatureKeys.has(featureKey)) return;
        seenFeatureKeys.add(featureKey);

        mergedResults.features.push(feature);
        mergedResults.jsonFeatures.push(jsonFeature);
        mergedResults.layers.push(resultLayer);
        mergedResults.attributes.push(resultAttributes[index]);
      });
    });

    return mergedResults;
  }

  return {
    createSearchResultsFromJson,
    getGeoJsonDataProjection,
    mergeSearchResults
  };
}

;// ./src/search-service.js
function createSearchService({
  FILTER_DIALECTS,
  Origo,
  attributeValueMatchesSearch,
  buildSearchFilter,
  combineWithExistingFilter,
  createSearchResultsService,
  createWfsUrl,
  defaultNumericComparisonMode,
  defaultSearchMode,
  defaultTextMatchMode,
  getFallbackFilterDialect,
  getFeatureProperties,
  getLayerFilterDialect,
  getLocalFeatures,
  getSearchAttributesForTargetLayer,
  getSearchOperatorFromModes,
  getSearchTargetLayers,
  getSourceUrl,
  getTypeName,
  getViewer,
  isClientFeatureLayer,
  isLongRequestQueryError,
  isRequestQueryTooLong,
  isSearchingChildLayers,
  limit,
  loadClientFeatures,
  name,
  requestJson,
  useCurrentExtent
}) {
  function featureMatchesSearchFilter(
    feature,
    attributes,
    searchText,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchModeValue = defaultSearchMode,
    rangeEndText = '',
    searchOperatorValue = getSearchOperatorFromModes(searchModeValue, matchMode, comparisonMode)
  ) {
    const clusteredFeatures = feature && typeof feature.get === 'function' ? feature.get('features') : undefined;
    if (Array.isArray(clusteredFeatures) && clusteredFeatures.length > 0) {
      return clusteredFeatures.some(clusteredFeature => featureMatchesSearchFilter(
        clusteredFeature,
        attributes,
        searchText,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      ));
    }

    const properties = getFeatureProperties(feature);
    return attributes
      .filter(attribute => attribute && Object.prototype.hasOwnProperty.call(properties, attribute.name))
      .some(attribute => attributeValueMatchesSearch(
        attribute,
        properties[attribute.name],
        searchText,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      ));
  }

  function searchLocalFeatures(
    layer,
    searchText,
    attributes,
    maxFeatures = limit,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchModeValue = defaultSearchMode,
    rangeEndText = '',
    searchOperatorValue = getSearchOperatorFromModes(searchModeValue, matchMode, comparisonMode)
  ) {
    const matchingFeatures = getLocalFeatures(layer)
      .filter(feature => featureMatchesSearchFilter(feature, attributes, searchText, matchMode, comparisonMode, searchModeValue, rangeEndText, searchOperatorValue))
      .slice(0, maxFeatures);

    return {
      features: matchingFeatures,
      jsonFeatures: matchingFeatures.map(feature => ({
        properties: getFeatureProperties(feature)
      })),
      layers: matchingFeatures.map(() => layer),
      attributes: matchingFeatures.map(() => attributes)
    };
  }

  function getCurrentExtentBbox() {
    if (!useCurrentExtent) return undefined;
    const extent = getViewer().getMap().getView().calculateExtent(getViewer().getMap().getSize());
    return `${extent.join(',')},${getViewer().getProjectionCode()}`;
  }

  const {
    createSearchResultsFromJson,
    mergeSearchResults
  } = createSearchResultsService({
    getFeatureProperties,
    getViewer,
    limit,
    Origo
  });

  async function searchLayer(
    layer,
    searchText,
    attributes,
    includeUnknownAttributes = true,
    maxFeatures = limit,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchModeValue = defaultSearchMode,
    rangeEndText = '',
    searchOperatorValue = getSearchOperatorFromModes(searchModeValue, matchMode, comparisonMode)
  ) {
    const emptyResults = { features: [], jsonFeatures: [], layers: [], attributes: [] };
    if (isClientFeatureLayer(layer)) {
      await loadClientFeatures(layer);
      const localSearchFilter = buildSearchFilter(
        FILTER_DIALECTS.cql,
        attributes,
        searchText,
        includeUnknownAttributes,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      );
      if (!localSearchFilter) return emptyResults;

      return searchLocalFeatures(
        layer,
        searchText,
        attributes,
        maxFeatures,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      );
    }

    const sourceUrl = getSourceUrl(layer);
    if (!sourceUrl) {
      const localSearchFilter = buildSearchFilter(
        FILTER_DIALECTS.cql,
        attributes,
        searchText,
        includeUnknownAttributes,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      );
      if (!localSearchFilter) return emptyResults;

      return searchLocalFeatures(
        layer,
        searchText,
        attributes,
        maxFeatures,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      );
    }

    const createSearchRequest = (filterDialect, requestAttributes) => {
      const searchFilter = buildSearchFilter(
        filterDialect,
        requestAttributes,
        searchText,
        includeUnknownAttributes,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      );
      if (!searchFilter) return undefined;

      const combinedFilter = combineWithExistingFilter(layer, filterDialect, searchFilter);
      const params = {
        outputFormat: 'application/json',
        srsName: getViewer().getProjectionCode(),
        maxFeatures,
        bbox: getCurrentExtentBbox()
      };
      if (filterDialect === FILTER_DIALECTS.qgis) {
        params.expFilter = combinedFilter;
      } else {
        params.cqlFilter = combinedFilter;
      }

      const url = createWfsUrl(layer, params);
      if (!url) return undefined;
      return { url, attributes: requestAttributes };
    };

    const createChunkedSearchRequests = (filterDialect) => {
      const chunks = [];
      let currentAttributes = [];

      attributes.forEach((attribute) => {
        const singleRequest = createSearchRequest(filterDialect, [attribute]);
        if (!singleRequest) return;

        const candidateAttributes = currentAttributes.concat(attribute);
        const candidateRequest = createSearchRequest(filterDialect, candidateAttributes);
        if (currentAttributes.length === 0 || !isRequestQueryTooLong(candidateRequest.url)) {
          currentAttributes = candidateAttributes;
          return;
        }

        chunks.push(currentAttributes);
        currentAttributes = [attribute];
      });

      if (currentAttributes.length > 0) chunks.push(currentAttributes);
      return chunks
        .map(chunkAttributes => createSearchRequest(filterDialect, chunkAttributes))
        .filter(Boolean);
    };

    const requestChunkedSearchResults = async (filterDialect) => {
      const requests = createChunkedSearchRequests(filterDialect);
      if (requests.length === 0) return undefined;

      const results = await Promise.all(requests.map(async (request) => {
        const json = await requestJson(request.url);
        return createSearchResultsFromJson(layer, json, request.attributes);
      }));

      return mergeSearchResults(results, maxFeatures);
    };

    const requestSearchResults = async (filterDialect, forceChunked = false) => {
      const request = createSearchRequest(filterDialect, attributes);
      if (!request) return undefined;
      if (forceChunked || isRequestQueryTooLong(request.url)) return requestChunkedSearchResults(filterDialect);

      const json = await requestJson(request.url);
      return createSearchResultsFromJson(layer, json, attributes);
    };

    const requestSearchResultsWithQueryFallback = async (filterDialect) => {
      try {
        return await requestSearchResults(filterDialect);
      } catch (error) {
        if (!isLongRequestQueryError(error)) throw error;
        return requestSearchResults(filterDialect, true);
      }
    };

    const filterDialect = await getLayerFilterDialect(layer);
    if (!filterDialect) {
      if (getLocalFeatures(layer).length > 0) {
        return searchLocalFeatures(
          layer,
          searchText,
          attributes,
          maxFeatures,
          matchMode,
          comparisonMode,
          searchModeValue,
          rangeEndText,
          searchOperatorValue
        );
      }
      throw new Error(`${name}: no supported filter dialect for ${getTypeName(layer)}`);
    }

    let results;
    try {
      results = await requestSearchResultsWithQueryFallback(filterDialect);
    } catch (error) {
      const fallbackFilterDialect = await getFallbackFilterDialect(layer, filterDialect);
      if (!fallbackFilterDialect || fallbackFilterDialect === filterDialect) throw error;
      results = await requestSearchResultsWithQueryFallback(fallbackFilterDialect);
    }

    return results || emptyResults;
  }
  async function searchSingleLayerWithFallback(
    layer,
    searchText,
    attributes,
    maxFeatures = limit,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchModeValue = defaultSearchMode,
    rangeEndText = '',
    searchOperatorValue = getSearchOperatorFromModes(searchModeValue, matchMode, comparisonMode)
  ) {
    try {
      return await searchLayer(
        layer,
        searchText,
        attributes,
        true,
        maxFeatures,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      );
    } catch (error) {
      console.warn(`${name}: search with unknown attributes failed, retrying strict search`, error);
      return searchLayer(
        layer,
        searchText,
        attributes,
        false,
        maxFeatures,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      );
    }
  }

  async function searchTargetLayersWithFallback(
    searchTargetLayers,
    searchText,
    attributes,
    maxFeatures = limit,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchModeValue = defaultSearchMode,
    rangeEndText = '',
    searchOperatorValue = getSearchOperatorFromModes(searchModeValue, matchMode, comparisonMode)
  ) {
    const results = await Promise.all(searchTargetLayers.map(async (targetLayer) => {
      const targetAttributes = await getSearchAttributesForTargetLayer(targetLayer, attributes);
      if (targetAttributes.length === 0) return { features: [], jsonFeatures: [], layers: [], attributes: [] };

      try {
        return await searchSingleLayerWithFallback(
          targetLayer,
          searchText,
          targetAttributes,
          maxFeatures,
          matchMode,
          comparisonMode,
          searchModeValue,
          rangeEndText,
          searchOperatorValue
        );
      } catch (error) {
        console.warn(`${name}: layer search failed for grouped layer ${targetLayer.get('name')}`, error);
        return { features: [], jsonFeatures: [], layers: [], attributes: [] };
      }
    }));

    return mergeSearchResults(results, maxFeatures);
  }

  async function searchLayerWithFallback(
    layer,
    searchText,
    attributes,
    maxFeatures = limit,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchModeValue = defaultSearchMode,
    rangeEndText = '',
    searchOperatorValue = getSearchOperatorFromModes(searchModeValue, matchMode, comparisonMode)
  ) {
    const searchTargetLayers = getSearchTargetLayers(layer);
    if (searchTargetLayers.length === 0) return { features: [], jsonFeatures: [], layers: [], attributes: [] };
    if (isSearchingChildLayers(layer, searchTargetLayers)) {
      return searchTargetLayersWithFallback(
        searchTargetLayers,
        searchText,
        attributes,
        maxFeatures,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      );
    }

    return searchSingleLayerWithFallback(
      layer,
      searchText,
      attributes,
      maxFeatures,
      matchMode,
      comparisonMode,
      searchModeValue,
      rangeEndText,
      searchOperatorValue
    );
  }

  return {
    featureMatchesSearchFilter,
    searchSingleLayerWithFallback,
    searchLayerWithFallback
  };
}

;// ./src/wfs-client.js
function createWfsClient({
  FILTER_DIALECTS,
  filterDialectCache,
  filterDialectRequestCache,
  getExplicitFilterDialect,
  getFilterDialectCacheKey,
  getSearchTargetLayers,
  getSourceConfig,
  getSourceUrl,
  getTypeName,
  getViewer,
  isClientFeatureLayer = () => false,
  name,
  requestQueryLengthLimit,
  setFilterDialectCache
}) {
  function createWfsUrl(layer, params = {}) {
    if (isClientFeatureLayer(layer)) return undefined;

    const sourceUrl = getSourceUrl(layer);
    if (!sourceUrl) return undefined;

    const url = new URL(sourceUrl, window.location.href);
    url.searchParams.set('service', 'WFS');
    url.searchParams.set('version', '1.1.0');
    url.searchParams.set('request', params.request || 'GetFeature');

    if (params.typeName !== false) {
      url.searchParams.set('typeName', getTypeName(layer));
    }

    if (params.outputFormat) url.searchParams.set('outputFormat', params.outputFormat);
    if (params.srsName) url.searchParams.set('srsName', params.srsName);
    if (params.maxFeatures) url.searchParams.set('maxFeatures', params.maxFeatures);
    if (params.cqlFilter) url.searchParams.set('CQL_FILTER', params.cqlFilter);
    if (params.expFilter) url.searchParams.set('EXP_FILTER', params.expFilter);
    if (params.bbox) url.searchParams.set('BBOX', params.bbox);

    const sourceConfig = getSourceConfig(layer);
    const queryParams = sourceConfig && sourceConfig.queryParams ? sourceConfig.queryParams : {};
    Object.keys(queryParams).forEach((key) => {
      url.searchParams.set(key, queryParams[key]);
    });

    return url.toString();
  }

  async function requestJson(url) {
    const response = await fetch(url, { method: 'GET' });
    const text = await response.text();
    if (!response.ok) {
      const error = new Error(`${response.status} ${response.statusText}: ${text.substring(0, 300)}`);
      error.status = response.status;
      error.statusText = response.statusText;
      error.responseText = text;
      error.url = url;
      throw error;
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(text.substring(0, 300));
    }
  }

  function getRequestQueryLength(url) {
    try {
      return new URL(url, window.location.href).search.length;
    } catch {
      return String(url || '').length;
    }
  }

  function isRequestQueryTooLong(url) {
    return getRequestQueryLength(url) > requestQueryLengthLimit;
  }

  function isLongRequestQueryError(error) {
    const errorText = [
      error && error.status,
      error && error.statusText,
      error && error.message,
      error && error.responseText
    ].filter(Boolean).join(' ').toLowerCase();

    return Boolean(error && (
      error.status === 414
      || errorText.includes('404.15')
      || errorText.includes('query string is too long')
      || errorText.includes('query too long')
      || errorText.includes('request-uri too long')
      || errorText.includes('uri too long')
    ));
  }

  function createUrlWithParams(baseUrl, params = {}) {
    const url = new URL(baseUrl, window.location.href);
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value === null || value === undefined) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  }

  function getFilterRequestParamName(filterDialect) {
    return filterDialect === FILTER_DIALECTS.qgis ? 'EXP_FILTER' : 'CQL_FILTER';
  }

  function isFilterExpressionTooLong(filterDialect, filter) {
    const paramName = getFilterRequestParamName(filterDialect);
    return isRequestQueryTooLong(createUrlWithParams('https://origo.local/', { [paramName]: filter }));
  }

  function getWmsSourceUrl(source) {
    if (source && typeof source.getUrl === 'function') return source.getUrl();
    if (source && typeof source.getUrls === 'function') {
      const urls = source.getUrls();
      return Array.isArray(urls) ? urls[0] : undefined;
    }
    return undefined;
  }

  function getEstimatedWmsRequestUrl(source, filterParams = {}) {
    const sourceUrl = getWmsSourceUrl(source);
    if (!sourceUrl) return undefined;

    const params = Object.assign(
      {},
      typeof source.getParams === 'function' ? source.getParams() : {},
      filterParams
    );
    params.SERVICE = params.SERVICE || 'WMS';
    params.REQUEST = params.REQUEST || 'GetMap';
    params.BBOX = params.BBOX || '0,0,0,0';
    params.WIDTH = params.WIDTH || '256';
    params.HEIGHT = params.HEIGHT || '256';
    params.FORMAT = params.FORMAT || 'image/png';
    if (!params.SRS && !params.CRS) params.SRS = getViewer().getProjectionCode();

    return createUrlWithParams(sourceUrl, params);
  }

  function shouldUseWmsPostForFilter(source, filterParams = {}) {
    const estimatedUrl = getEstimatedWmsRequestUrl(source, filterParams);
    return Boolean(estimatedUrl && isRequestQueryTooLong(estimatedUrl));
  }

  function loadImageElementWithPost(image, src) {
    if (!image || !src) return;

    const imageElement = image;
    const splitIndex = src.indexOf('?');
    const url = splitIndex >= 0 ? src.substring(0, splitIndex) : src;
    const body = splitIndex >= 0 ? src.substring(splitIndex + 1) : '';
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.addEventListener('loadend', function loaded() {
      const data = this.response;
      if (!data || this.status >= 400) return;

      const objectUrl = URL.createObjectURL(data);
      const revokeObjectUrl = () => URL.revokeObjectURL(objectUrl);
      imageElement.addEventListener('load', revokeObjectUrl, { once: true });
      imageElement.addEventListener('error', revokeObjectUrl, { once: true });
      imageElement.src = objectUrl;
    });
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(body);
  }

  function getLoadImageElement(loadTarget) {
    if (loadTarget && typeof loadTarget.getImage === 'function') return loadTarget.getImage();
    return loadTarget;
  }

  function wmsPostImageLoadFunction(loadedImage, src) {
    loadImageElementWithPost(getLoadImageElement(loadedImage), src);
  }

  function wmsPostTileLoadFunction(tile, src) {
    loadImageElementWithPost(getLoadImageElement(tile), src);
  }

  function getJsonFeatureCount(json) {
    if (!json || !Array.isArray(json.features)) return undefined;
    return json.features.length;
  }

  async function requestFilterDialectTest(layer, filterDialect, filter) {
    const params = {
      outputFormat: 'application/json',
      maxFeatures: 1
    };
    if (filterDialect === FILTER_DIALECTS.qgis) {
      params.expFilter = filter;
    } else if (filterDialect === FILTER_DIALECTS.cql) {
      params.cqlFilter = filter;
    }

    const url = createWfsUrl(layer, params);
    if (!url) return undefined;
    return requestJson(url);
  }

  async function testNoMatchFilterDialect(layer, filterDialect, baselineHasFeatures) {
    if (!baselineHasFeatures) return false;

    try {
      const json = await requestFilterDialectTest(layer, filterDialect, '1=0');
      return getJsonFeatureCount(json) === 0;
    } catch (error) {
      console.warn(`${name}: ${filterDialect} filter dialect test failed for ${getTypeName(layer)}`, error);
      return false;
    }
  }

  async function detectFilterDialect(layer, filterDialects = [FILTER_DIALECTS.cql, FILTER_DIALECTS.qgis]) {
    let baselineHasFeatures = false;
    try {
      const baselineJson = await requestFilterDialectTest(layer);
      baselineHasFeatures = getJsonFeatureCount(baselineJson) > 0;
    } catch (error) {
      console.warn(`${name}: filter dialect baseline test failed for ${getTypeName(layer)}`, error);
    }

    const testFilterDialectAtIndex = async (index = 0) => {
      if (index >= filterDialects.length) return undefined;
      const filterDialect = filterDialects[index];
      if (await testNoMatchFilterDialect(layer, filterDialect, baselineHasFeatures)) return filterDialect;
      return testFilterDialectAtIndex(index + 1);
    };

    return testFilterDialectAtIndex();
  }

  async function getLayerFilterDialect(layer) {
    if (isClientFeatureLayer(layer)) return undefined;

    const explicitFilterDialect = getExplicitFilterDialect(layer);
    if (explicitFilterDialect) return explicitFilterDialect;

    const cacheKey = getFilterDialectCacheKey(layer);
    if (!cacheKey) return undefined;
    if (filterDialectCache[cacheKey]) return filterDialectCache[cacheKey];
    if (filterDialectRequestCache[cacheKey]) return filterDialectRequestCache[cacheKey];

    const filterDialectRequest = (async () => {
      try {
        const filterDialect = await detectFilterDialect(layer);
        if (filterDialect) filterDialectCache[cacheKey] = filterDialect;
        return filterDialect;
      } finally {
        if (filterDialectRequestCache[cacheKey] === filterDialectRequest) {
          delete filterDialectRequestCache[cacheKey];
        }
      }
    })();

    filterDialectRequestCache[cacheKey] = filterDialectRequest;
    return filterDialectRequest;
  }

  function prewarmFilterDialects(layer) {
    getSearchTargetLayers(layer).forEach((targetLayer) => {
      getLayerFilterDialect(targetLayer).catch((error) => {
        console.warn(`${name}: filter dialect prewarm failed for ${getTypeName(targetLayer)}`, error);
      });
    });
  }

  async function getFallbackFilterDialect(layer, failedFilterDialect) {
    if (isClientFeatureLayer(layer)) return undefined;
    if (getExplicitFilterDialect(layer)) return undefined;

    const fallbackFilterDialect = failedFilterDialect === FILTER_DIALECTS.qgis
      ? FILTER_DIALECTS.cql
      : FILTER_DIALECTS.qgis;
    const detectedFilterDialect = await detectFilterDialect(layer, [fallbackFilterDialect]);
    if (detectedFilterDialect) setFilterDialectCache(layer, detectedFilterDialect);
    return detectedFilterDialect;
  }

  return {
    createWfsUrl,
    getFallbackFilterDialect,
    getLayerFilterDialect,
    isFilterExpressionTooLong,
    isLongRequestQueryError,
    isRequestQueryTooLong,
    prewarmFilterDialects,
    requestJson,
    shouldUseWmsPostForFilter,
    wmsPostImageLoadFunction,
    wmsPostTileLoadFunction
  };
}

;// ./src/plugin-services.js












function createPluginServices({
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
    FILTER_DIALECTS: FILTER_DIALECTS,
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

  const searchFilterRules = createSearchFilter({
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
    FILTER_DIALECTS: FILTER_DIALECTS,
    Origo,
    attributeValueMatchesSearch: searchFilterRules.attributeValueMatchesSearch,
    buildSearchFilter: searchFilterRules.buildSearchFilter,
    combineWithExistingFilter: layerContext.combineWithExistingFilter,
    createSearchResultsService: createSearchResults,
    createWfsUrl: wfsClient.createWfsUrl,
    defaultNumericComparisonMode,
    defaultSearchMode,
    defaultTextMatchMode,
    getFallbackFilterDialect: wfsClient.getFallbackFilterDialect,
    getFeatureProperties: attributeDiscovery.getFeatureProperties,
    getLayerFilterDialect: wfsClient.getLayerFilterDialect,
    getLocalFeatures: localFeatureSource.getLocalFeatures,
    getSearchAttributesForTargetLayer: attributeDiscovery.getSearchAttributesForTargetLayer,
    getSearchOperatorFromModes: getSearchOperatorFromModes,
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
    defaultHighlightStyleOptions: defaultHighlightStyleOptions,
    defaultNumericComparisonMode,
    defaultSearchMode,
    defaultTextMatchMode,
    featureInfoForResultsLimit,
    getFeatureInfo: () => runtime.featureInfo,
    getSearchOperatorFromModes: getSearchOperatorFromModes,
    getViewer,
    highlightOnSubmit,
    highlightStyleOptions,
    highlightZIndex,
    localization: options.localization,
    limit,
    maxZoomLevel,
    name,
    normalizeFeatureLimit: normalizeFeatureLimit,
    searchLayerWithFallback: searchService.searchLayerWithFallback,
    zoomOnSubmit,
    zoomPadding,
    zoomToExtentLimit
  });

  const layerFilter = createLayerFilterService({
    FILTER_DIALECTS: FILTER_DIALECTS,
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
    getSearchOperatorFromModes: getSearchOperatorFromModes,
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
    normalizeNumericComparisonMode: normalizeNumericComparisonMode,
    normalizeSearchMode: normalizeSearchMode,
    normalizeSearchOperator: normalizeSearchOperator,
    normalizeTextMatchMode: normalizeTextMatchMode,
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

;// ./src/search-panel-view.js
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getVerticalScrollContainer(startEl) {
  let parentEl = startEl.parentElement;

  while (parentEl && parentEl !== document.documentElement) {
    const { overflowY } = window.getComputedStyle(parentEl);
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') return parentEl;
    parentEl = parentEl.parentElement;
  }

  return undefined;
}

function setPanelStatus(statusEl, message, state = '') {
  const visibleMessage = message || '';
  statusEl.toggleAttribute('hidden', !visibleMessage);
  statusEl.setAttribute('class', `o-layer_search_filter__status ${state}`.trim());
  statusEl.replaceChildren(document.createTextNode(visibleMessage));
}

function createSearchPanelView({
  cmp,
  layer,
  layerContext,
  localize,
  options
}) {
  const targetEl = document.getElementById(cmp.getId());
  if (!targetEl || targetEl.querySelector('.o-layer_search_filter')) return undefined;

  const hasActivationButtonText = options.buttonText !== null
    && options.buttonText !== undefined
    && String(options.buttonText).trim() !== '';
  const localizedButtonText = hasActivationButtonText ? localize('buttonText', options.buttonText) : '';
  const activationButtonLabel = localizedButtonText === null || localizedButtonText === undefined
    ? ''
    : String(localizedButtonText).trim();
  const activationButtonClass = `o-layer_search_filter__activate-button${activationButtonLabel ? '' : ' o-layer_search_filter__activate-button--icon-only'}`;
  const activationButtonAriaLabel = activationButtonLabel || localize('title', options.title) || 'Sök';
  const activationButtonTextHtml = activationButtonLabel ? `<span>${escapeHtml(activationButtonLabel)}</span>` : '';
  const hasLayerVisibilityButton = options.showLayerVisibilityButton !== false;
  const hasFilterButton = options.showFilterButton !== false;
  const hasZoomToResultsButton = options.showZoomToResultsButton !== false;
  const hasFeatureInfoForResultsButton = options.showFeatureInfoForResultsButton !== false
    && layerContext.hasQueryableSearchTarget(layer);
  const hasCloseSearchButton = options.showCloseSearchButton !== false;
  const hasActionButtons = hasLayerVisibilityButton
    || hasFilterButton
    || hasZoomToResultsButton
    || hasFeatureInfoForResultsButton;
  const layerVisibilityLabel = layerContext.getLayerVisibilityLabel(layer);
  const layerVisibilityButtonHtml = hasLayerVisibilityButton ? `
      <button class="o-layer_search_filter__visibility-button round small icon-smaller no-shrink" type="button" aria-pressed="${String(layer.getVisible())}" aria-label="${escapeHtml(layerVisibilityLabel)}" title="${escapeHtml(layerVisibilityLabel)}">
        <span class="icon grey"><svg class="grey"><use xlink:href="${layerContext.getLayerVisibilityIcon(layer)}"></use></svg></span>
      </button>` : '';
  const filterButtonLabel = localize('filterButtonTitle', options.filterButtonTitle);
  const filterButtonHtml = hasFilterButton ? `
      <button class="o-layer_search_filter__filter-button o-layer_search_filter__action-button round light compact icon-small" type="button" aria-pressed="false" aria-label="${escapeHtml(filterButtonLabel)}" title="${escapeHtml(filterButtonLabel)}">
        <span class="icon grey">
          <svg class="o-layer_search_filter__filter-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39C20.25 4.95 19.78 4 18.95 4H5.04c-.83 0-1.3.95-.79 1.61z"></path>
          </svg>
        </span>
      </button>` : '';
  const zoomButtonLabel = localize('zoomToResultsButtonTitle', options.zoomToResultsButtonTitle);
  const zoomToResultsButtonHtml = hasZoomToResultsButton ? `
      <button class="o-layer_search_filter__zoom-to-results-button o-layer_search_filter__action-button round light compact icon-small" type="button" aria-label="${escapeHtml(zoomButtonLabel)}" title="${escapeHtml(zoomButtonLabel)}">
        <span class="icon grey">
          <svg class="o-layer_search_filter__zoom-to-results-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3h-6zM3 9l2.3-2.3 2.87 2.89 1.42-1.42L6.7 5.3 9 3H3v6zm6 12l-2.3-2.3 2.89-2.87-1.42-1.42L5.3 17.3 3 15v6h6zm12-6l-2.3 2.3-2.87-2.89-1.42 1.42 2.89 2.87L15 21h6v-6z"></path>
          </svg>
        </span>
      </button>` : '';
  const featureInfoButtonLabel = localize('featureInfoForResultsButtonTitle', options.featureInfoForResultsButtonTitle);
  const featureInfoForResultsButtonHtml = hasFeatureInfoForResultsButton ? `
      <button class="o-layer_search_filter__feature-info-results-button o-layer_search_filter__action-button round light compact icon-small" type="button" aria-label="${escapeHtml(featureInfoButtonLabel)}" title="${escapeHtml(featureInfoButtonLabel)}">
        <span class="icon grey">
          <svg class="o-layer_search_filter__feature-info-results-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-11h2V7h-2v2z"></path>
          </svg>
        </span>
      </button>` : '';
  const closeButtonLabel = localize('closeSearchButtonTitle', options.closeSearchButtonTitle);
  const closeSearchButtonHtml = hasCloseSearchButton ? `
      <button class="o-layer_search_filter__close-button o-layer_search_filter__action-button round light compact icon-small" type="button" aria-label="${escapeHtml(closeButtonLabel)}" title="${escapeHtml(closeButtonLabel)}">
        <span class="icon grey"><svg class="grey"><use xlink:href="#ic_close_24px"></use></svg></span>
      </button>` : '';
  const wrapper = document.createElement('div');
  wrapper.className = 'o-layer_search_filter padding-small padding-x text-small';
  wrapper.innerHTML = `
    <button class="${activationButtonClass}" type="button" aria-expanded="false" aria-label="${escapeHtml(activationButtonAriaLabel)}">
      <span class="icon grey"><svg class="grey"><use xlink:href="#ic_search_24px"></use></svg></span>
      ${activationButtonTextHtml}
    </button>
    <form class="o-layer_search_filter__form hidden" aria-label="${escapeHtml(localize('title', options.title))}">
      <div class="o-layer_search_filter__control o-search o-search-false flex row align-center padding-right-small">
        <input class="o-layer_search_filter__input o-search-field form-control text-grey-darker" type="text" autocomplete="off" placeholder="${escapeHtml(localize('placeholder', options.placeholder))}" />
        <button class="o-layer_search_filter__icon-button o-layer_search_filter__search-button o-search-button no-shrink no-grow compact icon-small" type="submit" aria-label="Sök">
          <span class="icon grey"><svg class="grey"><use xlink:href="#ic_search_24px"></use></svg></span>
        </button>
        <button class="o-layer_search_filter__icon-button o-layer_search_filter__clear-button o-search-button-close no-shrink no-grow compact icon-small" type="button" aria-label="Rensa sökning">
          <span class="icon grey"><svg class="grey"><use xlink:href="#ic_close_24px"></use></svg></span>
        </button>
      </div>
      <div class="o-layer_search_filter__between-control hidden">
        <input class="o-layer_search_filter__between-input form-control text-grey-darker" type="text" autocomplete="off" placeholder="${escapeHtml(localize('numericComparisonBetweenEndPlaceholder', options.numericComparisonBetweenEndPlaceholder))}" aria-label="${escapeHtml(localize('numericComparisonBetweenEndPlaceholder', options.numericComparisonBetweenEndPlaceholder))}" />
      </div>
    </form>
    <div class="o-layer_search_filter__actions hidden" role="toolbar" aria-label="${escapeHtml(localize('filterActionsTitle', options.filterActionsTitle))}">
      ${layerVisibilityButtonHtml}
      ${filterButtonHtml}
      ${zoomToResultsButtonHtml}
      ${featureInfoForResultsButtonHtml}
      <div class="o-layer_search_filter__operator hidden">
        <select class="o-layer_search_filter__operator-select" aria-hidden="true" tabindex="-1"></select>
        <button class="o-layer_search_filter__operator-button" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="${escapeHtml(localize('searchOperatorTitle', options.searchOperatorTitle))}" title="${escapeHtml(localize('searchOperatorTitle', options.searchOperatorTitle))}">
          <span class="o-layer_search_filter__operator-button-text"></span>
        </button>
        <div class="o-layer_search_filter__operator-menu hidden" role="listbox" aria-label="${escapeHtml(localize('searchOperatorTitle', options.searchOperatorTitle))}"></div>
      </div>
    </div>
    <div class="o-layer_search_filter__attributes hidden" aria-label="${escapeHtml(localize('attributeFilterTitle', options.attributeFilterTitle))}"></div>
    <div class="o-layer_search_filter__footer hidden">
      <div class="o-layer_search_filter__status" aria-live="polite" hidden></div>
      ${closeSearchButtonHtml}
    </div>
  `;
  targetEl.appendChild(wrapper);

  const elements = {
    actionsEl: wrapper.querySelector('.o-layer_search_filter__actions'),
    activateButtonEl: wrapper.querySelector('.o-layer_search_filter__activate-button'),
    attributesEl: wrapper.querySelector('.o-layer_search_filter__attributes'),
    betweenControlEl: wrapper.querySelector('.o-layer_search_filter__between-control'),
    betweenInputEl: wrapper.querySelector('.o-layer_search_filter__between-input'),
    clearButtonEl: wrapper.querySelector('.o-layer_search_filter__clear-button'),
    closeSearchButtonEl: wrapper.querySelector('.o-layer_search_filter__close-button'),
    controlEl: wrapper.querySelector('.o-layer_search_filter__control'),
    featureInfoForResultsButtonEl: wrapper.querySelector('.o-layer_search_filter__feature-info-results-button'),
    filterButtonEl: wrapper.querySelector('.o-layer_search_filter__filter-button'),
    footerEl: wrapper.querySelector('.o-layer_search_filter__footer'),
    formEl: wrapper.querySelector('.o-layer_search_filter__form'),
    inputEl: wrapper.querySelector('.o-layer_search_filter__input'),
    layerVisibilityButtonEl: wrapper.querySelector('.o-layer_search_filter__visibility-button'),
    operatorButtonEl: wrapper.querySelector('.o-layer_search_filter__operator-button'),
    operatorButtonTextEl: wrapper.querySelector('.o-layer_search_filter__operator-button-text'),
    operatorEl: wrapper.querySelector('.o-layer_search_filter__operator'),
    operatorMenuEl: wrapper.querySelector('.o-layer_search_filter__operator-menu'),
    operatorSelectEl: wrapper.querySelector('.o-layer_search_filter__operator-select'),
    statusEl: wrapper.querySelector('.o-layer_search_filter__status'),
    zoomToResultsButtonEl: wrapper.querySelector('.o-layer_search_filter__zoom-to-results-button')
  };
  elements.layerVisibilityIconUseEl = elements.layerVisibilityButtonEl
    ? elements.layerVisibilityButtonEl.querySelector('use')
    : undefined;
  const footerScrollContainerEl = getVerticalScrollContainer(targetEl);
  if (footerScrollContainerEl && footerScrollContainerEl.parentElement) {
    footerScrollContainerEl.classList.add('o-layer_search_filter__scroll-container--docked-footer');
    elements.footerEl.classList.add('o-layer_search_filter__footer--docked');
    footerScrollContainerEl.insertAdjacentElement('afterend', elements.footerEl);
  }

  return {
    elements,
    footerScrollContainerEl,
    hasActionButtons,
    layerPanelSlidenavEl: targetEl.closest && targetEl.closest('.slidenav'),
    targetEl,
    wrapper
  };
}

;// ./src/search-activation.js


function createSearchActivation({
  actions,
  layer,
  localize,
  operatorMenu,
  options,
  searchExecution,
  services,
  state,
  view
}) {
  const {
    attributesEl,
    betweenInputEl,
    featureInfoForResultsButtonEl,
    filterButtonEl,
    inputEl,
    statusEl,
    zoomToResultsButtonEl
  } = view.elements;

  function setSearchControlsDisabled(disabled) {
    inputEl.disabled = disabled;
    if (filterButtonEl) filterButtonEl.disabled = disabled;
    if (zoomToResultsButtonEl) zoomToResultsButtonEl.disabled = disabled;
    if (featureInfoForResultsButtonEl) featureInfoForResultsButtonEl.disabled = disabled;
    operatorMenu.setDisabled(disabled);
    betweenInputEl.disabled = disabled;
  }

  function updateAttributeButtonsState() {
    Array.from(attributesEl.querySelectorAll('.o-layer_search_filter__attribute-button')).forEach((button) => {
      const isSelected = state.selectedAttributeNames.has(button.dataset.attributeName);
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
    });
  }

  function handleAttributeSelectionChange() {
    const searchText = inputEl.value.trim();
    actions.persistUiState();
    if (searchText) {
      searchExecution.schedule();
      return;
    }

    searchExecution.invalidate();
    services.clearHighlightedFeatures();
    actions.suggestions.hide();
  }

  function renderAttributeButtons(attributes) {
    const attributeNames = new Set(state.discoveredAttributes.map(attribute => attribute.name));
    Array.from(state.selectedAttributeNames).forEach((attributeName) => {
      if (!attributeNames.has(attributeName)) state.selectedAttributeNames.delete(attributeName);
    });
    attributesEl.replaceChildren();

    const visibleAttributes = services.getSearchOperatorAttributes(attributes, state.currentSearchOperator);
    if (visibleAttributes.length === 0) {
      attributesEl.classList.add('hidden');
      actions.persistUiState();
      return;
    }

    const titleEl = document.createElement('div');
    titleEl.className = 'o-layer_search_filter__attributes-title';
    titleEl.replaceChildren(document.createTextNode(localize('attributeFilterTitle', options.attributeFilterTitle)));

    const listEl = document.createElement('div');
    listEl.className = 'o-layer_search_filter__attributes-list';
    listEl.setAttribute('role', 'group');
    listEl.setAttribute('aria-label', localize('attributeFilterTitle', options.attributeFilterTitle));

    visibleAttributes.forEach((attribute) => {
      const attributeButtonEl = document.createElement('button');
      attributeButtonEl.type = 'button';
      attributeButtonEl.className = 'o-layer_search_filter__attribute-button';
      attributeButtonEl.dataset.attributeName = attribute.name;
      attributeButtonEl.setAttribute('aria-pressed', 'false');
      const attributeDisplayName = services.getAttributeDisplayName(attribute);
      if (attributeDisplayName !== attribute.name) attributeButtonEl.setAttribute('title', attribute.name);
      attributeButtonEl.replaceChildren(document.createTextNode(attributeDisplayName));
      attributeButtonEl.addEventListener('click', () => {
        if (state.selectedAttributeNames.has(attribute.name)) {
          state.selectedAttributeNames.delete(attribute.name);
        } else {
          state.selectedAttributeNames.add(attribute.name);
        }
        updateAttributeButtonsState();
        handleAttributeSelectionChange();
      });
      listEl.appendChild(attributeButtonEl);
    });

    attributesEl.appendChild(titleEl);
    attributesEl.appendChild(listEl);
    attributesEl.classList.remove('hidden');
    updateAttributeButtonsState();
    actions.persistUiState();
  }

  function showReadyAttributes(attributes, { restore = false } = {}) {
    if (state.disposed) return;
    if (!state.activationStarted) {
      actions.persistUiState();
      return;
    }
    operatorMenu.updateState();
    renderAttributeButtons(attributes);
    const message = localize('attributesReadyText', options.attributesReadyText)
      .replace('{{count}}', attributes.length);
    setPanelStatus(statusEl, message, 'success');
    setSearchControlsDisabled(false);
    actions.persistUiState();
    if (!restore) inputEl.focus();
    if (searchExecution.hasCurrentSearchableInput(inputEl.value.trim())) searchExecution.schedule();
  }

  function activate({ restore = false } = {}) {
    if (state.disposed || state.activationStarted) return;
    state.activationStarted = true;
    view.elements.activateButtonEl.classList.add('hidden');
    view.elements.activateButtonEl.setAttribute('aria-expanded', 'true');
    view.elements.formEl.classList.remove('hidden');
    actions.updateActionsVisibility();
    actions.updateFooterVisibility();
    actions.persistUiState();
    if (!restore) inputEl.focus();

    services.prewarmFilterDialects(layer);
    if (state.discoveredAttributes.length > 0) {
      showReadyAttributes(state.discoveredAttributes, { restore });
      return;
    }
    if (state.discoveryFailed) {
      state.discoveryFailed = false;
      actions.persistUiState();
    }

    setPanelStatus(statusEl, localize('discoveringAttributesText', options.discoveringAttributesText), 'loading');
    services.discoverAttributes(layer)
      .then((attributes) => {
        if (state.disposed) return;
        state.discoveredAttributes = attributes;
        if (attributes.length === 0) {
          state.discoveryFailed = true;
          const missingLayerDataText = services.hasSearchableLayerData(layer)
            ? localize('noAttributesText', options.noAttributesText)
            : localize('unsupportedLayerText', options.unsupportedLayerText);
          actions.persistUiState();
          if (state.activationStarted) setPanelStatus(statusEl, missingLayerDataText, 'error');
          return;
        }
        state.discoveryFailed = false;
        showReadyAttributes(attributes, { restore });
      })
      .catch((error) => {
        if (state.disposed) return;
        state.discoveryFailed = true;
        actions.persistUiState();
        if (!state.activationStarted) return;
        console.error(`${options.name}: layer attribute discovery failed`, error);
        setPanelStatus(statusEl, localize('noAttributesText', options.noAttributesText), 'error');
      });
  }

  return {
    activate,
    renderAttributeButtons,
    setSearchControlsDisabled
  };
}

;// ./src/search-execution.js



function createSearchExecution({
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

;// ./src/search-operator-menu.js


function createSearchOperatorMenu({
  actions,
  localize,
  options,
  searchOperatorOptions,
  services,
  state,
  view
}) {
  const {
    betweenControlEl,
    betweenInputEl,
    inputEl,
    operatorButtonEl,
    operatorButtonTextEl,
    operatorEl,
    operatorMenuEl,
    operatorSelectEl
  } = view.elements;
  const operatorMenuParentEl = operatorMenuEl.parentElement;
  const operatorMenuNextSibling = operatorMenuEl.nextSibling;
  let operatorOutsidePointerDownActive = false;
  let operatorViewportListenersActive = false;

  function getSearchOperatorOption(operator) {
    const normalizedOperator = normalizeSearchOperator(operator);
    return searchOperatorOptions.find(operatorOption => operatorOption.value === normalizedOperator)
      || searchOperatorOptions[0];
  }

  function getSearchOperatorLabel(operator) {
    const operatorOption = getSearchOperatorOption(operator);
    return localize(operatorOption.titleKey, operatorOption.titleFallback);
  }

  function getSearchOperatorOptionText(operator) {
    const operatorOption = getSearchOperatorOption(operator);
    return localize(operatorOption.optionKey, operatorOption.optionFallback);
  }

  function syncCurrentSearchOperatorDetails() {
    state.currentSearchOperator = normalizeSearchOperator(
      state.currentSearchOperator,
      state.currentSearchMode,
      state.currentTextMatchMode,
      state.currentNumericComparisonMode
    );
    state.currentSearchMode = getSearchModeForOperator(state.currentSearchOperator);
    state.currentTextMatchMode = getTextMatchModeForOperator(
      state.currentSearchOperator,
      state.currentTextMatchMode
    );
    state.currentNumericComparisonMode = getNumericComparisonModeForOperator(
      state.currentSearchOperator,
      state.currentNumericComparisonMode
    );
  }

  const getOperatorOptionButtons = () => Array.from(
    operatorMenuEl.querySelectorAll('.o-layer_search_filter__operator-option')
  );

  function scrollOperatorOptionIntoView(optionButtonEl) {
    if (!optionButtonEl) return;
    const optionTop = optionButtonEl.offsetTop;
    const optionBottom = optionTop + optionButtonEl.offsetHeight;
    const menuTop = operatorMenuEl.scrollTop;
    const menuBottom = menuTop + operatorMenuEl.clientHeight;

    if (optionTop < menuTop) {
      operatorMenuEl.scrollTop = optionTop;
    } else if (optionBottom > menuBottom) {
      operatorMenuEl.scrollTop = optionBottom - operatorMenuEl.clientHeight;
    }
  }

  function attachOperatorMenuToBody() {
    if (operatorMenuEl.parentElement !== document.body) document.body.appendChild(operatorMenuEl);
  }

  function restoreOperatorMenuParent() {
    if (operatorMenuEl.parentElement !== operatorMenuParentEl) {
      operatorMenuParentEl.insertBefore(operatorMenuEl, operatorMenuNextSibling);
    }
  }

  function positionOperatorMenu() {
    if (!state.operatorMenuOpen || operatorButtonEl.disabled || operatorMenuEl.children.length === 0) return;

    const buttonRect = operatorButtonEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const margin = 8;
    const gap = 4;
    const preferredMaxHeight = Math.min(320, Math.max(192, viewportHeight - (margin * 2)));
    const availableBelow = Math.max(0, viewportHeight - buttonRect.bottom - gap - margin);
    const availableAbove = Math.max(0, buttonRect.top - gap - margin);
    const openAbove = availableBelow < Math.min(preferredMaxHeight, 180) && availableAbove > availableBelow;
    const availableHeight = openAbove ? availableAbove : availableBelow;
    const maxHeight = Math.max(96, Math.min(preferredMaxHeight, availableHeight || preferredMaxHeight));
    const menuWidth = Math.max(buttonRect.width, 180);
    const left = Math.min(Math.max(margin, buttonRect.left), Math.max(margin, viewportWidth - menuWidth - margin));

    operatorMenuEl.style.left = `${left}px`;
    operatorMenuEl.style.maxHeight = `${maxHeight}px`;
    operatorMenuEl.style.minWidth = `${buttonRect.width}px`;
    operatorMenuEl.style.top = openAbove
      ? `${Math.max(margin, buttonRect.top - gap - maxHeight)}px`
      : `${Math.min(buttonRect.bottom + gap, viewportHeight - margin - maxHeight)}px`;
    operatorMenuEl.style.width = `${menuWidth}px`;

    const menuHeight = Math.min(operatorMenuEl.scrollHeight, maxHeight);
    if (openAbove) operatorMenuEl.style.top = `${Math.max(margin, buttonRect.top - gap - menuHeight)}px`;
  }

  function handleOperatorOutsidePointerDown(event) {
    if (!operatorEl.contains(event.target) && !operatorMenuEl.contains(event.target)) close();
  }

  function handleOperatorViewportChange() {
    if (state.operatorMenuOpen) positionOperatorMenu();
  }

  function updateMenuVisibility() {
    const menuVisible = state.operatorMenuOpen
      && !operatorButtonEl.disabled
      && operatorMenuEl.children.length > 0;
    if (menuVisible) attachOperatorMenuToBody();
    operatorMenuEl.hidden = !menuVisible;
    operatorMenuEl.classList.toggle('hidden', !menuVisible);
    operatorEl.classList.toggle('is-open', menuVisible);
    operatorButtonEl.setAttribute('aria-expanded', String(menuVisible));
    if (menuVisible) {
      positionOperatorMenu();
    } else {
      operatorMenuEl.removeAttribute('style');
      restoreOperatorMenuParent();
    }
    if (menuVisible && !operatorOutsidePointerDownActive) {
      document.addEventListener('pointerdown', handleOperatorOutsidePointerDown);
      operatorOutsidePointerDownActive = true;
    } else if (!menuVisible && operatorOutsidePointerDownActive) {
      document.removeEventListener('pointerdown', handleOperatorOutsidePointerDown);
      operatorOutsidePointerDownActive = false;
    }
    if (menuVisible && !operatorViewportListenersActive) {
      window.addEventListener('resize', handleOperatorViewportChange);
      window.addEventListener('scroll', handleOperatorViewportChange, true);
      operatorViewportListenersActive = true;
    } else if (!menuVisible && operatorViewportListenersActive) {
      window.removeEventListener('resize', handleOperatorViewportChange);
      window.removeEventListener('scroll', handleOperatorViewportChange, true);
      operatorViewportListenersActive = false;
    }
  }

  function close() {
    state.operatorMenuOpen = false;
    updateMenuVisibility();
  }

  function open() {
    if (operatorButtonEl.disabled || operatorEl.hidden || operatorMenuEl.children.length === 0) return;
    state.operatorMenuOpen = true;
    updateMenuVisibility();
    scrollOperatorOptionIntoView(operatorMenuEl.querySelector('.o-layer_search_filter__operator-option.is-selected'));
  }

  function setDisabled(disabled) {
    operatorSelectEl.disabled = disabled;
    operatorButtonEl.disabled = disabled;
    if (disabled) close();
  }

  function focusOperatorOption(step = 0) {
    const optionButtons = getOperatorOptionButtons();
    if (optionButtons.length === 0) return;
    let activeIndex = optionButtons.indexOf(document.activeElement);
    if (activeIndex < 0) {
      activeIndex = optionButtons.findIndex(optionButton => optionButton.getAttribute('aria-selected') === 'true');
    }
    if (activeIndex < 0) activeIndex = 0;
    const nextIndex = (activeIndex + step + optionButtons.length) % optionButtons.length;
    optionButtons[nextIndex].focus();
    scrollOperatorOptionIntoView(optionButtons[nextIndex]);
  }

  function selectSearchOperator(operatorValue) {
    operatorSelectEl.value = operatorValue;
    operatorSelectEl.dispatchEvent(new Event('change', { bubbles: true }));
    close();
    operatorButtonEl.focus();
  }

  function getOperatorOptionButtonFromEvent(event) {
    const { target } = event;
    if (!target || typeof target.closest !== 'function') return null;
    return target.closest('.o-layer_search_filter__operator-option');
  }

  function getAvailableSearchOperatorOptions() {
    const hasTextAttributes = services.hasTextSearchAttributes(state.discoveredAttributes);
    const hasNumericAttributes = services.hasNumericSearchAttributes(state.discoveredAttributes);

    return searchOperatorOptions.filter((operatorOption) => {
      if (operatorOption.type === 'mixed') return hasTextAttributes || hasNumericAttributes;
      if (operatorOption.type === 'numeric') return hasNumericAttributes;
      return hasTextAttributes;
    });
  }

  function getAvailableSearchOperator(preferredOperator = state.currentSearchOperator) {
    const normalizedOperator = normalizeSearchOperator(
      preferredOperator,
      state.currentSearchMode,
      state.currentTextMatchMode,
      state.currentNumericComparisonMode
    );
    const availableOptions = getAvailableSearchOperatorOptions();
    if (availableOptions.some(operatorOption => operatorOption.value === normalizedOperator)) return normalizedOperator;
    const fallbackOperator = getSearchOperatorFromModes(
      state.currentSearchMode,
      state.currentTextMatchMode,
      state.currentNumericComparisonMode
    );
    if (availableOptions.some(operatorOption => operatorOption.value === fallbackOperator)) return fallbackOperator;
    return availableOptions.length > 0 ? availableOptions[0].value : normalizedOperator;
  }

  function updateBetweenControlState() {
    const isBetween = isBetweenSearchOperator(state.currentSearchOperator);
    const searchPlaceholder = isBetween
      ? localize('numericComparisonBetweenStartPlaceholder', options.numericComparisonBetweenStartPlaceholder)
      : localize('placeholder', options.placeholder);

    inputEl.setAttribute('placeholder', searchPlaceholder);
    betweenControlEl.hidden = !isBetween;
    betweenControlEl.classList.toggle('hidden', !isBetween);
  }

  function updateState() {
    state.currentSearchOperator = getAvailableSearchOperator(state.currentSearchOperator);
    syncCurrentSearchOperatorDetails();

    const availableOptions = getAvailableSearchOperatorOptions();
    operatorSelectEl.replaceChildren();
    operatorMenuEl.replaceChildren();
    availableOptions.forEach((operatorOption) => {
      const optionText = getSearchOperatorOptionText(operatorOption.value);
      const optionLabel = getSearchOperatorLabel(operatorOption.value);
      const selected = operatorOption.value === state.currentSearchOperator;
      const optionEl = document.createElement('option');
      optionEl.value = operatorOption.value;
      optionEl.replaceChildren(document.createTextNode(optionText));
      operatorSelectEl.appendChild(optionEl);

      const optionButtonEl = document.createElement('button');
      optionButtonEl.type = 'button';
      optionButtonEl.className = 'o-layer_search_filter__operator-option';
      optionButtonEl.dataset.searchOperator = operatorOption.value;
      optionButtonEl.setAttribute('role', 'option');
      optionButtonEl.setAttribute('aria-selected', String(selected));
      optionButtonEl.setAttribute('title', optionLabel);
      optionButtonEl.classList.toggle('is-selected', selected);
      optionButtonEl.replaceChildren(document.createTextNode(optionText));
      operatorMenuEl.appendChild(optionButtonEl);
    });

    operatorSelectEl.value = state.currentSearchOperator;
    const currentOperatorLabel = getSearchOperatorLabel(state.currentSearchOperator);
    const currentOperatorText = getSearchOperatorOptionText(state.currentSearchOperator);
    operatorButtonTextEl.replaceChildren(document.createTextNode(currentOperatorText));
    operatorButtonEl.setAttribute('aria-label', `${localize('searchOperatorTitle', options.searchOperatorTitle)}: ${currentOperatorLabel}`);
    operatorButtonEl.setAttribute('title', currentOperatorLabel);
    operatorSelectEl.setAttribute('title', currentOperatorLabel);
    operatorEl.hidden = availableOptions.length === 0;
    operatorEl.classList.toggle('hidden', availableOptions.length === 0);
    if (availableOptions.length === 0) close();
    updateMenuVisibility();
    actions.updateActionsVisibility();
    updateBetweenControlState();
    actions.updateSearchState();
  }

  function bind() {
    operatorButtonEl.addEventListener('click', () => (state.operatorMenuOpen ? close() : open()));
    operatorButtonEl.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
        focusOperatorOption();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        open();
        focusOperatorOption(-1);
      } else if (event.key === 'Escape') close();
    });
    operatorMenuEl.addEventListener('click', (event) => {
      const optionButtonEl = getOperatorOptionButtonFromEvent(event);
      if (optionButtonEl) selectSearchOperator(optionButtonEl.dataset.searchOperator);
    });
    operatorMenuEl.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        focusOperatorOption(event.key === 'ArrowDown' ? 1 : -1);
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        const buttons = getOperatorOptionButtons();
        if (buttons.length > 0) buttons[event.key === 'Home' ? 0 : buttons.length - 1].focus();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const optionButtonEl = getOperatorOptionButtonFromEvent(event);
        if (optionButtonEl) selectSearchOperator(optionButtonEl.dataset.searchOperator);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        close();
        operatorButtonEl.focus();
      }
    });
    [operatorEl, operatorMenuEl].forEach(element => element.addEventListener('focusout', (event) => {
      if (!operatorEl.contains(event.relatedTarget) && !operatorMenuEl.contains(event.relatedTarget)) close();
    }));
    operatorSelectEl.addEventListener('change', () => {
      state.currentSearchOperator = normalizeSearchOperator(
        operatorSelectEl.value,
        state.currentSearchMode,
        state.currentTextMatchMode,
        state.currentNumericComparisonMode
      );
      updateState();
      actions.renderAttributeButtons(state.discoveredAttributes);
      actions.persistUiState();
      if (inputEl.value.trim() || betweenInputEl.value.trim()) actions.scheduleSearch();
    });
  }

  function destroy() {
    close();
    if (operatorOutsidePointerDownActive) {
      document.removeEventListener('pointerdown', handleOperatorOutsidePointerDown);
      operatorOutsidePointerDownActive = false;
    }
    if (operatorViewportListenersActive) {
      window.removeEventListener('resize', handleOperatorViewportChange);
      window.removeEventListener('scroll', handleOperatorViewportChange, true);
      operatorViewportListenersActive = false;
    }
    if (operatorMenuEl.parentElement === document.body) {
      if (operatorMenuParentEl && operatorMenuParentEl.isConnected) {
        restoreOperatorMenuParent();
      } else {
        operatorMenuEl.remove();
      }
    }
  }

  return {
    bind,
    close,
    destroy,
    setDisabled,
    updateState
  };
}

;// ./src/search-panel.js






function createSearchPanel({
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

;// ./src/suggestions-panel.js


function createSuggestionsPanel({
  layerContext,
  localize,
  options,
  runtime,
  services
}) {
  const {
    activateLayerOnSuggestionClick,
    defaultNumericComparisonMode,
    defaultSearchMode,
    defaultTextMatchMode,
    maxZoomLevel,
    noResultsText,
    suggestionsTitle
  } = options;
  const suggestionSlidenavListeners = new Map();
  let suggestionsEl;
  let suggestionsTitleEl;
  let suggestionsStatusEl;
  let suggestionsListEl;
  let suggestionsResultCount;
  let activeSearchInputEl;

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getMatchedAttribute(
    jsonFeature,
    attributes,
    searchText,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchModeValue = defaultSearchMode,
    rangeEndText = '',
    searchOperatorValue = getSearchOperatorFromModes(searchModeValue, matchMode, comparisonMode)
  ) {
    const properties = jsonFeature.properties || {};
    const matchedAttribute = attributes
      .filter(attribute => attribute && Object.prototype.hasOwnProperty.call(properties, attribute.name))
      .find(attribute => services.attributeValueMatchesSearch(
        attribute,
        properties[attribute.name],
        searchText,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      ));

    if (!matchedAttribute) return undefined;
    return {
      name: matchedAttribute.name,
      title: services.getAttributeTitle(matchedAttribute),
      displayName: services.getAttributeDisplayName(matchedAttribute),
      type: matchedAttribute.type,
      value: properties[matchedAttribute.name]
    };
  }

  function highlightMatchedValue(
    matchedAttribute,
    searchText,
    matchMode = defaultTextMatchMode,
    searchOperatorValue = getSearchOperatorFromModes(defaultSearchMode, matchMode, defaultNumericComparisonMode)
  ) {
    const value = String(matchedAttribute.value);
    const normalizedSearchText = String(searchText).trim();
    const normalizedSearchOperator = normalizeSearchOperator(searchOperatorValue, defaultSearchMode, matchMode, defaultNumericComparisonMode);

    if (!normalizedSearchText) return escapeHtml(value);

    if (matchedAttribute.type === 'string' || matchedAttribute.type === 'unknown') {
      if (isEqualsSearchOperator(normalizedSearchOperator)) {
        return value === normalizedSearchText
          ? `<strong>${escapeHtml(value)}</strong>`
          : escapeHtml(value);
      }
      const valueLower = value.toLowerCase();
      const searchLower = normalizedSearchText.toLowerCase();
      let matchIndex = valueLower.indexOf(searchLower);
      if (getTextMatchModeForOperator(normalizedSearchOperator, matchMode) === 'startsWith') {
        matchIndex = valueLower.startsWith(searchLower) ? 0 : -1;
      }
      if (matchIndex > -1) {
        const before = value.substring(0, matchIndex);
        const match = value.substring(matchIndex, matchIndex + normalizedSearchText.length);
        const after = value.substring(matchIndex + normalizedSearchText.length);
        return `${escapeHtml(before)}<strong>${escapeHtml(match)}</strong>${escapeHtml(after)}`;
      }
    }

    return `<strong>${escapeHtml(value)}</strong>`;
  }

  function getContainingGroupLayer(layer) {
    const { viewer } = runtime;
    if (!viewer || typeof viewer.getGroupLayers !== 'function') return undefined;
    return viewer.getGroupLayers().find(groupLayer => layerContext.getGroupDescendantLayers(groupLayer).includes(layer));
  }

  function ensureLayerVisible(layer) {
    if (!layer || typeof layer.getVisible !== 'function' || typeof layer.setVisible !== 'function') return;
    const groupLayer = getContainingGroupLayer(layer);
    if (groupLayer && typeof groupLayer.getVisible === 'function' && typeof groupLayer.setVisible === 'function' && !groupLayer.getVisible()) {
      groupLayer.setVisible(true);
    }
    if (!layer.getVisible()) layer.setVisible(true);
  }

  function ensureLayerVisibleForSuggestionClick(layer) {
    if (activateLayerOnSuggestionClick) ensureLayerVisible(layer);
  }

  function showFeatureOnMap(layer, feature) {
    ensureLayerVisibleForSuggestionClick(layer);
    services.setHighlightedFeatures([feature], { force: true });
    services.zoomToFeatures([feature]);
  }

  function showFeature(layer, feature) {
    if (!services.canOpenFeatureInfo(layer)) {
      showFeatureOnMap(layer, feature);
      return;
    }

    services.clearHighlightedFeatures();
    ensureLayerVisibleForSuggestionClick(layer);
    const level = maxZoomLevel || runtime.viewer.getResolutions().length - 2;
    runtime.featureInfo.showFeatureInfo({
      feature: [feature],
      layerName: layer.get('name')
    }, {
      maxZoomLevel: level,
      suppressDialog: false
    });
  }

  function position() {
    if (!suggestionsEl) return;

    const { viewer } = runtime;
    const parentEl = document.getElementById(viewer.getMain().getId()) || viewer.getMap().getTargetElement();
    const anchorEl = activeSearchInputEl && activeSearchInputEl.isConnected
      ? activeSearchInputEl
      : parentEl.querySelector('.o-layer_search_filter__input:focus') || parentEl.querySelector('.o-layer_search_filter__input');
    if (!anchorEl) return;

    const margin = 8;
    const gap = 8;
    const parentRect = parentEl.getBoundingClientRect();
    const anchorRect = anchorEl.getBoundingClientRect();
    const legendEl = parentEl.querySelector('.o-legend') || document.querySelector('.o-legend');
    const suggestionsWidth = Math.max(anchorRect.width, 240);
    const bottom = Math.max(parentRect.bottom - anchorRect.top, margin);

    if (legendEl) {
      const legendRect = legendEl.getBoundingClientRect();
      const availableLeftOfLegend = legendRect.left - parentRect.left - gap - margin;
      if (availableLeftOfLegend >= suggestionsWidth) {
        const legendBottom = Math.max(parentRect.bottom - legendRect.bottom, margin);
        suggestionsEl.style.right = `${Math.max(parentRect.right - legendRect.left + gap, margin)}px`;
        suggestionsEl.style.bottom = `${legendBottom}px`;
        suggestionsEl.style.width = `${suggestionsWidth}px`;
        return;
      }
    }

    suggestionsEl.style.right = `${Math.max(parentRect.right - anchorRect.right, margin)}px`;
    suggestionsEl.style.bottom = `${bottom}px`;
    suggestionsEl.style.width = `${suggestionsWidth}px`;
  }

  function hide({ clearResults = true } = {}) {
    if (!suggestionsEl) return;
    suggestionsEl.classList.add('hidden');
    if (!clearResults) return;
    suggestionsResultCount = undefined;
    suggestionsListEl.replaceChildren();
    suggestionsStatusEl.replaceChildren();
  }

  function destroy() {
    if (suggestionsEl) {
      window.removeEventListener('resize', position);
      suggestionsEl.remove();
    }
    suggestionsEl = undefined;
    suggestionsTitleEl = undefined;
    suggestionsStatusEl = undefined;
    suggestionsListEl = undefined;
    suggestionsResultCount = undefined;
    activeSearchInputEl = undefined;
  }

  function clearSlidenavListeners() {
    suggestionSlidenavListeners.forEach((listener, slidenavEl) => {
      slidenavEl.removeEventListener('slidenav:slide', listener);
    });
    suggestionSlidenavListeners.clear();
  }

  function ensure() {
    if (suggestionsEl) return suggestionsEl;

    const { viewer } = runtime;
    const targetEl = document.getElementById(viewer.getMain().getId()) || viewer.getMap().getTargetElement();
    suggestionsEl = document.createElement('div');
    suggestionsEl.className = 'o-layer_search_filter-suggestions hidden';
    suggestionsEl.innerHTML = `
      <div class="o-layer_search_filter-suggestions__header">
        <div class="o-layer_search_filter-suggestions__title"></div>
        <button class="o-layer_search_filter-suggestions__close" type="button" aria-label="Stäng sökresultat">×</button>
      </div>
      <div class="o-layer_search_filter-suggestions__status" aria-live="polite"></div>
      <ul class="o-layer_search_filter-suggestions__list"></ul>
    `;
    targetEl.appendChild(suggestionsEl);

    suggestionsTitleEl = suggestionsEl.querySelector('.o-layer_search_filter-suggestions__title');
    suggestionsStatusEl = suggestionsEl.querySelector('.o-layer_search_filter-suggestions__status');
    suggestionsListEl = suggestionsEl.querySelector('.o-layer_search_filter-suggestions__list');
    suggestionsEl.querySelector('.o-layer_search_filter-suggestions__close').addEventListener('click', () => hide());
    window.addEventListener('resize', position);
    return suggestionsEl;
  }

  function bindToSlidenav(targetEl) {
    const slidenavEl = targetEl.closest && targetEl.closest('.slidenav');
    if (!slidenavEl || suggestionSlidenavListeners.has(slidenavEl)) return;

    const onSlidenavSlide = (event) => {
      if (event.detail && event.detail.activeSlide === 'main') hide();
    };
    suggestionSlidenavListeners.set(slidenavEl, onSlidenavSlide);
    slidenavEl.addEventListener('slidenav:slide', onSlidenavSlide);
  }

  function getTitle(layer) {
    const resultCountText = Number.isInteger(suggestionsResultCount) ? ` (${suggestionsResultCount})` : '';
    return `${localize('suggestionsTitle', suggestionsTitle)}: ${layer.get('title') || layer.get('name')}${resultCountText}`;
  }

  function show(layer, resultCount) {
    ensure();
    if (arguments.length > 1) {
      suggestionsResultCount = Number.isInteger(resultCount) ? resultCount : undefined;
    }
    suggestionsTitleEl.replaceChildren(document.createTextNode(getTitle(layer)));
    position();
    suggestionsEl.classList.remove('hidden');
  }

  function setStatus(message, state = '') {
    ensure();
    suggestionsStatusEl.hidden = !message;
    suggestionsStatusEl.setAttribute('class', `o-layer_search_filter-suggestions__status ${state}`.trim());
    suggestionsStatusEl.replaceChildren(document.createTextNode(message));
  }

  function render(
    layer,
    results,
    searchText,
    attributes,
    matchMode = defaultTextMatchMode,
    comparisonMode = defaultNumericComparisonMode,
    searchModeValue = defaultSearchMode,
    rangeEndText = '',
    searchOperatorValue = getSearchOperatorFromModes(searchModeValue, matchMode, comparisonMode),
    renderOptions = {}
  ) {
    const { showPanel = true } = renderOptions;
    ensure();
    suggestionsListEl.replaceChildren();

    results.jsonFeatures.forEach((jsonFeature, index) => {
      const feature = results.features[index];
      const resultLayer = results.layers && results.layers[index] ? results.layers[index] : layer;
      const resultAttributes = results.attributes && results.attributes[index] ? results.attributes[index] : attributes;
      const matchedAttribute = getMatchedAttribute(
        jsonFeature,
        resultAttributes,
        searchText,
        matchMode,
        comparisonMode,
        searchModeValue,
        rangeEndText,
        searchOperatorValue
      );
      if (!matchedAttribute) return;

      const item = document.createElement('li');
      const button = document.createElement('button');
      const resultLayerTitle = resultLayer !== layer ? resultLayer.get('title') || resultLayer.get('name') : '';
      const matchedAttributeDisplayName = matchedAttribute.displayName || matchedAttribute.name;
      const resultDescription = resultLayerTitle
        ? `${matchedAttributeDisplayName} - ${resultLayerTitle}`
        : matchedAttributeDisplayName;
      button.type = 'button';
      button.className = 'o-layer_search_filter__result-button';
      button.innerHTML = `
        <span class="suggestion o-layer_search_filter__result-content">
          <span class="o-layer_search_filter__result-title">${highlightMatchedValue(matchedAttribute, searchText, matchMode, searchOperatorValue)}</span>
          <span class="o-layer_search_filter__result-description">${escapeHtml(resultDescription)}</span>
        </span>
      `;
      button.addEventListener('click', () => {
        hide({ clearResults: false });
        showFeature(resultLayer, feature);
      });
      item.appendChild(button);
      suggestionsListEl.appendChild(item);
    });

    const resultCount = suggestionsListEl.children.length;
    if (showPanel) {
      show(layer, resultCount);
    } else {
      suggestionsResultCount = resultCount;
    }

    if (resultCount === 0) setStatus(localize('noResultsText', noResultsText), 'empty');
  }

  return {
    bindToSlidenav,
    clearActiveInput(inputEl) {
      if (activeSearchInputEl === inputEl) activeSearchInputEl = undefined;
    },
    clearResults() {
      ensure();
      suggestionsListEl.replaceChildren();
    },
    clearSlidenavListeners,
    destroy,
    ensure,
    hasResults: () => Boolean(suggestionsListEl && suggestionsListEl.children.length > 0),
    hide,
    isActiveInput: inputEl => activeSearchInputEl === inputEl,
    render,
    setActiveInput(inputEl) {
      activeSearchInputEl = inputEl;
    },
    setStatus,
    show
  };
}

;// ./src/control.js






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

/* harmony default export */ const control = (LayerSearchFilter);

;// ./src/index.js


/* harmony default export */ const src = (control);

})();

LayerSearchFilter = __webpack_exports__["default"];
/******/ })()
;