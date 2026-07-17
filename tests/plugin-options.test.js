import assert from 'node:assert/strict';
import test from 'node:test';

import createPluginOptions, { createSearchOperatorOptions } from '../src/plugin-options.js';

test('preserves plugin defaults and deprecated request-length aliases', () => {
  const defaults = createPluginOptions();
  assert.equal(defaults.name, 'layer_search_filter');
  assert.equal(defaults.defaultSearchMode, 'text');
  assert.equal(defaults.defaultTextMatchMode, 'contains');
  assert.equal(defaults.attributeFilterTitle, 'Sökbara attribut');
  assert.equal(defaults.noResultsText, 'Inga träffar.');
  assert.equal(defaults.zoomToResultStatusText, '{{count}} träff markerad.');
  assert.equal(defaults.zoomToResultsStatusText, '{{count}} träffar markerade.');
  assert.equal(defaults.featureInfoResultStatusText, '{{count}} objekt markerat.');
  assert.equal(defaults.featureInfoResultsStatusText, '{{count}} objekt markerade.');
  assert.equal(
    defaults.featureInfoResultsLimitReachedText,
    'Maximalt antal ({{limit}}) har nåtts; det kan finnas fler träffar.'
  );
  assert.equal(defaults.requestQueryLengthLimit, 1800);
  assert.equal(defaults.wmsOverlayFeatureLimit, 1000);

  const configured = createPluginOptions({
    maxWfsQueryLength: 900,
    numericComparisonMode: 'greaterThan',
    searchMode: 'numeric',
    zoomToExtentLimit: 250
  });
  assert.equal(configured.defaultNumericComparisonMode, 'greaterThan');
  assert.equal(configured.defaultSearchMode, 'numeric');
  assert.equal(configured.requestQueryLengthLimit, 900);
  assert.equal(configured.wmsOverlayFeatureLimit, 250);
});

test('keeps configured operator labels in the generated operator choices', () => {
  const options = createPluginOptions({
    numericComparisonBetweenOptionText: 'Range',
    textMatchContainsOptionText: 'Includes'
  });
  const operatorOptions = createSearchOperatorOptions(options);

  assert.equal(operatorOptions[0].optionFallback, 'Includes');
  assert.equal(operatorOptions.at(-1).optionFallback, 'Range');
});
