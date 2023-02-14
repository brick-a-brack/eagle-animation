import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { getProjectData } from './projects';
import { createDirectory, copy } from './utils';
import { generate } from './ffmpeg';

export const normalizePictures = async (projectPath, scene, outputPath) => {
    const project = await getProjectData(projectPath);
    const files = project?.project?.scenes?.[scene]?.pictures?.reduce((acc, e) => ([...acc, ...(Array(e.deleted ? 0 : e.length || 1).fill(e))]), []);
    await createDirectory(outputPath);
    for (let i = 0; i < files.length; i++) {
        await copy(join(projectPath, `/${scene}/`, files[i].filename), join(outputPath, `frame-${i.toString().padStart(6, '0')}.jpg`));
    }
}

export const exportProjectScene = async (projectPath, scene, filePath) => {
    const project = await getProjectData(projectPath);
    const directoryPath = join(projectPath, `/_tmp-${uuidv4()}/`);
    await normalizePictures(projectPath, scene, directoryPath);
    await generate(1920, 1080, directoryPath, 'h264', filePath, project.project.scenes[scene].framerate);
};

