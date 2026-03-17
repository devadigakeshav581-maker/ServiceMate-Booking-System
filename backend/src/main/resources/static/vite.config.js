import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    viteCompression(),
    visualizer({ open: true, gzipSize: true, brotliSize: true })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.js',
  },
  build: {
    // Output directly to Spring Boot's static folder
    // Relative path from 'frontend' directory to 'backend' static directory
    outDir: '../backend/src/main/resources/static',
    emptyOutDir: true, // Clears the static folder before building
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['socket.io-client'],
        },
      },
    },
  },
  server: {
    proxy: {
      // Proxy API requests to the Spring Boot backend during development
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true
      }
    }
  }
});