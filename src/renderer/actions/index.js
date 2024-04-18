import { isFirefox } from '@braintree/browser-detection';
import { fetchFile } from '@ffmpeg/util';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

import { getEncodingProfile, getFFmpegArgs, parseFFmpegLogs } from '../../common/ffmpeg';
import { LS_SETTINGS } from '../config';
import { getFFmpeg } from './ffmpeg';
import { createFrame, getFrameBlobUrl } from './frames';
import { applyFrameLengthOffset, createProject, deleteProject, deleteProjectFrame, getAllProjects, getProject, moveFrame, sceneAddFrame, updateProjectTitle, updateSceneFPSValue } from './projects';

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
        return getFrameBlobUrl(picture.id);
      }
    }
  }
  return null;
};

// TODO: .preview => img to display
const computeProject = async (data) => {
  let preview = await getDefaultPreview(data);
  const scenes = await Promise.all(
    data.project.scenes.map(async (scene) => ({
      ...scene,
      pictures: await Promise.all(
        scene.pictures
          .filter((p) => !p.deleted)
          .map(async (picture) => ({
            ...picture,
            link: await getFrameBlobUrl(picture.id),
          }))
      ),
    }))
  );

  return {
    id: data.id,
    preview,
    project: {
      ...data.project,
      scenes,
    },
    _path: null,
    _file: null,
  };
};

export const Actions = {
  GET_LAST_VERSION: async () => {
    // Web version is always up-to-date, ignore update detection
    return { version: null };
  },
  GET_PROJECTS: async () => {
    const projects = await getAllProjects();
    return Promise.all(projects.map(computeProject));
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
  DELETE_PROJECT: async (evt, { project_id }) => {
    await deleteProject(project_id);
    return null;
  },
  DELETE_FRAME: async (evt, { project_id, track_id, frame_id }) => {
    await deleteProjectFrame(project_id, track_id, frame_id);
    const project = await getProject(project_id);
    return computeProject(project);
  },
  DUPLICATE_FRAME: async (evt, { project_id, track_id, frame_id }) => {
    await applyFrameLengthOffset(project_id, track_id, frame_id, 1);
    const project = await getProject(project_id);
    return computeProject(project);
  },
  DEDUPLICATE_FRAME: async (evt, { project_id, track_id, frame_id }) => {
    await applyFrameLengthOffset(project_id, track_id, frame_id, -1);
    const project = await getProject(project_id);
    return computeProject(project);
  },
  MOVE_FRAME: async (evt, { project_id, track_id, frame_id, before_frame_id = false }) => {
    await moveFrame(project_id, track_id, frame_id, before_frame_id);
    const project = await getProject(project_id);
    return computeProject(project);
  },
  RENAME_PROJECT: async (evt, { project_id, title }) => {
    await updateProjectTitle(project_id, title);
    const project = await getProject(project_id);
    return computeProject(project);
  },
  UPDATE_FPS_VALUE: async (evt, { project_id, track_id, fps }) => {
    await updateSceneFPSValue(project_id, track_id, fps);
    const project = await getProject(project_id);
    return computeProject(project);
  },
  OPEN_LINK: async (evt, { link }) => {
    window.open(link, '_blank');
    return null;
  },
  TAKE_PICTURE: async (evt, { project_id, track_id, buffer, before_frame_id = false, extension = 'jpg' }) => {
    const frameId = await createFrame(buffer, extension);
    await sceneAddFrame(project_id, track_id, extension, before_frame_id, frameId);
    const project = await getProject(project_id);
    return computeProject(project);
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
  EXPORT_SELECT_PATH: async () => null,
  EXPORT: async (evt, { project_id, track_id, mode = 'video', format = 'h264', frames = [], custom_output_framerate = false, custom_output_framerate_number = 10 }) => {
    const trackId = Number(track_id);
    const project = await getProject(project_id);

    if (mode === 'frames') {
      const zip = new JSZip();
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        zip.file(`frame-${frame.index.toString().padStart(6, '0')}.${frame.extension}`, frame.buffer);
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
        await ffmpeg.writeFile(`frame-${frame.index.toString().padStart(6, '0')}.${frame.extension}`, await fetchFile(new Blob([frame.buffer])));
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

    return true;
  },
};
