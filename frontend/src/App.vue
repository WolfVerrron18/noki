<template>
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
import { useRoute } from 'vue-router'
import { NOKI_LOOK_KEY } from '@/components/mascot/look'
import NokiTour from '@/components/ui/NokiTour.vue'
import { useBooking } from '@/stores/booking'
import { useMaster } from '@/stores/master'
import { applyPalette, DEFAULT_PALETTE } from '@/styles/palettes'

const store = useMaster()
const booking = useBooking()
const route = useRoute()
provide(NOKI_LOOK_KEY, computed(() => store.master?.mascot))

/** Страница записи к мастеру (/b/:slug/*): там тема мастера из ссылки */
const isBookingPage = computed(() => route.matched.some((r) => r.path === '/b/:slug'))

watchEffect(() => {
  if (isBookingPage.value) applyPalette(booking.master?.theme ?? DEFAULT_PALETTE)
  else applyPalette(store.themePreview ?? store.master?.theme ?? DEFAULT_PALETTE)
})
</script>

<style>
.pop-enter-active, .pop-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.pop-enter-from { opacity: 0; transform: translateY(8px); }
.pop-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
