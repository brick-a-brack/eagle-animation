import Action from '@components/Action';
import ActionCard from '@components/ActionCard';
import FormGroup from '@components/FormGroup';
import IconTabs from '@components/IconTabs';
import NumberInput from '@components/NumberInput';
import Select from '@components/Select';
import Switch from '@components/Switch';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faAperture from '@icons/faAperture';
import faCamera from '@icons/faCamera';
import faFaceViewfinder from '@icons/faFaceViewfinder';
import faLightbulbOn from '@icons/faLightbulbOn';
import faMagnifyingGlass from '@icons/faMagnifyingGlass';
import faQuestion from '@icons/faQuestion';
import faRotate from '@icons/faRotate';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { withTranslation } from 'react-i18next';

import { CameraCapabilityItem } from '../CameraCapabilityItem';

import * as style from './style.module.css';
import faFilm from '@icons/faFilm';
import faSun from '@icons/faSun';
import faCircleHalfStroke from '@icons/faCircleHalfStroke';
import faDroplet from '@icons/faDroplet';
import faEye from '@icons/faEye';
import faLeftRight from '@icons/faLeftRight';
import faUpDown from '@icons/faUpDown';
import faCrosshairs from '@icons/faCrosshairs';
import faRulerHorizontal from '@icons/faRulerHorizontal';
import faClock from '@icons/faClock';
import faPlusMinus from '@icons/faPlusMinus';
import faWandMagicSparkles from '@icons/faWandMagicSparkles';
import faPalette from '@icons/faPalette';
import faTemperatureHalf from '@icons/faTemperatureHalf';
import faSignal from '@icons/faSignal';
import faTriangle from '@icons/faTriangle';
import faCirclesOverlap3 from '@icons/faCirclesOverlap3';

const groupDevices = (devices, t) => {
  const output = [];

  const categories = {
    'WEB-TOUCAN-CAMERA-SERVER': t('Toucan Camera Server') + ' ' +t('(Experimental)'),
    'WEB-WEBCAM': t('Webcams'),
    'WEB-GPHOTO2': t('WebUSB'),
  };

  // Categories
  Object.keys(categories).forEach((key) => {
    const tmpDevices = devices.filter((e) => e?.value?.startsWith(key));
    if (tmpDevices.length > 0) {
      output.push({
        id: key,
        label: categories[key],
        values: tmpDevices,
      });
    }
  });

  // Other
  const tmpDevices = devices.filter((e) => !Object.keys(categories).some((tag) => e?.value?.startsWith(tag)));
  if (tmpDevices.length > 0) {
    output.push({
      id: 'OTHER',
      label: t('Other'),
      values: tmpDevices,
    });
  }

  return output;
};

const CameraCapabilityPage = ({ }) => {



}

const getCapabilitiesTabs = (capabilities, t = v => v) => {
  let tabs = [{
    title: t('Quality'),
    properties: ['video_stream_format', 'image_quality', 'power_line_frequency'],
    icon: faFilm,
  },{
    title: t('Brightness'),
    properties: ['brightness_auto', 'brightness'],
    icon: faSun,
  }, {
    title: t('Contrast'),
    properties: ['contrast_auto', 'contrast'],
    icon: faCircleHalfStroke,
  }, {
    title: t('Saturation'),
    properties: ['saturation_auto', 'saturation'],
    icon: faCirclesOverlap3,
  }, {
    title: t('Sharpness'),
    properties: ['sharpness_auto', 'sharpness'],
    icon: faTriangle,
  }, {
    title: t('Gamma'),
    properties: ['gamma_auto', 'gamma'],
    icon: faQuestion,
  }, {
    title: t('Hue'),
    properties: ['hue_auto', 'hue'],
    icon: faTemperatureHalf,
  }, {
    title: t('White Balance'),
    properties: ['white_balance_auto', 'white_balance'],
    icon: faLightbulbOn,
  }, {
    title: t('Focus'),
    properties: ['focus_auto', 'focus'],
    icon: faFaceViewfinder,
  }, {
    title: t('Exposure'),
    properties: ['exposure_auto', 'backlight_compensation', 'exposure_compensation', 'exposure', 'gain_auto', 'gain'],
    icon: faAperture,
  }, {
    title: t('ISO'),
    properties: ['iso_auto', 'iso'],
    icon: faSignal,
  }, {
    title: t('Camera controls'),
    properties: ['zoom_auto', 'zoom', 'tilt_auto', 'tilt', 'pan_auto', 'pan', 'roll_auto', 'roll'],
    icon: faMagnifyingGlass,
  }, {
    title: t('Live View'),
    properties: ['live_view_zoom', 'live_view_pan', 'live_view_tilt', 'live_view_roll'],
    icon: faCrosshairs,
  }];

  const capabilitiesKeys = tabs.map((e) => e.properties).flat();
  const unhandledCapabilities = capabilities.filter((cap) => !capabilitiesKeys.includes(cap.id));

  tabs.push({
    title: t('Other capabilities'),
    properties: unhandledCapabilities.map((e) => e.id),
    icon: faQuestion,
  })

  return tabs.map((tab) => ({ ...tab, properties: tab.properties.filter((prop) => capabilities.some((cap) => cap.id === prop)) })).filter((tab) => tab.properties.length > 0);

};

