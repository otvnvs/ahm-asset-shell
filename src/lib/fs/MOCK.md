# Local Storage Mock Filesystem (`mock.js`)

This document details the architecture, data schemas, and runtime behaviors of the localized virtualization layer. This system replicates full directory mapping and document stream reading/writing via the browser's synchronous `localStorage` sandbox whenever native Android intercept services are unavailable.

---

## 1. System Constants & Fallback Payload
The mock engine targets an isolated data partition key to keep storage safe from collision:

*   **Partition Key:** `ahm-asset-shell`

### Default Storage Topology Tree
Upon initial boot in an environment lacking native intercept vectors, the engine seeds the default virtual tree structure below:

```json
{
  "status": "success",
  "files": [
    { "name": "readme.txt", "isDirectory": false, "size": 142, "content": "Welcome to offline browser mode!" },
    { "name": "src/apps/todo", "isDirectory": true, "size": 0 },
    { 
      "name": "src/apps/todo/app.json", 
      "isDirectory": false, 
      "size": 254, 
      "content": "{\n  \"name\": \"Task Master\",\n  \"route\": \"/apps/todo\",\n  \"svgContent\": \"<path d=\\\"M9 11l3 3L22 4\\\"></path><path d=\\\"M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11\\\"></path>\"\n}" 
    }
  ]
}
```

---

## 2. API Contract Implementations
The exported `mockFileSystem` object exposes five structural CRUD operations mimicking standard POSIX file behaviors:

1.  **`list(path)`**: Filters single-level deep array matches. Ensures nested objects containing unrequested child slashes remain hidden until explicitly searched.
2.  **`read(path)`**: Scans for exact string matches on file keys and returns plain-text or binary data packages.
3.  **`write(path, content)`**: Validates path permissions. Updates file sizes dynamically using standard object `Blob` metrics and commits the changes back to local storage.
4.  **`mkdir(path)`**: Generates structural folder indicators in the flat database collection if they do not already exist.
5.  **`delete(path)`**: Performs recursive tree wipes by stripping out matching file paths alongside all child keys beginning with a matching sub-directory prefix.

---

## 3. Testing New Mock Applications
To test the addition of new sub-applications directly inside a desktop browser before pushing them onto your physical Android container, you can execute the configuration snippet below. 

Open your browser's Developer Tools Console while on your homepage workspace (`http://localhost:1234/#/home`), paste this code, and press **Enter**:

```javascript
(function seedMonitorApp() {
  const key = "ahm-asset-shell";
  const db = JSON.parse(localStorage.getItem(key) || '{"status":"success","files":[]}');
  
  // 1. Inject Folder Entry
  if (!db.files.some(f => f.name === "src/apps/monitor")) {
    db.files.push({ name: "src/apps/monitor", isDirectory: true, size: 0 });
  }
  
  // 2. Inject Automated App Manifest
  const manifestContent = JSON.stringify({
    name: "System Monitor",
    route: "/apps/monitor",
    svgContent: '<rect x=\"2\" y=\"3\" width=\"20\" height=\"14\" rx=\"2\" ry=\"2\"></rect><line x1=\"8\" y1=\"21\" x2=\"16\" y2=\"21\"></line><line x1=\"12\" y1=\"17\" x2=\"12\" y2=\"21\"></line>'
  }, null, 2);
  
  const manifestIdx = db.files.findIndex(f => f.name === "src/apps/monitor/app.json");
  if (manifestIdx >= 0) db.files[manifestIdx].content = manifestContent;
  else db.files.push({ name: "src/apps/monitor/app.json", isDirectory: false, size: manifestContent.length, content: manifestContent });

  localStorage.setItem(key, JSON.stringify(db));
  console.log("System Monitor configuration successfully seeded into browser storage!");
  location.reload();
})();
```

Another example, without `route` specified to illustrate autocomputing the route

```javascript
(function seedCalendarMock() {
  const key = "ahm-asset-shell";
  const db = JSON.parse(localStorage.getItem(key) || '{"status":"success","files":[]}');
  
  // 1. Inject Folder Entry
  if (!db.files.some(f => f.name === "src/apps/calendar")) {
    db.files.push({ name: "src/apps/calendar", isDirectory: true, size: 0 });
  }
  
  // 2. Inject Automated App Manifest (No route parameter included!)
  const manifestContent = JSON.stringify({
    name: "Calendar",
    svgContent: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>'
  }, null, 2);
  
  const manifestIdx = db.files.findIndex(f => f.name === "src/apps/calendar/app.json");
  if (manifestIdx >= 0) db.files[manifestIdx].content = manifestContent;
  else db.files.push({ name: "src/apps/calendar/app.json", isDirectory: false, size: manifestContent.length, content: manifestContent });

  localStorage.setItem(key, JSON.stringify(db));
  console.log("Calendar testing configuration successfully seeded into browser storage!");
  location.reload();
})();
```

Executing this code bypasses manual manifest editing, updates the runtime router structures immediately, and displays your new test app card right on your dashboard screen.

---

## 4. Phase 1 Marketplace Pre-Seeding Configurations

To test remote repository parsing and GitHub API interface actions seamlessly in a headless desktop browser environment, the `DEFAULT_MOCK_STORAGE` file includes a zero-configuration profile for the Marketplace applet. This initializes the entry point without manual routing declarations:

```json
{
  "name": "src/apps/marketplace",
  "isDirectory": true,
  "size": 0
},
{ 
  "name": "src/apps/marketplace/app.json", 
  "isDirectory": false, 
  "size": 210, 
  "content": "{\n  \"name\": \"Marketplace\",\n  \"svgContent\": \"<circle cx=\\\"12\\\" cy=\\\"12\\\" r=\\\"10\\\"></circle><line x1=\\\"22\\\" y1=\\\"12\\\" x2=\\\"2\\\" y2=\\\"12\\\"></line><path d=\\\"M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z\\\"></path>\"\n}" 
}
```

### Clearing Workspace Profile Memory
When applying structural schema adjustments to the default mock tree layout, any cached configurations must be wiped out using the browser developer console:
```javascript
localStorage.removeItem('ahm-asset-shell');
location.reload();
```

