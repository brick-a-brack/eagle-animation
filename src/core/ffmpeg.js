import ffmpeg from 'ffmpeg-static';
import { join } from 'path';
import { execFile } from 'child_process';
import { remote } from 'electron';

import { DEFAULT_FPS } from '../config';

// eslint-disable-next-line
const ffmpegPath = ((ffmpeg.path) ? join(remote.app.getAppPath().replace('app.asar', 'app.asar.unpacked'), 'node_modules/ffmpeg-static/', ffmpeg.path) : false);

const profiles = {
    h264: {
        codec: 'libx264',
        extension: 'mp4',
        pix_fmt: 'yuv420p',
        preset: 'veryslow'
    },
    av1: {
        codec: 'libaom-av1',
        extension: 'mkv',
        pix_fmt: 'yuv420p'
    },
    hevc: {
        codec: 'libx265',
        extension: 'mp4',
        pix_fmt: 'yuv420p',
        preset: 'veryslow'
    },
    prores: {
        codec: 'prores_ks',
        extension: 'mov',
        pix_fmt: 'yuva444p10le'
    },
    webm: {
        codec: 'libvpx',
        extension: 'webm',
        pix_fmt: 'yuv420p'
    },
    xvid: {
        codec: 'libxvid',
        extension: 'avi',
        pix_fmt: 'yuv420p'
    },
    'png-video': {

    }
};
/*
        -codec prores_ks
        -pix_fmt yuva444p10le
        -qscale:v 1
        -quant_mat 4
        -alpha_bits 8
        -bits_per_mb 2400
        -f mov
        -vendor ap10
*/

export const generate = (
    width = 1920,
    height = 1080,
    directory = false,
    outputProfil = false,
    outputFile = false,
    fps = 24
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
    args.push('-r', (parseInt(fps, 10) > 0 && parseInt(fps, 10) <= 120) ? parseInt(fps, 10) : DEFAULT_FPS);

    // Add all images in the path
    args.push('-i', 'img-%06d.jpg');

    // AutoScale input to ratio
    args.push('-vf', `scale=w=${width}:h=${height}:force_original_aspect_ratio=1,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`);

    // Codec
    args.push('-c:v', profile.codec);

    // Bitrate
    args.push('-b:v', '128M');

    // Preset
    if (profile.preset)
        args.push('-preset', profile.preset);

    // Fast start for streaming
    if (profile.extension === 'mp4')
        args.push('-movflags', '+faststart');

    // Output framerate
    args.push('-r', '60');

    // Pixel mode
    args.push('-pix_fmt', profile.pix_fmt);

    // Output file
    args.push(`${outputFile}`);

    console.log(`ffmpeg.exe ${args.map(e => (`"${e}"`)).join(' ')}`);

    // Exec
    const exec = execFile(ffmpegPath, args, { cwd: directory });

    exec.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    exec.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    exec.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        resolve();
    });

    exec.on('exit', (code) => {
        console.log(`child process exited with code ${code}`);
        resolve();
    });
});
