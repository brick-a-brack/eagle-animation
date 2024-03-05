import { getCamera, getCameras } from '../cameras';

class Devices {
    constructor() {
        this.currentId = null;
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

        getCamera(this.currentId)?.disconnect();

        this.currentId = id;
    }

    async disconnect() {
        if (!this.currentId) {
            return;
        }

        getCamera(this.currentId)?.disconnect();
    }

    getMainCamera() {
        if (this.currentId) {
            return getCamera(this.currentId);
        }
        return null;
    }
}

const DevicesInstance = new Devices();

export default DevicesInstance;