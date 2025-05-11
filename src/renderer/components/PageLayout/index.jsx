import * as style from './style.module.css';

const PageLayout = ({ children }) => {
  return <div className={style.pageLayout}>{children}</div>;
};

export default PageLayout;
