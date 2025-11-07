import Slider from 'rc-slider';

import 'rc-slider/assets/index.css';

const CustomSliderSelect = ({ options = [], value, onChange = () => {}, isDisabled = false, ...rest }) => {
  const currentValue = options.findIndex((option) => option.value === value);

  return (
    <Slider
      keyboard={false}
      {...rest}
      step={1}
      min={0}
      max={options.length - 1}
      value={currentValue >= 0 ? currentValue : 0}
      style={{ maxWidth: '300px', ...(isDisabled ? { cursor: 'not-allowed', opacity: '0.2' } : {}) }}
      styles={{
        track: {
          backgroundColor: '#7f8186',
          height: '10px',
        },
        rail: {
          backgroundColor: '#7f8186',
          height: '10px',
        },
        handle: {
          backgroundColor: '#486ee5',
          height: '24px',
          width: '24px',
          marginLeft: '-12px',
          marginTop: '-7px',
          boxShadow: 'none',
          borderColor: 'rgba(0,0,0,0)',
          opacity: '1',
          transform: 'none',
          ...(isDisabled ? { cursor: 'not-allowed' } : {}),
        },
      }}
      onChange={(v) => onChange(options[v])}
    />
  );
};

export default CustomSliderSelect;
