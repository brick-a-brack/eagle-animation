let webp = null;
let avif = null;

const detectWebpSupport = async () => {
  const elem = document.createElement('canvas');
  // eslint-disable-next-line no-extra-boolean-cast
  if (!!(elem.getContext && elem.getContext('2d'))) {
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
};

const detectAvifSupport = () =>
  new Promise((resolve) => {
    const image = new Image();
    image.onerror = () => resolve(false);
    image.onload = () => resolve(true);
    image.src =
      'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });

detectAvifSupport().then((v) => (avif = v));
detectWebpSupport().then((v) => (webp = v));

export const getPictureLink = (url = '', args = {}, alpha = false) => {
  if (!url) {
    return null;
  }

  const f = args.f ? args.f : 'jpg';
  const q = args.q ? Number(args.q) : (f === 'webp' ? 70 : f === 'jpg' ? 75 : 100);

  const params = new URLSearchParams({
    ...(args.w ? { w: Math.round(args.w) } : {}),
    ...(args.h ? { h: Math.round(args.h) } : {}),
    ...(args.m ? { m: args.m } : {}),
    ...(f ? { f } : {}),
    ...(q ? { q } : {}),
  }).toString();

  return `${url}?${params}`;
};
