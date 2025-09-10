const profiles = {
  h264: {
    codec: 'libx264',
    extension: 'mp4',
    pix_fmt: 'yuv420p',
    preset: 'faster',
  },
  hevc: {
    codec: 'libx265',
    extension: 'mp4',
    pix_fmt: 'yuv420p',
    preset: 'faster',
  },
  prores: {
    codec: 'prores_ks',
    extension: 'mov',
    pix_fmt: 'yuva444p10le',
  },
  vp8: {
    codec: 'libvpx',
    extension: 'webm',
    pix_fmt: 'yuv420p',
  },
  vp9: {
    codec: 'libvpx-vp9',
    extension: 'webm',
    pix_fmt: 'yuv420p',
  },
};

export const getEncodingProfile = (format) => {
  return profiles[format] || null;
};

export const parseFFmpegLogs = (logPart, nbFrames = 0, outputFramerate = null, onProgress = () => {}) => {
  (logPart || '').split('\n').forEach((line) => {
    const currentFrame = line?.split('fps=')?.[0]?.split('frame=')?.[1]?.replaceAll(' ', '')?.replaceAll('\t', '') || null;
    if (currentFrame) {
      let divider = outputFramerate === null ? nbFrames : nbFrames * outputFramerate;
      divider = divider <= 0 ? 1 : divider;
      const value = Number(currentFrame) / divider;
      if (value) {
        onProgress(value);
      }
    }
  });
};

export const getFFmpegArgs = (encodingProfile = false, outputFile = false, fps = 24, opts = {}) => {
  if (typeof profiles[encodingProfile] === 'undefined') {
    throw new Error('UNKNOWN_PROFILE');
  }

  // Get profile
  const profile = profiles[encodingProfile];

  // Invalid output file
  if (outputFile === false) {
    throw new Error('UNDEFINED_OUTPUT');
  }

  // Default -y to overwite
  const args = ['-y', '-stats_period', '0.1'];

  // Input framerate
  args.push('-r', `${Number(fps) > 0 && Number(fps) <= 240 ? Number(fps) : 12}`);

  // Add all images in the path
  args.push('-i', 'frame-%06d.jpg');

  // Codec
  args.push('-c:v', profile.codec);

  // Preset
  if (profile.preset) {
    args.push('-preset', profile.preset);
  }

  // Fast start for streaming
  if (profile.extension === 'mp4') {
    args.push('-movflags', '+faststart');
  }

  // Custom output framerate
  if (opts.customOutputFramerate && opts.customOutputFramerateNumber) {
    args.push('-r', `${Number(opts.customOutputFramerateNumber)}`);
  }

  // Pixel mode
  args.push('-pix_fmt', profile.pix_fmt);

  // Prores flags
  if (encodingProfile === 'prores') {
    args.push('-profile:v', '3', '-vendor', 'apl0', '-bits_per_mb', '4000', '-f', 'mov');
  }

  // Output file
  const hasExtension = outputFile.toLowerCase().endsWith(`.${profile.extension}`);
  args.push(`${outputFile}${hasExtension ? '' : `.${profile.extension}`}`);

  return args;
};
