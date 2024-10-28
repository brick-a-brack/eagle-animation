import isFirefox from '@braintree/browser-detection/is-firefox';
import { fetchFile } from '@ffmpeg/util';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

import { getEncodingProfile, getFFmpegArgs, parseFFmpegLogs } from '../../common/ffmpeg';
import { LS_SETTINGS } from '../config';
import { createBuffer, flushBuffers, getBuffer } from './buffer';
import { getFFmpeg } from './ffmpeg';
import { createFrame, getFrameBlobUrl } from './frames';
import { createProject, deleteProject, getAllProjects, getProject, saveProject } from './projects';

let events = [];

export const addEventListener = (name, callback) => {
  events.push([name, callback]);
};

export const removeEventListener = (name, callback) => {
  events = events.filter(([evtName, evtCallback]) => evtName !== name || evtCallback !== callback);
};

export const sendEvent = (name, data) => {
  for (const [eventName, eventCallback] of events) {
    if (eventName === name && typeof eventCallback === 'function') {
      eventCallback(name, data);
    }
  }
};

const getDefaultPreview = async (data) => {
  for (let i = 0; i < (data?.project?.scenes?.length || 0); i++) {
    for (const picture of data?.project?.scenes?.[i]?.pictures || []) {
      if (!picture.deleted) {
        return getFrameBlobUrl(picture.filename?.split('.')?.[0]);
      }
    }
  }
  return null;
};

const computeProject = async (data, bindPictureLink = true) => {
  const copiedData = structuredClone(data);
  let preview = await getDefaultPreview(copiedData);
  const scenes = await Promise.all(
    copiedData?.project?.scenes?.map(async (scene) => {
      return {
        ...scene,
        pictures: await Promise.all(
          scene.pictures.map(async (picture) => ({
            ...picture,
            link: bindPictureLink ? await getFrameBlobUrl(picture.filename?.split('.')?.[0]) : null,
          }))
        ),
      };
    })
  );

  let output = {
    id: copiedData.id,
    preview,
    project: {
      ...copiedData?.project,
      scenes,
    },
  };

  delete output._path;
  delete output._file;

  return output;
};

let dedupProms = {};

