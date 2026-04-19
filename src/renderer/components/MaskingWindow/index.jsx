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
import { forwardRef, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';
import faEraserCirclePlus from '@icons/faEraserCirclePlus';
import faEraserCircleMinus from '@icons/faEraserCircleMinus';
import MaskingEditor from '@components/MaskingEditor';
import CustomSlider from '@components/CustomSlider';
import faEye from '@icons/faEye';


const MaskingWindow = forwardRef(({
  backgroundLayer = null,
  foregroundLayer = null,
  transparentLayer = null,
  t,
}, ref) => {
  const [selectedTab, setSelectedTab] = useState('REMOVE');
  const [brushSize, setBrushSize] = useState(50);

  const categories = [
    { id: 'REMOVE', icon: faEraserCircleMinus, title: t('Remove foreground') },
    { id: 'RESTORE', icon: faEraserCirclePlus, title: t('Restore foreground') },
    { id: 'PREVIEW', icon: faEye, title: t('Preview') },
  ].map((e, i) => ({ ...e, selected: selectedTab === e.id || (i === 0 && selectedTab === null) }));

  return (
    <>
      <IconTabs tabs={categories} onClick={(e) => setSelectedTab(e.id)} />
      <br />
      <CustomSlider step={1} min={10} max={90} value={brushSize} onChange={setBrushSize} />
      <MaskingEditor
        brushSize={brushSize}
        backgroundLayer={backgroundLayer}
        foregroundLayer={foregroundLayer}
        transparentLayer={transparentLayer}
        mode={selectedTab}
        ref={ref}
      />
    </>
  );
});

export default withTranslation()(MaskingWindow);
