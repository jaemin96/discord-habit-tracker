// @ts-check
import nestConfig from '@habit-tracker/eslint-config/nest';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  ...nestConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    ignores: ['**/*.cjs'],
  },
];
