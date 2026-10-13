import type { RouteRecordRaw } from 'vue-router'

// Экраны мастера: /m/*. requiresMaster — без профиля мастера отправляем в онбординг
export const masterRoutes: RouteRecordRaw[] = [
  {
    path: '/m',
    name: 'master-home',
    component: () => import('@/views/master/HomeView.vue'),
    meta: { requiresMaster: true },
  },
  {
    path: '/m/onboarding',
    name: 'master-onboarding',
    component: () => import('@/views/master/OnboardingView.vue'),
  },
  {
    path: '/m/profile',
    name: 'master-profile',
    component: () => import('@/views/master/ProfileView.vue'),
    meta: { requiresMaster: true },
  },
  {
    path: '/m/hours',
    name: 'master-hours',
    component: () => import('@/views/master/HoursView.vue'),
    meta: { requiresMaster: true },
  },
  {
    path: '/m/schedule',
    name: 'master-schedule',
    component: () => import('@/views/master/schedule/ScheduleView.vue'),
    meta: { requiresMaster: true },
  },
  {
    path: '/m/schedule/new',
    name: 'master-schedule-new',
    component: () => import('@/views/master/schedule/ManualBookingView.vue'),
    meta: { requiresMaster: true },
  },
  {
    path: '/m/feedback',
    name: 'master-feedback',
    component: () => import('@/views/master/FeedbackView.vue'),
    meta: { requiresMaster: true },
  },
  {
    path: '/m/mascot',
    name: 'master-mascot',
    component: () => import('@/views/master/MascotEditorView.vue'),
    meta: { requiresMaster: true },
  },
  {
    path: '/m/services',
    name: 'master-services',
    component: () => import('@/views/master/services/ServicesView.vue'),
    meta: { requiresMaster: true },
  },
  {
    path: '/m/services/new',
    name: 'master-service-new',
    component: () => import('@/views/master/services/ServiceEditView.vue'),
    meta: { requiresMaster: true },
  },
  {
    path: '/m/services/:id',
    name: 'master-service-edit',
    component: () => import('@/views/master/services/ServiceEditView.vue'),
    props: true,
    meta: { requiresMaster: true },
  },
]
