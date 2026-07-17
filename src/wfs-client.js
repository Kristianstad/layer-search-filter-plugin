export default function createWfsClient({
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
