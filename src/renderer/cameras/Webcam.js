const allowedCapabilities = [
    'focusMode',
    'focusDistance',
    'brightness',
    'contrast',
    /*teinte*/
    'saturation',
    'sharpness',
    /* gamma correction */
    'whiteBalanceMode',
    'colorTemperature',
    'exposureMode',
    'exposureCompensation',
    'exposureTime',
    'zoom',
    'tilt',
    'pan'
];

const defaultCapabilities = {
    'brightness': 128,
    'contrast': 128,
    'colorTemperature': 2200,
    'exposureCompensation': 0,
    'exposureMode': 'continuous',
    'exposureTime': 625,
    'focusDistance': 0,
    'focusMode': 'continuous',
    'pan': 0,
    'resizeMode': 'none',
    'saturation': 128,
    'sharpness': 128,
    'tilt': 0,
    'whiteBalanceMode': 'continuous',
    'zoom': 100,
};

class Webcam {
    constructor(deviceId = null) {
        this.stream = false;
        this.deviceId = deviceId;

        this.video = false;
        this.width = false;
        this.height = false;

        this.capabilitiesState = {};
        this.previousCapabilitiesState = {};
        this.capabilities = null;

        setInterval(async () => {
            if (!this.stream) {
                return;
            }

            const mediaStreamTrack = this.stream.getVideoTracks()[0];
            const settings = mediaStreamTrack.getSettings();

            for (const cap of allowedCapabilities) {
                if (settings[cap] !== this.capabilitiesState[cap] && this.previousCapabilitiesState[cap] !== this.capabilitiesState[cap]) {
                    const mediaStreamTrack = this.stream.getVideoTracks()[0];
                    const toApply = [{
                        [cap]: this.capabilitiesState[cap],
                        ...(cap === 'focusMode' ? { focusDistance: settings.focusDistance } : {}),
                        ...(cap === 'exposureMode' ? {
                            exposureCompensation: settings.exposureCompensation,
                            exposureTime: settings.exposureTime,
                        } : {}),
                        ...(cap === 'whiteBalanceMode' ? { colorTemperature: settings.colorTemperature } : {}),
                        ...(cap === 'zoom' ? { pan: settings.pan, tilt: settings.tilt } : {}),
                    }];
                    console.log('[CAMERA]', 'Apply setting', cap, this.capabilitiesState[cap]);
                    mediaStreamTrack.applyConstraints({
                        advanced: toApply
                    }).catch(console.error);
                }
            }

            this.previousCapabilitiesState = { ...this.capabilitiesState };
        }, 100);
    }

    get id() {
        return this?.context?.id || null;
    }

    initPreview() {
        return new Promise(async (resolve) => { // eslint-disable-line no-async-promise-executor
            // Get preview stream
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: this.deviceId ? { exact: this.deviceId } : undefined,
                    width: 99999, height: 99999, // Force to get the best quality available
                    frameRate: this.settings?.forceMaxQuality ? undefined : 15,
                },
                audio: false
            }).catch((err) => console.error('failed', err));

            console.log('[CAMERA]', 'Init', this.video, this.stream)

            window.DEVICE = this.stream;

            this.capabilities = this.stream?.getVideoTracks()?.[0] ? this.stream.getVideoTracks()[0].getCapabilities() : [];
            this.capabilitiesState = { ...defaultCapabilities };

            // Launch preview
            if (this.video) {
                this.video.srcObject = this.stream;
                this.video.addEventListener('canplay', () => {
                    this.video.play();
                    this.width = this.video.videoWidth;
                    this.height = this.video.videoHeight;
                    resolve();
                });

                console.log('[CAMERA]', 'Ready')
            }
        });
    }

    resetCapabilities() {
        this.capabilitiesState = { ...defaultCapabilities };
        return allowedCapabilities.filter(e => this.capabilities[e]).map(e => ({
            id: e,
            type: ['exposureMode', 'focusMode', 'resizeMode', 'whiteBalanceMode'].includes(e) ? 'SWITCH' : 'RANGE',
            ...this.capabilities[e],
            value: defaultCapabilities[e],
        }))
    }

    applyCapability(key, value) {
        if (!this.stream || !this.capabilities) {
            return null;
        }

        this.capabilitiesState[key] = value;
    }

    getCapabilities() {
        if (!this.stream || !this.capabilities) {
            return [];
        }

        const mediaStreamTrack = this.stream.getVideoTracks()[0]
        const settings = mediaStreamTrack.getSettings();
        //const supported = navigator.mediaDevices.getSupportedConstraints();

        return allowedCapabilities.filter(e => this.capabilities[e]).map(e => ({
            id: e,
            type: ['exposureMode', 'focusMode', 'resizeMode', 'whiteBalanceMode'].includes(e) ? 'SWITCH' : 'RANGE',
            ...this.capabilities[e],
            value: settings[e],
        }))
    }

    connect({ videoDOM } = {videoDOM : false}, settings = {}) {
        this.video = videoDOM;
        this.settings = settings;
        return this.initPreview();
    }

    isInitialized() {
        return this.width !== false;
    }

    getPreviewWidth() {
        return this.width;
    }

    getPreviewHeight() {
        return this.height;
    }

    async takePicture() {
        if (!this.stream) {
            console.error('[Camera]', 'Not correctly initialized!')
            return;
        }

        const imageCapture = new ImageCapture(this.stream.getVideoTracks()[0]);
        const bitmap = (await imageCapture.takePhoto({}).then(blob => createImageBitmap(blob)).catch(() => null)) || (await imageCapture.grabFrame({}).catch(() => null))

        if (!bitmap) {
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d', { alpha: false });
        context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
        //const context = canvas.getContext("bitmaprenderer");
        //context?.transferFromImageBitmap(bitmap);
        return canvas;
    }

    async disconnect() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
                track.enabled = false
            });
        }
    }
}

class WebcamBrowser {
    static async getCameras() {
        try {
            const streams = await navigator.mediaDevices.enumerateDevices()
            return streams.filter(stream => stream.kind === 'videoinput').map((stream) => ({
                deviceId: stream.deviceId,
                type: 'WEB',
                module: 'WEBCAM',
                label: stream.label,
            }));

        } catch (err) {
            console.error(err);
        }
        return [];
    }
}

export const Camera = Webcam;
export const CameraBrowser = WebcamBrowser;