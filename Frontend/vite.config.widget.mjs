import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/widget/index.ts'),
            name: 'CluaizWidget',
            fileName: () => 'widget.js',
            formats: ['iife'],
        },
        outDir: 'public',
        emptyOutDir: false, // Don't wipe public folder, just overwrite widget.js
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: false, // Keep console for debugging for now
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
});
