import Action from '@components/Action';
import FormGroup from '@components/FormGroup';
import IconTabs from '@components/IconTabs';
import NumberInput from '@components/NumberInput';
import PeersList from '@components/PeersList';
import Select from '@components/Select';
import Switch from '@components/Switch';
import Window from '@components/Window';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAppCapabilities from '@hooks/useAppCapabilities';
import usePeers from '@hooks/usePeers';
import faAperture from '@icons/faAperture';
import faCamera from '@icons/faCamera';
import faCircleHalfStroke from '@icons/faCircleHalfStroke';
import faCirclesOverlap3 from '@icons/faCirclesOverlap3';
import faCrosshairs from '@icons/faCrosshairs';
import faExposure from '@icons/faExposure';
import faFaceViewfinder from '@icons/faFaceViewfinder';
import faFilm from '@icons/faFilm';
import faIso from '@icons/faIso';
import faLightbulbOn from '@icons/faLightbulbOn';
import faMagnifyingGlass from '@icons/faMagnifyingGlass';
import faMobileSignalOut from '@icons/faMobileSignalOut';
import faQuestion from '@icons/faQuestion';
import faRotate from '@icons/faRotate';
import faShutterSpeed from '@icons/faShutterSpeed';
import faSun from '@icons/faSun';
import faTemperatureHalf from '@icons/faTemperatureHalf';
import faTriangle from '@icons/faTriangle';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { withTranslation } from 'react-i18next';

import { CameraCapabilityItem } from '../CameraCapabilityItem';

import * as style from './style.module.css';

