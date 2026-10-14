import { createRouter, createWebHistory } from 'vue-router'
import { masterRoutes } from '@/router/masterRouter'
import { clientRoutes } from '@/router/clientRouter'
import { devRoutes } from '@/router/devRouter'
import { useAuth } from '@/stores/auth'
import { useMaster } from '@/stores/master'

declare module 'vue-router' {
  interface RouteMeta {
    /** Только для мастера: без профиля — редирект в онбординг */
    requiresMaster?: boolean
    /** Открывается без входа (служебные экраны) */
    public?: boolean
  }
}

// Корневой роутер: только собирает модули. Маршруты раздела — в <section>Router.ts
export const router = createRouter({
  // базовый путь сборки: '/' или '/<репозиторий>/' на GitHub Pages
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'start', component: () => import('@/views/StartView.vue') },
    ...masterRoutes,
    ...clientRoutes,
    ...devRoutes,
    { path: '/:pathMatch(.*)*', redirect: { name: 'start' } },
  ],
})

router.beforeEach(async (to) => {
  if (to.name === 'start' || to.meta.public) return true

  // Перезагрузили страницу или открыли по прямому адресу — входим и продолжаем на тот же экран.
  // Если войти не удалось, стартовый экран покажет ошибку и кнопку «Попробовать ещё раз».
  const auth = useAuth()
  if (!auth.me) await auth.login()
  if (!auth.me) return { name: 'start' }

  const isOnboarding = to.name === 'master-onboarding'
  if (to.meta.requiresMaster || isOnboarding) {
    const store = useMaster()
    try {
      await store.load()
    } catch {
      auth.error = 'common.networkError'
      return { name: 'start' }
    }
    if (to.meta.requiresMaster && !store.master) return { name: 'master-onboarding' }
    // профиль уже есть — повторный онбординг не нужен
    if (isOnboarding && store.master) return { name: 'master-home' }
  }
  return true
})
