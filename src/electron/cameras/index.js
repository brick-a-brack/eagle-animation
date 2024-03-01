import { Camera as CanonCamera, CameraBrowser as CanonCameraBrowser } from './canon';

const Cameras = [
    { browser: CanonCameraBrowser, item: CanonCamera },
];

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