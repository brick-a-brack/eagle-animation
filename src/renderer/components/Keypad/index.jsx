import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { withTranslation } from 'react-i18next';

import faArrowsRepeat from '../../icons/faArrowsRepeat';
import faCamera from '../../icons/faCamera';
import faDiamondHalfStroke from '../../icons/faDiamondHalfStroke';
import faForwardFast from '../../icons/faForwardFast';
import faFrame from '../../icons/faFrame';
import faImageCircleMinus from '../../icons/faImageCircleMinus';
import faImageCirclePlus from '../../icons/faImageCirclePlus';
import faImageEye from '../../icons/faImageEye';
import faImageSlash from '../../icons/faImageSlash';
import faPlay from '../../icons/faPlay';
import Action from '../Action';

import * as style from './style.module.css';

const KeyButton = ({ id, icon, title, onClick, width = 1, height = 1 }) => {
  const styleCss = {
    ...(width > 1 ? { gridColumn: `span ${width}` } : {}),
    ...(height > 1 ? { gridRow: `span ${height}`, height: '100%' } : {}),
  };

  return (
    <Action className={style.keyButton} title={title} action={() => onClick(id)} style={styleCss}>
      <FontAwesomeIcon icon={icon} />
    </Action>
  );
};

const KeyGrid = ({ children }) => {
  return <div className={style.keyGrid}>{children}</div>;
};

const KeyPad = withTranslation()(({ t }) => {
  return (
    <KeyGrid>
      <KeyButton id="LOOP" icon={faArrowsRepeat} title={t('Loop')} />
      <KeyButton id="SHORT_PLAY" icon={faForwardFast} title={t('Short play')} />
      <KeyButton id="DIFFERENCE" icon={faDiamondHalfStroke} title={t('Difference')} />
      <KeyButton id="GRID" icon={faFrame} title={t('Play')} />

      <KeyButton id="MUTE" icon={faPlay} title={t('Mute')} />
      <KeyButton id="HIDE_FRAME" icon={faImageEye} title={t('Hide frame')} />
      <KeyButton id="FRAME_FIRST" icon={faPlay} title={t('Go to first frame')} />
      <KeyButton id="ONION_MORE" icon={faPlay} title={t('Increase onion skin')} />

      <KeyButton id="DUPLICATE" icon={faImageCirclePlus} title={t('Duplicate')} />
      <KeyButton id="CLONE" icon={faPlay} title={t('Play')} />
      <KeyButton id="DEDUPLICATE" icon={faImageCircleMinus} title={t('Deduplicate frame')} />
      <KeyButton id="ONION_LESS" icon={faPlay} title={t('Reduce onion skin')} />

      <KeyButton id="FRAME_LEFT" icon={faPlay} title={t('Go to previous frame')} />
      <KeyButton id="FRAME_RIGHT" icon={faPlay} title={t('Go to next frame')} />
      <KeyButton id="FRAME_LIVE" icon={faPlay} title={t('Go to live preview')} />

      <KeyButton id="TAKE_PICTURE" icon={faCamera} title={t('Take picture')} height={2} />
      <KeyButton id="PLAY" icon={faPlay} title={t('Play')} width={2} />
      <KeyButton id="DELETE_FRAME" icon={faImageSlash} title={t('Remove frame')} />
    </KeyGrid>
  );
  /*grid-column: span 2;*/
  /*
          TAKE_PICTURES_1
          TAKE_PICTURES_2
          TAKE_PICTURES_3
          TAKE_PICTURES_4
          TAKE_PICTURES_5
          TAKE_PICTURES_6
          TAKE_PICTURES_7
          TAKE_PICTURES_8
          TAKE_PICTURES_9
          TAKE_PICTURES_10
    
        
         */
});

export default KeyPad;
