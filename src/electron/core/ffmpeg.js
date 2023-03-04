import ffmpeg from 'ffmpeg-static';
import { execFile } from 'child_process';

// eslint-disable-next-line
const ffmpegPath = ffmpeg ? ffmpeg.replace('app.asar', 'app.asar.unpacked') : false;

const profiles = {
    h264: {
        codec: 'libx264',
        extension: 'mp4',
        pix_fmt: 'yuv420p',
        preset: 'faster'
    },
    hevc: {
        codec: 'libx265',
        extension: 'mp4',
        pix_fmt: 'yuv420p',
        preset: 'faster'
    },
    prores: {
        codec: 'prores_ks',
        extension: 'mov',
        pix_fmt: 'yuva444p10le'
    },
    vp8: {
        codec: 'libvpx',
        extension: 'webm',
        pix_fmt: 'yuv420p'
    },
    vp9: {
        codec: 'libvpx-vp9',
        extension: 'webm',
        pix_fmt: 'yuv420p'
    },
};

export const getProfile = (format) => {
   return  profiles[format] || null;
}

export const generate = (
    width = 1920,
    height = 1080,
    directory = false,
    outputProfil = false,
    outputFile = false,
    fps = 24,
    opts = {},
) => new Promise((resolve, reject) => {
    if (typeof (profiles[outputProfil]) === 'undefined')
        return reject(new Error('UNKNOWN PROFILE'));

    // Get profile
    const profile = profiles[outputProfil];

    // Invalid output file
    if (outputFile === false)
        return reject(new Error('UNDEFINED_OUTPUT'));

    // Default -y to overwite
    const args = ['-y'];

    // Input framerate
    args.push('-r', (parseInt(fps, 10) > 0 && parseInt(fps, 10) <= 240) ? parseInt(fps, 10) : 12);

    // Add all images in the path
    args.push('-i', 'frame-%06d.jpg');

    // Output resolution
    const customHeight = (opts.resolution && opts.resolution !== 'original') ? `,scale=w=-2:h=${opts.resolution}:force_original_aspect_ratio=1` : '';

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
        args.push('-r', `${parseInt(opts.customOutputFramerateNumber, 10)}`);
    }

    // Pixel mode
    args.push('-pix_fmt', profile.pix_fmt);

    // Prores flags
    if (outputProfil === 'prores') {
        args.push(
            '-profile:v', '3',
            '-vendor', 'apl0',
            '-bits_per_mb', '4000',
            '-f', 'mov',
        );
    }

    // Output file
    args.push(`${outputFile}`);

    console.log(`ffmpeg.exe ${args.map(e => (`"${e}"`)).join(' ')}`);

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
