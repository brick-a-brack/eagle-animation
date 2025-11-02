export const getPictureLink = (url = '', args = {}) => {
  if (!url) {
    return null;
  }

  const f = args.f ? args.f : 'jpg';
  const q = args.q ? Number(args.q) : f === 'webp' ? 70 : f === 'jpg' ? 75 : 100;

  const params = new URLSearchParams({
    ...(args.w ? { w: Math.round(args.w) } : {}),
    ...(args.h ? { h: Math.round(args.h) } : {}),
    ...(args.m ? { m: args.m } : {}),
    ...(f ? { f } : {}),
    ...(q ? { q } : {}),
  }).toString();

  return `${url}?${params}`;
};
