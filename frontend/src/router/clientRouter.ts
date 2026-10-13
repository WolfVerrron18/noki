import type { RouteRecordRaw } from 'vue-router'

// Экраны клиентки: /b/:slug/* — запись к мастеру, /my — мои записи
export const clientRoutes: RouteRecordRaw[] = [
  {
    path: '/b/:slug',
    component: () => import('@/views/client/BookingLayout.vue'),
    props: true,
    children: [
      {
        path: '',
        name: 'client-master',
        component: () => import('@/views/client/MasterPageView.vue'),
        props: true,
      },
      {
        path: 's/:serviceId',
        name: 'client-time',
        component: () => import('@/views/client/BookingTimeView.vue'),
        props: true,
      },
      {
        path: 's/:serviceId/confirm',
        name: 'client-confirm',
        component: () => import('@/views/client/BookingConfirmView.vue'),
        props: (route) => ({ ...route.params, start: String(route.query.start ?? '') }),
      },
      {
        path: 'done',
        name: 'client-done',
        component: () => import('@/views/client/BookingDoneView.vue'),
        props: true,
      },
    ],
  },
  {
    path: '/my',
    name: 'client-my',
    component: () => import('@/views/client/MyBookingsView.vue'),
  },
]
