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

  const swBuildOptions = (watchOptions = null) => ({
    configFile: false,
    root: resolvedConfig.root,
    resolve: resolvedConfig.resolve,
    logLevel: 'warn',
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
      ...(watchOptions ? { watch: watchOptions } : {}),
    },
  });

  return {
    name,
    config(_, { command }) {
      isBuild = command === "build";
      return {
        build: {
          rollupOptions: {
            input: {
              main: resolve(__dirname, 'src/renderer/index.html'),
              // SW is built separately to inline all dependencies
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
      if (isBuild && config.build.watch) {
        // In watch mode, start a dedicated independent watcher for the SW.
        // Calling build() from closeBundle() is unreliable in watch mode,
        // so we start a parallel watcher here instead.
        build(swBuildOptions(config.build.watch)).catch(e => {
          console.error(`[${name}] SW watch build failed:`, e.message);
        });
      }
    },
    configureServer(server) {
      // Dev server: bundle the SW in-memory and serve it at /sw.js.
      // Also watch the modules it depends on and rebuild when they change.
      let swCode = null;
      let building = false;
      const watchedFiles = new Set([options.filename]);

      const rebuild = async () => {
        if (building) return;
        building = true;
        try {
          const result = await build({
            configFile: false,
            root: resolvedConfig.root,
            resolve: resolvedConfig.resolve,
            logLevel: 'silent',
            build: {
              rollupOptions: {
                input: options.filename,
                output: { format: 'es', inlineDynamicImports: true },
              },
              write: false,
              emptyOutDir: false,
            },
          });
          const output = (Array.isArray(result) ? result[0] : result).output;
          for (const chunk of output) {
            if (chunk.type === 'chunk') {
              // Track every non-node_modules module so we watch it
              for (const id of (chunk.moduleIds ?? [])) {
                if (!id.includes('node_modules')) watchedFiles.add(id);
              }
              if (chunk.isEntry) swCode = chunk.code;
            }
          }
        } catch (e) {
          console.error(`[${name}] SW dev build failed:`, e.message);
        } finally {
          building = false;
        }
      };

      rebuild();

      server.watcher.on('change', (file) => {
        if (watchedFiles.has(file)) rebuild();
      });

      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] === '/sw.js') {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.end(swCode ?? '// Service worker not ready yet, reload in a moment');
          return;
        }
        next();
      });
    },
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `export const serviceWorkerFile = '/sw.js'`;
      }
    },
    async closeBundle() {
      if (!isBuild || resolvedConfig.build.watch) return;
      try {
        await build(swBuildOptions());
      } catch (e) {
        console.error(`[${name}] SW build failed:`, e.message);
      }
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