import Slider from '@components/CustomSlider';
import SliderSelect from '@components/CustomSliderSelect';
import FormGroup from '@components/FormGroup';
import RulerPicker from '@components/RulerPicker';
import Select from '@components/Select';
import Switch from '@components/Switch';
import { useCallback, useMemo } from 'react';
import { withTranslation } from 'react-i18next';

const getCapabilitySelectLabel = (label, t) => {
  const properId = label?.toLowerCase().replace(/ /g, '_').trim();
  const map = {
    disabled: t('Disabled'),
    '50_hz': t('50 Hz'),
    '60_hz': t('60 Hz'),
    continuous: t('Automatic'),
    auto: t('Automatic'),
    manual: t('Manual'),
    autoambiencepriority: t('Automatic'),
    cloudy: t('Cloudy'),
    daylight: t('Daylight'),
    flash: t('Flash'),
    fluorescent: t('Fluorescent'),
    shade: t('Shade'),
    tungsten: t('Tungsten'),
    whitepaper: t('Manual'),
  }
  return map?.[properId] || label || t('Unknown');
}

const getCapabilityLabel = (id, t) => {
  const properId = id?.toLowerCase().replace(/ /g, '_').trim();
  const map = {
    image_quality: t('Image quality'),
    video_stream_format: t('Video stream format'),
    power_line_frequency: t('Power line frequency'),
    brightness_auto: t('Automatic brightness'),
    brightness: t('Brightness'),
    contrast_auto: t('Automatic contrast'),
    contrast: t('Contrast'),
    saturation_auto: t('Automatic saturation'),
    saturation: t('Saturation'),
    sharpness_auto: t('Automatic sharpness'),
    sharpness: t('Sharpness'),
    gamma_auto: t('Automatic gamma'),
    gamma: t('Gamma'),
    white_balance_auto: t('Automatic white balance'),
    white_balance: t('White balance'),
    hue_auto: t('Automatic hue'),
    hue: t('Hue'),
    exposure_auto: t('Automatic exposure'),
    exposure_compensation: t('Exposure compensation'),
    exposure: t('Exposure'),
    backlight_compensation: t('Backlight compensation'),
    gain_auto: t('Automatic gain'),
    gain: t('Gain'),
    zoom_auto: t('Automatic zoom'),
    zoom: t('Zoom'),
    tilt_auto: t('Automatic tilt'),
    tilt: t('Tilt'),
    pan_auto: t('Automatic pan'),
    pan: t('Pan'),
    roll_auto: t('Automatic roll'),
    roll: t('Roll'),
    focus_auto: t('Automatic focus'),
    focus: t('Focus'),
    live_view_zoom: t('Live view zoom'),
    live_view_pan: t('Live view pan'),
    live_view_tilt: t('Live view tilt'),
    live_view_roll: t('Live view roll'),
    iso_auto: t('Automatic ISO'),
    iso: t('ISO'),
  };
  return map?.[properId] || id || t('Unknown');
}

/*
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
};*/

const CameraCapabilitySelectItem = ({ id, disabled = false, values = [], value = undefined, onCapabilityChange, t }) => {
  return (
    <FormGroup key={id} label={getCapabilityLabel(id, t)}>
      <Select
        disabled={disabled}
        options={values.map((e) => ({ ...e, label: getCapabilitySelectLabel(e.label, t) }))}
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
      label={getCapabilityLabel(id, t)}
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
      label={getCapabilityLabel(id, t)}
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
      label={getCapabilityLabel(id, t)}
      description={t('[{{min}}, {{max}}] • {{value}}', {
        min: values?.[0]?.label || '',
        max: values?.[values?.length - 1]?.label || '',
        value: selectedValue?.label || '',
      })}
    >
      <SliderSelect
        disabled={disabled}
        options={(values || []).map((e) => ({ ...e, label: getCapabilitySelectLabel(e.label, t) }))}
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
    <FormGroup key={id} label={getCapabilityLabel(id, t)}>
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
