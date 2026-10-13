<template>
  <div class="stack center page">
    <div class="burst">
      <!-- Ноки радуется, конфетти вылетает на верхней точке его прыжка -->
      <NokiMascot :size="180" :greet="EnumNokiReaction.Cheer" @ready="onNokiReady" />
      <NokiConfetti :count="36" :autoplay="false" :trigger="burst" />
    </div>
    <h1>{{ t('booking.doneTitle') }}</h1>

    <NokiCard v-if="booking" class="summary">
      <strong>{{ booking.service_name }}</strong>
      <p class="when">{{ fmt.dateLong(booking.start_at, master.timezone) }}, {{ fmt.time(booking.start_at, master.timezone) }}</p>
      <p class="hint">{{ master.name }}</p>
    </NokiCard>

    <p class="hint">{{ t('booking.doneHint') }}</p>

    <NokiButton @click="router.push({ name: 'client-my' })">{{ t('booking.toMyBookings') }}</NokiButton>
    <NokiButton variant="soft" @click="router.push({ name: 'client-master', params: { slug } })">{{ t('booking.bookMore') }}</NokiButton>
  </div>
</template>

<script setup lang="ts">
// Запись создана
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiMascot from '@/components/mascot/NokiMascot.vue'
import { EnumNokiReaction } from '@/components/mascot/rive/character'
import NokiButton from '@/components/ui/NokiButton.vue'
import NokiCard from '@/components/ui/NokiCard.vue'
import NokiConfetti from '@/components/fx/NokiConfetti.vue'
import { useBooking } from '@/stores/booking'
import { useFormat } from '@/composables/useFormat'

/** Пропсы BookingDoneView */
interface Props {
  /** Адрес мастера */
  slug: string
}

const props = defineProps<Props>()
const { t } = useI18n()
const router = useRouter()
const store = useBooking()
const fmt = useFormat()

const master = computed(() => store.master!)
const booking = computed(() => store.lastBooking)

/** Счётчик для конфетти: запускаем, когда Ноки подпрыгнул (прыжок ура — через ~0.3 с после старта) */
const burst = ref(0)
const CHEER_PEAK_MS = 280
let burstTimer: ReturnType<typeof setTimeout> | undefined

function onNokiReady() {
  burstTimer = setTimeout(() => burst.value++, CHEER_PEAK_MS)
}

onBeforeUnmount(() => clearTimeout(burstTimer))

// открыли экран заново (перезагрузка, прямая ссылка) — показывать нечего
onMounted(() => {
  if (!booking.value) router.replace({ name: 'client-master', params: { slug: props.slug } })
})
</script>

<style scoped lang="scss">
.page {
  align-items: center;
  padding-top: var(--space-lg);

  h1 { margin: 0; }
}

.burst { position: relative; }

.summary {
  width: 100%;
  text-align: center;

  p { margin: 0; }
}

.when {
  margin: var(--space-xs) 0;
  color: var(--primary-600);
  font-weight: var(--font-weight-semibold);
}
</style>
