class Webcam {
    constructor() {
        this.stream = false;
        this.imageCapture = false;

        this.video = false;
        this.width = false;
        this.height = false;
    }

    init(video = false) {
        console.log('WEBCAM: INIT', video);
        return new Promise((resolve, reject) => {
            navigator.mediaDevices.getUserMedia({
                video: {
                    optional: [
                        { minWidth: 160 },
                        { minWidth: 320 },
                        { minWidth: 640 },
                        { minWidth: 1024 },
                        { minWidth: 1280 },
                        { minWidth: 1920 },
                        { minWidth: 2560 },
                        { minWidth: 3840 },
                        { minWidth: 4920 }
                    ]
                },
                audio: false
            }).then((stream) => {
                this.stream = stream;
                this.video = video;
                const track = this.stream.getVideoTracks()[0];
                this.imageCapture = new ImageCapture(track);
                if (this.video) {
                    this.video.srcObject = this.stream;
                    this.video.addEventListener('canplay', () => {
                        this.video.play();
                        this.width = this.video.videoWidth;
                        this.height = this.video.videoHeight;
                        console.log('WEBCAM: OK');
                        resolve();
                    });
                } else
                    reject();
            }).catch((err) => {
                console.log('WEBCAM: Failed to initialize');
                reject(err);
            });
        });
    }

    isInitialized() {
        return (!(this.width === false));
    }

    getPreviewWidth() {
        return (this.width);
    }

    getPreviewHeight() {
        return (this.height);
    }

    getPictureWidth() {
        return (this.width);
    }

    getPictureHeight() {
        return (this.height);
    }

    takePicture() {
        return new Promise((resolve, reject) => {
            this.imageCapture.grabFrame().then((bitmap) => {
                const canvas = document.createElement('canvas');
                canvas.width = bitmap.width;
                canvas.height = bitmap.height;
                const context = canvas.getContext('2d');
                context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
                const data = canvas.toDataURL('image/jpeg');
                resolve(Buffer.from(data.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
            }).catch((err) => {
                reject(err);
            });
        });
    }
}

export default Webcam;
