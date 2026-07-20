// OPFS (Origin Private File System) utility module.
// All paths are slash-separated strings without a leading slash, e.g. "src/apps/recorder/index.vue".
// Returns null / false gracefully when OPFS is unavailable or a file does not exist.

export function opfsAvailable() {
  return typeof navigator !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage;
}

// Walks path segments and returns the final FileSystemDirectoryHandle, creating dirs as needed.
async function resolveDir(segments, create = false) {
  let dir = await navigator.storage.getDirectory();
  for (const seg of segments) {
    dir = await dir.getDirectoryHandle(seg, { create });
  }
  return dir;
}

// Splits "src/apps/foo/index.vue" → { dirSegments: ["src","apps","foo"], name: "index.vue" }
function splitPath(path) {
  const parts = path.replace(/^\//, '').split('/');
  return { dirSegments: parts.slice(0, -1), name: parts[parts.length - 1] };
}

export async function opfsWrite(path, content) {
  if (!opfsAvailable()) return;
  const { dirSegments, name } = splitPath(path);
  const dir = await resolveDir(dirSegments, true);
  const fh = await dir.getFileHandle(name, { create: true });
  const writable = await fh.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function opfsRead(path) {
  if (!opfsAvailable()) return null;
  try {
    const { dirSegments, name } = splitPath(path);
    const dir = await resolveDir(dirSegments, false);
    const fh = await dir.getFileHandle(name);
    const file = await fh.getFile();
    return await file.text();
  } catch (_) {
    return null;
  }
}

export async function opfsExists(path) {
  if (!opfsAvailable()) return false;
  try {
    const { dirSegments, name } = splitPath(path);
    const dir = await resolveDir(dirSegments, false);
    await dir.getFileHandle(name);
    return true;
  } catch (_) {
    return false;
  }
}

// Recursively deletes an OPFS directory tree (or a single file).
export async function opfsDelete(path) {
  if (!opfsAvailable()) return;
  try {
    const { dirSegments, name } = splitPath(path);
    if (dirSegments.length === 0) {
      // deleting from root
      const root = await navigator.storage.getDirectory();
      await root.removeEntry(name, { recursive: true });
    } else {
      const dir = await resolveDir(dirSegments, false);
      await dir.removeEntry(name, { recursive: true });
    }
  } catch (_) { /* not found — treat as success */ }
}

// Lists entry names in an OPFS directory. Returns [] if directory doesn't exist.
export async function opfsList(path) {
  if (!opfsAvailable()) return [];
  try {
    const segments = path.replace(/^\//, '').split('/').filter(Boolean);
    const dir = await resolveDir(segments, false);
    const names = [];
    for await (const [name] of dir.entries()) {
      names.push(name);
    }
    return names;
  } catch (_) {
    return [];
  }
}
