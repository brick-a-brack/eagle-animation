import CustomSlider from '@components/CustomSlider';
import IconTabs from '@components/IconTabs';
import MaskingEditor from '@components/MaskingEditor';
import Tooltip from '@components/Tooltip';
import faEye from '@icons/faEye';
import faPen from '@icons/faPen';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';
import Button from '@components/Button';
import faTrash from '@icons/faTrash';
import faBroom from '@icons/faBroom';
import faEraser from '@icons/faEraser';

const MaskingWindow = forwardRef(function MaskingWindow({ backgroundLayer = null, foregroundLayer = null, transparentLayer = null, t }, ref) {
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
          <div className={`${style.navbarItemLeft} ${style.navbarItemSmall}`}>
            <Button icon={faEraser} selected={selectedTab === 'REMOVE'} onClick={() => {
              setSelectedTab(selectedTab === 'REMOVE' ? 'RESTORE' : 'REMOVE');
            }} title={selectedTab === 'REMOVE' ? t('Anti-Eraser') : t('Eraser')} />
          </div>

          <div className={style.navbarItemLeft}>
            <div className={style.navbarItemRange} id="size" data-tooltip-content={t('Brush size')}>
              <div className={style.roundSize1} />
              <CustomSlider step={1} min={1} max={100} value={brushSize} onChange={setBrushSize} maxWidth="150px" />
              <div className={style.roundSize2} />
            </div>
            <Tooltip anchorId="size" />
          </div>

          <div className={style.navbarItemRight}>
            <div className={style.navbarItemRange} id="blur" data-tooltip-content={t('Blur size')}>
              <div className={style.roundBlur1} />
              <CustomSlider step={1} min={1} max={100} value={brushBlurSize} onChange={setBrushBlurSize} maxWidth="150px" />
              <div className={style.roundBlur2} />
            </div>
            <Tooltip anchorId="blur" />
          </div>

          <div className={`${style.navbarItemRight} ${style.navbarItemSmall}`}>
            <Button icon={faBroom} onClick={handleFlush} title={t('Flush')} />
          </div>
        </div>
      )}

    </>
  );
});

export default withTranslation()(MaskingWindow);