const CameraSettingsWindow = ({ t, cameraCapabilities, onCapabilityChange, onDevicesListRefresh = () => { }, onSettingsChange = () => { }, devices = [], settings = {} }) => {
  const [selectedTab, setSelectedTab] = useState('CAMERAS');
  const form = useForm({
    mode: 'all',
    defaultValues: {
      ...settings,
    },
  });
  const { watch, register, getValues } = form;

  const tabs = getCapabilitiesTabs(cameraCapabilities, t);

  const formValues = watch();

  useEffect(() => {
    const values = getValues();
    onSettingsChange(values);
  }, [JSON.stringify(formValues)]);

  const categories = [
    { id: 'CAMERAS', icon: faCamera, title: t('Cameras'), properties: [] },
    ...tabs.map(e => ({ icon: e.icon, title: e.title, properties: e.properties })),
  ].map((c, i) => ({
    ...c,
    id: `${c.id || i}`,
    selected: `${c.id || i}` === selectedTab,
  }));

  console.log('categories', categories, selectedTab)

  const selectedCategory = categories.find((e) => Boolean(e.selected)) || categories[0] || null;

  console.log('selectedCategory', selectedCategory)

  return (
    <>
      <IconTabs tabs={categories} onClick={(e) => setSelectedTab(e.id)} />
      <div className={style.actions}>
        {selectedCategory.id === 'CAMERAS' && (
          <>
            <FormGroup label={t('Camera')} description={t('The camera device to use to take frames')}>
              <Select
                options={[
                  { value: '', label: t('Choose a camera'), disabled: true },
                  ...groupDevices(
                    devices.map((e) => ({ value: e.id, label: e.label })),
                    t
                  ),
                ]}
                register={register('CAMERA_ID')}
              />
              <Action title={t('Refresh camera list')} className={style.refreshIcon} onClick={() => onDevicesListRefresh()}>
                <FontAwesomeIcon icon={faRotate} />
              </Action>
            </FormGroup>
            <FormGroup label={t('Frames to capture')} description={t('Number of frames to capture')}>
              <NumberInput register={register('CAPTURE_FRAMES')} min={1} />
            </FormGroup>

            <FormGroup label={t('Reverse horizontally')} description={t('Reverse the camera horizontally')}>
              <Switch register={register('REVERSE_X')} />
            </FormGroup>

            <FormGroup label={t('Reverse vertically')} description={t('Reverse the camera vertically')}>
              <Switch register={register('REVERSE_Y')} />
            </FormGroup>

            <FormGroup label={t('Frame averaging')} description={t('Frame averaging will take several frames to remove picture noise, camera must be perfectly stable')}>
              <div style={{ display: 'inline-block' }}>
                <Switch register={register('AVERAGING_ENABLED')} />
              </div>
              {watch('AVERAGING_ENABLED') && (
                <div style={{ display: 'inline-block', marginLeft: 'var(--space-big)' }}>
                  <NumberInput register={register('AVERAGING_VALUE')} min={2} max={10} />
                </div>
              )}
            </FormGroup>
          </>
        )}

        {selectedCategory.properties.map((cap) => (
          <CameraCapabilityItem key={cap} {...cameraCapabilities.find((c) => c.id === cap)} onCapabilityChange={onCapabilityChange} />
        ))}
      </div>
    </>
  );
};

export default withTranslation()(CameraSettingsWindow);
