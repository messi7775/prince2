import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@prince-net/types': path.resolve(
                __dirname,
                '../../packages/types/src/index.ts',
            ),
            '@prince-net/validation': path.resolve(
                __dirname,
                '../../packages/validation/src/index.ts',
            ),
            '@prince-net/config': path.resolve(
                __dirname,
                '../../packages/config/src/index.ts',
            ),
        },
    },
    optimizeDeps: {
        exclude: [
            '@prince-net/types',
            '@prince-net/validation',
            '@prince-net/config',
        ],
    },
    server: {
        host: true,
        port: 5173,
        strictPort: true,
        allowedHosts: true,
        proxy: {
            '/api': {
                target: process.env.API_PROXY_TARGET ?? 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    preview: {
        host: true,
        port: 4173,
        strictPort: true,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        target: 'es2022',
    },
});