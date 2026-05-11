import Slider from '@components/CustomSlider';
import SliderSelect from '@components/CustomSliderSelect';
import FormGroup from '@components/FormGroup';
import RulerPicker from '@components/RulerPicker';
import Select from '@components/Select';
import Switch from '@components/Switch';
import { useCallback, useMemo } from 'react';
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

const CameraCapabilitySelectItem = ({ id, disabled = false, values = [], value = undefined, onCapabilityChange, t }) => {
  return (
    <FormGroup key={id} label={CAPABILITIES_LABELS_TRANSLATIONS?.[id]?.(t) || id}>
      <Select
        disabled={disabled}
        options={values.map((e) => ({ ...e, label: CAPABILITIES_OPTIONS_TRANSLATIONS?.[e.label]?.(t) || e.label }))}
        value={value}
        onChange={(evt) => {
          if (disabled) {
            return;
          }
          onCapabilityChange(id, evt.target.value);
        }}
      />
    </FormGroup>
  );
};

const CameraCapabilityRangeItem = ({ id, disabled = false, min = undefined, max = undefined, value = undefined, step = 1, onCapabilityChange, t }) => {
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
        disabled={disabled}
        min={min}
        max={max}
        value={value}
        step={step}
        onChange={(value) => {
          if (disabled) {
            return;
          }
          onCapabilityChange(id, value);
        }}
      />
    </FormGroup>
  );
};

const CameraCapabilityRulerItem = ({ id, disabled = false, min = undefined, max = undefined, value = undefined, step = 1, onCapabilityChange, t }) => {

  const handleChange = useCallback((value) => {
    if (disabled) {
      return;
    }
    onCapabilityChange(id, value);
  }, [disabled, onCapabilityChange, id]);

  const stops = useMemo(() => Array((max - min + 1) / step).fill(0).map((_, i) => min + i * step), [min, max, step]);

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
      <RulerPicker disabled={disabled} value={value} onChange={handleChange} stops={stops} />
    </FormGroup>
  );
};

const CameraCapabilitySelectRangeItem = ({ id, disabled = false, values = [], value, onCapabilityChange, t }) => {
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
        disabled={disabled}
        options={(values || []).map((e) => ({ ...e, label: CAPABILITIES_OPTIONS_TRANSLATIONS?.[e.label]?.(t) || e.label }))}
        value={value}
        onChange={(evt) => {
          if (disabled) {
            return;
          }
          onCapabilityChange(id, evt.value);
        }}
      />
    </FormGroup>
  );
};

const CameraCapabilitySwitchItem = ({ id, disabled = false, value, onCapabilityChange, t }) => {
  return (
    <FormGroup key={id} label={CAPABILITIES_LABELS_TRANSLATIONS?.[id]?.(t) || id}>
      <Switch
        disabled={disabled}
        checked={value === true}
        onChange={() => {
          if (disabled) {
            return;
          }
          onCapabilityChange(id, value !== true);
        }}
      />
    </FormGroup>
  );
};

const CameraCapabilityDirectionalPad = () => {

}

export const CameraCapabilityItem = withTranslation()(({ type, t, ...props }) => {
  if (type === 'RANGE') {
    return <CameraCapabilityRangeItem {...props} t={t} />;
  }
  if (type === 'BOOLEAN') {
    return <CameraCapabilitySwitchItem {...props} t={t} />;
  }
  if (type === 'SELECT') {
    return <CameraCapabilitySelectItem {...props} t={t} />;
  }
  if (type === 'RANGE_SELECT') {
    return <CameraCapabilitySelectRangeItem {...props} t={t} />;
  }
  return null;
});
