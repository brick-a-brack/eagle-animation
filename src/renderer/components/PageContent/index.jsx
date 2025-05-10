import * as style from './style.module.css';

const PageContent = ({ children }) => {
  return <div className={style.pageContent}>{children}</div>;
};

export default PageContent;
