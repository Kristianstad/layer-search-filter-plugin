export default function createSearchService({
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
