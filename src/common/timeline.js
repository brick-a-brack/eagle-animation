// Shared timeline math for pictures + audio sync.
//
// Pictures live in "frame-time" (cumulative `length`), audio lives in seconds.
// The framerate bridges the two: anchoring an audio chunk to a picture keeps the
// sound glued to its visual event, so changing the FPS never desyncs it.

const isAlive = (picture) => picture && !picture.deleted;

// Number of output frames held before a given picture (sum of `length` of every
// non-deleted picture located before `frameId`). Returns 0 if not found.
export const getFrameOffset = (scene, frameId) => {
  if (!scene?.pictures || frameId === null || frameId === undefined) {
    return 0;
  }
  let offset = 0;
  for (const picture of scene.pictures) {
    if (`${picture.id}` === `${frameId}`) {
      return offset;
    }
    if (isAlive(picture)) {
      offset += picture.length || 1;
    }
  }
  return 0;
};

// Total duration of a scene in output frames.
export const getSceneFramesCount = (scene) => (scene?.pictures || []).reduce((acc, p) => acc + (isAlive(p) ? p.length || 1 : 0), 0);

// Total duration of a scene in seconds, for a given framerate.
export const getSceneDurationSeconds = (scene, fps) => (fps > 0 ? getSceneFramesCount(scene) / fps : 0);

// Absolute start time (seconds) of an audio chunk for a given framerate.
// `frameID === null` anchors the chunk at the scene start (time 0).
export const getChunkStartSeconds = (chunk, scene, fps) => {
  const frames = chunk?.frameID === null || chunk?.frameID === undefined ? 0 : getFrameOffset(scene, chunk.frameID);
  const base = fps > 0 ? frames / fps : 0;
  return base + (chunk?.frameDelay || 0);
};
