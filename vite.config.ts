import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { execSync } from "node:child_process";

const getCommitHash = () => {
    const environmentHash =
        process.env.CF_PAGES_COMMIT_SHA ||
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.GITHUB_SHA ||
        process.env.COMMIT_SHA;

    if (environmentHash) return environmentHash.substring(0, 7);

    try {
        return execSync("git rev-parse --short=7 HEAD", { encoding: "utf8" }).trim();
    } catch {
        return "unknown";
    }
};

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [wasm(), topLevelAwait(), react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    define: {
        __COMMIT_HASH__: JSON.stringify(getCommitHash()),
    },
})
