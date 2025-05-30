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
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';
import faEraserCirclePlus from '@icons/faEraserCirclePlus';
import faEraserCircleMinus from '@icons/faEraserCircleMinus';
import MaskingEditor from '@components/MaskingEditor';


const MaskingWindow = ({
  t,
}) => {
  const [selectedTab, setSelectedTab] = useState(null);

  const categories = [
    { id: 'REMOVE', icon: faEraserCirclePlus, title: t('Remove foreground')},
    { id: 'RESTORE', icon: faEraserCircleMinus, title: t('Restore foreground')},
  ].map((e, i) => ({ ...e, selected: selectedTab === e.id || (i === 0 && selectedTab === null) }));
   
  return (
    <>
      <IconTabs tabs={categories} onClick={(e) => setSelectedTab(e.id)} />
      <div className={style.actions}>
        
        <MaskingEditor />
    HERE

      </div>
    </>
  );
};

export default withTranslation()(MaskingWindow);
