import { floorResolution, floorResolutionValue } from '@common/resolution';
import { Buffer } from 'buffer';
import { v4 } from 'uuid';

import { extensionToMimeType } from './frameTypes';
import { getPictureLink } from './resize';

export const ExportFrames = async (
  projectId = null, // eslint-disable-line no-unused-vars
  sceneId = null, // eslint-disable-line no-unused-vars
  files = [],
  opts = {
    duplicateFramesCopy: true,
    duplicateFramesAuto: false,
    duplicateFramesAutoNumber: 1,
    forceFileExtension: undefined,
    resolution: null,
    exportMaskingLayers: false,
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
  const rawFrames = [];
  const filteredFrames = files
    .filter((e) => !e.deleted && !e.hidden)
    .map((e, index) => ({ ...e, index, type: 'FRAME' }))
    .reduce(
      (acc, e) => [
        ...acc,
        ...(e.masking && opts.exportMaskingLayers
          ? [
              e,
              ...(e.masking.background ? [{ ...e.masking.background, type: 'MASKING_BACKGROUND', index: e.index, length: e.length }] : []),
              ...(e.masking.foreground ? [{ ...e.masking.foreground, type: 'MASKING_FOREGROUND', index: e.index, length: e.length }] : []),
              ...(e.masking.transparent ? [{ ...e.masking.transparent, type: 'MASKING_TRANSPARENT', index: e.index, length: e.length }] : []),
            ]
          : [e]),
      ],
      []
    );
  for (const file of filteredFrames) {
    const targetExtension = file.filename.split('.').pop() || 'jpg';
    const computedExtension = (typeof opts.forceFileExtension !== 'undefined' ? opts.forceFileExtension : targetExtension) || targetExtension;

    // If needed we calc the width based on frame ratio and defined height
    let copiedResolution = structuredClone(resolution);
    if (copiedResolution && !copiedResolution.width) {
      const frameResolution = await fetch(file.metaLink).then((res) => res.json());
      copiedResolution.width = floorResolutionValue((copiedResolution.height * frameResolution.width) / frameResolution.height) || copiedResolution.height;
    }

    // Compute frame using web worker
    const frameArrayBuffer = await fetch(
      getPictureLink(file.link, {
        ...(copiedResolution && copiedResolution.width ? { w: copiedResolution.width } : {}),
        ...(copiedResolution && copiedResolution.height ? { h: copiedResolution.height } : {}),
        ...(copiedResolution
          ? {
              m: 'cover',
              q: 100,
            }
          : {}),
        ...(typeof opts.forceFileExtension !== 'undefined' ? { f: computedExtension } : {}),
      })
    ).then((res) => res.arrayBuffer());

    // Write file on disk/ram
    const bufferId = v4();
    await onBufferCreate(bufferId, Buffer.from(frameArrayBuffer));

    // Increase counter
    onFrameDone();

    // Return frame data
    rawFrames.push({
      id: file.id,
      index: file.index,
      type: file.type,
      length: file.length || 1,
      extension: computedExtension,
      mimeType: extensionToMimeType(computedExtension),
      bufferId: bufferId,
    });
  }
  const frames = rawFrames?.filter(Boolean);

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

  return frames?.reduce((acc, e, i) => [...acc, ...Array(getNumberOfFrames(e, e.index)).fill(e)], []).map((e, i) => ({ ...e, index: e.index }));
};
