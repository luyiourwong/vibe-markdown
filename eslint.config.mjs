import { defineConfig, globalIgnores } from 'eslint/config'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import vueMacros from '@vue-macros/eslint-config'
import vueParser from 'vue-eslint-parser'
import globals from 'globals'

export default defineConfig(
  // 設定全域忽略檔案
  globalIgnores(['dist', 'node_modules', 'coverage', '**/__test__']),

  // 基礎 JavaScript 配置
  js.configs.recommended,

  // 全域瀏覽器變數
  {
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn'
    }
  },

  // Vue 檔案專用配置
  {
    files: ['**/*.vue', '**/*.ts'],
    extends: [
      // Vue 配置 - 使用 macros 處理 Vue 3 Composition API
      ...pluginVue.configs['flat/recommended'],
      vueMacros,
      // TypeScript 配置 - 使用 TypeChecked 版本以啟用型別檢查
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked
    ],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
        sourceType: 'module'
      }
    },
    rules: {
      // 忽略部件命名 (預設建議 MultiWordSomething)
      'vue/multi-word-component-names': 'off',

      // 未使用參數排除 _ 字符
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],

      // 強制使用 import type 來引用類型
      '@typescript-eslint/consistent-type-imports': ['warn', {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports'
      }],
      '@typescript-eslint/no-import-type-side-effects': 'warn'
    }
  }
)