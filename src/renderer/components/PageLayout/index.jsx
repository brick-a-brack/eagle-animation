import * as style from './style.module.css';

const PageLayout = ({ children, hasMobileLeftBar = false, hasMobileRightBar = false }) => {
  return <div className={`${style.pageLayout} ${hasMobileLeftBar ? style.hasMobileLeftBar : ''} ${hasMobileRightBar ? style.hasMobileRightBar : ''}`}>{children}</div>;
};

export default PageLayout;
