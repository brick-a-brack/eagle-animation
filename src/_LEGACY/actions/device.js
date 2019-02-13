import Webcam from '../devices/Webcam';
import { ActionSavePicture } from './project'

let device = false

/* ---------- DEVICE LOAD ---------- */
export const DEVICE_LOAD_REQUEST = 'DEVICE_LOAD_REQUEST';
export const DEVICE_LOAD_SUCCESS = 'DEVICE_LOAD_SUCCESS';
export const DEVICE_LOAD_FAILURE = 'DEVICE_LOAD_FAILURE';

export const deviceLoadRequest = () => ({ type: DEVICE_LOAD_REQUEST, data: {} });
export const deviceLoadSuccess = (previewWidth, previewHeight, pictureWidth, pictureHeight) => ({
  type: DEVICE_LOAD_SUCCESS,
  data: {
    preview: {
      width: previewWidth,
      height: previewHeight
    },
    picture: {
      width: pictureWidth,
      height: pictureHeight
    }
  }
});
export const deviceLoadFailure = error => ({ type: DEVICE_LOAD_FAILURE, data: error });

export const ActionDeviceLoad = (dom) => ((dispatch) => {
  dispatch(deviceLoadRequest());
  device = new Webcam();
  device.init(dom).then((e) => {
    console.log('ok');
    dispatch(deviceLoadSuccess(device.getPreviewWidth(), device.getPreviewHeight(), device.getPictureWidth(), device.getPictureHeight()))
  }).catch((err) => {
    console.log('fail');
    dispatch(deviceLoadFailure(err));
  })
});

/* ----------- DEVICE_TAKE_PICTURE --------- */
export const DEVICE_TAKE_PICTURE_REQUEST = 'DEVICE_TAKE_PICTURE_REQUEST';
export const DEVICE_TAKE_PICTURE_SUCCESS = 'DEVICE_TAKE_PICTURE_SUCCESS';
export const DEVICE_TAKE_PICTURE_FAILURE = 'DEVICE_TAKE_PICTURE_FAILURE';

export const deviceTakePictureRequest = () => ({ type: DEVICE_TAKE_PICTURE_REQUEST, data: {} });
export const deviceTakePictureSuccess = buffer => ({ type: DEVICE_TAKE_PICTURE_SUCCESS, data: buffer });
export const deviceTakePictureFailure = err => ({ type: DEVICE_TAKE_PICTURE_FAILURE, data: err });

export const ActionDeviceTakePicture = () => ((dispatch) => {
  dispatch(deviceLoadRequest());
  if (device === false)
    return dispatch(deviceTakePictureFailure('CAMERA_NOT_READY'));
  device.takePicture().then((e) => {
    console.log('ok');
    dispatch(deviceTakePictureSuccess(e));
    dispatch(ActionSavePicture(e));
  }).catch((err) => {
    console.log('fail', err);
    dispatch(deviceTakePictureFailure(err));
    
  })
});