export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["src/**/*.js", "vite.config.js", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        localStorage: "readonly",
        window: "readonly",
        document: "readonly",
      },
    },
  },
];
