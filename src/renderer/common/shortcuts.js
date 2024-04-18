const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
const isMac = macosPlatforms.includes(window.navigator.platform);

const SHORTCUTS = {
  PLAY: ['0', 'space'],
  TAKE_PICTURE: ['enter'],
  TAKE_PICTURES_1: ['ctrl+1'],
  TAKE_PICTURES_2: ['ctrl+2'],
  TAKE_PICTURES_3: ['ctrl+3'],
  TAKE_PICTURES_4: ['ctrl+4'],
  TAKE_PICTURES_5: ['ctrl+5'],
  TAKE_PICTURES_6: ['ctrl+6'],
  TAKE_PICTURES_7: ['ctrl+7'],
  TAKE_PICTURES_8: ['ctrl+8'],
  TAKE_PICTURES_9: ['ctrl+9'],
  TAKE_PICTURES_10: ['ctrl+0'],
  LOOP: ['8'],
  SHORT_PLAY: ['6'],
  DELETE_FRAME: ['backspace', 'del'],
  HOME: ['esc'],
  HIDE_FRAME: ['h'],
  FRAME_LEFT: ['left', '1'],
  FRAME_RIGHT: ['right', '2'],
  FRAME_LIVE: ['up', '3', 'ctrl+right'],
  FRAME_FIRST: ['down', 'ctrl+left'],
  ONION_MORE: ['+'],
  ONION_LESS: ['-'],
  MUTE: ['m', '/', 'ctrl+m'],
  DUPLICATE: ['pageup'],
  DEDUPLICATE: ['pagedown'],
  GRID: ['g'],
};

const PARSED_SHORTCUTS = Object.keys(SHORTCUTS).reduce((acc, key) => ({ ...acc, [key]: SHORTCUTS[key].map((e) => (isMac ? e.replaceAll('ctrl', 'meta') : e)) }), {});

export default PARSED_SHORTCUTS;
