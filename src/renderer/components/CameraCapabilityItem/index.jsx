import Slider from '@components/CustomSlider';
import SliderSelect from '@components/CustomSliderSelect';
import FormGroup from '@components/FormGroup';
import RulerPicker from '@components/RulerPicker';
import Select from '@components/Select';
import Switch from '@components/Switch';
import { useCallback, useMemo, useRef, useState } from 'react';
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
    large_fine_jpeg: t('Large Fine JPEG'),
    large_normal_jpeg: t('Large Normal JPEG'),
    medium_fine_jpeg: t('Medium Fine JPEG'),
    medium_normal_jpeg: t('Medium Normal JPEG'),
    small_fine_jpeg: t('Small Fine JPEG'),
    small_normal_jpeg: t('Small Normal JPEG'),
    smaller_jpeg: t('Smaller JPEG'),
    tiny_jpeg: t('Tiny JPEG'),
    'raw_+_large_fine_jpeg': t('RAW + Large Fine JPEG'),
    l_jpeg_fine: t('Large Fine JPEG'),
    l_jpeg_normal: t('Large Normal JPEG'),
    m_jpeg_fine: t('Medium Fine JPEG'),
    m_jpeg_normal: t('Medium Normal JPEG'),
    s1_jpeg_fine: t('Small Fine JPEG'),
    s1_jpeg_normal: t('Small Normal JPEG'),
    s2_jpeg_fine: t('Smaller JPEG'),
    s3_jpeg_fine: t('Tiny JPEG'),
    'raw_+_l_jpeg_fine': t('RAW + Large Fine JPEG'),
    'raw_+_l_fine': t('RAW + Large Fine JPEG'),
    raw: t('RAW'),
    fit: t('Fit'),
    '5x': t('5x'),
    '6x': t('6x'),
    '10x': t('10x'),
    '15x': t('15x'),
  };
  return map?.[properId] || label || t('Unknown');
};

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
    shutter_speed: t('Shutter speed'),
    aperture: t('Aperture'),
  };
  return map?.[properId] || id || t('Unknown');
};

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
  const handleChange = useCallback(
    (value) => {
      if (disabled) {
        return;
      }
      onCapabilityChange(id, value);
    },
    [disabled, onCapabilityChange, id]
  );

  const stops = useMemo(
    () =>
      Array((max - min + 1) / step)
        .fill(0)
        .map((_, i) => min + i * step),
    [min, max, step]
  );

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

export const CameraCapabilityItem = withTranslation()(({ type, t, value, onCapabilityChange, ...props }) => {
  const [stateValue, setStateValue] = useState(value);
  const ref = useRef({ timeout: null, value: null });

  const handleChange = useCallback(
    (id, value) => {
      ref.current.value = value;
      setStateValue(value);

      if (!ref.current.timeout) {
        ref.current.timeout = setTimeout(() => {
          ref.current.timeout = null;
          onCapabilityChange(id, ref?.current?.value);
        }, 100);
      }
    },
    [value, onCapabilityChange]
  );

  if (type === 'RANGE') {
    return <CameraCapabilityRangeItem {...props} onCapabilityChange={handleChange} value={stateValue} t={t} />;
  }
  if (type === 'RULER') {
    return <CameraCapabilityRulerItem {...props} onCapabilityChange={handleChange} value={stateValue} t={t} />;
  }
  if (type === 'BOOLEAN') {
    return <CameraCapabilitySwitchItem {...props} onCapabilityChange={handleChange} value={stateValue} t={t} />;
  }
  if (type === 'SELECT') {
    return <CameraCapabilitySelectItem {...props} onCapabilityChange={handleChange} value={stateValue} t={t} />;
  }
  if (type === 'RANGE_SELECT') {
    return <CameraCapabilitySelectRangeItem {...props} onCapabilityChange={handleChange} value={stateValue} t={t} />;
  }

  console.warn('🐛 A capability type is not supported', type);

  return null;
});
