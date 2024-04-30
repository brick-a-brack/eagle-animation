import * as style from './style.module.css';

const Text = ({ children, center = false }) => {
  return <div className={`${style.text} ${center ? style.center : ''}  ${center ? style.center : ''}`}>{children}</div>;
};

export default Text;
