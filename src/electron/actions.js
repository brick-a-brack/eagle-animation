import { join } from 'path-browserify';
import { CONTRIBUTE_REPOSITORY, DIRECTORY_NAME } from '../config';
import { applyProjectFrameLengthOffset, createProject, deleteProject, deleteProjectFrame, getProjectData, getProjectsList, moveFrame, renameProject, takePicture } from './core/projects';
import { homedir } from 'os';
import fetch from 'node-fetch';
import { shell } from 'electron';
import { getSettings, saveSettings } from './core/settings';
import { selectFile, selectFolder } from './core/utils';
import { exportProjectScene, normalizePictures } from './core/export';

const PROJECTS_PATH = join(homedir(), DIRECTORY_NAME);

const getDefaultPreview = (data) => {
    for (let i = 0; i < (data?.project?.scenes?.length || 0); i++) {
        for (const picture of data?.project?.scenes?.[i]?.pictures || []) {
            if (!picture.deleted) {
                return `${data._path}/${i}/${picture.filename}`;
            }
        }
    }
    return null;
}

// TODO: .preview => img to display
const computeProject = (data) => {
    let preview = getDefaultPreview(data);
    const scenes = data.project.scenes.map((scene, i) => ({
        ...scene,
        pictures: scene.pictures.filter(p => !p.deleted).map(picture => ({
            ...picture,
            link: `${data._path}/${i}/${picture.filename}`,
        }))
    }))

    return {
        ...data,
        id: data._path.replaceAll('\\', '/').split('/').pop(),
        preview,
        project: {
            ...data.project,
            scenes
        },
        _path: null,
        _file: null
    };
}

const actions = {
    GET_LAST_VERSION: async () => {
        const res = await fetch(`https://raw.githubusercontent.com/${CONTRIBUTE_REPOSITORY}/master/package.json`).then(res => res.json())
        return { version: res?.version || null };
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
    DELETE_FRAME: async (evt, { project_id, track_id, frame_id }) => {
        const data = await deleteProjectFrame(join(PROJECTS_PATH, project_id), track_id, frame_id);
        return computeProject(data);
    },
    DUPLICATE_FRAME: async (evt, { project_id, track_id, frame_id }) => {
        const data = await applyProjectFrameLengthOffset(join(PROJECTS_PATH, project_id), track_id, frame_id, 1);
        return computeProject(data);
    },
    DEDUPLICATE_FRAME: async (evt, { project_id, track_id, frame_id }) => {
        const data = await applyProjectFrameLengthOffset(join(PROJECTS_PATH, project_id), track_id, frame_id, -1);
        return computeProject(data);
    },
    MOVE_FRAME: async (evt, { project_id, track_id, frame_id, before_frame_id = false }) => {
        const data = await moveFrame(join(PROJECTS_PATH, project_id), track_id, frame_id, before_frame_id);
        return computeProject(data);
    },
    RENAME_PROJECT: async (evt, { project_id, title }) => {
        const data = await renameProject(join(PROJECTS_PATH, project_id), title);
        return computeProject(data);
    },
    OPEN_LINK: async (evt, { link }) => {
        shell.openExternal(link);
        return null;
    },
    TAKE_PICTURE: async (evt, { project_id, track_id, buffer, before_frame_id = false }) => {
        const data = await takePicture(join(PROJECTS_PATH, project_id), track_id, 'jpg', before_frame_id, buffer);
        return computeProject(data);
    },
    GET_SETTINGS: async () => {
        return getSettings(PROJECTS_PATH);
    },
    SAVE_SETTINGS: async (evt, { settings }) => {
        return saveSettings(PROJECTS_PATH, settings);
    },
    EXPORT: async (evt, { project_id,
        track_id,
        mode = 'video',
        format = 'h264',
        resolution = 'original',
        duplicateFramesCopy = true,
        duplicateFramesAuto = false,
        duplicateFramesAutoNumber = 2,
        customOutputFramerate = false,
        customOutputFramerateNumber = 10,

    }) => {
        if (mode === 'frames') {
            const path = await selectFolder();
            if (path) {
                await normalizePictures(join(PROJECTS_PATH, project_id), track_id, path, {
                    duplicateFramesCopy,
                    duplicateFramesAuto,
                    duplicateFramesAutoNumber,
                });
            }
            return true;
        }

        const path = await selectFile('video', 'mp4');
        await exportProjectScene(join(PROJECTS_PATH, project_id), track_id, path, format, {
            duplicateFramesCopy,
            duplicateFramesAuto,
            duplicateFramesAutoNumber,
            customOutputFramerate,
            customOutputFramerateNumber ,
            resolution
        })

        return true;
    }
}

export default actions;