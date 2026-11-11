// Single source of truth for the OSC integration: used by the Electron backend, the help window and docs/OSC.md.
// Descriptions are functions so i18next-scanner extracts them, the backend never calls them.

export const OSC_DOC_LINK = 'https://github.com/brick-a-brack/eagle-animation/blob/master/docs/OSC.md';

export const OSC_DEFAULT_SETTINGS = {
  OSC_ENABLED: false,
  OSC_PROTOCOL: 'udp', // udp | tcp
  OSC_LISTEN_HOST: '127.0.0.1',
  OSC_LISTEN_PORT: 8000,
  OSC_TARGET_HOST: '127.0.0.1',
  OSC_TARGET_PORT: 9000,
  OSC_SEND_FRAME_PLAYED: false,
};

export const OSC_STATE_ADDRESS = '/eagle/state';
export const getOscActionAddress = (action) => `/eagle/action/${action.toLowerCase()}`;
export const getOscEventAddress = (event) => `/eagle/event/${event}`;
export const getOscStateAddress = (field) => `${OSC_STATE_ADDRESS}/${field}`;

export const OSC_GROUPS = {
  CAPTURE: (t) => t('Capture'),
  NAVIGATION: (t) => t('Navigation'),
  FRAME: (t) => t('Frame actions'),
  TIMELINE: (t) => t('Timeline'),
  PLAYBACK: (t) => t('Playback'),
  VIEW: (t) => t('View'),
  PROJECT: (t) => t('Project'),
  CAMERA: (t) => t('Camera'),
};

// Arg types: i integer, f float, s string, T boolean (sent as OSC True/False)
export const OSC_ARG_TYPE_LABELS = { i: 'i', f: 'f', s: 's', T: 'T/F' };

// Names match the keyboard shortcut actions handled by the animator
export const OSC_ACTIONS = [
  { name: 'TAKE_PICTURE', group: 'CAPTURE', description: (t) => t('Take a picture') },
  { name: 'FRAME_LEFT', group: 'NAVIGATION', description: (t) => t('Previous frame') },
  { name: 'FRAME_RIGHT', group: 'NAVIGATION', description: (t) => t('Next frame') },
  { name: 'ALTERNATIVE_FRAME_LEFT', group: 'NAVIGATION', description: (t) => t('Alternative previous frame') },
  { name: 'ALTERNATIVE_FRAME_RIGHT', group: 'NAVIGATION', description: (t) => t('Alternative next frame') },
  { name: 'FRAME_LIVE', group: 'NAVIGATION', description: (t) => t('Jump to live view') },
  { name: 'FRAME_FIRST', group: 'NAVIGATION', description: (t) => t('Jump to first frame') },
  { name: 'DELETE_FRAME', group: 'FRAME', description: (t) => t('Delete frame') },
  { name: 'HIDE_FRAME', group: 'FRAME', description: (t) => t('Show / Hide current frame in the animation') },
  { name: 'DUPLICATE', group: 'FRAME', description: (t) => t('Duplicate current frame') },
  { name: 'DEDUPLICATE', group: 'FRAME', description: (t) => t('Deduplicate current frame') },
  { name: 'CLONE', group: 'FRAME', description: (t) => t('Clone current frame') },
  { name: 'UNDO', group: 'FRAME', description: (t) => t('Undo last action') },
  { name: 'REDO', group: 'FRAME', description: (t) => t('Redo last undone action') },
  { name: 'PLAY', group: 'PLAYBACK', description: (t) => t('Play / Pause') },
  { name: 'LOOP', group: 'PLAYBACK', description: (t) => t('Enable / Disable loop') },
  { name: 'SHORT_PLAY', group: 'PLAYBACK', description: (t) => t('Enable / Disable short play') },
  { name: 'MUTE', group: 'PLAYBACK', description: (t) => t('Mute / Unmute sounds') },
  { name: 'ONION_MORE', group: 'VIEW', description: (t) => t('Increase onion skin') },
  { name: 'ONION_LESS', group: 'VIEW', description: (t) => t('Decrease onion skin') },
  { name: 'GRID', group: 'VIEW', description: (t) => t('Show / Hide grid') },
  { name: 'ADD_SCENE', group: 'PROJECT', description: (t) => t('Add new scene') },
  { name: 'HOME', group: 'PROJECT', description: (t) => t('Back to home') },
];

