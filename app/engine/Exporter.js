import ffmpeg from 'ffmpeg-static';
import { execFile } from 'child_process';
import { remote } from 'electron';
import path from 'path';

const { dialog } = remote;
const ffmpegPath = ((ffmpeg.path) ? path.join(remote.app.getAppPath().replace('app.asar', 'app.asar.unpacked'), 'node_modules/ffmpeg-static/', ffmpeg.path) : false);

const profiles = {
    "h264": {
        codec: 'libx264',
        extension: 'mp4',
        pix_fmt: 'yuv420p',
        preset: 'fast',
    },
    "hevc" : {
        codec: 'libx265',
        extension: 'mp4',
        pix_fmt: 'yuv420p',
        preset: 'fast',
    },
    "prores": {
        codec: 'prores_ks',
        extension: "mov",
        pix_fmt: 'yuva444p10le',
    },
    "webm": {
        codec: 'libvpx',
        extension: "webm",
        pix_fmt: 'yuv420p',
    },
    "xvid": {
        codec: 'libxvid',
        extension: "avi",
        pix_fmt: 'yuv420p',
    }
}
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

class Exporter {

	constructor() {
        this.project = false; // Project

        this.filename = false; // File to output

        this.profile = false; // Profile
    }

    setProject(project) {
        this.project = project;
    }

    setOutput(filename) {
        this.filename = filename;
    }

    setProfile(profile) {
        this.profile = profile;
    }

    savePrompt() {
        return new Promise((resolve, reject) => {
			let tmp = dialog.showSaveDialog();
            this.filename = tmp;
            resolve();
		});
    }

    async generate() {

        if (this.project === false) {
            console.log('PROJECT NOT DEFINED');
            return;
        }

        if (ffmpegPath === false) {
            console.log('FFMPEG NOT AVAILABLE');
            return;
        }

        let width = await this.project.getMaxWidth();
        let height = await this.project.getMaxHeight();
        if (width === false || height === false) {
            console.log('ERROR WHILE GETTING RESOLUTION');
            return;
        }

        let profile = profiles[this.profile];
        if (typeof(profile) === 'undefined') {
            console.log('UNKNOWN PROFILE');
            return;
        }

        if (this.outputFile === false) {
            console.log('OUTPUT UNDEFINED');
            return;
        }

        let fps = this.project.getFramerate();

        // Default -y to overwite
        let args = [ '-y'];

        // Input framerate
        args.push('-r', fps);

        // Add images
        args.push('-i', this.project.getDirectory() + '/0/%01d.jpg');

        // AutoScale input to ratio
        args.push('-vf', 'scale=w=' + width + ':h=' + height + ':force_original_aspect_ratio=1,pad=' + width + ':' + height + ':(ow-iw)/2:(oh-ih)/2');

        // Codec
        args.push('-c:v', profile.codec);

        // Bitrate
        args.push('-b:v', '50M');

        // Preset
        if (typeof(profile.preset) !== 'undefined') {
            args.push('-preset', profile.preset);
        }

        // Output framerate
        args.push('-r', fps);

        // Pixel mode
        args.push('-pix_fmt', profile.pix_fmt);

        // Output file
        args.push(this.filename + '.' + profile.extension);

        // Exec
        const exec = execFile(ffmpegPath, args);

        exec.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        exec.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });

        exec.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });

        exec.on('exit', (code) => {
            console.log(`child process exited with code ${code}`);
        });
    }
}

export default Exporter;