import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import svgr from 'vite-plugin-svgr';
import { normalizePath } from 'vite';

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['@brick-a-brack/napi-canon-cameras'],
      },
    },
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '~': resolve(__dirname),
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
