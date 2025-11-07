import { floorResolution, floorResolutionValue } from '@common/resolution';
import { Buffer } from 'buffer';
import { v4 } from 'uuid';

import { GetFrameResolution } from './ResolutionsCache';
import { ExportFrame } from './Worker';

export const ExportFrames = async (
  projectId = null,
  sceneId = null,
  files = [],
  opts = {
    duplicateFramesCopy: true,
    duplicateFramesAuto: false,
    duplicateFramesAutoNumber: 1,
    forceFileExtension: undefined,
    resolution: null,
  },
  onProgress = () => {},
  onBufferCreate = () => {}
) => {
  const resolution = floorResolution(opts.resolution);

  console.log(`🤖 Exporting frames in ${resolution ? `${resolution.width || '(auto)'}x${resolution.height}` : 'original'}`);

  // Update progress
  if (typeof onProgress === 'function') {
    onProgress(0);
  }

  // Update counter based on finished promise value
  let framesDone = 0;
  const onFrameDone = () => {
    framesDone++;
    if (typeof onProgress === 'function') {
      onProgress(framesDone / files.length);
    }
  };

  // Generate frames
  const frames = (
    await Promise.all(
      files.map(async (file) => {
        if (file.deleted || file.hidden) {
          onFrameDone();
          return null;
        }
        const targetExtension = file.filename.split('.').pop() || 'jpg';
        const computedExtension = (typeof opts.forceFileExtension !== 'undefined' ? opts.forceFileExtension : targetExtension) || targetExtension;

        // If needed we calc the width based on frame ratio and defined height
        let copiedResolution = structuredClone(resolution);
        if (copiedResolution && !copiedResolution.width) {
          const frameResolution = await GetFrameResolution(projectId, sceneId, file.id, file.link);
          copiedResolution.width = floorResolutionValue((copiedResolution.height * frameResolution.width) / frameResolution.height) || copiedResolution.height;
        }

        // Compute frame using web worker
        const frameBlob = await ExportFrame(file.link, copiedResolution, typeof opts.forceFileExtension !== 'undefined' ? computedExtension : undefined, 'cover');

        // Write file on disk/ram
        const bufferId = v4();
        await onBufferCreate(bufferId, Buffer.from(await frameBlob.arrayBuffer()));

        // Increase counter
        onFrameDone();

        // Return frame data
        return {
          id: file.id,
          length: file.length || 1,
          extension: computedExtension,
          mimeType: `image/${(computedExtension || 'jpg').replace('jpg', 'jpeg')}`,
          bufferId: bufferId,
        };
      })
    )
  )?.filter(Boolean);

  // Update progress
  if (typeof onProgress === 'function') {
    onProgress(1);
  }

  const getNumberOfFrames = (frame, index) => {
    if (opts.duplicateFramesAuto && opts.duplicateFramesAutoNumber && (index === 0 || index === frames.length - 1)) {
      return Number(opts.duplicateFramesAutoNumber) + frame.length - 1;
    }
    return opts.duplicateFramesCopy ? frame.length : 1;
  };

  return frames?.reduce((acc, e, i) => [...acc, ...Array(getNumberOfFrames(e, i)).fill(e)], []).map((e, i) => ({ ...e, index: i }));
};
