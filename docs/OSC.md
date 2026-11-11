# OSC remote control

Eagle Animation can be driven by external tools and can notify them of what happens in the app through [OSC (Open Sound Control)](https://opensoundcontrol.stanford.edu/), the standard protocol of show control software and hardware.

Typical uses:

- Take pictures, navigate the timeline or start the playback from a tablet ([TouchOSC](https://hexler.net/touchosc)) or a Stream Deck ([Bitfocus Companion](https://bitfocus.io/companion)).
- Flash a light, move a motion control rig or trigger a sound each time a picture is taken ([QLC+](https://www.qlcplus.org/), Arduino, Max/MSP, Pure Data…).

> OSC is only available in the desktop app: web browsers can't open UDP or TCP sockets.

## Enable and configure OSC

Open **Settings → Remote control (OSC)** and turn on **Enable OSC**. The settings are applied immediately and the **Status** line shows whether Eagle Animation is listening, along with the addresses other devices can use to reach it.

| Setting | Default | Description |
|---|---|---|
| Protocol | `UDP` | `UDP` or `TCP`. With TCP, packets are framed with SLIP, as defined by OSC 1.1. |
| Listening host | `127.0.0.1` | Network interface on which Eagle Animation receives actions. `127.0.0.1` accepts messages from this computer only, `0.0.0.0` from any device on the network. |
| Listening port | `8000` | Port on which Eagle Animation receives actions. |
| Target host | `127.0.0.1` | Address of the device that receives the events. |
| Target port | `9000` | Port on which events are sent. |
| Send played frames | Off | Sends `/eagle/event/frame_played` for every frame displayed during playback. It can generate a lot of traffic. |

Notes:

- Two apps can't listen on the same port of the same computer. When your OSC tool runs on the same computer as Eagle Animation, the listening port and the target port must be different. A warning is displayed in the settings when they are equal.
- To control Eagle Animation from another device (a tablet, a phone…), set the listening host to `0.0.0.0`, and set the target host to the IP address of that device. Your firewall may ask you to allow Eagle Animation on the network.
- With UDP, events are sent from the listening port, so tools that reply to the sender reach Eagle Animation directly.

## Actions (incoming)

Send these addresses to Eagle Animation while a project is opened in the animator. They trigger the same actions as the [keyboard shortcuts](../src/renderer/core/shortcuts.js).

- Addresses are case-sensitive: only the lowercase form is accepted.
- Arguments are ignored, except for button releases: a message whose first argument is `0` or `False` is ignored, so a button that sends `1` on press and `0` on release triggers the action only once.
- Unknown addresses are ignored, as are actions received while the masking editor is open.
- Messages can be grouped in bundles.

| Address | Description |
|---|---|
| **Capture** | |
| `/eagle/action/take_picture` | Take a picture |
| **Navigation** | |
| `/eagle/action/frame_left` | Previous frame |
| `/eagle/action/frame_right` | Next frame |
| `/eagle/action/alternative_frame_left` | Alternative previous frame |
| `/eagle/action/alternative_frame_right` | Alternative next frame |
| `/eagle/action/frame_live` | Jump to live view |
| `/eagle/action/frame_first` | Jump to first frame |
| **Frame actions** | |
| `/eagle/action/delete_frame` | Delete frame |
| `/eagle/action/hide_frame` | Show / Hide current frame in the animation |
| `/eagle/action/duplicate` | Duplicate current frame |
| `/eagle/action/deduplicate` | Deduplicate current frame |
| `/eagle/action/clone` | Clone current frame |
| `/eagle/action/undo` | Undo last action |
| `/eagle/action/redo` | Redo last undone action |
| **Playback** | |
| `/eagle/action/play` | Play / Pause |
| `/eagle/action/loop` | Enable / Disable loop |
| `/eagle/action/short_play` | Enable / Disable short play |
| `/eagle/action/mute` | Mute / Unmute sounds |
| **View** | |
| `/eagle/action/onion_more` | Increase onion skin |
| `/eagle/action/onion_less` | Decrease onion skin |
| `/eagle/action/grid` | Show / Hide grid |
| **Project** | |
| `/eagle/action/add_scene` | Add new scene |
| `/eagle/action/home` | Back to home |

## Events (outgoing)

Events are sent to the target host and port. Argument types: `i` integer (int32), `f` float (float32), `s` string, `T/F` OSC True / False.

Frame indexes start at `0` and count the frames of the current scene in timeline order. Scene indexes start at `0` too and match the scene position in the project, deleted scenes included.

| Address | Arguments | Description |
|---|---|---|
| **Capture** | | |
| `/eagle/event/capture_started` | `i count` | Capture started (count > 1 for multiple pictures) |
| `/eagle/event/picture_taken` | `i frameIndex` `i totalFrames` | A picture has been added |
| `/eagle/event/capture_finished` | `i count` | Capture sequence finished, with the number of pictures added |
| `/eagle/event/capture_error` | `s message` | Capture failed |
| **Timeline** | | |
| `/eagle/event/frame_selected` | `i frameIndex` | Current frame changed |
| `/eagle/event/live_view` | `T/F value` | Live view enabled / disabled |
| `/eagle/event/frame_deleted` | `i frameIndex` | Frame deleted |
| `/eagle/event/frame_hidden` | `i frameIndex` `T/F hidden` | Frame hidden / shown |
| `/eagle/event/frame_duration_changed` | `i frameIndex` `i length` | Frame duplicated / deduplicated |
| `/eagle/event/frame_cloned` | `i frameIndex` | Frame cloned |
| `/eagle/event/undo` | | Undo performed |
| `/eagle/event/redo` | | Redo performed |
| **Playback** | | |
| `/eagle/event/play_started` | | Playback started |
| `/eagle/event/play_stopped` | | Playback stopped |
| `/eagle/event/frame_played` | `i frameIndex` | Frame displayed during playback (opt-in, high traffic) |
| `/eagle/event/loop_changed` | `T/F value` | Loop toggled |
| `/eagle/event/short_play_changed` | `T/F value` | Short play toggled |
| **View** | | |
| `/eagle/event/onion_changed` | `f opacity` | Onion skin opacity changed |
| `/eagle/event/grid_changed` | `T/F value` | Grid toggled |
| `/eagle/event/mute_changed` | `T/F value` | Sounds muted / unmuted |
| **Project** | | |
| `/eagle/event/project_opened` | `s projectId` `s projectName` | Project opened |
| `/eagle/event/project_closed` | | Project closed |
| `/eagle/event/scene_changed` | `i sceneIndex` | Current scene changed |
| `/eagle/event/scene_added` | `i sceneIndex` | New scene created |
| `/eagle/event/fps_changed` | `i fps` | Framerate changed |
| **Camera** | | |
| `/eagle/event/camera_changed` | `s cameraId` `s cameraName` | Selected camera changed |
| `/eagle/event/camera_disconnected` | `s cameraId` | Camera lost |

`project_closed` is sent when you leave the animator, whether you go back to the home page, to the export page or to the settings.

## Current state: `/eagle/state`

Send `/eagle/state` (no arguments) to receive the current state. The reply is sent back **to the sender** (same address and port for UDP, same connection for TCP), as one OSC bundle containing the following messages:

| Address | Arguments | Description |
|---|---|---|
| `/eagle/state/project` | `s projectId` `s projectName` | Opened project (empty strings on the home page) |
| `/eagle/state/scene` | `i sceneIndex` | Current scene index (-1 when no project is opened) |
| `/eagle/state/frame` | `i frameIndex` `i totalFrames` | Current frame index (-1 on live view) and number of frames |
| `/eagle/state/live_view` | `T/F liveView` | Live view displayed |
| `/eagle/state/playing` | `T/F playing` | Playback in progress |
| `/eagle/state/capturing` | `T/F capturing` | Capture in progress |
| `/eagle/state/loop` | `T/F loop` | Loop enabled |
| `/eagle/state/short_play` | `T/F shortPlay` | Short play enabled |
| `/eagle/state/onion` | `f onion` | Onion skin opacity |
| `/eagle/state/grid` | `T/F grid` | Grid displayed |
| `/eagle/state/mute` | `T/F mute` | Sounds muted |
| `/eagle/state/fps` | `i fps` | Framerate of the current scene |
| `/eagle/state/camera` | `s cameraId` `s cameraName` | Selected camera |

Each state message uses its own address, so it can be bound directly to a control (a LED, a label…) of your OSC tool.

## Setup examples

### TouchOSC (tablet or phone)

1. In Eagle Animation, set the listening host to `0.0.0.0`, the listening port to `8000`, the target host to the IP address of the tablet and the target port to `9000`.
2. In TouchOSC, open the connections settings, enable an **OSC** connection over **UDP**, set the host to the IP address of the computer running Eagle Animation (displayed in the **Status** line), the send port to `8000` and the receive port to `9000`.
3. Add a button and set its OSC message address to `/eagle/action/take_picture`. Buttons send `1` on press and `0` on release, Eagle Animation only reacts to the press.
4. To show the playback status, add a LED or a toggle with the address `/eagle/event/play_started`, or bind it to `/eagle/state/playing` and send `/eagle/state` when the layout starts.

### Bitfocus Companion (Stream Deck)

1. Add a **Generic: OSC** connection, with the IP address of the computer running Eagle Animation and its listening port (`8000`).
2. On a button, add the action that sends an OSC message without arguments, with the path `/eagle/action/take_picture`.
3. Repeat with `/eagle/action/play`, `/eagle/action/frame_left`, `/eagle/action/frame_right`, `/eagle/action/delete_frame`…

### QLC+ (lighting)

1. In **Inputs/Outputs**, enable the **OSC** plugin as the input of a universe, and set its input port to the target port configured in Eagle Animation (for example `9000`).
2. In the Virtual Console, open the external input of a widget (a button triggering a flash cue for example) and use **Auto Detect**, then take a picture in Eagle Animation: QLC+ detects `/eagle/event/picture_taken`.
3. The cue now runs each time a picture is taken. Use `/eagle/event/capture_started` and `/eagle/event/capture_finished` to switch the lights only for the duration of the capture.

### Testing from the command line

Any OSC tool can be used to test the setup, for example [`oscsend` / `oscdump`](https://github.com/radarsat1/liblo) from liblo:

```sh
# Listen for the events sent by Eagle Animation
oscdump 9000

# Take a picture
oscsend localhost 8000 /eagle/action/take_picture
```
