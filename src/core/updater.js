import { CONTRIBUTE_REPOSITORY } from '../config';

export const getLatestPublishedRelease = () => new Promise((resolve, reject) => {
    fetch(`https://raw.githubusercontent.com/${CONTRIBUTE_REPOSITORY}/master/package.json`).then(res => res.json()).then((data) => {
        if (data.version)
            return resolve(data.version);
        return reject(new Error('NO_VERSION'));
    }).catch((err) => {
        reject(err);
    });
});
