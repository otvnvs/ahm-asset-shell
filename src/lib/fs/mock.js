const LOCAL_STORAGE_KEY = "ahm-asset-shell";

const DEFAULT_MOCK_STORAGE = {
  "status": "success",
  "files": [
    { "name": "readme.txt", "isDirectory": false, "size": 142, "content": "Welcome to offline browser mode!" },

    { "name": "src/apps/taskmanager", "isDirectory": true, "size": 0 },
    {
      "name": "src/apps/taskmanager/app.json", 
      "isDirectory": false, 
      "size": 220, 
      "svgContent": "<line x1=\"18\" y1=\"20\" x2=\"18\" y2=\"10\"></line><line x1=\"12\" y1=\"20\" x2=\"12\" y2=\"4\"></line><line x1=\"6\" y1=\"20\" x2=\"6\" y2=\"14\"></line>"
    },

    { "name": "src/apps/todo", "isDirectory": true, "size": 0 },
    { 
      "name": "src/apps/todo/app.json", 
      "isDirectory": false, 
      "size": 165, 
      "content": "{\n  \"name\": \"Task Master\",\n  \"svgContent\": \"<path d=\\\"M9 11l3 3L22 4\\\"></path><path d=\\\"M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11\\\"></path>\"\n}" 
    },

    { "name": "src/apps/calendar", "isDirectory": true, "size": 0 },
    { 
      "name": "src/apps/calendar/app.json", 
      "isDirectory": false, 
      "size": 220, 
      "content": "{\n  \"name\": \"Calendar\",\n  \"svgContent\": \"<rect x=\\\"3\\\" y=\\\"4\\\" width=\\\"18\\\" height=\\\"18\\\" rx=\\\"2\\\" ry=\\\"2\\\"></rect><line x1=\\\"16\\\" y1=\\\"2\\\" x2=\\\"16\\\" y2=\\\"6\\\"></line><line x1=\\\"8\\\" y1=\\\"2\\\" x2=\\\"8\\\" y2=\\\"6\\\"></line><line x1=\\\"3\\\" y1=\\\"10\\\" x2=\\\"21\\\" y2=\\\"10\\\"></line>\"\n}" 
    },

    { "name": "src/apps/marketplace", "isDirectory": true, "size": 0 },
    { 
      "name": "src/apps/marketplace/app.json", 
      "isDirectory": false, 
      "size": 210, 
      "content": "{\n  \"name\": \"Marketplace\",\n  \"svgContent\": \"<circle cx=\\\"12\\\" cy=\\\"12\\\" r=\\\"10\\\"></circle><line x1=\\\"22\\\" y1=\\\"12\\\" x2=\\\"2\\\" y2=\\\"12\\\"></line><path d=\\\"M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z\\\"></path>\"\n}" 
    }

  ]
};

function getMockDatabase() {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_STORAGE));
    return DEFAULT_MOCK_STORAGE;
  }
  return JSON.parse(data);
}

function saveMockDatabase(db) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
}

export const mockFileSystem = {
  list(path = '') {
    const db = getMockDatabase();
    // Normalize path to make filtering reliable
    const targetPath = path ? (path.endsWith('/') ? path : path + '/') : '';
    
    const results = db.files.filter(file => {
      if (targetPath === '') {
        return !file.name.includes('/');
      }
      if (file.name.startsWith(targetPath)) {
        const subName = file.name.substring(targetPath.length);
        return subName.length > 0 && !subName.includes('/');
      }
      return false;
    }).map(file => {
      const parts = file.name.split('/');
      return {
        name: parts[parts.length - 1],
        isDirectory: file.isDirectory,
        size: file.size || 0
      };
    });
    return { status: "success", files: results, isOfflineMock: true };
  },
  read(path) {
    const db = getMockDatabase();
    const file = db.files.find(f => f.name === path && !f.isDirectory);
    if (!file) throw new Error(`File not found in mock storage: ${path}`);
    return file.content || '';
  },
  write(path, content) {
    const db = getMockDatabase();
    const existingFileIndex = db.files.findIndex(f => f.name === path);
    if (existingFileIndex >= 0) {
      if (db.files[existingFileIndex].isDirectory) throw new Error("Cannot write data over a folder.");
      db.files[existingFileIndex].content = content;
      db.files[existingFileIndex].size = new Blob([content]).size;
    } else {
      db.files.push({ name: path, isDirectory: false, size: new Blob([content]).size, content: content });
    }
    saveMockDatabase(db);
    return { status: "success" };
  },
  mkdir(path) {
    const db = getMockDatabase();
    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const exists = db.files.some(f => f.name === cleanPath);
    if (!exists) {
      db.files.push({ name: cleanPath, isDirectory: true, size: 0 });
      saveMockDatabase(db);
    }
    return { status: "success" };
  },
  delete(path) {
    const db = getMockDatabase();
    db.files = db.files.filter(f => f.name !== path && !f.name.startsWith(path + '/'));
    saveMockDatabase(db);
    return { status: "success" };
  }
};

