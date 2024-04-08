import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const CustomSlider = ({ step, min, max, value, onChange = () => {}, ...rest }) => (
  <Slider
    keyboard={false}
    {...rest}
    step={step}
    min={min}
    max={max}
    value={value}
    style={{ maxWidth: '300px' }}
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
      },
    }}
    onChange={onChange}
  />
);

export default CustomSlider;
