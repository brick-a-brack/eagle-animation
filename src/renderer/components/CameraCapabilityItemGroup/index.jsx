import Button from '@components/Button';
import { getCapabilityLabel, getCapabilitySelectLabel } from '@components/CameraCapabilityItem';
import Slider from '@components/CustomSlider';
import SliderSelect from '@components/CustomSliderSelect';
import FormGroup from '@components/FormGroup';
import RulerPicker from '@components/RulerPicker';
import Select from '@components/Select';
import faWandMagicSparkles from '@icons/faWandMagicSparkles';
import { useCallback, useMemo, useRef, useState } from 'react';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

// Same rate limit as CameraCapabilityItem: dragging a slider emits far more values
// than a camera can take, so only one is sent per window.
const CHANGE_THROTTLE = 100;

/**
 * The boolean half of the pair, as a labelled button rather than a switch: it sits
 * inline with the control it governs, so it has to read as a mode being picked
 * ("Auto") and not as a separate setting. `selected` is what the shared Button uses
 * for an engaged state, which is exactly what a boolean capability being on is.
 */
const CapabilityToggle = ({ capability, onCapabilityChange, t }) => (
  <Button
    size="small"
    icon={faWandMagicSparkles}
    label={getCapabilityToggleLabel(capability.id, t)}
    selected={capability.value === true}
    disabled={capability.disabled}
    onClick={() => onCapabilityChange(capability.id, capability.value !== true)}
  />
);

// An `*_auto` capability reads as "Auto" next to the control it drives — the full
// "Automatic brightness" belongs on a row of its own, not on a button this narrow.
const getCapabilityToggleLabel = (id, t) => (id?.toLowerCase().endsWith('_auto') ? t('Auto') : getCapabilityLabel(id, t));

/** The control of the classic capability, picked from its type. */
const CapabilityControl = ({ capability, value, onChange, t }) => {
  const { id, type, disabled = false, values = [], min, max, step = 1 } = capability;

  const handleChange = useCallback(
    (nextValue) => {
      if (disabled) {
        return;
      }
      onChange(id, nextValue);
    },
    [disabled, onChange, id]
  );

  const stops = useMemo(() => {
    if (type !== 'RULER') {
      return [];
    }
    return Array((max - min + 1) / step)
      .fill(0)
      .map((_, i) => min + i * step);
  }, [type, min, max, step]);

  if (type === 'RANGE') {
    return <Slider disabled={disabled} min={min} max={max} value={value} step={step} onChange={handleChange} />;
  }

  if (type === 'RULER') {
    return <RulerPicker disabled={disabled} value={value} onChange={handleChange} stops={stops} />;
  }

  if (type === 'SELECT') {
    return <Select disabled={disabled} options={values.map((e) => ({ ...e, label: getCapabilitySelectLabel(e.label, t) }))} value={value} onChange={(evt) => handleChange(evt.target.value)} />;
  }

  if (type === 'RANGE_SELECT') {
    return <SliderSelect disabled={disabled} options={values.map((e) => ({ ...e, label: getCapabilitySelectLabel(e.label, t) }))} value={value} onChange={(evt) => handleChange(evt.value)} />;
  }

  console.warn('🐛 A capability type is not supported', type);

  return null;
};

/** The reading under the label, in the shape the standalone items already use. */
const getDescription = (capability, value, t) => {
  const { type, values = [], min, max } = capability;

  if (type === 'RANGE' || type === 'RULER') {
    return t('[{{min}}, {{max}}] • {{value}}', {
      min: Math.round(min),
      max: Math.round(max),
      value: Math.round(value),
    });
  }

  if (type === 'RANGE_SELECT') {
    const selected = values.find((v) => v.value === value) || values?.[0] || null;
    return t('[{{min}}, {{max}}] • {{value}}', {
      min: values?.[0]?.label || '',
      max: values?.[values.length - 1]?.label || '',
      value: selected?.label || '',
    });
  }

  return '';
};

/**
 * One row for a pair of capabilities that belong together: a boolean — usually the
 * `*_auto` of the other one — and the control it governs, side by side.
 *
 * Pairs like `brightness_auto` / `brightness` are two entries on the camera but one
 * decision for the user, and splitting them over two rows hides that turning the
 * first on is what takes the second out of play. Whether it does is the camera's
 * call, not this component's: each capability carries its own `disabled`, which is
 * passed straight through.
 *
 * Both are the shapes produced by the camera modules:
 * `{ id, type, value, disabled?, values?, min?, max?, step? }`.
 *
 * `booleanLabels` names what each state of the boolean means — `{ on, off }`. The
 * one matching the current state replaces the reading under the label, which is the
 * point: while the camera is choosing the value itself, `[0, 255] • 128` reads as a
 * setting the user made. A state left unnamed keeps the usual reading.
 */
export const CameraCapabilityItemGroup = withTranslation()(({ booleanCapability, capability, booleanLabels = {}, onCapabilityChange, t }) => {
  // Held locally so the control follows the pointer at its own pace, while the camera
  // is driven at CHANGE_THROTTLE.
  const [value, setValue] = useState(capability?.value);
  const ref = useRef({ timeout: null, value: null });

  const handleChange = useCallback(
    (id, nextValue) => {
      ref.current.value = nextValue;
      setValue(nextValue);

      if (!ref.current.timeout) {
        ref.current.timeout = setTimeout(() => {
          ref.current.timeout = null;
          onCapabilityChange(id, ref?.current?.value);
        }, CHANGE_THROTTLE);
      }
    },
    [onCapabilityChange]
  );

  if (!booleanCapability || !capability) {
    console.warn('🐛 A capability group needs both of its capabilities', booleanCapability?.id, capability?.id);
    return null;
  }

  const booleanLabel = booleanCapability.value === true ? booleanLabels?.on : booleanLabels?.off;

  return (
    <FormGroup label={getCapabilityLabel(capability.id, t)} description={booleanLabel || getDescription(capability, value, t)} labelPosition="top">
      <div className={style.row}>
        <CapabilityToggle capability={booleanCapability} onCapabilityChange={onCapabilityChange} t={t} />
        <div className={style.control}>
          <CapabilityControl capability={capability} value={value} onChange={handleChange} t={t} />
        </div>
      </div>
    </FormGroup>
  );
});

export default CameraCapabilityItemGroup;
