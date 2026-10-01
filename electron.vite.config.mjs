import { builtinModules, createRequire } from 'node:module';
import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, externalizeDepsPlugin, loadEnv } from 'electron-vite';
import { normalizePath } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import svgr from 'vite-plugin-svgr';

const { dependencies } = createRequire(import.meta.url)('./package.json');

const escapeForRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Vite 8 drops the build options electron-vite injects for the main and preload processes,
// so the CommonJS output format and the externals below must be declared explicitly. Without
// them externalizeDepsPlugin() is a no-op and every dependency gets inlined, which breaks the
// packages that locate their own assets through __dirname (ffmpeg-static, sharp).
const nodeExternals = ['electron', /^electron\/.+/, ...builtinModules.flatMap((m) => [m, `node:${m}`])];

const dependencyExternals = Object.keys(dependencies).flatMap((name) => [name, new RegExp(`^${escapeForRegExp(name)}/`)]);

const commonJsOutput = {
  format: 'cjs',
  entryFileNames: '[name].js',
  chunkFileNames: '[name]-[hash].js',
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    main: {
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, 'src/backend-electron/index.js'),
          },
          external: [...nodeExternals, ...dependencyExternals],
          output: commonJsOutput,
        },
        sourcemap: true,
      },
      plugins: [externalizeDepsPlugin()],
    },
    preload: {
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, 'src/backend-electron/preload/index.js'),
          },
          external: nodeExternals,
          output: commonJsOutput,
        },
        sourcemap: true,
      },
      plugins: [externalizeDepsPlugin()],
    },
    renderer: {
      build: {
        sourcemap: true,
      },
      define: {
        'import.meta.env.VITE_COMMIT_HASH': JSON.stringify(env.VITE_COMMIT_HASH),
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
              // vite-plugin-static-copy 4 mirrors the source tree relative to the Vite root, so
              // resources/ has to be globbed recursively and its leading segment stripped back off.
              src: normalizePath(resolve(__dirname, './resources/**/*')),
              dest: '.',
              rename: { stripBase: 1 },
            },
          ],
        }),
      ],
    },
  };
});
