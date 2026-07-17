export default function createLocalFeatureSource({
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
