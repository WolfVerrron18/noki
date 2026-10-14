import type { RouteRecordRaw } from 'vue-router'
import { isLegalDoc } from '@/legal/documents'

// Юридические документы: /legal/<документ>. Открываются без входа — ссылку можно дать кому угодно
export const legalRoutes: RouteRecordRaw[] = [
  {
    path: '/legal/:doc',
    name: 'legal-doc',
    component: () => import('@/views/legal/LegalView.vue'),
    props: true,
    meta: { public: true },
    // неизвестный документ — на старт, а не пустая страница
    beforeEnter: (to) => (isLegalDoc(to.params.doc) ? true : { name: 'start' }),
  },
]
