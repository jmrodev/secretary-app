import js from "@eslint/js";
import globals from "globals";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-empty": "warn",
      "no-undef": "warn",
      "preserve-caught-error": "warn",
      "no-unreachable": "warn",
      "no-useless-assignment": "warn",
      "no-useless-escape": "warn",
      "no-console": "off",
    },
  },
];
