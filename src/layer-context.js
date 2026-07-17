import { FILTER_DIALECTS } from './plugin-options.js';

export default function createLayerContext({
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
