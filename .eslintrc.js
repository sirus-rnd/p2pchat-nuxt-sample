module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  extends: [
    '@nuxtjs',
    '@nuxtjs/eslint-config-typescript',
    'prettier',
    'prettier/vue',
    'plugin:prettier/recommended',
    'plugin:nuxt/recommended'
  ],
  plugins: ['prettier'],
  // add your custom rules here
  rules: {
    "standard/computed-property-even-spacing": "off",
    "camelcase": [2, {"properties": "never"}],
    "no-useless-constructor": "off",
    "lines-between-class-members": "off"
  }
};
