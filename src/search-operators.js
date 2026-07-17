export const SEARCH_OPERATORS = {
  textIlike: 'textIlike',
  textStartsWith: 'textStartsWith',
  numericEquals: 'numericEquals',
  numericGreaterThan: 'numericGreaterThan',
  numericLessThan: 'numericLessThan',
  numericBetween: 'numericBetween'
};

export function normalizeTextMatchMode(mode) {
  return mode === 'startsWith' ? 'startsWith' : 'contains';
}

export function normalizeSearchMode(mode) {
  return mode === 'numeric' ? 'numeric' : 'text';
}

export function normalizeNumericComparisonMode(mode) {
  if (mode === 'greaterThan' || mode === 'lessThan' || mode === 'between') return mode;
  return 'equals';
}

export function getSearchOperatorFromModes(searchMode = 'text', matchMode = 'contains', comparisonMode = 'equals') {
  if (normalizeSearchMode(searchMode) === 'numeric') {
    const normalizedComparisonMode = normalizeNumericComparisonMode(comparisonMode);
    if (normalizedComparisonMode === 'greaterThan') return SEARCH_OPERATORS.numericGreaterThan;
    if (normalizedComparisonMode === 'lessThan') return SEARCH_OPERATORS.numericLessThan;
    if (normalizedComparisonMode === 'between') return SEARCH_OPERATORS.numericBetween;
    return SEARCH_OPERATORS.numericEquals;
  }

  return normalizeTextMatchMode(matchMode) === 'startsWith'
    ? SEARCH_OPERATORS.textStartsWith
    : SEARCH_OPERATORS.textIlike;
}

export function normalizeSearchOperator(operator, searchMode = 'text', matchMode = 'contains', comparisonMode = 'equals') {
  if (operator === SEARCH_OPERATORS.textIlike || operator === 'ilike' || operator === 'contains') {
    return SEARCH_OPERATORS.textIlike;
  }
  if (operator === SEARCH_OPERATORS.textStartsWith || operator === 'startsWith') {
    return SEARCH_OPERATORS.textStartsWith;
  }
  if (operator === SEARCH_OPERATORS.numericEquals || operator === 'equals') {
    return SEARCH_OPERATORS.numericEquals;
  }
  if (operator === SEARCH_OPERATORS.numericGreaterThan || operator === 'greaterThan') {
    return SEARCH_OPERATORS.numericGreaterThan;
  }
  if (operator === SEARCH_OPERATORS.numericLessThan || operator === 'lessThan') {
    return SEARCH_OPERATORS.numericLessThan;
  }
  if (operator === SEARCH_OPERATORS.numericBetween || operator === 'between') {
    return SEARCH_OPERATORS.numericBetween;
  }

  return getSearchOperatorFromModes(searchMode, matchMode, comparisonMode);
}

export function isNumericSearchOperator(operator) {
  const normalizedOperator = normalizeSearchOperator(operator);
  return normalizedOperator === SEARCH_OPERATORS.numericEquals
    || normalizedOperator === SEARCH_OPERATORS.numericGreaterThan
    || normalizedOperator === SEARCH_OPERATORS.numericLessThan
    || normalizedOperator === SEARCH_OPERATORS.numericBetween;
}

export function isEqualsSearchOperator(operator) {
  return normalizeSearchOperator(operator) === SEARCH_OPERATORS.numericEquals;
}

export function isNumericOnlySearchOperator(operator) {
  const normalizedOperator = normalizeSearchOperator(operator);
  return normalizedOperator === SEARCH_OPERATORS.numericGreaterThan
    || normalizedOperator === SEARCH_OPERATORS.numericLessThan
    || normalizedOperator === SEARCH_OPERATORS.numericBetween;
}

export function isTextSearchOperator(operator) {
  return !isNumericSearchOperator(operator);
}

export function isBetweenSearchOperator(operator) {
  return normalizeSearchOperator(operator) === SEARCH_OPERATORS.numericBetween;
}

export function getSearchModeForOperator(operator) {
  return isNumericSearchOperator(operator) ? 'numeric' : 'text';
}

export function getTextMatchModeForOperator(operator, fallbackMode = 'contains') {
  const normalizedOperator = normalizeSearchOperator(operator);
  if (normalizedOperator === SEARCH_OPERATORS.textStartsWith) return 'startsWith';
  if (isTextSearchOperator(normalizedOperator)) return 'contains';
  return normalizeTextMatchMode(fallbackMode);
}

export function getNumericComparisonModeForOperator(operator, fallbackMode = 'equals') {
  const normalizedOperator = normalizeSearchOperator(operator);
  if (normalizedOperator === SEARCH_OPERATORS.numericGreaterThan) return 'greaterThan';
  if (normalizedOperator === SEARCH_OPERATORS.numericLessThan) return 'lessThan';
  if (normalizedOperator === SEARCH_OPERATORS.numericBetween) return 'between';
  if (normalizedOperator === SEARCH_OPERATORS.numericEquals) return 'equals';
  return normalizeNumericComparisonMode(fallbackMode);
}

export function normalizeSearchableAttributesMode(mode) {
  return mode === 'layer' || mode === 'configured' ? 'layer' : 'all';
}

export function normalizeFeatureLimit(value, fallback) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 1) return fallback;
  return Math.floor(numericValue);
}

export function normalizeRequestQueryLength(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 1) return 1800;
  return Math.floor(numericValue);
}
