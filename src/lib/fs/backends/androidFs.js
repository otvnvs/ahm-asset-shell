export const androidFs = {
  async getWebRoot() {
    const response = await fetch('/api/fs/webroot', { method: 'GET' });
    if (!response.ok) throw new Error(`Server returned error status code: ${response.status}`);
    const data = await response.json();
    return data.web_root_path;
  },

  async listDirectory(path = '') {
    const res = await fetch('/api/fs/list?path=' + encodeURIComponent(path), { method: 'GET' });
    if (!res.ok) throw new Error('API operation failed: ' + res.statusText);
    return res.json();
  },

  async readFile(path) {
    const res = await fetch('/api/fs/read?path=' + encodeURIComponent(path), { method: 'GET' });
    if (!res.ok) throw new Error('Failed to load file contents: ' + res.statusText);
    return res.text();
  },

  async writeFile(path, content) {
    const targetUrl = '/api/fs/write?path=' + encodeURIComponent(path) + '&content=' + encodeURIComponent(content);
    const res = await fetch(targetUrl, { method: 'POST' });
    if (!res.ok) throw new Error('API operation failed: ' + res.statusText);
    return res.json();
  },

  async createDirectory(path) {
    const res = await fetch('/api/fs/mkdir?path=' + encodeURIComponent(path) + '&recursive=true', { method: 'POST' });
    if (!res.ok) throw new Error('API operation failed: ' + res.statusText);
    return res.json();
  },

  async deleteItem(path) {
    const res = await fetch('/api/fs/delete?path=' + encodeURIComponent(path) + '&recursive=true', { method: 'DELETE' });
    if (!res.ok) throw new Error('API operation failed: ' + res.statusText);
    return res.json();
  },

  async zipArchive(sourcePath, targetZipPath) {
    const response = await fetch('/api/arc/zip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ sourcePath, targetZipPath })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({ message: 'Compression runtime error' }));
      throw new Error(errData.message || 'Native zip compression failure');
    }
    return response.json();
  },

  async unzipArchive(zipPath, targetDirectory, stripComponents = 0) {
    const response = await fetch('/api/arc/unzip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ zipPath, targetDirectory, stripComponents })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({ message: 'Extraction runtime error' }));
      throw new Error(errData.message || 'Native zip extraction failure');
    }
    return response.json();
  },

  async deletePath(path, recursive = true) {
    const response = await fetch(`/api/fs/delete?path=${encodeURIComponent(path)}&recursive=${recursive}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to clean path target file resource');
    return response.json();
  },

  async downloadFile(url, path) {
    const targetUrl = `/api/net/download?url=${encodeURIComponent(url)}&path=${encodeURIComponent(path)}`;
    const response = await fetch(targetUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Native download pipeline dropped' }));
      throw new Error(err.message || `Download endpoint returned status: ${response.status}`);
    }
    return response.json();
  }
};
