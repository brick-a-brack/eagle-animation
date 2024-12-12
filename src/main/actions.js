import { copyFile } from 'node:fs/promises';

import { shell, systemPreferences } from 'electron';
import { mkdirp } from 'mkdirp';
import fetch from 'node-fetch';
import { join } from 'path-browserify';

import { getEncodingProfile } from '../common/ffmpeg';
import { CONTRIBUTE_REPOSITORY } from '../config';
import { flushCamera, getCamera, getCameras } from './cameras';
import { PROJECTS_PATH } from './config';
import { uploadFile } from './core/api';
import { exportProjectScene, exportSaveTemporaryBuffer, getSyncList, saveSyncList } from './core/export';
import { createProject, deleteProject, getProjectData, getProjectsList, projectSave, savePicture } from './core/projects';
import { getSettings, saveSettings } from './core/settings';
import { selectFile, selectFolder } from './core/utils';

console.log(`💾 Eagle Animation files will be saved in the following folder: ${PROJECTS_PATH}`);

const getPictureLink = (projectId, sceneIndex, filename) => `ea-data://${projectId}/${sceneIndex}/${filename}`;

const computeProject = (data) => {
  const copiedData = structuredClone(data);
  const scenes = copiedData.project.scenes.map((scene, i) => ({
    ...scene,
    pictures: scene.pictures.map((picture) => ({
      ...picture,
      link: getPictureLink(copiedData._id, i, picture.filename),
    })),
  }));

  let output = {
    ...copiedData,
    id: copiedData._id,
    project: {
      ...copiedData.project,
      scenes,
    },
    _path: undefined,
    _file: undefined,
  };

  delete output._path;
  delete output._file;

  return output;
};

