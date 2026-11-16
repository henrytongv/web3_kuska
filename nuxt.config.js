export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: [{ code: 'es', name: 'Español', file: 'es.json' }],
    defaultLocale: 'es',
    strategy: 'no_prefix',
    langDir: 'locales',
  },
  app: {
    head: {
      title: 'Web3 Kuska',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com',
    },
  },
  nitro: {
    externals: {
      // Estas dependencias tienen dos versiones conviviendo (ethers usa
      // @noble/* 1.x y @hiero-ledger/* usa 2.x). Si Nitro las traza, el
      // server de producción no arranca por resolución de subpaths.
      // Se dejan externas y Node las resuelve desde node_modules.
      external: [
        /^@hiero-ledger\//,
        /^@noble\//,
        /^@scure\//,
        /^ethers($|\/)/,
      ],
      // Sin tracing: nft no logra resolver bien las dos versiones de
      // @noble/* que conviven (ethers 1.x vs @hiero-ledger 2.x).
      // En runtime Node resuelve todo desde node_modules del proyecto.
      trace: false,
    },
  },
});
