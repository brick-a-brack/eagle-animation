import { Fragment } from 'react';
import { withTranslation } from 'react-i18next';

import Heading from '../Heading';

import * as style from './style.module.css';

const ShortcutsList = ({ t, shortcuts }) => {
  const keysTitles = {
    up: '↑',
    down: '↓',
    left: '←',
    right: '→',
    meta: '⌘',
    enter: t('Enter'),
    space: t('Space'),
    pageup: t('Page up'),
    pagedown: t('Page down'),
    backspace: '⌫',
    del: t('Del'),
    esc: t('Esc'),
    ctrl: t('Ctrl'),
  };

  const categoriesTitles = {
    PLAYBACK: t('Playback'),
    CAPTURE: t('Capture'),
    ACTIONS: t('Actions'),
    NAVIGATION: t('Navigation'),
    OTHER: t('Other'),
  };

  const titles = {
    PLAY: t('Play / Pause'),
    TAKE_PICTURE: t('Take picture'),
    TAKE_PICTURES_1: t('Take {{count}} picture', { count: 1 }),
    TAKE_PICTURES_2: t('Take {{count}} picture', { count: 2 }),
    TAKE_PICTURES_3: t('Take {{count}} picture', { count: 3 }),
    TAKE_PICTURES_4: t('Take {{count}} picture', { count: 4 }),
    TAKE_PICTURES_5: t('Take {{count}} picture', { count: 5 }),
    TAKE_PICTURES_6: t('Take {{count}} picture', { count: 6 }),
    TAKE_PICTURES_7: t('Take {{count}} picture', { count: 7 }),
    TAKE_PICTURES_8: t('Take {{count}} picture', { count: 8 }),
    TAKE_PICTURES_9: t('Take {{count}} picture', { count: 9 }),
    TAKE_PICTURES_10: t('Take {{count}} picture', { count: 10 }),
    LOOP: t('Enable / Disable loop'),
    SHORT_PLAY: t('Enable / Disable short play'),
    DELETE_FRAME: t('Delete frame'),
    HOME: t('Exit'),
    FRAME_LEFT: t('Previous frame'),
    FRAME_RIGHT: t('Next frame'),
    FRAME_LIVE: t('Jump to live view'),
    FRAME_FIRST: t('Jump to first frame'),
    ONION_MORE: t('Increase onion skin'),
    ONION_LESS: t('Decrease onion skin'),
    MUTE: t('Mute / Unmute sounds'),
    DUPLICATE: t('Duplicate current frame'),
    DEDUPLICATE: t('Deduplicate current frame'),
    GRID: t('Show / Hide grid'),
  };

  const categories = {
    PLAYBACK: ['PLAY', 'LOOP', 'SHORT_PLAY', 'MUTE'],
    CAPTURE: [
      'TAKE_PICTURE',
      'TAKE_PICTURES_1',
      'TAKE_PICTURES_2',
      'TAKE_PICTURES_3',
      'TAKE_PICTURES_4',
      'TAKE_PICTURES_5',
      'TAKE_PICTURES_6',
      'TAKE_PICTURES_7',
      'TAKE_PICTURES_8',
      'TAKE_PICTURES_9',
      'TAKE_PICTURES_10',
      'ONION_LESS',
      'ONION_MORE',
      'GRID',
    ],
    ACTIONS: ['DELETE_FRAME', 'DUPLICATE', 'DEDUPLICATE'],
    NAVIGATION: ['FRAME_LEFT', 'FRAME_RIGHT', 'FRAME_LIVE', 'FRAME_FIRST'],
    OTHER: ['HOME'],
  };

  return (
    <div className={style.table}>
      {Object.keys(categories).map((category) => (
        <Fragment key={category}>
          <Heading h={1}>{categoriesTitles[category] || category}</Heading>
          {categories[category].map((key) => (
            <div key={key} className={style.line}>
              <div className={style.action}>{titles[key] || key}</div>
              <div>
                {shortcuts[key].reduce(
                  (acc, v) => [
                    ...acc,
                    <div className={style.shortcut} key={v}>
                      {v
                        .replaceAll('+', ' + ')
                        .trim()
                        .split(' + ')
                        .map((e) => (
                          <div key={e} className={style.key}>
                            {' '}
                            {keysTitles[e] || e}
                          </div>
                        ))
                        .reduce((acc, e, i) => [...acc, ...(i > 0 ? [' + '] : []), e], [])}
                    </div>,
                  ],
                  []
                )}
              </div>
            </div>
          ))}
          <br />
        </Fragment>
      ))}
    </div>
  );
};

export default withTranslation()(ShortcutsList);
