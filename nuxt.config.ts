import { Configuration } from '@nuxt/types';
import { P2PLogLevel } from '@sirusdev/p2pchat-browser-sdk';
import dotenv from 'dotenv-defaults';

// configure dotenv
dotenv.config({
  defaults: '.env.defaults'
});

const config: Configuration = {
  mode: 'spa',
  server: {
    port: 8054,
    host: '0.0.0.0'
  },
  /*
   ** Headers of the page
   */
  head: {
    titleTemplate: 'P2P Chat Sample App',
    title: 'P2P Chat Sample App',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: process.env.npm_package_description || ''
      }
    ],
    link: [
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: `/favicon.ico`
      }
    ]
  },
  /*
   ** Customize the progress-bar color
   */
  loading: { color: '#fff' },
  /*
   ** Global CSS
   */
  css: ['@/assets/style/main.scss'],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [],
  /*
   ** Nuxt.js modules
   */
  modules: ['@nuxtjs/pwa'],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    '@nuxtjs/eslint-module',
    '@nuxtjs/vuetify',
    '@nuxt/typescript-build',
    '~/modules/p2p-chat'
  ],
  /*
   ** vuetify module configuration
   ** https://github.com/nuxt-community/vuetify-module
   */
  vuetify: {
    customVariables: ['~/assets/style/variables.scss'],
    defaultAssets: {
      font: {
        family: 'Roboto'
      },
      icons: 'mdi'
    },
    optionsPath: './vuetify.options.ts'
  },
  /**
   * typesript configurations
   */
  typescript: {
    typeCheck: {
      eslint: true
    }
  },
  /**
   * P2P Chat configurations
   */
  p2pchat: {
    signalingUrl: process.env.P2PCHAT_SIGNALING_URL || 'http://localhost:9012',
    logLevel: (process.env.P2PCHAT_LOG_LEVEL as P2PLogLevel) || 'error'
  },
  /*
   ** Build configuration
   */
  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, { isClient }) {
      // Extend only webpack config for client-bundle
      if (isClient) {
        config.devtool = '#source-map';
      }
      config.node = {
        fs: 'empty'
      };
    }
  }
};

export default config;
