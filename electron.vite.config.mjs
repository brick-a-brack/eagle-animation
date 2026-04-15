import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { normalizePath } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['@brick-a-brack/napi-canon-cameras', 'sharp'],
      },
      sourcemap: true,
    },
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    build: {
      sourcemap: true,
    },
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    build: {
      sourcemap: true,
    },
    worker: {
      format: 'es',
    },
    resolve: {
      alias: {
        '~': resolve(__dirname),
        '@components': resolve(__dirname, 'src/renderer/components/'),
        '@core': resolve(__dirname, 'src/renderer/core/'),
        '@views': resolve(__dirname, 'src/renderer/views/'),
        '@icons': resolve(__dirname, 'src/renderer/icons/'),
        '@hooks': resolve(__dirname, 'src/renderer/hooks/'),
        '@config-web': resolve(__dirname, 'src/renderer/config.js'),
        '@i18n': resolve(__dirname, 'src/renderer/i18n.js'),
        '@common': resolve(__dirname, 'src/common/'),
      },
    },
    plugins: [
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
        ],
      }),
    ],
  },
});
