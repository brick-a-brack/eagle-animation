import { join } from 'path';
import uuidv4 from 'uuid/v4';
import { getProjectData } from './projects';
import { createDirectory, copy } from './utils';
import { generate } from './ffmpeg';

export const normalizePictures = (projectPath, scene, outputPath) => new Promise((resolve, reject) => {
    getProjectData(projectPath).then((project) => {
        const files = project.project.scenes[scene].pictures
            .reduce((acc, e) => ([...acc, ...(Array(e.deleted ? 0 : e.length).fill(e))]), []);
        if (!project.project.scenes[scene] || project.project.scenes[scene].pictures.length <= 0)
            return reject(new Error('EMPTY_SCENE'));
        return createDirectory(outputPath).then(() => {
            Promise.all(files.map((f, idx) => (copy(join(projectPath, `/${scene}/`, f.filename), join(outputPath, `img-${idx.toString().padStart(6, '0')}.jpg`))))).then(() => resolve(files)).catch(err => reject(err));
        });
    }).catch(err => reject(err));
});

export const exportProjectScene = (projectPath, scene) => new Promise((resolve, reject) => {
    const directoryPath = join(projectPath, `/_tmp-${uuidv4()}/`);
    normalizePictures(projectPath, scene, directoryPath).then(() => {
        generate(1920, 1080, directoryPath, 'h264', `${directoryPath}output`, 10);
        resolve();
    }).catch(() => {
        generate(1920, 1080, directoryPath, 'h264', `${directoryPath}ouput`, 10);
        reject();
    });
});
