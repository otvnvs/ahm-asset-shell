import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  // Use a relative base path so assets load correctly from ANY subdirectory level
  base: './',	 
  
  plugins: [
    vue(),

    // FIX: Dynamic middleware that doesn't care what your subfolder or repo name is
    {
      name: 'dev-server-spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Clean the URL by stripping query parameters or hashes for the check
          const cleanUrl = req.url.split('?')[0].split('#')[0];

          // Only rewrite root-level navigation. Applet HTML files under
          // /src/apps/ (e.g. iframe applet dist/index.html) must be served as-is.
          if (cleanUrl === '/' || cleanUrl === '/index.html') {
            req.url = req.url.replace(/(index\.html|\/)$/, 'index.vite.html');
          }
          next();
        });
      }
    },
    
    // Keeps your production build output named correctly as index.html inside dist/
    {
      name: 'rename-vite-html-output',
      closeBundle: async () => {
        const buildDir = resolve(__dirname, 'dist');
        const oldPath = path.join(buildDir, 'index.vite.html');
        const newPath = path.join(buildDir, 'index.html');
        
        if (fs.existsSync(oldPath)) {
          await fs.promises.rename(oldPath, newPath);
          console.log('Successfully renamed build output to standard index.html');
        }
      }
    },

    // Watches src/apps/ for new or removed applet entry files and notifies the
    // launcher via a custom HMR event so the grid refreshes immediately.
    {
      name: 'applet-watcher',
      apply: 'serve',
      configureServer(server) {
        const appsDir = path.join(__dirname, 'src', 'apps');
        const notify = () => server.ws.send({ type: 'custom', event: 'applet-list-changed' });
        server.watcher.on('add',    (f) => { if (f.startsWith(appsDir)) notify(); });
        server.watcher.on('unlink', (f) => { if (f.startsWith(appsDir)) notify(); });
      }
    }
  ],
  server: {
    // Opens directly to your local file during npm run dev
    //open: '/index.vite.html' ,
    host: '0.0.0.0', // Forces Vite to use IPv4 instead of IPv6 (::1)
    port: 5173         // Or your preferred port
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.vite.html')
      }
    }
  }
});

