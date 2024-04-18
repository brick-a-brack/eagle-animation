import { execFile } from 'child_process';
import ffmpegExec from 'ffmpeg-static';

const ffmpegPath = ffmpegExec ? ffmpegExec.replace('app.asar', 'app.asar.unpacked') : false;

export const ffmpeg = (args = [], directory = false, onData = () => {}) => {
  return new Promise((resolve) => {
    console.log(`🎞️ FFmpeg ${args.map((e) => `"${e}"`).join(' ')}`);

    // Exec
    const exec = execFile(ffmpegPath, args, directory ? { cwd: directory } : {});

    exec.stdout.on('data', (data) => {
      onData(data);
    });

    exec.stderr.on('data', (data) => {
      onData(data);
    });

    exec.on('close', (code) => {
      console.log(`🎞️ FFmpeg exited with code ${code}`);
      resolve();
    });

    exec.on('exit', (code) => {
      console.log(`🎞️ FFmpeg exited with code ${code}`);
      resolve();
    });
  });
};