// Arg keys are the payload keys sent by the renderer with window.EA('EVENT', { name, ...payload })
export const OSC_EVENTS = [
  { name: 'capture_started', group: 'CAPTURE', args: [{ key: 'count', type: 'i' }], description: (t) => t('Capture started (count > 1 for multiple pictures)') },
  {
    name: 'picture_taken',
    group: 'CAPTURE',
    args: [
      { key: 'frameIndex', type: 'i' },
      { key: 'totalFrames', type: 'i' },
    ],
    description: (t) => t('A picture has been added'),
  },
  { name: 'capture_finished', group: 'CAPTURE', args: [{ key: 'count', type: 'i' }], description: (t) => t('Capture sequence finished, with the number of pictures added') },
  { name: 'capture_error', group: 'CAPTURE', args: [{ key: 'message', type: 's' }], description: (t) => t('Capture failed') },
  { name: 'frame_selected', group: 'TIMELINE', args: [{ key: 'frameIndex', type: 'i' }], description: (t) => t('Current frame changed') },
  { name: 'live_view', group: 'TIMELINE', args: [{ key: 'value', type: 'T' }], description: (t) => t('Live view enabled / disabled') },
  { name: 'frame_deleted', group: 'TIMELINE', args: [{ key: 'frameIndex', type: 'i' }], description: (t) => t('Frame deleted') },
  {
    name: 'frame_hidden',
    group: 'TIMELINE',
    args: [
      { key: 'frameIndex', type: 'i' },
      { key: 'hidden', type: 'T' },
    ],
    description: (t) => t('Frame hidden / shown'),
  },
  {
    name: 'frame_duration_changed',
    group: 'TIMELINE',
    args: [
      { key: 'frameIndex', type: 'i' },
      { key: 'length', type: 'i' },
    ],
    description: (t) => t('Frame duplicated / deduplicated'),
  },
  { name: 'frame_cloned', group: 'TIMELINE', args: [{ key: 'frameIndex', type: 'i' }], description: (t) => t('Frame cloned') },
  { name: 'undo', group: 'TIMELINE', args: [], description: (t) => t('Undo performed') },
  { name: 'redo', group: 'TIMELINE', args: [], description: (t) => t('Redo performed') },
  { name: 'play_started', group: 'PLAYBACK', args: [], description: (t) => t('Playback started') },
  { name: 'play_stopped', group: 'PLAYBACK', args: [], description: (t) => t('Playback stopped') },
  { name: 'frame_played', group: 'PLAYBACK', args: [{ key: 'frameIndex', type: 'i' }], optIn: true, description: (t) => t('Frame displayed during playback (opt-in, high traffic)') },
  { name: 'loop_changed', group: 'PLAYBACK', args: [{ key: 'value', type: 'T' }], description: (t) => t('Loop toggled') },
  { name: 'short_play_changed', group: 'PLAYBACK', args: [{ key: 'value', type: 'T' }], description: (t) => t('Short play toggled') },
  { name: 'onion_changed', group: 'VIEW', args: [{ key: 'opacity', type: 'f' }], description: (t) => t('Onion skin opacity changed') },
  { name: 'grid_changed', group: 'VIEW', args: [{ key: 'value', type: 'T' }], description: (t) => t('Grid toggled') },
  { name: 'mute_changed', group: 'VIEW', args: [{ key: 'value', type: 'T' }], description: (t) => t('Sounds muted / unmuted') },
  {
    name: 'project_opened',
    group: 'PROJECT',
    args: [
      { key: 'projectId', type: 's' },
      { key: 'projectName', type: 's' },
    ],
    description: (t) => t('Project opened'),
  },
  { name: 'project_closed', group: 'PROJECT', args: [], description: (t) => t('Project closed') },
  { name: 'scene_changed', group: 'PROJECT', args: [{ key: 'sceneIndex', type: 'i' }], description: (t) => t('Current scene changed') },
  { name: 'scene_added', group: 'PROJECT', args: [{ key: 'sceneIndex', type: 'i' }], description: (t) => t('New scene created') },
  { name: 'fps_changed', group: 'PROJECT', args: [{ key: 'fps', type: 'i' }], description: (t) => t('Framerate changed') },
  {
    name: 'camera_changed',
    group: 'CAMERA',
    args: [
      { key: 'cameraId', type: 's' },
      { key: 'cameraName', type: 's' },
    ],
    description: (t) => t('Selected camera changed'),
  },
  { name: 'camera_disconnected', group: 'CAMERA', args: [{ key: 'cameraId', type: 's' }], description: (t) => t('Camera lost') },
];

// Reply to /eagle/state: one bundle holding one message per field
export const OSC_STATE_FIELDS = [
  {
    name: 'project',
    args: [
      { key: 'projectId', type: 's' },
      { key: 'projectName', type: 's' },
    ],
    description: (t) => t('Opened project (empty strings on the home page)'),
  },
  { name: 'scene', args: [{ key: 'sceneIndex', type: 'i' }], description: (t) => t('Current scene index (-1 when no project is opened)') },
  {
    name: 'frame',
    args: [
      { key: 'frameIndex', type: 'i' },
      { key: 'totalFrames', type: 'i' },
    ],
    description: (t) => t('Current frame index (-1 on live view) and number of frames'),
  },
  { name: 'live_view', args: [{ key: 'liveView', type: 'T' }], description: (t) => t('Live view displayed') },
  { name: 'playing', args: [{ key: 'playing', type: 'T' }], description: (t) => t('Playback in progress') },
  { name: 'capturing', args: [{ key: 'capturing', type: 'T' }], description: (t) => t('Capture in progress') },
  { name: 'loop', args: [{ key: 'loop', type: 'T' }], description: (t) => t('Loop enabled') },
  { name: 'short_play', args: [{ key: 'shortPlay', type: 'T' }], description: (t) => t('Short play enabled') },
  { name: 'onion', args: [{ key: 'onion', type: 'f' }], description: (t) => t('Onion skin opacity') },
  { name: 'grid', args: [{ key: 'grid', type: 'T' }], description: (t) => t('Grid displayed') },
  { name: 'mute', args: [{ key: 'mute', type: 'T' }], description: (t) => t('Sounds muted') },
  { name: 'fps', args: [{ key: 'fps', type: 'i' }], description: (t) => t('Framerate of the current scene') },
  {
    name: 'camera',
    args: [
      { key: 'cameraId', type: 's' },
      { key: 'cameraName', type: 's' },
    ],
    description: (t) => t('Selected camera'),
  },
];

// State reported when no project is opened in the animator
export const OSC_DEFAULT_STATE = {
  projectId: '',
  projectName: '',
  sceneIndex: -1,
  frameIndex: -1,
  totalFrames: 0,
  liveView: false,
  playing: false,
  capturing: false,
  loop: false,
  shortPlay: false,
  onion: 0,
  grid: false,
  mute: false,
  fps: 0,
  cameraId: '',
  cameraName: '',
};
