import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import mediaMinMax from 'postcss-media-minmax';
import { defineConfig, normalizePath } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import svgr from 'vite-plugin-svgr';
import topLevelAwait from 'vite-plugin-top-level-await';

const URL = process.env.VITE_PUBLIC_URL || '';

// https://vitejs.dev/config/
export default defineConfig({
  ...(URL ? { base: URL } : {}),
  root: resolve(__dirname, 'src/renderer/'),
  build: {
    cssTarget: ['chrome100'],
    sourcemap: true,
    /*rollupOptions: {
        input: {
            main: resolve(__dirname, 'src/renderer/index.html'),
        },
    },*/
    outDir: resolve(__dirname, 'out/web/'),
  },
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  },
  resolve: {
    alias: {
      '~': resolve(__dirname),
    },
  },
  css: {
    postcss: {
      plugins: [mediaMinMax],
    },
  },
  plugins: [
    topLevelAwait({
      // The export name of top-level await promise for each chunk module
      promiseExportName: '__tla',
      // The function to generate import names of top-level await promise in each chunk module
      promiseImportName: (i) => `__tla_${i}`,
    }),
    react(),
    svgr({
      include: '**/*.svg?jsx',
      svgrOptions: {
        // svgr options
      },
    }),
    viteStaticCopy({
      targets: [
        {
          src: normalizePath(resolve(__dirname, './resources/*')),
          dest: '.',
        },
        {
          src: normalizePath(resolve(__dirname, 'node_modules/@ffmpeg/core/dist/esm/*')),
          dest: '.',
        },
      ],
    }),
  ],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
