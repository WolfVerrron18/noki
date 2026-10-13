import PocketBase from 'pocketbase'

// В проде фронт и API на одном домене (Nginx проксирует /api), в dev — прокси Vite
export const pb = new PocketBase(location.origin)
pb.autoCancellation(false)
