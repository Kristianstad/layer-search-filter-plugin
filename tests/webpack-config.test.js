import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const createWebpackConfig = require('../webpack.config.cjs');

test('production emits readable and minified bundles without source maps', () => {
  const configs = createWebpackConfig({}, { mode: 'production' });

  assert.equal(Array.isArray(configs), true);
  assert.deepEqual(configs.map(config => ({
    devtool: config.devtool,
    filename: config.output.filename,
    library: config.output.library,
    minimize: config.optimization.minimize
  })), [
    {
      devtool: false,
      filename: 'layer_search_filter.js',
      library: {
        name: 'LayerSearchFilter',
        type: 'var',
        export: 'default'
      },
      minimize: false
    },
    {
      devtool: false,
      filename: 'layer_search_filter.min.js',
      library: {
        name: 'LayerSearchFilter',
        type: 'var',
        export: 'default'
      },
      minimize: true
    }
  ]);
});

test('development emits only the readable bundle with inline source maps', () => {
  const config = createWebpackConfig({}, { mode: 'development' });

  assert.equal(Array.isArray(config), false);
  assert.equal(config.output.filename, 'layer_search_filter.js');
  assert.deepEqual(config.output.library, {
    name: 'LayerSearchFilter',
    type: 'var',
    export: 'default'
  });
  assert.equal(config.optimization.minimize, false);
  assert.equal(config.devtool, 'inline-source-map');
});
