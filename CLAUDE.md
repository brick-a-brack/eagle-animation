# Eagle Animation — CLAUDE.md

Stop motion animation software by Brick à Brack, available as an **Electron desktop app** and a **pure-browser web app**, sharing ~95% of the React codebase.

---

## Stack

| Layer | Tool |
|---|---|
| Frontend | React 19, React Router 7, CSS Modules, i18next |
| Build (Electron) | electron-vite 5 |
| Build (web) | Vite 7 |
| Storage (Electron) | Node.js filesystem (`~/EagleAnimation/`) |
| Storage (web) | Dexie / IndexedDB |
| Image processing (Electron) | Sharp |
| Image processing (web) | OffscreenCanvas in Service Worker |
| Video export (Electron) | ffmpeg-static (native child process) |
| Video export (web) | @ffmpeg/ffmpeg (WASM) |
| Camera | Toucan Camera Server (subprocess on Electron, env-var URL on web) |

---

## Project structure

```
src/
├── main/            # Electron main process (Node.js only)
│   ├── index.js     # Window creation, protocol registration, IPC setup
│   ├── actions.js   # IPC action handlers
│   └── core/
│       ├── routes.js    # ea:// custom protocol handler (image serving + resizing)
│       ├── projects.js  # Filesystem project I/O
│       ├── export.js    # Native FFmpeg export
│       ├── toucan.js    # Toucan Camera Server subprocess
│       └── settings.js  # Settings persistence
├── preload/
│   └── index.js     # Exposes window.IPC to renderer via contextBridge
├── renderer/        # React app (shared between Electron and web)
│   ├── index.jsx    # Entry: mounts React, wires window.EA/EAEvents, registers SW
│   ├── config.js    # Runtime device detection (ELECTRON vs WEB)
│   ├── sw-web.js    # Service Worker (web-only backend, compiled to /sw.js)
│   ├── core/
│   │   └── bindings.js  # THE bridge: EA() and EAEvents() dual-backend shim
│   ├── actions/     # Web backend (mirrors main/actions.js)
│   │   ├── index.js     # Web action handlers + event bus
│   │   ├── projects.js  # Dexie project CRUD
│   │   ├── frames.js    # IndexedDB frame blob storage
│   │   └── ffmpeg.js    # FFmpeg.wasm init
│   ├── hooks/       # useProject, useProjects, useSettings, useSyncList …
│   ├── views/       # Page components (Home, Animator, Export, Settings …)
│   └── components/  # Reusable UI components
└── common/          # Shared between main and renderer
    ├── ffmpeg.js    # FFmpeg argument builders (codec, bitrate)
    └── resizer.js   # Query-param parsing for image resize requests
```

---

## The dual-backend bridge (`window.EA` / `EAEvents`)

**This is the most important architectural concept in the codebase.**

`src/renderer/core/bindings.js` exposes two globals that all hooks and components use to talk to the backend. The implementation switches at runtime based on whether `window.IPC` exists (injected by the Electron preload) or not.

### `EA(action, data)` — request/response

```js
// Electron: goes through Electron IPC
window.IPC.call(action, data)
  → ipcRenderer.invoke(action, data)
  → main/actions.js handler
  → returns result

// Web: calls in-process web action handler
import * as WebActions from '../actions'
WebActions[action](null, data)
  → renderer/actions/index.js handler
  → returns result
```

### `EAEvents(name, callback)` — event stream

```js
// Electron: wraps ipcRenderer.on
window.IPC.stream(name, callback)
  → mainWindow.webContents.send(name, value) from main process

// Web: in-memory event bus in renderer/actions/index.js
addEventListener(name, callback)  // registers in module-level array
sendEvent(name, data)             // dispatches to all registered callbacks
```

### Device detection

```js
// src/renderer/config.js
export const DEVICE = window.IPC ? 'ELECTRON' : 'WEB';
```

Use `DEVICE` (not `import.meta.env`) anywhere runtime behavior must differ.

