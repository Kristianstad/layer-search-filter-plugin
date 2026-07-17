export default function createMapResultsService({
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
