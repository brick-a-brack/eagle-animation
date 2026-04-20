import Action from '@components/Action';
import ActionCard from '@components/ActionCard';
import Slider from '@components/CustomSlider';
import SliderSelect from '@components/CustomSliderSelect';
import FormGroup from '@components/FormGroup';
import IconTabs from '@components/IconTabs';
import NumberInput from '@components/NumberInput';
import Select from '@components/Select';
import Switch from '@components/Switch';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faAperture from '@icons/faAperture';
import faCamera from '@icons/faCamera';
import faDroplet from '@icons/faDroplet';
import faFaceViewfinder from '@icons/faFaceViewfinder';
import faLightbulbOn from '@icons/faLightbulbOn';
import faMagnifyingGlass from '@icons/faMagnifyingGlass';
import faRotate from '@icons/faRotate';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';
import faEraserCirclePlus from '@icons/faEraserCirclePlus';
import faEraserCircleMinus from '@icons/faEraserCircleMinus';
import MaskingEditor from '@components/MaskingEditor';
import CustomSlider from '@components/CustomSlider';
import faEye from '@icons/faEye';
import Tooltip from '@components/Tooltip';
import faPen from '@icons/faPen';


const MaskingWindow = forwardRef(({
  backgroundLayer = null,
  foregroundLayer = null,
  transparentLayer = null,
  t,
}, ref) => {
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
  }

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
      {selectedTab !== 'PREVIEW' && <div className={style.navbar}>
        <div className={style.navbarItem}>
          <button onClick={() => { setSelectedTab('REMOVE') }}>REMOVE</button>
          <button onClick={() => { setSelectedTab('RESTORE') }}>RESTORE</button>
        </div>

        <div className={style.navbarItem} >
          <div className={style.navbarItemRange} id="size" data-tooltip-content={t('Brush size')}>
            <CustomSlider step={1} min={1} max={100} value={brushSize} onChange={setBrushSize} />
          </div>
        </div>

        <div className={style.navbarItem} >
          <div className={style.navbarItemRange} id="blur" data-tooltip-content={t('Blur size')}>
            <CustomSlider step={1} min={1} max={100} value={brushBlurSize} onChange={setBrushBlurSize} />
          </div>
        </div>

        <div className={style.navbarItem}>
          <button onClick={handleFlush}>FLUSH</button>
        </div>

      </div >}

      <Tooltip anchorId="size" />
      <Tooltip anchorId="blur" />
    </>
  );
});

export default withTranslation()(MaskingWindow);
