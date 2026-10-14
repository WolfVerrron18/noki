// Режим просмотра: приложение открыто в браузере, без Telegram и (возможно) без бэкенда.
// Есть в npm run dev и в демо-сборке для GitHub Pages (VITE_DEMO=1); в обычной production-сборке его нет.

/** Демо-сборка для показа с телефона: бэкенда нет совсем, данные сразу в браузере */
export const DEMO_BUILD = import.meta.env.VITE_DEMO === '1'

/** Режим просмотра вне Telegram: выбор роли, тестовый пользователь, полоска «сменить роль» */
export const PREVIEW_MODE = import.meta.env.DEV || DEMO_BUILD
