import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import { router } from '@/router/router'
import { i18n } from '@/i18n'
import { initTelegram } from '@/telegram'
import { vPress } from '@/animations/press'
import { vPop } from '@/animations/pop'
import { vFill } from '@/animations/fill'
import '@/styles/main.scss'

initTelegram()
createApp(App).use(createPinia()).use(router).use(i18n).directive('press', vPress).directive('pop', vPop).directive('fill', vFill).mount('#app')
