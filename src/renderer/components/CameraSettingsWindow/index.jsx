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

import { CameraCapabilityItem, CAPABILITIES_LABELS_TRANSLATIONS } from '../CameraCapabilityItem';

import * as style from './style.module.css';

const groupDevices = (devices, t) => {
  const output = [];

  const categories = {
    'WEB-WEBCAM': t('Webcams'),
    'WEB-GPHOTO2': t('WebUSB'),
    'WEB-TOUCAN-CAMERA-SERVER': t('Toucan Camera Server'),
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

const CameraSettingsWindow = ({ t, cameraCapabilities, onCapabilityChange, onDevicesListRefresh = () => {}, onCapabilitiesReset, onSettingsChange = () => {}, devices = [], settings = {} }) => {
  const [selectedTab, setSelectedTab] = useState('CAMERAS');
  const form = useForm({
    mode: 'all',
    defaultValues: {
      ...settings,
    },
  });
  const { watch, register, getValues } = form;

  const formValues = watch();

  useEffect(() => {
    const values = getValues();
    onSettingsChange(values);
  }, [JSON.stringify(formValues)]);

  const capsIcons = {
    WHITE_BALANCE_MODE: faLightbulbOn,
    FOCUS: faFaceViewfinder,
    ZOOM: faMagnifyingGlass,
    EXPOSURE: faAperture,
  };

  const categories = [
    { id: 'CAMERAS', icon: faCamera, title: t('Cameras'), capabilities: [] },
    ...cameraCapabilities.map((e) => ({ id: e.id, icon: capsIcons[e.id] || faQuestion, title: CAPABILITIES_LABELS_TRANSLATIONS?.[e.id]?.(t) || e.id, capabilities: [e] })),
  ].map((c) => ({
    ...c,
    selected: c.id === selectedTab,
  }));

  const selectedCategory = categories.find((e) => Boolean(e.selected));

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

        {selectedCategory.capabilities.map((cap) => (
          <CameraCapabilityItem key={cap.id} {...cap} onCapabilityChange={onCapabilityChange} />
        ))}

        {selectedCategory.id === 'CAMERAS' && cameraCapabilities.some((cap) => cap.canReset) && (
          <FormGroup label={t('Reset camera settings')} description={t('Reset the current camera settings, all values will be reset to default')}>
            <ActionCard title={t('Reset settings')} onClick={() => onCapabilitiesReset()} sizeAuto secondary />
          </FormGroup>
        )}
      </div>
    </>
  );
};

export default withTranslation()(CameraSettingsWindow);
