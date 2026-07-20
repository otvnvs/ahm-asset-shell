// Shared runtime file reader: OPFS first (persisted across reloads), then the
// in-memory fallback used when OPFS is unavailable. Key format is the SFC-loader
// style "./src/apps/foo/bar.vue". Used by sfcBootstrap.js, viteLoader.js, and
// appLoader.js so the OPFS/memory lookup logic lives in one place.

import { opfsRead, opfsAvailable } from './opfs.js';
import { memoryFsRead } from '../apps/marketplace/memoryInstaller.js';

export async function combinedFsRead(key) {
  if (opfsAvailable()) {
    const opfsKey = key.replace(/^\.\//, '');
    const content = await opfsRead(opfsKey);
    if (content !== null) return content;
  }
  return memoryFsRead(key);
}
