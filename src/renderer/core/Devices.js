import Webcam from './Webcam';

class Devices {
    constructor() {
        this.currentId = null;
        this.currentCamera = null;
    }

    async list() {
        const streams = await navigator.mediaDevices.enumerateDevices()
        return streams.filter(stream => stream.kind === 'videoinput').map((stream, i) => ({
            id: `webcamera-${stream.deviceId}`,
            label: `[${i}] ${stream.label}`,
        }));
    }

    async init() {
        const list = await this.list();
        if (!this.currentId || !list.some(camera => camera.id === this.currentId)) {
            this.currentId = list?.[0]?.id || null
        }
    }

    async setMainCamera(id) {
        if (this.currentId === id) {
            return;
        }

        this.currentId = id;
        if (this.currentCamera) {
            this.currentCamera.stop();
        }
        this.currentCamera = null;
    }

    async stop() {
        if (!this.currentId) {
            return;
        }

        if (this.currentCamera) {
            this.currentCamera.stop();
        }

        this.currentCamera = null;
    }

    getMainCamera() {
        if (this.currentCamera) {
            return this.currentCamera;
        }

        if (this.currentId && this.currentId.startsWith('webcamera-')) {
            this.currentCamera = new Webcam(this.currentId.replace('webcamera-', ''));
        }

        return this.currentCamera || null;
    }
}

const DevicesInstance = new Devices();

export default DevicesInstance;