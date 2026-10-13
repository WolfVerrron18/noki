<template>
  <!-- режим просмотра в браузере: со страниц клиентки и мастера всегда можно вернуться к выбору роли -->
  <button v-if="previewBar" type="button" class="preview-bar" @click="router.push({ name: 'start' })">
    {{ t('preview.switch') }}
  </button>
  <RouterView v-slot="{ Component }">
    <Transition name="pop" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
  <NokiTour />
</template>

<script setup lang="ts">
// Ноки текущего мастера на всех экранах; страницы клиентки переопределяют своим мастером.
// Цветовая тема — тоже мастера: на страницах записи — того, к кому записываются.
import { computed, provide, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { isInTelegram } from '@/telegram'
import { NOKI_LOOK_KEY } from '@/components/mascot/look'
import NokiTour from '@/components/ui/NokiTour.vue'
import { useBooking } from '@/stores/booking'
import { useMaster } from '@/stores/master'
import { applyPalette, DEFAULT_PALETTE } from '@/styles/palettes'

const store = useMaster()
const booking = useBooking()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

/** Полоска «сменить роль»: только npm run dev в браузере и не на самом экране выбора */
const previewBar = computed(() => import.meta.env.DEV && !isInTelegram() && route.name !== 'start' && !route.meta.public)
provide(NOKI_LOOK_KEY, computed(() => store.master?.mascot))

/** Страница записи к мастеру (/b/:slug/*): там тема мастера из ссылки */
const isBookingPage = computed(() => route.matched.some((r) => r.path === '/b/:slug'))

watchEffect(() => {
  if (isBookingPage.value) applyPalette(booking.master?.theme ?? DEFAULT_PALETTE)
  else applyPalette(store.themePreview ?? store.master?.theme ?? DEFAULT_PALETTE)
})
</script>

<style>
.preview-bar {
  display: block;
  margin: 0 auto var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  border: 1px dashed var(--secondary-300);
  border-radius: var(--radius-pill);
  background: var(--secondary-100);
  color: var(--secondary-on-soft);
  font: inherit;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.pop-enter-active, .pop-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.pop-enter-from { opacity: 0; transform: translateY(8px); }
.pop-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
