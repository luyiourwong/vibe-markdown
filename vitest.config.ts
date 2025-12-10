import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import {loadEnv} from "vite";
import {fileURLToPath, URL} from "node:url";

export default defineConfig(({ mode }) => {
    // 加載對應模式的環境變數
    const env = loadEnv(mode, process.cwd());

    return {
        plugins: [
            vue()
        ],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        // 動態指定 base：值來自環境變數
        base: env.VITE_ROOT_PATH || '/',
        test: {
            globals: true,
            environment: 'jsdom',
            coverage: {
                provider: 'v8',
                reporter: ['text', 'json', 'html', 'lcov'], // 添加 lcov
                reportsDirectory: './coverage',  // 指定覆蓋率報告目錄
                exclude: [
                    'node_modules/',
                    'dist/',
                    '**/*.d.ts',
                    '**/*.test.ts',
                    'coverage/**',
                    '**/*.config.*',
                    '**/env.*'
                ]
            }
        }
    };
});