import JSZip from 'jszip';
import { LS_SETTINGS } from '../config';
import { createFrame, getFrameBlob, getFrameBlobUrl } from './frames';
import { saveAs } from 'file-saver';
import {
  applyFrameLengthOffset,
  createProject,
  deleteProject,
  deleteProjectFrame,
  getAllProjects,
  getProject,
  moveFrame,
  normalizePictures,
  sceneAddFrame,
  updateProjectTitle,
  updateSceneFPSValue,
} from './projects';
import { getFFmpeg } from './ffmpeg';
import { getEncodingProfile, getFFmpegArgs } from '../../common/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { isFirefox } from '@braintree/browser-detection';

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

const DEFAULT_SETTINGS = {
  CAMERA_ID: 0,
  CAPTURE_FRAMES: 1,
  AVERAGING_ENABLED: false,
  AVERAGING_VALUE: 3,
  //LANGUAGE: 'en', // default Handled by front side
  SHORT_PLAY: 20,
  RATIO_OPACITY: 1,
  GRID_OPACITY: 1,
  GRID_MODES: ['GRID'], // GRID | CENTER | MARGINS
  GRID_LINES: 3,
  GRID_COLUMNS: 3,
  EVENT_KEY: '',
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

const actions = {
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
  TAKE_PICTURE: async (evt, { project_id, track_id, buffer, before_frame_id = false }) => {
    const frameId = await createFrame(buffer);
    await sceneAddFrame(project_id, track_id, 'jpg', before_frame_id, frameId);
    const project = await getProject(project_id);
    return computeProject(project);
  },
  GET_SETTINGS: async () => {
    try {
      return {
        ...DEFAULT_SETTINGS,
        ...JSON.parse(localStorage.getItem(LS_SETTINGS)),
      };
    } catch (err) {
      return DEFAULT_SETTINGS;
    }
  },
  SAVE_SETTINGS: async (evt, { settings }) => {
    localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
    return {
      ...DEFAULT_SETTINGS,
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
  EXPORT: async (
    evt,
    {
      project_id,
      track_id,
      mode = 'video',
      format = 'h264',
      resolution = 'original',
      duplicate_frames_copy = true,
      duplicate_frames_auto = false,
      duplicate_frames_auto_number = 2,
      custom_output_framerate = false,
      custom_output_framerate_number = 10,
    }
  ) => {
    const trackId = Number(track_id);

    const project = await getProject(project_id);
    const frames = await normalizePictures(project_id, trackId, {
      duplicateFramesCopy: duplicate_frames_copy,
      duplicateFramesAuto: duplicate_frames_auto,
      duplicateFramesAutoNumber: duplicate_frames_auto_number,
    });

    if (mode === 'frames') {
      const zip = new JSZip();
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const blob = await getFrameBlob(frame.id);
        zip.file(`frame-${i.toString().padStart(6, '0')}.jpg`, blob);
      }
      zip.generateAsync({ type: 'blob' }).then(function (content) {
        saveAs(content, 'frames.zip');
      });
    }

    if (mode === 'video') {
      const ffmpeg = await getFFmpeg(console.log);
      console.log('FFMPEG READY', ffmpeg);

      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const blob = await getFrameBlob(frame.id);
        await ffmpeg.writeFile(`frame-${i.toString().padStart(6, '0')}.jpg`, await fetchFile(blob));
      }

      const profile = getEncodingProfile(format);
      const output = `video.${profile.extension}`;

      const args = getFFmpegArgs(1920, 1080, format, output, custom_output_framerate ? custom_output_framerate_number : project.project.scenes[trackId].framerate, {
        duplicateFramesCopy: duplicate_frames_copy,
        duplicateFramesAuto: duplicate_frames_auto,
        duplicateFramesAutoNumber: duplicate_frames_auto_number,
        customOutputFramerate: custom_output_framerate,
        customOutputFramerateNumber: custom_output_framerate_number,
        resolution,
      });

      console.log('FFMPEG RUN', args);

      await ffmpeg.exec(args);
      const data = await ffmpeg.readFile(output);
      saveAs(new Blob([data.buffer], { type: 'application/octet-stream' }), output);
    }

    return true;
  },
};

export default actions;
