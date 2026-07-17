export function stableStringify(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${key}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return String(value);
}

export function normalizeProjectionCode(value) {
  if (!value) return undefined;

  const projectionText = String(value);
  if (projectionText.toUpperCase() === 'CRS:84') return 'EPSG:4326';

  const epsgMatch = projectionText.match(/EPSG(?::|::|\/0\/)(\d+)/i);
  if (epsgMatch) return `EPSG:${epsgMatch[1]}`;
  return projectionText;
}

export default function createSearchResults({ getFeatureProperties, getViewer, limit, Origo }) {
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