export const Actions = {
  GET_MEDIA_PERMISSIONS: async () => {
    if (isFirefox()) {
      dedupProms.testCamera =
        dedupProms.testCamera ||
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then(() => true)
          .catch(() => false);

      dedupProms.testMicrophone =
        dedupProms.testMicrophone ||
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then(() => true)
          .catch(() => false);

      const [firefoxCameraPermission, firefoxMicrophonePermission] = await Promise.all([dedupProms.testCamera, dedupProms.testMicrophone]);
      return {
        camera: firefoxCameraPermission ? 'granted' : 'denied',
        microphone: firefoxMicrophonePermission ? 'granted' : 'denied',
      };
    } else {
      const [cameraPermission, microphonePermission] = await Promise.all([
        navigator.permissions.query({ name: 'camera' }).catch(() => null),
        navigator.permissions.query({ name: 'microphone' }).catch(() => null),
      ]);
      return {
        camera: cameraPermission?.state === 'granted' ? 'granted' : 'denied',
        microphone: microphonePermission?.state === 'granted' ? 'granted' : 'denied',
      };
    }
  },
  ASK_MEDIA_PERMISSION: async (evt, { mediaType }) => {
    const permission = await navigator.mediaDevices
      .getUserMedia({
        ...(mediaType === 'camera' ? { video: true } : {}),
        ...(mediaType === 'microphone' ? { audio: true } : {}),
      })
      .then(() => true)
      .catch(() => false);
    return permission;
  },
  GET_LAST_VERSION: async () => {
    return { version: null }; // Web version is always up-to-date, ignore update detection
  },
  GET_PROJECTS: async () => {
    const projects = await getAllProjects();
    return Promise.all(projects.map((d) => computeProject(d, false)));
  },
  NEW_PROJECT: async (evt, { title }) => {
    const id = await createProject(title);
    const project = await getProject(id);
    return computeProject(project);
  },
  GET_PROJECT: async (evt, { project_id }) => {
    const project = await getProject(project_id);
    return computeProject(project);
  },
  SAVE_PROJECT: async (evt, { project_id, data }) => {
    if (!data) {
      return null;
    }
    await saveProject(project_id, data);
    const project = await getProject(project_id);
    return computeProject(project);
  },
  DELETE_PROJECT: async (evt, { project_id }) => {
    await deleteProject(project_id);
    return null;
  },
  OPEN_LINK: async (evt, { link }) => {
    window.open(link, '_blank');
    return null;
  },
  SAVE_PICTURE: async (evt, { buffer, extension = 'jpg' }) => {
    const frameId = await createFrame(buffer, extension);
    return {
      filename: `${frameId}.${extension || 'dat'}`,
      deleted: false,
      length: 1,
      link: await getFrameBlobUrl(frameId),
    };
  },
  GET_SETTINGS: async () => {
    try {
      return {
        ...JSON.parse(localStorage.getItem(LS_SETTINGS)),
      };
    } catch (err) {
      return {};
    }
  },
  SAVE_SETTINGS: async (evt, { settings }) => {
    localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
    return {
      ...settings,
    };
  },
  SYNC: async () => {
    return null;
  },
  APP_CAPABILITIES: async () => {
    const capabilities = ['EXPORT_VIDEO', 'EXPORT_VIDEO_H264', 'EXPORT_VIDEO_VP8', 'EXPORT_VIDEO_PRORES', 'EXPORT_FRAMES'];

    // Firefox don't support photo mode
    if (!isFirefox()) {
      capabilities.push('LOW_FRAMERATE_QUALITY_IMPROVEMENT');
    }

    return capabilities;
  },
  EXPORT_SELECT_PATH: async () => '',
  EXPORT_BUFFER: async (evt, { buffer_id, buffer }) => {
    await createBuffer(buffer_id, buffer);
  },
  EXPORT: async (evt, { project_id, track_id, mode = 'video', format = 'h264', frames = [], custom_output_framerate = false, custom_output_framerate_number = 10 }) => {
    const trackId = Number(track_id);
    const project = await getProject(project_id);

    if (mode === 'frames') {
      const zip = new JSZip();
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const buffer = await getBuffer(frame.buffer_id);
        zip.file(`frame-${frame.index.toString().padStart(6, '0')}.${frame.extension}`, buffer);
      }
      zip.generateAsync({ type: 'blob' }).then((content) => {
        saveAs(content, 'frames.zip');
      });
    }

    if (mode === 'video') {
      const handleData = (data) => {
        parseFFmpegLogs(data?.message || '', frames.length || 0, custom_output_framerate ? custom_output_framerate_number : undefined, (progress) => {
          sendEvent('FFMPEG_PROGRESS', { progress });
        });
      };

      const ffmpeg = await getFFmpeg(handleData);

      for (const frame of frames) {
        const buffer = await getBuffer(frame.buffer_id);
        await ffmpeg.writeFile(`frame-${frame.index.toString().padStart(6, '0')}.${frame.extension}`, await fetchFile(new Blob([buffer])));
      }

      const profile = getEncodingProfile(format);
      const output = `video.${profile.extension}`;

      const args = getFFmpegArgs(format, output, project.project.scenes[trackId].framerate, {
        customOutputFramerate: custom_output_framerate,
        customOutputFramerateNumber: custom_output_framerate_number,
      });

      console.log(`🎞️ FFmpeg ${args.map((e) => `"${e}"`).join(' ')}`);

      await ffmpeg.exec(args);
      const data = await ffmpeg.readFile(output);
      saveAs(new Blob([data.buffer], { type: 'application/octet-stream' }), output);
    }

    await flushBuffers();
    return true;
  },
};
