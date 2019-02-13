// Video duration
export const VIDEO_DURATION = 7;

// Allowed resolutions
export const ALLOWED_RESOLUTIONS = ['1280x720', '1920x1080', '3840x2160'];

// Output parameters
export const OUTPUT_PARAMETERS = {
    "h264": {
        codec: 'libx264',
        extension: 'mp4',
        pix_fmt: 'yuv420p',
        preset: 'fast',
    },
    "hevc": {
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
    },
    "png": {
        codec: 'png',
        extension: "mp4",
        pix_fmt: '',
    }
};
