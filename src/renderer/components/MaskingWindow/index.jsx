import CustomSlider from '@components/CustomSlider';
import IconTabs from '@components/IconTabs';
import MaskingEditor from '@components/MaskingEditor';
import Tooltip from '@components/Tooltip';
import faEye from '@icons/faEye';
import faPen from '@icons/faPen';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const MaskingWindow = forwardRef(({ backgroundLayer = null, foregroundLayer = null, transparentLayer = null, t }, ref) => {
  const [selectedTab, setSelectedTab] = useState('REMOVE');
  const [brushSize, setBrushSize] = useState(50);
  const [brushBlurSize, setBrushBlurSize] = useState(10);

  const editorRef = useRef(null);

  useImperativeHandle(ref, () => ({
    flush() {
      editorRef.current.flush(); // délègue à MaskingEditor
    },
    exportLayers() {
      return editorRef.current.exportLayers();
    },
  }));

  const categories = [
    { id: 'EDIT', icon: faPen, title: t('Edit'), selected: selectedTab !== 'PREVIEW' },
    { id: 'PREVIEW', icon: faEye, title: t('Preview'), selected: selectedTab === 'PREVIEW' },
  ];

  const handleFlush = () => {
    editorRef.current.flush();
  };

  return (
    <>
      <IconTabs tabs={categories} onClick={(e) => setSelectedTab(e.id === 'EDIT' ? 'REMOVE' : 'PREVIEW')} />
      <br />

      <MaskingEditor
        brushSize={brushSize}
        brushBlurSize={brushBlurSize}
        backgroundLayer={backgroundLayer}
        foregroundLayer={foregroundLayer}
        transparentLayer={transparentLayer}
        mode={selectedTab}
        ref={editorRef}
      />
      {selectedTab !== 'PREVIEW' && (
        <div className={style.navbar}>
          <div className={style.navbarItem}>
            <button
              onClick={() => {
                setSelectedTab('REMOVE');
              }}
            >
              REMOVE
            </button>
            <button
              onClick={() => {
                setSelectedTab('RESTORE');
              }}
            >
              RESTORE
            </button>
          </div>

          <div className={style.navbarItem}>
            <div className={style.navbarItemRange} id="size" data-tooltip-content={t('Brush size')}>
              <CustomSlider step={1} min={1} max={100} value={brushSize} onChange={setBrushSize} />
            </div>
          </div>

          <div className={style.navbarItem}>
            <div className={style.navbarItemRange} id="blur" data-tooltip-content={t('Blur size')}>
              <CustomSlider step={1} min={1} max={100} value={brushBlurSize} onChange={setBrushBlurSize} />
            </div>
          </div>

          <div className={style.navbarItem}>
            <button onClick={handleFlush}>FLUSH</button>
          </div>
        </div>
      )}

      <Tooltip anchorId="size" />
      <Tooltip anchorId="blur" />
    </>
  );
});

export default withTranslation()(MaskingWindow);