const actions = {
  GET_MEDIA_PERMISSIONS: async () => {
    if (typeof systemPreferences.getMediaAccessStatus === 'function') {
      const [camera, microphone] = await Promise.all([systemPreferences.getMediaAccessStatus('camera'), systemPreferences.getMediaAccessStatus('microphone')]);
      return {
        camera,
        microphone,
      };
    }
    return {
      camera: 'granted',
      microphone: 'granted',
    };
  },
  ASK_MEDIA_PERMISSION: async (evt, { mediaType }) => {
    if (typeof systemPreferences.askForMediaAccess === 'function') {
      return systemPreferences.askForMediaAccess(mediaType);
    }
    return true;
  },
  GET_LAST_VERSION: async () => {
    if (CONTRIBUTE_REPOSITORY) {
      const res = await fetch(`https://raw.githubusercontent.com/${CONTRIBUTE_REPOSITORY}/master/package.json`).then((res) => res.json());
      return { version: res?.version || null };
    }
    return { version: null };
  },
  GET_PROJECTS: async () => {
    const projects = await getProjectsList(PROJECTS_PATH);
    return projects.map(computeProject);
  },
  NEW_PROJECT: async (evt, { title }) => {
    const data = await createProject(PROJECTS_PATH, title);
    return computeProject(data);
  },
  GET_PROJECT: async (evt, { project_id }) => {
    const data = await getProjectData(join(PROJECTS_PATH, project_id));
    return computeProject(data);
  },
  DELETE_PROJECT: async (evt, { project_id }) => {
    await deleteProject(join(PROJECTS_PATH, project_id));
    return null;
  },
  SAVE_PROJECT: async (evt, { project_id, data = {} }) => {
    await projectSave(join(PROJECTS_PATH, project_id), data.project, true);
    const updatedData = await getProjectData(join(PROJECTS_PATH, project_id));
    return computeProject(updatedData);
  },
  SAVE_PICTURE: async (evt, { project_id, track_id, buffer, extension = 'jpg' }) => {
    const data = await getProjectData(join(PROJECTS_PATH, project_id));
    const picture = await savePicture(join(PROJECTS_PATH, project_id), track_id, extension, buffer);
    return {
      ...picture,
      link: getPictureLink(data._id, track_id, picture.filename),
    };
  },
  OPEN_LINK: async (evt, { link }) => {
    shell.openExternal(link);
    return null;
  },
  LIST_NATIVE_CAMERAS: () => {
    return getCameras();
  },
  TAKE_PICTURE_NATIVE_CAMERA: async (evt, { camera_id }) => {
    const camera = await getCamera(camera_id);
    if (camera) {
      return camera.takePicture();
    }
    return null;
  },
  GET_CAPABILITIES_NATIVE_CAMERA: async (evt, { camera_id }) => {
    const camera = await getCamera(camera_id);
    if (camera) {
      return camera.getCapabilities();
    }
    return [];
  },
  APPLY_CAPABILITY_NATIVE_CAMERA: async (evt, { camera_id, key, value }) => {
    const camera = await getCamera(camera_id);
    if (camera) {
      camera.applyCapability(key, value);
      return null;
    }
    return null;
  },
  RESET_CAPABILITIES_NATIVE_CAMERA: async (evt, { camera_id }) => {
    const camera = await getCamera(camera_id);
    if (camera) {
      camera.resetCapabilities();
      return camera.getCapabilities();
    }
    return [];
  },
  CONNECT_NATIVE_CAMERA: async (evt, { camera_id }, sendToRenderer) => {
    const camera = await getCamera(camera_id);
    if (camera) {
      camera.connect((data) => {
        sendToRenderer('LIVE_VIEW_DATA', { camera_id, data });
      });
    }
  },
  GET_BATTERY_STATUS_NATIVE_CAMERA: async (evt, { camera_id }) => {
    const camera = await getCamera(camera_id);
    if (camera) {
      return camera.batteryStatus();
    }
    return null;
  },
  DISCONNECT_NATIVE_CAMERA: async (evt, { camera_id }) => {
    const camera = await getCamera(camera_id);
    if (camera) {
      flushCamera(camera_id);
      camera.disconnect();
    }
  },
  GET_SETTINGS: async () => {
    return getSettings(PROJECTS_PATH);
  },
  SAVE_SETTINGS: async (evt, { settings }) => {
    return saveSettings(PROJECTS_PATH, settings);
  },
  SYNC: async () => {
    let syncList = await getSyncList(PROJECTS_PATH);
    for (let i = 0; i < syncList.length; i++) {
      const syncElement = syncList[i];
      try {
        if (!syncElement.isUploaded) {
          console.log(`☁️ Sync start ${syncElement.publicCode} (${syncElement.apiKey})`);
          await uploadFile(syncElement.apiKey, syncElement.publicCode, syncElement.fileExtension, join(PROJECTS_PATH, '/.sync/', syncElement.fileName));
          syncList[i].isUploaded = true;
          await saveSyncList(PROJECTS_PATH, syncList);
          console.log(`✅ Sync finished ${syncElement.publicCode} (${syncElement.apiKey})`);
        }
      } catch (err) {
        console.log(`❌ Sync failed ${syncElement.publicCode} (${syncElement.apiKey})`, err);
      }
    }
  },
  APP_CAPABILITIES: async () => {
    const capabilities = [
      'EXPORT_VIDEO',
      'EXPORT_FRAMES',
      'BACKGROUND_SYNC',
      'LOW_FRAMERATE_QUALITY_IMPROVEMENT',
      'EXPORT_VIDEO_H264',
      'EXPORT_VIDEO_HEVC',
      'EXPORT_VIDEO_PRORES',
      'EXPORT_VIDEO_VP8',
      'EXPORT_VIDEO_VP9',
    ];
    return capabilities;
  },
  EXPORT_SELECT_PATH: async (
    evt,
    {
      type = 'FILE',
      format = 'h264',
      translations = {
        EXPORT_FRAMES: '',
        EXPORT_VIDEO: '',
        DEFAULT_FILE_NAME: '',
        EXT_NAME: '',
      },
    }
  ) => {
    if (type === 'FOLDER') {
      return selectFolder(translations.EXPORT_FRAMES);
    }
    if (type === 'FILE') {
      const profile = getEncodingProfile(format);
      return selectFile(translations.DEFAULT_FILE_NAME, profile.extension, translations.EXPORT_VIDEO, translations.EXT_NAME);
    }
    return null;
  },
  EXPORT_BUFFER: async (evt, { project_id, buffer_id, buffer }) => {
    await exportSaveTemporaryBuffer(join(PROJECTS_PATH, project_id), buffer_id, buffer);
  },
  EXPORT: async (
    evt,
    {
      project_id,
      track_id,
      frames = [],
      mode = 'video',
      format = 'h264',
      custom_output_framerate = false,
      custom_output_framerate_number = 10,
      output_path = null,
      public_code = 'default',
      event_key = '',
      framerate = 10,
    },
    sendToRenderer
  ) => {
    if (mode === 'frames') {
      if (output_path) {
        const bufferDirectoryPath = join(join(PROJECTS_PATH, project_id), `/.tmp/`);
        for (const frame of frames) {
          await copyFile(join(bufferDirectoryPath, frame.buffer_id), join(output_path, `frame-${frame.index.toString().padStart(6, '0')}.${frame.extension}`));
        }
      }
      return true;
    }

    const profile = getEncodingProfile(format);

    // Create sync folder if needed
    if (mode === 'send') {
      await mkdirp(join(PROJECTS_PATH, '/.sync/'));
    }

    const path = mode === 'send' ? join(PROJECTS_PATH, '/.sync/', `${public_code}.${profile.extension}`) : output_path;
    await exportProjectScene(
      join(PROJECTS_PATH, project_id),
      track_id,
      frames,
      path,
      format,
      {
        customOutputFramerate: custom_output_framerate,
        customOutputFramerateNumber: custom_output_framerate_number,
        framerate: Number(framerate),
      },
      (progress) => sendToRenderer('FFMPEG_PROGRESS', { progress })
    );

    if (mode === 'send') {
      const syncList = await getSyncList(PROJECTS_PATH);
      await saveSyncList(PROJECTS_PATH, [
        ...syncList,
        {
          apiKey: event_key,
          publicCode: public_code,
          fileName: `${public_code}.${profile.extension}`,
          fileExtension: profile.extension,
          isUploaded: false,
        },
      ]);

      actions.SYNC();
    }

    return true;
  },
};

export default actions;
