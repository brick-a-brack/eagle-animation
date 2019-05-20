import Webcam from '../devices/Webcam';

let device = false;

export const initDevice = (dom) => {
    device = new Webcam();
    return device.init(dom);
};

export const getCurrentDevice = () => new Promise((resolve) => {
    resolve(device);
});

export const getDeviceResolution = () => new Promise((resolve) => {
    resolve({
        preview: {
            width: (device) ? device.getPreviewWidth() : false,
            height: (device) ? device.getPreviewHeight() : false
        },
        picture: {
            width: (device) ? device.getPictureWidth() : false,
            height: (device) ? device.getPictureHeight() : false
        }
    });
});

export const takePicture = () => device.takePicture();
