import {
  getNumericComparisonModeForOperator,
  getSearchOperatorFromModes,
  getTextMatchModeForOperator,
  isBetweenSearchOperator,
  isEqualsSearchOperator,
  isNumericSearchOperator,
  isTextSearchOperator,
  normalizeNumericComparisonMode,
  normalizeSearchMode,
  normalizeSearchOperator,
  normalizeTextMatchMode
} from './search-operators.js';

export default function createSearchFilter({
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
