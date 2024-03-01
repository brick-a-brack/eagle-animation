import { getCamera, getCameras } from '../cameras';

class Devices {
    constructor() {
        this.currentId = null;
        this.currentCamera = null;
    }

    async list() {
        const cameras = await getCameras();
        return cameras.map((e,i) => ({...e, label: `[${i}] ${e.label || ''}`}));
    }

    async connect() {
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
            this.currentCamera.disconnect();
        }
        this.currentCamera = null;
    }

    async disconnect() {
        if (!this.currentId) {
            return;
        }

        if (this.currentCamera) {
            this.currentCamera.disconnect();
        }

        this.currentCamera = null;
    }

    getMainCamera() {
        if (this.currentCamera) {
            return this.currentCamera;
        }

        if (this.currentId) {
            return getCamera(this.currentId);
        }

        return this.currentCamera || null;
    }
}

const DevicesInstance = new Devices();

export default DevicesInstance;