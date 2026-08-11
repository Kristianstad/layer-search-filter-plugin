import assert from 'node:assert/strict';
import test from 'node:test';

import createPluginOptions, {
  createSearchOperatorOptions,
  defaultHighlightStyleOptions
} from '../src/plugin-options.js';

test('preserves plugin defaults and deprecated request-length aliases', () => {
  const defaults = createPluginOptions();
  assert.equal(defaults.name, 'layer_search_filter');
  assert.equal(defaults.defaultSearchMode, 'text');
  assert.equal(defaults.defaultTextMatchMode, 'contains');
  assert.equal(defaults.attributeFilterTitle, 'Sökbara attribut');
  assert.equal('attributesReadyText' in defaults, false);
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
  assert.deepEqual(defaults.highlightStyleOptions.Point, [{
    circle: {
      radius: 5,
      stroke: {
        color: [0, 153, 255, 1],
        width: 0
      },
      fill: {
        color: [0, 153, 255, 1]
      }
    }
  }]);
  assert.equal(defaults.highlightStyleOptions, defaultHighlightStyleOptions);

  const customPointHighlightStyle = [{ circle: { radius: 9 } }];
  const configured = createPluginOptions({
    highlightStyleOptions: { Point: customPointHighlightStyle },
    maxWfsQueryLength: 900,
    numericComparisonMode: 'greaterThan',
    searchMode: 'numeric',
    zoomToExtentLimit: 250
  });
  assert.equal(configured.defaultNumericComparisonMode, 'greaterThan');
  assert.equal(configured.defaultSearchMode, 'numeric');
  assert.equal(configured.requestQueryLengthLimit, 900);
  assert.equal(configured.wmsOverlayFeatureLimit, 250);
  assert.equal(configured.highlightStyleOptions.Point, customPointHighlightStyle);
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
