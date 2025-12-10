import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    assetsInlineLimit: 0, // Non inline-are i font, mantenerli come file separati
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Mantieni i font nella cartella assets
          let extType = assetInfo.name.split('.').at(1);
          if (/woff|woff2|ttf|eot/.test(extType)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://127.0.0.1:8443',
        changeOrigin: true,
        secure: false, // Ignora errori certificato SSL
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/datastore': {
        target: 'https://127.0.0.1:8443',
        changeOrigin: true,
        secure: false, // Ignora errori certificato SSL
        rewrite: (path) => path.replace(/^\/datastore/, '/datastore')
      }
    }
  }
});
