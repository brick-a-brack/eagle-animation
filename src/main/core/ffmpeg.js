import ffmpeg from 'ffmpeg-static';
import { execFile } from 'child_process';
import { getFFmpegArgs } from '../../common/ffmpeg';

// eslint-disable-next-line
const ffmpegPath = ffmpeg ? ffmpeg.replace('app.asar', 'app.asar.unpacked') : false;

export const generate = (width = 1920, height = 1080, directory = false, outputProfil = false, outputFile = false, fps = 24, opts = {}) => {
  return new Promise((resolve, reject) => {
    const args = getFFmpegArgs(width, height, outputProfil, outputFile, fps, opts).catch(reject);

    console.log(`ffmpeg.exe ${args.map((e) => `"${e}"`).join(' ')}`);

    // Exec
    const exec = execFile(ffmpegPath, args, { cwd: directory });

    let std = '';

    exec.stdout.on('data', (data) => {
      std += data;
    });

    exec.stderr.on('data', (data) => {
      std += data;
    });

    exec.on('close', (code) => {
      console.log(std);
      console.log(`child process exited with code ${code}`);
      resolve();
    });

    exec.on('exit', (code) => {
      console.log(std);
      console.log(`child process exited with code ${code}`);
      resolve();
    });
  });
};
