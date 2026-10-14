# Nidoki

Telegram Mini App для записи к бьюти-мастеру. Маскот — котёнок-облачко Ноки.

- `frontend/` — Vue 3 + Vite + TS (мини-апп)
- `backend/` — Node.js + TypeScript: Hono (HTTP), Drizzle (запросы), PostgreSQL
- `docs/STATUS.md` — что сделано и что дальше, `docs/data-model.html` — какие данные храним

## Локальный запуск

Нужен Node.js 20+. PostgreSQL ставить не обязательно: без `DATABASE_URL` сервер поднимает PGlite — настоящий Postgres внутри Node, данные в `backend/data/`.

1. Фронт (его зависимости нужны и серверу: он импортирует общий код из `frontend/src`):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Сервер:
   ```bash
   cd backend
   npm install
   cp .env.example .env   # NIDOKI_DEV_AUTH=1 — вход тестовым пользователем без Telegram
   npm run dev
   ```
3. Откройте http://localhost:5173. Запросы `/api` Vite проксирует на сервер (`:8090`). Сервер не запущен — фронт сам переходит на данные в браузере (режим просмотра).

Проверки: `npm test` и `npx vue-tsc --noEmit` во `frontend/`, `npm test` и `npm run typecheck` в `backend/`.

## Как работает вход

Фронт отправляет `Telegram.WebApp.initData` на `POST /api/auth/telegram`. Сервер проверяет HMAC-подпись токеном бота и срок `auth_date` (24 ч), затем выдаёт свой токен (JWT, 7 дней). Без валидной подписи войти нельзя.

## Деплой (VPS + Nginx)

`cd backend && npm run build` собирает сервер в один файл `dist/server.mjs` (общий код фронта и зависимости внутри). На сервере: PostgreSQL, `DATABASE_URL`, свой `JWT_SECRET`, `NIDOKI_DEV_AUTH` не задан; миграции из `backend/migrations/` применяются при старте. Подробности — на этапе деплоя.
