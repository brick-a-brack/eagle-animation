# EagleAnimation

[![Official Website](docs/tags/website.svg)](https://brickfilms.com/)
[![Discord](docs/tags/discord.svg)](https://discord.com/invite/mmU2sVAJUq)

![Eagle Animation in use by Théo Aron](docs/imgs/img_2.png)

__EagleAnimation__ is an awesome, free and open-source stop motion animation software. It is available for Windows, macOS and Linux.  

👉 *This project is supported by Brick à Brack, the non-profit organization that owns [Brickfilms.com](https://brickfilms.com/) - The biggest brickfilming community, you can join us, it's free and without ads!* 🎥

- ❤️ **Friendly timeline** - Instantly preview your animation, duplicate and reorganize frames as you want.
- 😎 **The highest quality** - Use all the power of your camera and animate with the best quality possible!
- 💡 **Animator tools** - Thanks to onion skin, grid tools and difference mode, animating has never been so easy.
- 💾 **Easy export** - Export your animation to a video file or export frames to use them in video editing software.
- ⚙️ **Adjust camera settings** - Control and adjust your camera settings (Soon).
- 🪄 **Frame averaging** - Capture several frames and merge them to reduce picture noise automatically.
- 🥖 **Oui-Oui-Baguette** - The software is available in several languages to allow everyone to use it.

## Downloads and license

Eagle Animation can be downloaded from the [Github releases page](https://github.com/brick-a-brack/eagle-animation/releases).

The source code is published under [GPLv3](http://www.gnu.org/licenses/gpl.html).

## Credits

The logo was created by Nishant Shukla and sound effects were obtained from [Zapsplat.com](https://zapsplat.com/).

## Contribute

Feel free to make pull-requests, help us to translate the software or report issues 😉

### Production build and release process

- Run `npm i --force` to install dependencies.
- Create a `.env` file based on the `.env.sample`.
- Update `version` value in `package.json` if needed.
- Run `npm run build` to build the web bundle and main script in the `dist/electron` directory.
- Run `npm run package:windows`, `npm run package:linux` and `npm run package:mac` to build release files.
- Create a draft release on Github.
- Merge into master.

### Development mode

- Run `npm i --force` to install dependencies.
- Run `npm start` to launch the application in dev mode.

*Note: Because app backend and web bundle are splitted, any change in the backend part will relaunch the whole app. At the moment, it does not kill the previous openned window.*

### Telemetry

To improve the quality of __Eagle Animation__, runtime errors are automatically reported to developpers by using [Sentry SDK](https://sentry.io/).
You can disable error reporting, just set `SENTRY_DSN` to `""` in `src/config.js` and rebuild the app.
