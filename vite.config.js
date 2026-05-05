import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'three-core': ['three'],
          'gsap': ['gsap'],
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true,
  },
  optimizeDeps: {
    include: ['three', 'gsap']
  }
});
