import { defineConfig } from 'vite';
import path from 'path';

const sharedAssetsRoot = path.resolve(__dirname, '../../assets/user_imports');

export default defineConfig({
  root: path.resolve(__dirname),
  publicDir: path.resolve(__dirname, 'assets_external'),
  resolve: {
    alias: {
      '@sharedAssets': sharedAssetsRoot,
    },
  },
  server: {
    host: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
