module.exports = {
  env: {
    node: true,
    commonjs: true,
    es6: true
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module'
  },
  rules: {
    'sort-imports': ['error', {
      'ignoreCase': false,
      'ignoreDeclarationSort': false,
      'ignoreMemberSort': false,
      'memberSyntaxSortOrder': ['none', 'all', 'multiple', 'single']
    }],
    'no-control-regex': 0,
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', {
      'vars': 'all',
      'args': 'after-used',
      'ignoreRestSiblings': false
    }]
  },
  overrides: [
    {
        files: ['*.js', '*.jsx'],
        rules: {
          '@typescript-eslint/no-var-requires': 'off',
          '@typescript-eslint/explicit-function-return-type': 'off',
        }
    }
  ],
  globals: {
    __basedir: 'writable'
  }
}
