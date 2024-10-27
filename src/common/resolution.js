import resizeToFit from 'intrinsic-scale';

export const floorResolutionValue = (v) => (v ? (Math.floor(v) % 2 !== 0 ? Math.floor(v) + 1 : Math.floor(v)) : v);
export const floorResolution = (v) => (v ? { width: v.width ? floorResolutionValue(v.width) : v.width, height: v.height ? floorResolutionValue(v.height) : v.height } : v);

export const getBestResolution = (frames, resolutions = [], ratio = null) => {
  if (!frames || frames.length === 0 || !resolutions || resolutions.length === 0) {
    return null;
  }
  const framesResolutions = frames
    .map((e, i) => ({ ...e, resolution: resolutions?.[i] || null }))
    .filter((frame) => !frame.deleted && !frame.hidden)
    .map((e) => e.resolution);
  let outputResolution = null;
  for (const resolution of framesResolutions) {
    if (!resolution) {
      continue;
    }
    if (!outputResolution || resolution.height > outputResolution.height) {
      outputResolution = resolution;
    }
  }
  if (ratio !== null) {
    const containedResolution = resizeToFit('contain', { width: ratio, height: 1 }, outputResolution);
    return { width: containedResolution.width, height: containedResolution.height };
  }

  return outputResolution;
};
