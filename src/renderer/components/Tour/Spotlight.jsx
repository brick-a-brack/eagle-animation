import * as style from './style.module.css';

// The dimmed overlay with a transparent cut-out around the highlighted element.
// `hole` is null for centered steps, in which case the whole viewport is dimmed.
const Spotlight = ({ hole, interactive, vw, vh }) => {
  if (!hole) {
    return <div className={style.panel} style={{ inset: 0 }} />;
  }
  return (
    <>
      <div className={style.panel} style={{ height: `${hole.top}px`, left: 0, top: 0, width: `${vw}px` }} />
      <div className={style.panel} style={{ height: `${hole.bottom - hole.top}px`, left: 0, top: `${hole.top}px`, width: `${hole.left}px` }} />
      <div className={style.panel} style={{ height: `${hole.bottom - hole.top}px`, left: `${hole.right}px`, top: `${hole.top}px`, width: `${vw - hole.right}px` }} />
      <div className={style.panel} style={{ height: `${vh - hole.bottom}px`, left: 0, top: `${hole.bottom}px`, width: `${vw}px` }} />
      <div
        className={`${style.ring} ${interactive ? style.ringInteractive : ''}`}
        style={{ height: `${hole.bottom - hole.top}px`, left: `${hole.left}px`, top: `${hole.top}px`, width: `${hole.right - hole.left}px` }}
      />
    </>
  );
};

export default Spotlight;
