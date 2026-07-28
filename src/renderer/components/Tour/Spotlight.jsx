import * as style from './style.module.css';

// The dimmed overlay with a transparent cut-out around the highlighted element.
// `hole` is null for centered steps, in which case the whole viewport is dimmed.
// Every layer (panels and ring) swallows pointer events so nothing behind the
// tour — not even the highlighted element — is clickable or hoverable.
const Spotlight = ({ hole, vw, vh }) => {
  if (!hole) {
    return <div className={style.panel} style={{ inset: 0 }} />;
  }

  // The hole can extend off-screen (partially visible target). The dimming panels
  // must stay within the viewport, while the ring keeps the real (unclamped)
  // bounds so it wraps the whole element even where it overflows the window.
  const left = Math.max(hole.left, 0);
  const top = Math.max(hole.top, 0);
  const right = Math.min(hole.right, vw);
  const bottom = Math.min(hole.bottom, vh);

  return (
    <>
      <div className={style.panel} style={{ height: `${top}px`, left: 0, top: 0, width: `${vw}px` }} />
      <div className={style.panel} style={{ height: `${bottom - top}px`, left: 0, top: `${top}px`, width: `${left}px` }} />
      <div className={style.panel} style={{ height: `${bottom - top}px`, left: `${right}px`, top: `${top}px`, width: `${vw - right}px` }} />
      <div className={style.panel} style={{ height: `${vh - bottom}px`, left: 0, top: `${bottom}px`, width: `${vw}px` }} />
      <div className={style.ring} style={{ height: `${hole.bottom - hole.top}px`, left: `${hole.left}px`, top: `${hole.top}px`, width: `${hole.right - hole.left}px` }} />
    </>
  );
};

export default Spotlight;
