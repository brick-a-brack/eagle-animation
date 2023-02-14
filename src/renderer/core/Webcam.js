
class Webcam {
    constructor(deviceId = null) {
        this.stream = false;
        this.deviceId = deviceId;

        this.video = false;
        this.width = false;
        this.height = false;
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

            console.log('CAMERA INIT', this.video, this.stream)

            // window.DEVICE = this.stream;

            // Launch preview
            if (this.video) {
                this.video.srcObject = this.stream;
                this.video.addEventListener('canplay', () => {
                    this.video.play();
                    this.width = this.video.videoWidth;
                    this.height = this.video.videoHeight;
                    resolve();
                });

                console.log('CAMERA OK')
            }
        });
    }

    init(video = false, settings = {}) {
        this.video = video;
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

    getPictureWidth() {
        return this.width;
    }

    getPictureHeight() {
        return this.height;
    }

    mergePictures(picturesCanvas = []) {
        const width = this.getPictureWidth();
        const height = this.getPictureHeight();
        const imageData = picturesCanvas.map(canvas => canvas.getContext('2d', { alpha: false }).getImageData(0, 0, width, height).data)
        const nbImageData = imageData.length;
        const dataArray = new Uint8ClampedArray(width * height * 4);

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const redIdx = y * (width * 4) + x * 4;
                const greenIdx = y * (width * 4) + x * 4 + 1;
                const blueIdx = y * (width * 4) + x * 4 + 2;
                const alphaIdx = y * (width * 4) + x * 4 + 3;

                let redValue = 0;
                let greenValue = 0;
                let blueValue = 0;

                for (let i = 0; i < nbImageData; i++) {
                    redValue += imageData[i][redIdx];
                    greenValue += imageData[i][greenIdx];
                    blueValue += imageData[i][blueIdx];
                }
                dataArray[redIdx] = ~~(redValue / nbImageData);
                dataArray[greenIdx] = ~~(greenValue / nbImageData);
                dataArray[blueIdx] = ~~(blueValue / nbImageData);
                dataArray[alphaIdx] = 255;
            }
        }

        const imgValues = new ImageData(dataArray, width, height)

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.putImageData(imgValues, 0, 0, 0, 0, width, height);

        return canvas;
    }

    async takePictureToCanvas() {
        if (!this.stream) {
            console.error('Camera is not correctly initialized!')
            return;
        }

        const imageCapture = new ImageCapture(this.stream.getVideoTracks()[0]);
        const bitmap = await imageCapture.takePhoto({}).then(blob => createImageBitmap(blob))
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d', { alpha: false });
        context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);

        return canvas;
    }

    async takePicture(nbFramesToTake = 1) {
        const canvasList = [];

        for (let i = 0; i < nbFramesToTake || i < 1; i++) {
            const data = await this.takePictureToCanvas();
            if (data) {
                canvasList.push(data);
            }
        }

        const finalCanvas = (canvasList.length > 1) ? await this.mergePictures(canvasList) : canvasList?.[0];
        const data = finalCanvas.toDataURL('image/jpeg');
        return Buffer.from(data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    }

    async stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
                track.enabled = false
            });
        }
    }
}

export default Webcam;
