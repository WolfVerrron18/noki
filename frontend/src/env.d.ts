/// <reference types="vite/client" />
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

/** Переменные окружения фронта (frontend/.env) */
interface ImportMetaEnv {
  /** username бота без @ */
  readonly VITE_BOT_USERNAME?: string
  /** short name Mini App из BotFather */
  readonly VITE_APP_SHORT_NAME?: string
  /** '1' — демо-сборка для GitHub Pages: режим просмотра без бэкенда (см. src/demo.ts) */
  readonly VITE_DEMO?: string
}
