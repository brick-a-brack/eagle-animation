import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { rimraf } from 'rimraf'

import { getProjectData } from './projects';
import { createDirectory, copy } from './utils';
import { generate } from './ffmpeg';


export const normalizePictures = async (projectPath, scene, outputPath, opts = {}) => {

    const project = await getProjectData(projectPath);
    const frames = project?.project?.scenes?.[scene]?.pictures?.filter(e => !e.deleted) || [];

    const getNumberOfFrames = (frame, index) => {
        if (opts.duplicateFramesAuto && opts.duplicateFramesAutoNumber && (index === 0 || index === frames.length - 1)) {
            return parseInt(opts.duplicateFramesAutoNumber, 10) + frame.length - 1;
        }
        return opts.duplicateFramesCopy ? frame.length : 1
    }

    const files = frames?.reduce((acc, e, i) => ([...acc, ...(Array(getNumberOfFrames(e, i)).fill(e))]), []);
    await createDirectory(outputPath);
    for (let i = 0; i < files.length; i++) {
        await copy(join(projectPath, `/${scene}/`, files[i].filename), join(outputPath, `frame-${i.toString().padStart(6, '0')}.jpg`));
    }
}

export const exportProjectScene = async (projectPath, scene, filePath, format, opts = {}) => {
    const project = await getProjectData(projectPath);
    const directoryPath = join(projectPath, `/_tmp-${uuidv4()}/`);
    await normalizePictures(projectPath, scene, directoryPath, opts);
    await generate(1920, 1080, directoryPath, format, filePath, project.project.scenes[scene].framerate, opts);
    await rimraf(directoryPath);
};

