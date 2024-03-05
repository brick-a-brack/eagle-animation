import { platform } from 'os';

const Cameras = [];

if (platform() === "win32") {
    import('./canon').then(canon => {
        Cameras.push({ browser: canon.CameraBrowser, item: canon.Camera });
    });
}

let cachedCameras = {};

export const getCameras = async () => {
    const availableCameras = [];

    for (const camType of Cameras) {
        const cameras = await camType?.browser?.getCameras() || [];
        for (const camera of cameras) {
            availableCameras.push({
                ...camera,
                type: 'NATIVE',
                id: `NATIVE-${camera.module}-${camera.deviceId}`,
            })
        }
    }

    return availableCameras;
}

export const flushCamera = async (id) => {
    cachedCameras[id] = null;
}

export const getCamera = async (id) => {
    if (cachedCameras[id]) {
        return cachedCameras[id];
    }

    for (const camType of Cameras) {
        const cameras = await camType?.browser?.getCameras() || [];
        for (const camera of cameras) {
            if (id === `NATIVE-${camera.module}-${camera.deviceId}`) {
                const CameraClass = camType?.item;
                cachedCameras[id] = new CameraClass(camera.deviceId, {
                    ...camera,
                    type: 'NATIVE',
                    id: `NATIVE-${camera.module}-${camera.deviceId}`,
                });
                return cachedCameras[id];
            }
        }
    }

    return null;
}