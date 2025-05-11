# EagleAnimation

[![Official Website](docs/tags/website.svg)](https://brickfilms.com/) [![Discord](docs/tags/discord.svg)](https://discord.com/invite/mmU2sVAJUq)

![Eagle Animation in use by Théo Aron](docs/imgs/img_2.png)

**EagleAnimation** is an awesome, free and open-source stop motion animation software. It is available for Windows, macOS, Linux and also works with any web browser. It's a great alternative to _Stop
Motion Studio_, _Dragon Frame_ and _Boats Animator_.

👉 _This project is supported by Brick à Brack, the non-profit organization that owns [Brickfilms.com](https://brickfilms.com/) - The biggest brickfilming community, you can join us, it's free and
without ads!_ 🎥

- ✨ **DSLR cameras support** - Use and configure your DSLR camera directly.
- ❤️ **Friendly timeline** - Instantly preview your animation, duplicate and reorganize frames as you want.
- 😎 **The highest quality** - Use all the power of your camera and animate with the best quality possible!
- 💡 **Animator tools** - Thanks to onion skin, grid tools and difference mode, animating has never been so easy.
- 💾 **Easy export** - Export your animation to a video file or export frames to use them in video editing software.
- ⚙️ **Adjust camera settings** - Control and adjust your camera settings.
- 🪄 **Frame averaging** - Capture several frames and merge them to reduce picture noise automatically.
- 🥖 **Oui-Oui-Baguette** - The software is available in several languages to allow everyone to use it.

## Get started

- 🚀 Downloads are available on the [Github releases page](https://github.com/brick-a-brack/eagle-animation/releases).
- ☁️ Try it directly in your browser using [the Web hosted version](https://app.eagle-animation.com/).
- 🐛 You can report issues on the [Github issue tracker](https://github.com/brick-a-brack/eagle-animation/issues).
- 🧑‍⚖️ The source code is published under [GPLv3](http://www.gnu.org/licenses/gpl.html).

## F.A.Q. (Frequently Asked Questions)

### How to fix: "Eagle Animation" is damaged and can't be opened. You should move it to Trash.

This error occurs because Eagle Animation files are not signed. You can fix the issue by following these instructions:
[https://www.youtube.com/watch?v=ceGovao817g](https://www.youtube.com/watch?v=ceGovao817g).

### What languages does Eagle Animation support?

Eagle Animation is available in English, French, German, Spanish, Italian, Portuguese, Polish, Esperanto, Bulgarian, Czech, Danish, Greek, Croatian, Latvian, Hungarian, Dutch, Romanian, Slovak,
Slovenian, Finnish, Swedish and Russian.

### Is Eagle Animation compatible with my camera?

Eagle animation is compatible with all webcams detected by your device and also support DSLR cameras on the Windows version.

### Is there a mobile version of Eagle Animation?

There is currently no mobile version of Eagle Animation but you can use [the Web hosted version](https://app.eagle-animation.com/) on tablets.

## Contribute

Feel free to make pull-requests, help us to translate the software or report issues 😉

The logo was created by Nishant Shukla and sound effects were obtained from [Zapsplat.com](https://zapsplat.com/).

## Build and configuration
Some variables can be configured using a `.env` file, values with a "\*" are required.

| **Name**         | **Description**                                                                                         | **Example**                                |
| ---------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| VITE_PUBLIC_URL  | The full url of the assets server, must be ended by a slash "/". If it is not defined, we will use "/". | `https://app.eagle-animation.com/`         |
| VITE_COMMIT_HASH | The hash of the current git commit, if it is not provided, the bundle will be flagged as "local".       | `cda02bf88498ce97d947fb357a6e4f459812122a` |

### Build process

- Run `npm i --legacy-peer-deps` to install dependencies (`--legacy-peer-deps` is required because we use an old dependency).
- Update `src/config.js` file if needed.
- Run `npm run build:win`, `npm run build:linux`, `npm run build:mac` and `npm run build:web` to build release files.

### Release process

- Update `version` value in `package.json` if needed.
- Create a draft release on Github and tag it with the same version number: `vX.X.X`.
- Merge your branch/dev into master.

### Development mode

- Run `npm i --legacy-peer-deps` to install dependencies.
- Run `npm run start:electron` to launch the application in dev mode.
- Run `npm run start:web` to launch the web app in dev mode.

### Telemetry

To improve the quality of **Eagle Animation**, runtime errors and application events are automatically reported to developpers using [PostHog](https://posthog.com/). You can disable the telemetry, just set `POSTHOG_TOKEN` to `""` in `src/config.js` and rebuild the app.

We also track user behavior on the app to

## Compatilibity

Some features are device-dependent or platform-limited. Here's a summary table.

| Feature                   | Downloadable app | Web (Chrome¹) | Web (Firefox) | Web (Safari) |
| ------------------------- | ---------------- | ------------- | ------------- | ------------ |
| Take photos (Webcam)      | 🟢               | 🟢            | 🟡²           | 🟡²          |
| Control settings (Webcam) | 🟡³              | 🟡³           | 🔴            | 🔴           |
| Take photos (DSLR)        | 🟡⁴              | 🟡⁵           | 🔴            | 🔴           |
| Export frames             | 🟢               | 🟢            | 🟢            | 🟢           |
| Export video              | 🟢               | 🟢            | 🟢            | 🟢           |
| Workshop features         | 🟢               | 🔴            | 🔴            | 🔴           |

1. Including Chromium based browsers (Edge, Brave, Opera, Arc, etc...).
2. The quality of webcam photos is poorer on Firefox and Safari.
3. Webcam settings are only supported on Windows.
4. Only on Windows and with Canon cameras.
5. Using WebUSB, can require advanced configuration on Windows.

## Camera support and DSLR implementation

Camera implementation varies based on devices and browser engine, Eagle Animation uses various libraries to support cameras.

### Webcam

All versions of the app support webcams. On the downloadable version and when using Chromium-based browsers, the app uses the Web ImageCapture API to take photos, which results in better photo
quality.

| Platform | Downloadable app | Web (Chrome) | Web (Firefox) | Web (Safari) |
| -------- | ---------------- | ------------ | ------------- | ------------ |
| Windows  | ImageCapture     | ImageCapture | Fallback      | Fallback     |
| Linux    | ImageCapture     | ImageCapture | Fallback      | Fallback     |
| Mac      | ImageCapture     | ImageCapture | Fallback      | Fallback     |

- [ImageCapture](https://www.w3.org/TR/image-capture/)
- Fallback: Use canvas to extract frame from live preview

### DSLR

DSLR support depends on the platform and the specific implementation. Refer to the details below to check if your camera is supported.

| Platform | Downloadable app | Web (Chrome)        | Web (Firefox) | Web (Safari) |
| -------- | ---------------- | ------------------- | ------------- | ------------ |
| Windows  | EDSDK            | libgphoto2 (WebUSB) | 🔴            | 🔴           |
| Linux    | 🔴               | libgphoto2 (WebUSB) | 🔴            | 🔴           |
| Mac      | 🔴               | libgphoto2 (WebUSB) | 🔴            | 🔴           |

- [EDSDK](https://developercommunity.usa.canon.com/resource/1744392420000/CDC_EDSDK_Compat_List)
- [libgphoto2](http://www.gphoto.org/proj/libgphoto2/support.php)
