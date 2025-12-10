/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string
    // 您可以在這裡加入其他環境變數
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}