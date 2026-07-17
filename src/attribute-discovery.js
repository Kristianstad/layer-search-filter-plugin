export default function createAttributeDiscovery({
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
