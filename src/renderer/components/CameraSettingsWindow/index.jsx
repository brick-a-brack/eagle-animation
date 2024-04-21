import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { withTranslation } from 'react-i18next';

import faAperture from '../../icons/faAperture';
import faCamera from '../../icons/faCamera';
import faDroplet from '../../icons/faDroplet';
import faFaceViewfinder from '../../icons/faFaceViewfinder';
import faLightbulbOn from '../../icons/faLightbulbOn';
import faMagnifyingGlass from '../../icons/faMagnifyingGlass';
import faRotate from '../../icons/faRotate';
import Action from '../Action';
import ActionCard from '../ActionCard';
import Slider from '../CustomSlider';
import SliderSelect from '../CustomSliderSelect';
import FormGroup from '../FormGroup';
import IconTabs from '../IconTabs';
import NumberInput from '../NumberInput';
import Select from '../Select';
import Switch from '../Switch';

import * as style from './style.module.css';

const CameraSettingsWindow = ({
  t,
  cameraCapabilities,
  onCapabilityChange,
  onDevicesListRefresh = () => {},
  onCapabilitiesReset,
  onSettingsChange = () => {},
  appCapabilities = [],
  devices = [],
  settings = {},
}) => {
  const [selectedTab, setSelectedTab] = useState(null);
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

  const selectOptionsTranslations = {
    continuous: t('Automatic'),
    manual: t('Manual'),
    AutoAmbiencePriority: t('Automatic'),
    Cloudy: t('Cloudy'),
    Daylight: t('Daylight'),
    Flash: t('Flash'),
    Fluorescent: t('Fluorescent'),
    Shade: t('Shade'),
    Tungsten: t('Tungsten'),
    WhitePaper: t('Manual'),
  };

  const capsTranslations = {
    BRIGHTNESS: t('Brightness'),
    COLOR_TEMPERATURE: t('White balance'),
    CONTRAST: t('Contrast'),
    FOCUS_DISTANCE: t('Focus'),
    FOCUS_MODE: t('Automatic focus'),
    EXPOSURE_COMPENSATION: t('Exposure compensation'),
    EXPOSURE_MODE: t('Automatic exposure'),
    EXPOSURE_TIME: t('Exposure time'),
    ZOOM_POSITION_X: t('Horizontal position'),
    SATURATION: t('Saturation'),
    SHARPNESS: t('Sharpness'),
    ZOOM_POSITION_Y: t('Vertical position'),
    WHITE_BALANCE_MODE: t('Automatic white balance'),
    ZOOM: t('Zoom'),
    APERTURE: t('Aperture'),
    WHITE_BALANCE: t('White balance'),
    SHUTTER_SPEED: t('Shutter speed'),
    ISO: t('ISO'),
  };

  const categories = [
    { id: 'CAMERAS', icon: faCamera, title: t('Cameras'), capabilities: [] },
    { id: 'WHITE_BALANCE', icon: faLightbulbOn, title: t('White balance'), capabilities: ['WHITE_BALANCE_MODE', 'COLOR_TEMPERATURE', 'WHITE_BALANCE'] },
    { id: 'FOCUS', icon: faFaceViewfinder, title: t('Focus'), capabilities: ['FOCUS_MODE', 'FOCUS_DISTANCE'] },
    { id: 'IMAGE_SETTINGS', icon: faDroplet, title: t('Image settings'), capabilities: ['BRIGHTNESS', 'CONTRAST', 'SATURATION', 'SHARPNESS'] },
    { id: 'EXPOSURE', icon: faAperture, title: t('Exposure'), capabilities: ['EXPOSURE_MODE', 'EXPOSURE_COMPENSATION', 'EXPOSURE_TIME', 'ISO', 'SHUTTER_SPEED', 'APERTURE'] },
    { id: 'ZOOM', icon: faMagnifyingGlass, title: t('Zoom'), capabilities: ['ZOOM', 'ZOOM_POSITION_X', 'ZOOM_POSITION_Y'] },
  ]
    .filter((category) => category.id === 'CAMERAS' || cameraCapabilities.map((e) => e.id).some((capId) => category.capabilities.includes(capId)))
    .map((e, i) => ({ ...e, selected: selectedTab === e.id || (i === 0 && selectedTab === null) }));

  const selectedCategory = categories.find((e) => Boolean(e.selected));

  return (
    <>
      <IconTabs tabs={categories} onClick={(e) => setSelectedTab(e.id)} />
      <div className={style.actions}>
        {selectedCategory.id === 'CAMERAS' && (
          <>
            <FormGroup label={t('Camera')} description={t('The camera device to use to take frames')}>
              <Select options={devices.map((e) => ({ value: e.id, label: e.label }))} register={register('CAMERA_ID')} />
              <Action title={t('Refresh camera list')} className={style.refreshIcon} action={() => onDevicesListRefresh()}>
                <FontAwesomeIcon icon={faRotate} />
              </Action>
            </FormGroup>
            <FormGroup label={t('Frames to capture')} description={t('Number of frames to capture')}>
              <NumberInput register={register('CAPTURE_FRAMES')} min={1} />
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
            {appCapabilities.includes('LOW_FRAMERATE_QUALITY_IMPROVEMENT') && (
              <FormGroup
                label={t('Improve quality by reducing preview framerate')}
                description={t('Some cameras can take better quality pictures by reducing the framerate of the preview (Restart required)')}
              >
                <div>
                  <Switch register={register('FORCE_QUALITY')} />
                </div>
              </FormGroup>
            )}
          </>
        )}

        {cameraCapabilities
          .filter((cap) => selectedCategory.capabilities.includes(cap.id))
          .map((cap) => {
            if (cap.type === 'RANGE') {
              return (
                <FormGroup
                  key={cap.id}
                  label={capsTranslations[cap.id] || cap.id}
                  description={t('[{{min}}, {{max}}] • {{value}}', { min: Math.round(cap.min), max: Math.round(cap.max), value: Math.round(cap.value) })}
                >
                  <Slider
                    min={cap.min}
                    max={cap.max}
                    value={cap.value}
                    step={cap.step}
                    onChange={(value) => {
                      onCapabilityChange(cap.id, value);
                    }}
                  />
                </FormGroup>
              );
            }
            if (cap.type === 'SWITCH') {
              return (
                <FormGroup key={cap.id} label={capsTranslations[cap.id] || cap.id}>
                  <Switch
                    checked={cap.value === true}
                    onChange={() => {
                      if (cap.value === true) {
                        onCapabilityChange(cap.id, false);
                      } else {
                        onCapabilityChange(cap.id, true);
                      }
                    }}
                  />
                </FormGroup>
              );
            }
            if (cap.type === 'SELECT') {
              return (
                <FormGroup key={cap.id} label={capsTranslations[cap.id] || cap.id}>
                  <Select
                    options={cap.values.map((e) => ({ ...e, label: selectOptionsTranslations[e.label] || e.label }))}
                    value={cap.value}
                    onChange={(evt) => {
                      onCapabilityChange(cap.id, evt.target.value);
                    }}
                  />
                </FormGroup>
              );
            }
            if (cap.type === 'SELECT_RANGE') {
              const selectedValue = cap.values?.find((v) => v.value === cap.value) || cap.values?.[0] || null;
              return (
                <FormGroup
                  key={cap.id}
                  label={capsTranslations[cap.id] || cap.id}
                  description={t('[{{min}}, {{max}}] • {{value}}', {
                    min: cap.values?.[0]?.label || '',
                    max: cap?.values?.[cap?.values?.length - 1]?.label || '',
                    value: selectedValue?.label || '',
                  })}
                >
                  <SliderSelect
                    options={cap.values.map((e) => ({ ...e, label: selectOptionsTranslations[e.label] || e.label }))}
                    value={cap.value}
                    onChange={(evt) => {
                      onCapabilityChange(cap.id, evt.value);
                    }}
                  />
                </FormGroup>
              );
            }
            return null;
          })}

        {selectedCategory.id === 'CAMERAS' && cameraCapabilities.some((cap) => cap.canReset) && (
          <FormGroup label={t('Reset camera settings')} description={t('Reset the current camera settings, all values will be reset to default')}>
            <ActionCard className={style.settingsReset} title={t('Reset settings')} action={() => onCapabilitiesReset()} sizeAuto secondary />
          </FormGroup>
        )}
      </div>
    </>
  );
};

export default withTranslation()(CameraSettingsWindow);
