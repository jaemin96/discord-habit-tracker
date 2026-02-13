const tseslint = require("typescript-eslint");
const eslint = require("@eslint/js");
const globals = require("globals");

module.exports = tseslint.config(
  {
    ignores: ["eslint.config.mjs", "dist/**", "node_modules/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: "commonjs",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  }
);
