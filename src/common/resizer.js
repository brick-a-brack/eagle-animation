export const parseResizeArguments = (params) => {
  const w = params.get('w') || params.get('width') || null;
  const h = params.get('h') || params.get('height') || null;
  const f = params.get('f') || params.get('format') || null;
  const q = params.get('q') || params.get('quality') || null;
  const mode = params.get('m') || params.get('mode') || null; // fit or cover
  const infos = params.get('i') || params.get('infos') || null;

  return {
    w: w ? parseInt(w, 10) : null,
    h: h ? parseInt(h, 10) : null,
    f: ['jpg', 'jpeg', 'webp', 'avif'].includes(f?.toLowerCase() || '') ? f?.toLowerCase() : null,
    q: infos !== 'json' ? q ? Math.max(0, Math.min(100, parseInt(q, 10))) : null : null,
    m: ['cover', 'contain'].includes(mode?.toLowerCase() || '') ? mode?.toLowerCase() : null,
    i: infos === 'json' ? 'json' : null,
  };
};
