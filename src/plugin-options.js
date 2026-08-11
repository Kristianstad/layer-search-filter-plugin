import {
  SEARCH_OPERATORS,
  normalizeFeatureLimit,
  normalizeNumericComparisonMode,
  normalizeRequestQueryLength,
  normalizeSearchMode,
  normalizeSearchOperator,
  normalizeSearchableAttributesMode,
  normalizeTextMatchMode
} from './search-operators.js';

export const FILTER_DIALECTS = {
  cql: 'cql',
  qgis: 'qgis'
};

export const defaultHighlightStyleOptions = {
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

export default function createPluginOptions(options = {}) {
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

export function createSearchOperatorOptions(options) {
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
