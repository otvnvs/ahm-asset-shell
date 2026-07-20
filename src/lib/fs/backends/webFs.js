export const webFs = {
  getWebRoot() {
    return '';
  },

  async listDirectory(path = '') {
    const appsJsonUrl = 'src/apps/apps.json';
    const res = await fetch(appsJsonUrl);
    if (!res.ok) throw new Error('Failed to load apps.json: ' + res.statusText);
    const entries = await res.json();
    const normalizedPath = path.replace(/\/$/, '');
    const results = entries.filter(entry => {
      const entryPath = entry.path.replace(/\/$/, '');
      const parent = entryPath.substring(0, entryPath.lastIndexOf('/'));
      return parent === normalizedPath;
    }).map(entry => ({
      name: entry.path.split('/').pop(),
      isDirectory: entry.isDirectory,
      size: 0
    }));
    return { status: 'success', files: results };
  },

  async readFile(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error('Failed to read file: ' + path);
    return res.text();
  },

  writeFile() {
    throw new Error('NotSupportedInWebMode: writeFile');
  },

  createDirectory() {
    throw new Error('NotSupportedInWebMode: createDirectory');
  },

  deleteItem() {
    throw new Error('NotSupportedInWebMode: deleteItem');
  },

  deletePath() {
    throw new Error('NotSupportedInWebMode: deletePath');
  },

  zipArchive() {
    throw new Error('NotSupportedInWebMode: zipArchive');
  },

  unzipArchive() {
    throw new Error('NotSupportedInWebMode: unzipArchive');
  },

  downloadFile() {
    throw new Error('NotSupportedInWebMode: downloadFile');
  }
};
