import { fetchFile } from '@ffmpeg/util';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

import { getEncodingProfile, getFFmpegArgs, parseFFmpegLogs } from '@common/ffmpeg';
import { LS_SETTINGS } from '@config-web';
import { isBlink } from '@common/isBlink';
import { createBuffer, flushBuffers, getBuffer } from './buffer';
import { getFFmpeg } from './ffmpeg';
import { createFrame, getFrameBlobUrl } from './frames';
import { createProject, deleteProject, getAllProjects, getProject, saveProject } from './projects';

let events = [];
let currentDirectory = null;

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

const computeProject = async (data, bindPictureLink = true) => {
  const copiedData = structuredClone(data);
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
    project: {
      ...copiedData?.project,
      scenes,
    },
  };

  delete output._path;
  delete output._file;

  return output;
};

export const Actions = {
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
    const capabilities = ['EXPORT_VIDEO', 'EXPORT_VIDEO_H264', 'EXPORT_VIDEO_VP8', 'EXPORT_VIDEO_PRORES', 'EXPORT_FRAMES', 'EXPORT_FRAMES_ZIP'];

    // Chromium based browsers support photo mode
    if (isBlink()) {
      capabilities.push('LOW_FRAMERATE_QUALITY_IMPROVEMENT');
    }

    return capabilities;
  },
  EXPORT_SELECT_PATH: async (evt, { compress_as_zip = false }) => {
    currentDirectory = null;
    if (!compress_as_zip) {
      try {
        if ('showDirectoryPicker' in self) {
          const dirHandle = await window.showDirectoryPicker();
          currentDirectory = await dirHandle.getDirectoryHandle('frames', {
            create: true,
          });
          return currentDirectory ? true : null;
        }
      } catch (err) {
        currentDirectory = false;
        return null;
      }
    }
    return true;
  },
  EXPORT_BUFFER: async (evt, { buffer_id, buffer }) => {
    await createBuffer(buffer_id, buffer);
  },
  EXPORT: async (evt, { project_id, track_id, mode = 'video', format = 'h264', frames = [], custom_output_framerate = false, compress_as_zip = false, custom_output_framerate_number = 10 }) => {
    const trackId = Number(track_id);
    const project = await getProject(project_id);

    // Frames export
    if (mode === 'frames') {
      if (compress_as_zip) {
        // Fallback on regular ZIP
        const zip = new JSZip();
        for (let i = 0; i < frames.length; i++) {
          const frame = frames[i];
          const buffer = await getBuffer(frame.buffer_id);
          zip.file(`frame-${frame.index.toString().padStart(6, '0')}.${frame.extension}`, buffer);
        }
        zip.generateAsync({ type: 'blob' }).then((content) => {
          saveAs(content, 'frames.zip');
        });
      } else if (currentDirectory !== null) {
        // Use FileSystem API (Chromium only)
        if (currentDirectory !== false) {
          for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const buffer = await getBuffer(frame.buffer_id);
            const fileHandle = await currentDirectory.getFileHandle(`frame-${frame.index.toString().padStart(6, '0')}.${frame.extension}`, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(buffer);
            await writable.close();
          }
        }
        currentDirectory = null;
      } else {
        let blob = null;
        for (let i = 0; i < frames.length; i++) {
          const frame = frames[i];
          const buffer = await getBuffer(frame.buffer_id);
          const filename = `frame-${frame.index.toString().padStart(6, '0')}.${frame.extension}`;
          blob = new Blob([buffer], { type: `image/${frame?.extension?.replace('jpg', 'jpeg') || 'jpeg'}` });
          saveAs(blob, filename);
          blob = null;
        }
      }
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
