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

export const getFFmpegArgs = (width = 1920, height = 1080, encodingProfile = false, outputFile = false, fps = 24, opts = {}) => {
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
  const args = ['-y'];

  // Input framerate
  args.push('-r', `${Number(fps) > 0 && Number(fps) <= 240 ? Number(fps) : 12}`);

  // Add all images in the path
  args.push('-i', 'frame-%06d.jpg');

  // Output resolution
  const customHeight = opts.resolution && opts.resolution !== 'original' ? `,scale=w=-2:h=${opts.resolution}:force_original_aspect_ratio=1` : '';

  // AutoScale input to ratio
  args.push('-vf', `scale=w=${width}:h=${height}:force_original_aspect_ratio=1,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2${customHeight}`);

  // Codec
  args.push('-c:v', profile.codec);

  // Bitrate
  //args.push('-b:v', '128M');

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
  args.push(`${outputFile}`);

  return args;
};