const groupDevices = (devices, t) => {
  const output = [];

  const categories = {
    'TOUCAN-CAMERA-SERVER': t('Cameras'),
    WEBCAM: t('Webcams'),
    GPHOTO2: t('WebUSB'),
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

const getCapabilitiesTabs = (capabilities, t = (v) => v) => {
  let tabs = [
    {
      title: t('Quality'),
      properties: ['video_stream_format', 'photo_resolution', 'image_quality', 'power_line_frequency'],
      icon: faFilm,
    },
    {
      title: t('Brightness'),
      properties: ['brightness_auto', 'brightness'],
      icon: faSun,
    },
    {
      title: t('Contrast'),
      properties: ['contrast_auto', 'contrast'],
      icon: faCircleHalfStroke,
    },
    {
      title: t('Saturation'),
      properties: ['saturation_auto', 'saturation'],
      icon: faCirclesOverlap3,
    },
    {
      title: t('Sharpness'),
      properties: ['sharpness_auto', 'sharpness'],
      icon: faTriangle,
    },
    {
      title: t('Gamma'),
      properties: ['gamma_auto', 'gamma'],
      icon: faQuestion,
    },
    {
      title: t('Hue'),
      properties: ['hue_auto', 'hue'],
      icon: faTemperatureHalf,
    },
    {
      title: t('White Balance'),
      properties: ['white_balance_auto', 'white_balance'],
      icon: faLightbulbOn,
    },
    {
      title: t('Focus'),
      properties: ['focus_auto', 'focus'],
      icon: faFaceViewfinder,
    },
    {
      title: t('Aperture'),
      properties: ['aperture_auto', 'aperture'],
      icon: faAperture,
    },
    {
      title: t('Exposure'),
      properties: ['exposure_auto', 'backlight_compensation', 'exposure_compensation', 'exposure', 'gain_auto', 'gain'],
      icon: faExposure,
    },
    {
      title: t('Shutter speed'),
      properties: ['shutter_speed_auto', 'shutter_speed'],
      icon: faShutterSpeed,
    },
    {
      title: t('ISO'),
      properties: ['iso_auto', 'iso'],
      icon: faIso,
    },
    {
      title: t('Camera controls'),
      properties: ['zoom_auto', 'zoom', 'tilt_auto', 'tilt', 'pan_auto', 'pan', 'roll_auto', 'roll'],
      icon: faMagnifyingGlass,
    },
    {
      title: t('Live View'),
      properties: ['live_view_zoom', 'live_view_pan', 'live_view_tilt', 'live_view_roll'],
      icon: faCrosshairs,
    },
  ];

  const capabilitiesKeys = tabs.map((e) => e.properties).flat();
  const unhandledCapabilities = capabilities.filter((cap) => !capabilitiesKeys.includes(cap.id));

  tabs.push({
    title: t('Other capabilities'),
    properties: unhandledCapabilities.map((e) => e.id),
    icon: faQuestion,
  });

  return tabs.map((tab) => ({ ...tab, properties: tab.properties.filter((prop) => capabilities.some((cap) => cap.id === prop)) })).filter((tab) => tab.properties.length > 0);
};

const RemoteCameraSettingsWindow = withTranslation()(({ onDevicesListRefresh }) => {
  const { peers, actions } = usePeers();
  const handleConnect = async (...args) => {
    await actions.add(...args);
    onDevicesListRefresh();
  };

  const handleDelete = async (...args) => {
    await actions.remove(...args);
    onDevicesListRefresh();
  };

  return <PeersList peers={peers} onConnect={handleConnect} onDelete={handleDelete} />;
});

const BasicCameraSettingsTab = withTranslation()(({ t, onDevicesListRefresh = () => {}, onSettingsChange = () => {}, devices = [], settings = {}, currentCameraId = null }) => {
  const form = useForm({
    mode: 'all',
    defaultValues: {
      ...settings,
      CAMERA_ID: currentCameraId || settings?.CAMERA_ID || null,
    },
  });
  const { appCapabilities } = useAppCapabilities();
  const { watch, register, getValues, setValue } = form;
  const [isPeerDevicesListOpen, setIsPeerDevicesListOpen] = useState(false);

  const formValues = watch();

  // Keep CAMERA_ID in sync with the actually-selected camera from useCamera,
  // not with settings (which may lag behind, e.g. when the default camera was
  // just auto-selected). Without this the Select would stay empty while the
  // camera is actually streaming.
  useEffect(() => {
    if (currentCameraId && currentCameraId !== getValues('CAMERA_ID')) {
      setValue('CAMERA_ID', currentCameraId);
    }
  }, [currentCameraId, getValues, setValue]);

  useEffect(() => {
    const values = getValues();
    onSettingsChange(values);
  }, [JSON.stringify(formValues)]);

  return (
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

        {appCapabilities.includes('REMOTE_CAMERAS') && !settings?.COMPATIBILITY_MODE_CAMERAS && (
          <Action title={t('Remote cameras')} className={style.refreshIcon} onClick={() => setIsPeerDevicesListOpen(true)}>
            <FontAwesomeIcon icon={faMobileSignalOut} />
          </Action>
        )}
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

      {appCapabilities.includes('REMOTE_CAMERAS') && !settings?.COMPATIBILITY_MODE_CAMERAS && (
        <Window title={t('Remote cameras')} isOpened={isPeerDevicesListOpen} onClose={() => setIsPeerDevicesListOpen(false)} zIndex={1}>
          <RemoteCameraSettingsWindow onDevicesListRefresh={onDevicesListRefresh} />
        </Window>
      )}
    </>
  );
});

const CameraSettingsWindow = ({ t, cameraCapabilities, onCapabilityChange, onDevicesListRefresh = () => {}, onSettingsChange = () => {}, devices = [], settings = {}, currentCameraId = null }) => {
  const [selectedTab, setSelectedTab] = useState('CAMERAS');

  const tabs = getCapabilitiesTabs(cameraCapabilities, t);

  const categories = [{ id: 'CAMERAS', icon: faCamera, title: t('Cameras'), properties: [] }, ...tabs.map((e) => ({ icon: e.icon, title: e.title, properties: e.properties }))].map((c, i) => ({
    ...c,
    id: `${c.id || i}`,
    selected: `${c.id || i}` === selectedTab,
  }));

  const selectedCategory = categories.find((e) => Boolean(e.selected)) || categories[0] || null;

  return (
    <>
      <IconTabs tabs={categories} onClick={(e) => setSelectedTab(e.id)} />
      <div className={style.actions}>
        {selectedCategory.id === 'CAMERAS' && (
          <BasicCameraSettingsTab onDevicesListRefresh={onDevicesListRefresh} onSettingsChange={onSettingsChange} devices={devices} settings={settings} currentCameraId={currentCameraId} />
        )}

        {selectedCategory.properties.map((cap) => (
          <CameraCapabilityItem key={cap} {...cameraCapabilities.find((c) => c.id === cap)} onCapabilityChange={onCapabilityChange} />
        ))}
      </div>
    </>
  );
};

export default withTranslation()(CameraSettingsWindow);
