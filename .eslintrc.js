module.exports = {
  root: true,
  extends: ["eslint:recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  ignorePatterns: [
    "node_modules/",
    "dist/",
    ".next/",
    "coverage/",
    ".turbo/",
  ],
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
      ],
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
      },
    },
    {
      files: ["*.js", "*.cjs"],
      env: {
        node: true,
      },
    },
  ],
};
