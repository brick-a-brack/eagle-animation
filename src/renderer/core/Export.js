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
  const emitProgress = (v) => (typeof onProgress === 'function' ? onProgress(v) : null);
  const resolution = floorResolution(opts.resolution);

  console.log(`🤖 Exporting frames in ${resolution ? `${resolution.width || '(auto)'}x${resolution.height}` : 'original'}`);

  // Update progress
  emitProgress(0);

  const getNumberOfFrames = (frame, index, nbFrames) => {
    if (opts.duplicateFramesAuto && opts.duplicateFramesAutoNumber && (index === 0 || index === nbFrames - 1)) {
      return Number(opts.duplicateFramesAutoNumber) + frame.length - 1;
    }
    return opts.duplicateFramesCopy ? frame.length : 1;
  };

  // Generate frames
  const filteredFiles = files.filter((e) => !e.deleted && !e.hidden);
  const exportableFiles = filteredFiles
    .reduce((acc, e, i) => [...acc, ...Array(getNumberOfFrames(e, i, filteredFiles.length)).fill(e)], [])
    .map((e, i) => ({ ...e, index: i, type: 'FRAME' }))
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

  // Export each frame
  const cachedBuffers = new Map();
  const outputFrames = [];
  for (let i = 0; i < exportableFiles.length; i++) {
    const file = exportableFiles[i];
    const targetExtension = file.filename.split('.').pop() || 'jpg';
    const computedExtension = (typeof opts.forceFileExtension !== 'undefined' ? opts.forceFileExtension : targetExtension) || targetExtension;

    // If needed we calc the width based on frame ratio and defined height
    let copiedResolution = structuredClone(resolution);
    if (copiedResolution && !copiedResolution.width) {
      const frameResolution = await fetch(file.metaLink).then((res) => res.json());
      copiedResolution.width = floorResolutionValue((copiedResolution.height * frameResolution.width) / frameResolution.height) || copiedResolution.height;
    }

    // If buffer is not cached, compute it
    if (!cachedBuffers.has(`${file.type}:${file.id}`)) {
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
      cachedBuffers.set(`${file.type}:${file.id}`, bufferId);
    }

    // Send progress
    emitProgress((i + 1) / filteredFiles.length);

    // Return frame data
    outputFrames.push({
      id: file.id,
      index: file.index,
      type: file.type,
      length: file.length || 1,
      extension: computedExtension,
      mimeType: extensionToMimeType(computedExtension),
      bufferId: cachedBuffers.get(`${file.type}:${file.id}`),
    });
  }

  // Update progress
  emitProgress(1);

  // Return all frames
  return outputFrames;
};
