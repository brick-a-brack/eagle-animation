import Webcam from '../devices/Webcam';

let device = false

export const initDevice = (dom) => {
    device = new Webcam()
    return device.init(dom)
}

export const getCurrentDevice = () => {
    return new Promise((resolve, reject) => {
        resolve(device)
    })
}

export const getDeviceResolution = () => {
    return new Promise((resolve, reject) => {
        resolve({
            preview: {
                width: (device) ? device.getPreviewWidth() : false,
                height: (device) ? device.getPreviewHeight() : false
            },
            picture: {
                width: (device) ? device.getPictureWidth() : false,
                height: (device) ? device.getPictureHeight() : false
            }
        })
    })
}