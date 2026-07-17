module.exports = {
  root: true,
  extends: 'airbnb-base',
  env: {
    browser: true,
    es2022: true
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  globals: {
    Origo: 'readonly'
  },
  rules: {
    'comma-dangle': ['error', 'never'],
    'global-require': 'off',
    'import/no-cycle': 'off',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'new-cap': 'off',
    'prefer-destructuring': 'off',
    'max-len': 'off',
    'max-lines': ['error', { max: 500 }],
    'no-alert': 'off',
    'prefer-object-spread': 'off',
    'object-curly-newline': 'off',
    'arrow-parens': 'off',
    'no-nested-ternary': 'off',
    'no-param-reassign': ['error', { props: false }],
    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
    'no-unused-vars': ['error', { varsIgnorePattern: '^filterNeedsSearchText$' }],
    'no-else-return': ['error', { allowElseIf: true }],
    'no-console': ['error', { allow: ['warn', 'error', 'log'] }],
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: ['tests/**', 'webpack.config.cjs'],
      optionalDependencies: false
    }]
  },
  overrides: [{
    files: ['tests/**/*.js'],
    env: {
      node: true
    }
  }, {
    files: ['webpack.config.cjs'],
    env: {
      node: true
    },
    parserOptions: {
      sourceType: 'script'
    }
  }]
};
