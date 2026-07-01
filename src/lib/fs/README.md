# File System REST API Documentation (`/api/fs`)

This documentation outlines the REST API endpoints (`/list`, `/read`, `/write`, `/mkdir`, `/delete`) exposed by the Android WebView interceptor (`WebViewClient.shouldInterceptRequest`). These endpoints support file management operations with optional client-side simulation via `localStorage` in offline scenarios.

## Endpoints

### 1. List Directory Contents
* **URL:** `/api/fs/list`
* **Method:** `GET`
* **Query Parameters:** `path` (string, required) - URL-encoded directory path.
* **Response:** JSON list of files/directories.

### 2. Read File Content
* **URL:** `/api/fs/read`
* **Method:** `GET`
* **Query Parameters:** `path` (string, required) - URL-encoded file path.
* **Response:** `text/plain` file content.

### 3. Write File Content
* **URL:** `/api/fs/write`
* **Method:** `POST`
* **Query Parameters:** `path` (string, required) - URL-encoded path.
* **Body:** `text/plain` content.

### 4. Create Directory
* **URL:** `/api/fs/mkdir`
* **Method:** `POST`
* **Query Parameters:** `path` (required), `recursive` (optional, boolean).

### 5. Delete File or Directory
* **URL:** `/api/fs/delete`
* **Method:** `DELETE`
* **Query Parameters:** `path` (required), `recursive` (optional, boolean).

