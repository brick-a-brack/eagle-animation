// The repo's own app captures, docs/screenshots/<format>_<scene>.png. A capture
// with no format prefix would be used as a fallback for every format.
const modules = import.meta.glob('../../docs/screenshots/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const SCREENSHOT_URLS = Object.fromEntries(Object.entries(modules).map(([path, url]) => [path.match(/([^/]+)\.[a-z]+$/)[1], url]));

const images = {};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Cannot load image ${src}`));
    img.src = src;
  });

export async function loadScreenshots() {
  await Promise.all(
    Object.entries(SCREENSHOT_URLS).map(async ([key, url]) => {
      try {
        images[key] = await loadImage(url);
      } catch {
        console.warn('Missing screenshot', key);
      }
    })
  );
  return images;
}

export const screenFor = (format, scene) => images[`${format}_${scene}`] || images[scene];
