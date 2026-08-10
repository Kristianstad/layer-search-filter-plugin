export default function createAttributeService({
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
    const plainTextTitle = getAttributeTitle(attribute)
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return plainTextTitle || (attribute && attribute.name ? attribute.name : '');
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

  function hasLayerSearchAttributes(layer) {
    return Array.isArray(layer.get('layerSearchAttributes'));
  }

  function getConfiguredAttributes(layer) {
    const layerAttributes = hasLayerSearchAttributes(layer)
      ? layer.get('layerSearchAttributes')
      : layer.get('attributes');
    const attributes = Array.isArray(layerAttributes) ? layerAttributes : [];
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

  function usesConfiguredAttributesOnly(layer, configuredAttributes) {
    return hasLayerSearchAttributes(layer)
      || (searchableAttributesMode === 'layer' && configuredAttributes.length > 0);
  }

  function getAttributeCacheKey(
    layer,
    configuredAttributes,
    configuredAttributesOnly = usesConfiguredAttributesOnly(layer, configuredAttributes)
  ) {
    const configuredAttributesKey = configuredAttributes.map(getConfiguredAttributeCachePart).join('|');
    if (!configuredAttributesOnly) {
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
    hasLayerSearchAttributes,
    isSearchableAttribute,
    mergeAttributes,
    usesConfiguredAttributesOnly
  };
}
