import Slider from '@components/CustomSlider';
import SliderSelect from '@components/CustomSliderSelect';
import FormGroup from '@components/FormGroup';
import Select from '@components/Select';
import Switch from '@components/Switch';
import { withTranslation } from 'react-i18next';

export const CAPABILITIES_OPTIONS_TRANSLATIONS = {
  continuous: (t) => t('Automatic'),
  auto: (t) => t('Automatic'),
  manual: (t) => t('Manual'),
  AutoAmbiencePriority: (t) => t('Automatic'),
  Cloudy: (t) => t('Cloudy'),
  Daylight: (t) => t('Daylight'),
  Flash: (t) => t('Flash'),
  Fluorescent: (t) => t('Fluorescent'),
  Shade: (t) => t('Shade'),
  Tungsten: (t) => t('Tungsten'),
  WhitePaper: (t) => t('Manual'),
};

export const CAPABILITIES_LABELS_TRANSLATIONS = {
  BRIGHTNESS: (t) => t('Brightness'),
  COLOR_TEMPERATURE: (t) => t('White balance'),
  CONTRAST: (t) => t('Contrast'),
  FOCUS_DISTANCE: (t) => t('Focus'),
  FOCUS_MODE: (t) => t('Automatic focus'),
  EXPOSURE_COMPENSATION: (t) => t('Exposure compensation'),
  EXPOSURE_MODE: (t) => t('Automatic exposure'),
  EXPOSURE_TIME: (t) => t('Exposure time'),
  ZOOM_POSITION_X: (t) => t('Horizontal position'),
  SATURATION: (t) => t('Saturation'),
  SHARPNESS: (t) => t('Sharpness'),
  ZOOM_POSITION_Y: (t) => t('Vertical position'),
  WHITE_BALANCE_MODE: (t) => t('Automatic white balance'),
  ZOOM: (t) => t('Zoom'),
  APERTURE: (t) => t('Aperture'),
  WHITE_BALANCE: (t) => t('White balance'),
  SHUTTER_SPEED: (t) => t('Shutter speed'),
  ISO: (t) => t('ISO'),
};

const CameraCapabilitySelectItem = ({ id, isDisabled = false, values = [], value = undefined, onCapabilityChange, t }) => {
  return (
    <FormGroup key={id} label={CAPABILITIES_LABELS_TRANSLATIONS?.[id]?.(t) || id}>
      <Select
        isDisabled={isDisabled}
        options={values.map((e) => ({ ...e, label: CAPABILITIES_OPTIONS_TRANSLATIONS?.[e.label]?.(t) || e.label }))}
        value={value}
        onChange={(evt) => {
          if (isDisabled) {
            return;
          }
          onCapabilityChange(id, evt.target.value);
        }}
      />
    </FormGroup>
  );
};

const CameraCapabilityRangeItem = ({ id, isDisabled = false, min = undefined, max = undefined, value = undefined, step = 1, onCapabilityChange, t }) => {
  return (
    <FormGroup
      key={id}
      label={CAPABILITIES_LABELS_TRANSLATIONS?.[id]?.(t) || id}
      description={t('[{{min}}, {{max}}] • {{value}}', {
        min: Math.round(min),
        max: Math.round(max),
        value: Math.round(value),
      })}
    >
      <Slider
        isDisabled={isDisabled}
        min={min}
        max={max}
        value={value}
        step={step}
        onChange={(value) => {
          if (isDisabled) {
            return;
          }
          onCapabilityChange(id, value);
        }}
      />
    </FormGroup>
  );
};

const CameraCapabilitySelectRangeItem = ({ id, isDisabled = false, values = [], value, onCapabilityChange, t }) => {
  const selectedValue = (values || []).find((v) => v.value === value) || values?.[0] || null;
  return (
    <FormGroup
      key={id}
      label={CAPABILITIES_LABELS_TRANSLATIONS?.[id]?.(t) || id}
      description={t('[{{min}}, {{max}}] • {{value}}', {
        min: values?.[0]?.label || '',
        max: values?.[values?.length - 1]?.label || '',
        value: selectedValue?.label || '',
      })}
    >
      <SliderSelect
        isDisabled={isDisabled}
        options={(values || []).map((e) => ({ ...e, label: CAPABILITIES_OPTIONS_TRANSLATIONS?.[e.label]?.(t) || e.label }))}
        value={value}
        onChange={(evt) => {
          if (isDisabled) {
            return;
          }
          onCapabilityChange(id, evt.value);
        }}
      />
    </FormGroup>
  );
};

const CameraCapabilitySwitchItem = ({ id, isDisabled = false, value, onCapabilityChange, t }) => {
  return (
    <FormGroup key={id} label={CAPABILITIES_LABELS_TRANSLATIONS?.[id]?.(t) || id}>
      <Switch
        isDisabled={isDisabled}
        checked={value === true}
        onChange={() => {
          if (isDisabled) {
            return;
          }
          onCapabilityChange(id, value !== true);
        }}
      />
    </FormGroup>
  );
};

export const CameraCapabilityItem = withTranslation()(({ type, t, ...props }) => {
  if (type === 'RANGE') {
    return <CameraCapabilityRangeItem {...props} t={t} />;
  }
  if (type === 'SWITCH') {
    return <CameraCapabilitySwitchItem {...props} t={t} />;
  }
  if (type === 'SELECT') {
    return <CameraCapabilitySelectItem {...props} t={t} />;
  }
  if (type === 'SELECT_RANGE') {
    return <CameraCapabilitySelectRangeItem {...props} t={t} />;
  }
  return null;
});
