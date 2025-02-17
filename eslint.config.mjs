import eslintConfigPrettier from 'eslint-config-prettier'
import js from '@eslint/js'
import stylisticTs from '@stylistic/eslint-plugin-ts'

export default [
  js.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: ['node_modules/', 'vendor/', '.gitlab-ci-local/', 'lib/', 'dist/'],
  },
  {
    plugins: {
      '@stylistic/ts': stylisticTs,
    },
    rules: {
      // Possible errors
      'no-duplicate-imports': 'error',
      'no-import-assign': 'off',
      'no-unreachable-loop': 'error',
      'no-unexpected-multiline': 'off',
      // Suggestions
      'arrow-body-style': 'error',
      'capitalized-comments': 'error',
      'default-case': 'error',
      'default-case-last': 'error',
      eqeqeq: 'error',
      'max-depth': 'error',
      'no-alert': 'error',
      'no-case-declarations': 'error',
      'no-else-return': 'error',
      'no-empty': 'error',
      'no-lonely-if': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-concat': 'error',
      'no-useless-constructor': 'error',
      'no-var': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-const': 'error',
      'prefer-numeric-literals': 'error',
      'prefer-spread': 'error',
      'require-await': 'error',
      'sort-imports': 'error',
      'sort-vars': 'error',
      // Styling
      '@stylistic/ts/block-spacing': 'error',
      '@stylistic/ts/brace-style': 'error',
      '@stylistic/ts/comma-dangle': 'off',
      '@stylistic/ts/comma-spacing': [
        'error',
        {
          before: false,
          after: true,
        },
      ],
      '@stylistic/ts/function-call-spacing': 'error',
      '@stylistic/ts/key-spacing': [
        'error',
        {
          beforeColon: false,
          afterColon: true,
          mode: 'strict',
        },
      ],
      '@stylistic/ts/keyword-spacing': [
        'error',
        {
          before: true,
          after: true,
        },
      ],
      '@stylistic/ts/lines-around-comment': [
        'error',
        {
          beforeBlockComment: false,
          afterBlockComment: false,
          beforeLineComment: false,
          afterLineComment: false,
          allowBlockStart: true,
          allowBlockEnd: true,
          allowObjectStart: true,
          allowObjectEnd: true,
          allowArrayStart: true,
          allowArrayEnd: true,
        },
      ],
      '@stylistic/ts/lines-between-class-members': ['error', 'always'],
      '@stylistic/ts/indent': ['error', 2],
      '@stylistic/ts/object-curly-newline': 'off',
      '@stylistic/ts/object-curly-spacing': ['error', 'always'],
      '@stylistic/ts/object-property-newline': 'error',
      '@stylistic/ts/padding-line-between-statements': 'error',
      '@stylistic/ts/quote-props': ['error', 'as-needed'],
      '@stylistic/ts/quotes': [
        'error',
        'single',
        {
          avoidEscape: true,
          allowTemplateLiterals: true,
        },
      ],
      '@stylistic/ts/semi': ['error', 'never'],
      '@stylistic/ts/space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
        },
      ],
      '@stylistic/ts/space-infix-ops': 'error',
    },
  },
]
