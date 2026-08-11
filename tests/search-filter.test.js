import assert from 'node:assert/strict';
import test from 'node:test';

import createSearchFilter from '../src/search-filter.js';
import {
  SEARCH_OPERATORS,
  getSearchOperatorFromModes,
  normalizeRequestQueryLength,
  normalizeSearchOperator
} from '../src/search-operators.js';

function createRules() {
  return createSearchFilter({
    defaultNumericComparisonMode: 'equals',
    defaultSearchMode: 'text',
    defaultSearchOperator: SEARCH_OPERATORS.textIlike,
    defaultTextMatchMode: 'contains',
    getSortedAttributes: attributes => attributes,
    localize: (_key, fallback) => fallback,
    minLength: 2,
    numericComparisonBetweenNeedsNumberText: 'two numbers required',
    numericComparisonNeedsNumberText: 'number required',
    typeMoreText: 'type {{minLength}} characters'
  });
}

test('normalizes legacy search options without changing their public meaning', () => {
  assert.equal(getSearchOperatorFromModes('text', 'startsWith'), SEARCH_OPERATORS.textStartsWith);
  assert.equal(getSearchOperatorFromModes('numeric', 'contains', 'greaterThan'), SEARCH_OPERATORS.numericGreaterThan);
  assert.equal(normalizeSearchOperator('ilike'), SEARCH_OPERATORS.textIlike);
  assert.equal(normalizeSearchOperator('between'), SEARCH_OPERATORS.numericBetween);
  assert.equal(normalizeRequestQueryLength(undefined), 1800);
  assert.equal(normalizeRequestQueryLength('42.9'), 42);
});

test('uses a one-character minimum for equals and starts-with searches', () => {
  const rules = createRules();

  assert.equal(rules.hasSearchableInput('A', 'text', '', SEARCH_OPERATORS.textIlike), false);
  assert.equal(rules.hasSearchableInput('A', 'text', '', SEARCH_OPERATORS.textStartsWith), true);
  assert.equal(rules.hasSearchableInput('A', 'numeric', '', SEARCH_OPERATORS.numericEquals), true);
  assert.equal(rules.hasSearchableInput('', 'text', '', SEARCH_OPERATORS.textStartsWith), false);
  assert.equal(
    rules.getSearchInputHint('', 'text', '', SEARCH_OPERATORS.textStartsWith),
    'type 1 characters'
  );
  assert.equal(
    rules.getSearchInputHint('', 'numeric', '', SEARCH_OPERATORS.numericEquals),
    'type 1 characters'
  );
});

test('builds the characterized CQL and QGIS filter dialects', () => {
  const rules = createRules();
  const stringAttributes = [{ name: 'display name', type: 'string' }];
  const numericAttributes = [{ name: 'amount', type: 'number' }];

  assert.equal(
    rules.buildSearchCql([{ name: 'id', type: 'string' }], 'st'),
    '("id" ILIKE \'%st%\')'
  );
  assert.equal(
    rules.buildSearchCql([{ name: 'name', type: 'string' }], 'Al'),
    '("name" ILIKE \'%Al%\')'
  );
  assert.equal(
    rules.buildSearchCql(stringAttributes, "O'Brien"),
    "(\"display name\" ILIKE '%O''Brien%')"
  );
  assert.equal(
    rules.buildSearchCql([{ name: 'owner"name', type: 'string' }], 'Al'),
    '("owner""name" ILIKE \'%Al%\')'
  );
  assert.equal(
    rules.buildSearchQgisExpression(stringAttributes, 'Al', true, 'startsWith'),
    '(strpos(lower("display name"), \'al\') = 1)'
  );
  assert.equal(
    rules.buildSearchCql(numericAttributes, '10', true, 'contains', 'between', 'numeric', '2', 'between'),
    '("amount" BETWEEN 2 AND 10)'
  );
});

test('matches local values using the same text, numeric, and range semantics', () => {
  const rules = createRules();

  assert.equal(rules.attributeValueMatchesSearch({ type: 'string' }, 'Stockholm', 'holm'), true);
  assert.equal(rules.attributeValueMatchesSearch({ type: 'string' }, 'Stockholm', 'stock', 'startsWith'), true);
  assert.equal(rules.attributeValueMatchesSearch({ type: 'string' }, 'Stockholm', 'stockholm', 'contains', 'equals', 'text', '', 'equals'), false);
  assert.equal(rules.attributeValueMatchesSearch({ type: 'number' }, 7, '10', 'contains', 'lessThan', 'numeric', '', 'lessThan'), true);
  assert.equal(rules.attributeValueMatchesSearch({ type: 'number' }, 7, '10', 'contains', 'between', 'numeric', '2', 'between'), true);
});
