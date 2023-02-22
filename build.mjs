import { Parcel } from '@parcel/core';
import { exec, spawn } from 'child_process';
import { copyFile } from 'fs/promises';
import mkdirp from 'mkdirp';
import { fileURLToPath } from 'url';

const isWatching = process.argv.includes('--watch')

const bundlerWeb = new Parcel({
    defaultConfig: '@parcel/config-default',
    entries: "src/renderer/index.html",
    targets: {
        "electron-renderer": {
            "distDir": "./dist/electron/renderer",
            publicUrl: './',
            "context": "browser"
        },
    },
    additionalReporters: [
        {
            packageName: 'parcel-reporter-static-files-copy',
            resolveFrom: fileURLToPath(import.meta.url)
        }
    ],
    ...(isWatching ? {
        serveOptions: {
            port: 8282
        },
        hmrOptions: {
            port: 8282
        }
    } : {}),
});

const bundlerElectron = new Parcel({
    defaultConfig: '@parcel/config-default',
    entries: "src/electron/index.js",
    targets: {
        "electron-main": {
            "distDir": "./dist/electron",
            "context": "electron-main",
            "outputFormat": "commonjs"
        }
    }
});

const buildTask = async (bun) => {
    try {
        let { bundleGraph, buildTime } = await bun.run();
        let bundles = bundleGraph.getBundles();
        console.log(bundles);

        console.log(`✨ Built ${bundles.length} bundles in ${buildTime}ms!`);
    } catch (err) {
        console.log(err.diagnostics || err);
    }
}

const watchTask = async (bun, callback = () => { }) => {
    await bun.watch((err, event) => {
        if (err) {
            throw err;
        }

        if (event.type === 'buildSuccess') {
            let bundles = event.bundleGraph.getBundles();
            console.log(`✨ WBuilt ${bundles.length} bundles in ${event.buildTime}ms!`);
            callback(bundles)
        } else if (event.type === 'buildFailure') {
            console.log(event.diagnostics || event);
        }
    });
}

// Running app support
let runningApp = null;
const runApp = async () => {
    if (runningApp !== null) {
        runningApp.kill();
        runningApp = null;
    }
    console.log('Starting app...');
    runningApp = spawn('npx', ['electron', './dist/electron/index.js'], {
        env: {
            ...process.env,
            ENV: 'development',
        },
        shell: true
    });
    runningApp.stdout.on('data', (data) => {
        if (data.toString()) {
            console.log(data.toString());
        }
    });
    runningApp.stderr.on('data', (data) => {
        if (data.toString()) {
            console.error(data.toString());
        }
    });
};

const build = async () => {
    if (isWatching) {
        watchTask(bundlerWeb);
        watchTask(bundlerElectron, async () => {
            await copyFile('src/electron/preload.js', 'dist/electron/preload.js');
            runApp('./dist/electron/index.js')
        });
    } else {
        await mkdirp('dist/electron/');
        buildTask(bundlerWeb);
        buildTask(bundlerElectron);
        await copyFile('src/electron/preload.js', 'dist/electron/preload.js');
    }
}

build();