---

## Electron — custom `ea://` protocol

On Electron, images are never served over `file://` (CORS, permissions). Instead a custom protocol is registered:

**Registration — `src/main/index.js`:**
```js
protocol.registerSchemesAsPrivileged([{ scheme: 'ea', privileges: { ... } }]);
protocol.handle('ea', ImageRoute);
```

**Handler — `src/main/core/routes.js`:**

URL format: `ea://api/pictures/{projectId}/{sceneIndex}/{filename}?w=800&h=600&f=webp&q=80`

Pipeline:
1. Parse URL → resolve filesystem path inside `~/EagleAnimation/`
2. Check SHA256-keyed disk cache
3. If raw file requested → `net.fetch(pathToFileURL(...))`
4. Otherwise → Sharp: resize / convert format / adjust quality
5. Cache result, return `Response` with correct `Content-Type`

Query params: `w` width, `h` height, `m` mode (cover/contain), `q` quality, `f` format (webp/png/avif/jpeg), `c` cache flag, `i` info-only (returns JSON metadata).

When you add a new image variant or resize option, add the param to the resizer in `src/common/resizer.js` **and** to `routes.js`.

---

## Web — Service Worker as fake backend

On the web there is no server. A Service Worker intercepts requests to `/api/pictures/*` and serves images directly from IndexedDB.

**Registration — `src/renderer/index.jsx`:**
```js
if (DEVICE === 'WEB') {
  navigator.serviceWorker.register('/sw.js');
}
```

**Service Worker — `src/renderer/sw-web.js` (compiled to `/sw.js`):**

```
fetch /api/pictures/{frameId}?w=...&f=...
  → parse frameId and query params
  → getFrameBlob(frameId)   ← reads from IndexedDB
  → loadImageToCanvas()     ← decode Blob → OffscreenCanvas
  → ExportFrame()           ← resize + format-convert via OffscreenCanvas
  → return Blob as Response
```

The Service Worker is bundled by a **custom Vite plugin** in `vite.config.mjs` that inlines all its dependencies (including the IndexedDB helpers). If you add a new dependency inside `sw-web.js`, make sure the plugin can resolve it.

This means the web app works offline after first load — no backend required.

---

## Adding a new action

1. Add handler to `src/main/actions.js` (Electron path)
2. Add identical handler to `src/renderer/actions/index.js` (web path)
3. Call it anywhere via `await EA('MY_ACTION', data)`

Both handlers receive `(event, data)` — `event` is the Electron IPC event on desktop, `null` on web.

---

## Build scripts

| Command | What it does |
|---|---|
| `npm run start:electron` | Electron dev with HMR |
| `npm run start:web` | Web dev server |
| `npm run build:web` | Production web build → `out/web/` |
| `npm run build:win/mac/linux` | Packaged Electron release |

---

## Storage layout

**Electron (filesystem):**
```
~/EagleAnimation/
└── {project_id}/
    ├── project.eagleanimation   # JSON project metadata
    └── {scene_index}/
        └── {frame_filename}     # JPEG/PNG frame images
```

**Web (IndexedDB via Dexie):**
- `projects` table — serialised project JSON
- Frame blobs stored separately, keyed by frame ID

---

## Key conventions

- **No global state library.** State lives in custom hooks (`useProject`, `useProjects`, `useSettings`). Each hook calls `EA()` and/or subscribes with `EAEvents()`.
- **Image URLs are platform-specific.** Electron returns `ea://…` URLs; web returns `/api/pictures/…` URLs. Never hardcode either format — always use the URL returned by the backend.
- **FFmpeg args are shared.** Codec selection and bitrate logic lives in `src/common/ffmpeg.js`. Platform-specific execution (native vs WASM) is in `main/core/export.js` and `renderer/actions/ffmpeg.js`.
- **Translations.** Keys are extracted by `i18next-scanner`. Run `npm run extract-strings` after adding new `t('key')` calls.
