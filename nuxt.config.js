import * as zkTailwindDefault from "matter-dapp-ui/tailwind.config.js";

export default {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'wallet-tailwind',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Customize the progress-bar color
  loading: {
    color: "#8c8dfc",
    continuous: true,
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: ["@/assets/style/main.scss"],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: ["@/components/", { path: "@/blocks/", prefix: "block" }],

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',
    // https://go.nuxtjs.dev/tailwindcss
    '@nuxtjs/tailwindcss',
    ['matter-dapp-ui', {
      network: "rinkeby",
    }],
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    // https://www.npmjs.com/package/nuxt-webfontloader
    "nuxt-webfontloader",
  ],

  tailwindcss: {
    config: {
      ...zkTailwindDefault,
      purge: {
        enabled: process.env.NODE_ENV === "production",
        content: [
          `components/**/*.vue`,
          `blocks/**/*.vue`,
          `layouts/**/*.vue`,
          `pages/**/*.vue`,
          "./node_modules/matter-dapp-ui/components/**/*.vue",
          "./node_modules/matter-dapp-ui/blocks/**/*.vue",
          "./node_modules/matter-dapp-ui/layouts/**/*.vue",
        ],
      },
    },
  },

  // Fonts loader https://www.npmjs.com/package/nuxt-webfontloader
  webfontloader: {
    google: {
      families: ["Fira+Sans:300,400,500,600", "Fira+Code:300"],
    },
  },

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {},

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
  }
}
