import Button from '@components/Button';
import CustomSlider from '@components/CustomSlider';
import IconTabs from '@components/IconTabs';
import MaskingEditor from '@components/MaskingEditor';
import Tooltip from '@components/Tooltip';
import faBroom from '@icons/faBroom';
import faEraser from '@icons/faEraser';
import faEye from '@icons/faEye';
import faPen from '@icons/faPen';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const MaskingWindow = forwardRef(function MaskingWindow({ backgroundLayer = null, foregroundLayer = null, transparentLayer = null, t }, ref) {
  const [selectedTab, setSelectedTab] = useState('REMOVE');
  const [brushSize, setBrushSize] = useState(50);
  const [brushBlurSize, setBrushBlurSize] = useState(25);

  const editorRef = useRef(null);

  useImperativeHandle(ref, () => ({
    exportLayers() {
      return editorRef.current.exportLayers();
    },
  }));

  const categories = [
    { id: 'EDIT', icon: faPen, title: t('Edit'), selected: selectedTab !== 'PREVIEW' },
    { id: 'PREVIEW', icon: faEye, title: t('Preview'), selected: selectedTab === 'PREVIEW' },
  ];

  const handleTabChange = (e) => {
    const mode = e.id === 'EDIT' ? 'REMOVE' : 'PREVIEW';
    setSelectedTab(mode);
    window.track('masking', { feature: 'change_tab', mode });
  };

  const handleFlush = () => {
    editorRef.current.flush();
    window.track('masking', { feature: 'flush' });
  };

  const handleEraserModeChange = () => {
    const newMode = selectedTab === 'REMOVE' ? 'RESTORE' : 'REMOVE';
    setSelectedTab(newMode);
    window.track('masking', { feature: 'eraser_change', mode: newMode });
  };

  return (
    <div className={style.container}>
      <IconTabs tabs={categories} onClick={handleTabChange} />

      <MaskingEditor
        brushSize={brushSize}
        brushBlurSize={brushBlurSize}
        backgroundLayer={backgroundLayer}
        foregroundLayer={foregroundLayer}
        transparentLayer={transparentLayer}
        mode={selectedTab}
        ref={editorRef}
      />

      <div className={`${style.navbar} ${selectedTab === 'PREVIEW' ? style.hidden : ''}`}>
        <div className={`${style.navbarItemLeft} ${style.navbarItemSmall}`}>
          <Button icon={faEraser} selected={selectedTab === 'REMOVE'} onClick={handleEraserModeChange} title={selectedTab === 'REMOVE' ? t('Anti-Eraser') : t('Eraser')} />
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
      <div />
    </div>
  );
});

export default withTranslation()(MaskingWindow);
