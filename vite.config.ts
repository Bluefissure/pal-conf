import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [wasm(), topLevelAwait(), react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    define: {
        __COMMIT_HASH__: JSON.stringify(process.env.CF_PAGES_COMMIT_SHA?.substring(0, 7)),
    },
})
