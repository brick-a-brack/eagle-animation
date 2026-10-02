import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const GRADLE_FILE = resolve('android/app/build.gradle.kts');
const PACKAGE_FILE = resolve('package.json');

// The max value of versionCode on the Play Store is 2 100 000 000.
// We use the timestamp of October 1st, 2026 as an origin and a 30 seconds time range,
// so two different builds can't be released within the same time range.
// Based on this calc, we will have issues about version code in... 2356.
const BASE_TIMESTAMP = 1790889704;
const TIME_RANGE = 30;
const MAX_VERSION_CODE = 2100000000;

const getCommitHash = () => {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).trim() || 'unknown';
  } catch {
    return 'unknown';
  }
};

const getVersionCode = () => {
  const versionCode = Math.floor((Math.floor(Date.now() / 1000) - BASE_TIMESTAMP) / TIME_RANGE);

  // Edge case, invalid version code
  if (versionCode <= 0) {
    console.warn('WARNING: versionCode<=0, fallback to versionCode=1');
    return 1;
  }

  // Edge case, not supported by the Play Store
  if (versionCode > MAX_VERSION_CODE) {
    console.warn(`WARNING: versionCode>${MAX_VERSION_CODE}, fallback to versionCode=${MAX_VERSION_CODE}`);
    return MAX_VERSION_CODE;
  }

  return versionCode;
};

const main = () => {
  const revision = getCommitHash();
  const { version } = JSON.parse(readFileSync(PACKAGE_FILE, 'utf-8'));
  const versionCode = getVersionCode();
  const versionName = `${version}-${revision.substring(0, 7)}`;

  // Those lines are written to $GITHUB_ENV by the pipeline
  console.log(`auto_version=${version}`);
  console.log(`auto_version_code=${versionCode}`);
  console.log(`auto_version_name=${versionName}`);

  // Patch versionCode and versionName
  const gradle = readFileSync(GRADLE_FILE, 'utf-8');
  const patched = gradle.replace(/versionCode = .*/, `versionCode = ${versionCode}`).replace(/versionName = .*/, `versionName = "${versionName}"`);

  if (patched === gradle) {
    throw new Error(`Unable to patch versionCode/versionName in ${GRADLE_FILE}`);
  }

  writeFileSync(GRADLE_FILE, patched);
};

try {
  main();
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
