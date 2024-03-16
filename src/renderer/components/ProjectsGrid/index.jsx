import * as style from './style.module.css';

const ProjectsGrid = ({ children }) => {
  return (
    <div className={style.wrapper}>
      {children}
      {Array.apply(null, { length: 60 }) // eslint-disable-line prefer-spread
        .map(Number.call, Number)
        .map((_, key) => (
          <div
            key={key} // eslint-disable-line react/no-array-index-key
            className={style.fakeBox}
          />
        ))}
    </div>
  );
};

export default ProjectsGrid;
