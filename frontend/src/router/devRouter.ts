import type { RouteRecordRaw } from 'vue-router'

// Служебные экраны: /dev/*. Подключаются только в npm run dev
export const devRoutes: RouteRecordRaw[] = import.meta.env.DEV
  ? [
      {
        path: '/dev/mascot',
        name: 'dev-mascot',
        component: () => import('@/views/dev/MascotPlaygroundView.vue'),
        meta: { public: true },
      },
    ]
  : []
