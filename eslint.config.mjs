import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        document: 'readonly',
        window: 'readonly',
        HTMLElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLParagraphElement: 'readonly',
        HTMLHeadingElement: 'readonly',
        crypto: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Node.js globals
        NodeJS: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        // Web/API globals
        Request: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        Blob: 'readonly',
        FormData: 'readonly',
        Headers: 'readonly',
      },
    },
    rules: {
      // Basic rules only
      'no-unused-vars': 'off', // Let TypeScript handle this
      'no-console': 'off', // Allow console for now
      'prefer-const': 'warn',
      'no-var': 'error',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
    },
  },
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      '.turbo/**',
      'coverage/**',
      '*.config.js',
      '*.config.mjs',
      '.next/**',
      'apps/web/dist/**',
      '**/*.astro', // Ignore Astro files for now to avoid parser issues
    ],
  },
];