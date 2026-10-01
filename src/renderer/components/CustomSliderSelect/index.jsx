import CustomSlider from '@components/CustomSlider';

const CustomSliderSelect = ({ options = [], value, onChange = () => {}, ...rest }) => {
  const currentValue = options.findIndex((option) => option.value === value);

  return <CustomSlider {...rest} step={1} min={0} max={options.length - 1} value={currentValue >= 0 ? currentValue : 0} onChange={(index) => onChange(options[index])} />;
};

export default CustomSliderSelect;
