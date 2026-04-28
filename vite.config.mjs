import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import mediaMinMax from 'postcss-media-minmax';
import { build, defineConfig, loadEnv, normalizePath } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import svgr from 'vite-plugin-svgr';

function serviceWorkerPlugin(options) {
  const name = "vite-plugin-service-worker";
  const virtualModuleId = `virtual:${name}`;
  const resolvedVirtualModuleId = "\0" + virtualModuleId;
  let isBuild = false;
  let resolvedConfig;
  return {
    name,
    config(_, { command }) {
      isBuild = command === "build";
      return {
        build: {
          rollupOptions: {
            input: {
              main: resolve(__dirname, 'src/renderer/index.html'),
              // SW is built separately in closeBundle to inline all dependencies
            },
            output: {
              entryFileNames: "assets/[name].[hash].js",
            }
          }
        }
      };
    },
    configResolved(config) {
      resolvedConfig = config;
    },
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        let filename = isBuild ? '/sw.js' : options.filename;
        if (!filename.startsWith("/")) filename = `/${filename}`;
        return `export const serviceWorkerFile = '${filename}'`;
      }
    },
    async closeBundle() {
      if (!isBuild) return;
      await build({
        configFile: false,
        root: resolvedConfig.root,
        resolve: resolvedConfig.resolve,
        build: {
          rollupOptions: {
            input: options.filename,
            output: {
              format: 'es',
              inlineDynamicImports: true,
              entryFileNames: 'sw.js',
            },
          },
          outDir: resolvedConfig.build.outDir,
          emptyOutDir: false,
          sourcemap: resolvedConfig.build.sourcemap,
        },
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const URL = env.VITE_PUBLIC_URL || process.env.VITE_PUBLIC_URL || '';

  return {
  ...(URL ? { base: URL } : {}),
  root: resolve(__dirname, 'src/renderer/'),
  define: {
    'import.meta.env.VITE_COMMIT_HASH': JSON.stringify(env.VITE_COMMIT_HASH),
  },
  build: {
    cssTarget: ['chrome100'],
    sourcemap: true,
    outDir: resolve(__dirname, 'out/web/'),  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util", "web-gphoto2"],
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
  css: {
    postcss: {
      plugins: [mediaMinMax],
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
        {
          src: normalizePath(resolve(__dirname, 'node_modules/@ffmpeg/core/dist/esm/*')),
          dest: '.',
        },
        {
          src: normalizePath(resolve(__dirname, 'node_modules/web-gphoto2/build/*')),
          dest: '.',
        },
      ],
    }),
    serviceWorkerPlugin({
      filename: resolve(__dirname, 'src/renderer/sw-web.js'),
    }),
  ],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  };
});