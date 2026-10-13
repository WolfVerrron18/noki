# Nidoki 💅

Telegram Mini App для записи к мастеру. Маскот — котёнок-облачко Ноки.

## Локальный запуск

1. Скачайте [Pocketbase](https://github.com/pocketbase/pocketbase/releases) (v0.23+) и положите бинарник в `backend/`.
2. Запустите бэкенд (миграции применятся сами):
   ```bash
   cd backend
   TELEGRAM_BOT_TOKEN=<токен> NIDOKI_DEV_AUTH=1 ./pocketbase serve
   ```
   `NIDOKI_DEV_AUTH=1` разрешает вход без Telegram под тестовым пользователем. **На проде не включать.**
3. Запустите фронт:
   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```
   Откройте http://localhost:5173. Запросы `/api` проксируются на Pocketbase (`:8090`).

## Как работает вход

Фронт отправляет `Telegram.WebApp.initData` на `POST /api/tg-auth`. Сервер проверяет HMAC-подпись токеном бота и срок `auth_date` (24 ч), затем выдаёт токен Pocketbase. Без валидной подписи войти нельзя.

## Деплой (VPS + Nginx)

Будет описан на шаге 11.
