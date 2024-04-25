import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export const getFFmpeg = async (callback = () => {}) => {
  const baseURL = '/';
  const ffmpeg = new FFmpeg();
  ffmpeg.on('log', callback);
  ffmpeg.on('error', callback);
  ffmpeg.on('progress', callback);
  await ffmpeg
    .load({
      coreURL: await toBlobURL(`${baseURL}ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}ffmpeg-core.wasm`, 'application/wasm'),
    })
    .catch(console.error);
  return ffmpeg;
};
