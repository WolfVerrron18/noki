<template>
  <div class="stack">
    <PageHeader :title="t('booking.timeTitle')" :back="back" />

    <div v-if="service" class="summary">
      <strong>{{ service.name }}</strong>
      <span class="hint">{{ fmt.duration(service.duration_min) }} · {{ fmt.price(service.price) }}</span>
    </div>

    <DateStrip v-model="date" :timezone="master.timezone" :schedule="master" />

    <div v-if="loading" class="stack center state">
      <NokiMascot :size="110" />
    </div>
    <div v-else-if="!slots.length" class="stack center state">
      <NokiMascot mood="sleepy" :size="110" />
      <p>{{ isDayOff ? t('booking.dayOff') : failed ? t('common.error') : t('booking.noSlots') }}</p>
      <p class="hint">{{ t('booking.noSlotsHint') }}</p>
    </div>
    <template v-else>
      <h2>{{ fmt.dayTitle(date) }}</h2>
      <SlotGrid v-model="selected" :slots="slots" :timezone="master.timezone" />
    </template>

    <NokiMainButton :text="t('common.next')" :disabled="!selected" @click="next" />
  </div>
</template>

<script setup lang="ts">
// Выбор даты и свободного времени
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiMascot from '@/components/mascot/NokiMascot.vue'
import NokiMainButton from '@/components/ui/NokiMainButton.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import DateStrip from '@/components/booking/DateStrip.vue'
import SlotGrid from '@/components/booking/SlotGrid.vue'
import { useBooking } from '@/stores/booking'
import { useFormat } from '@/composables/useFormat'
import { useSlots } from '@/composables/useSlots'
import { addDays, isWorkDay, todayIn } from '@/utils/slots'

/** Пропсы BookingTimeView */
interface Props {
  /** Адрес мастера */
  slug: string
  /** id выбранной услуги */
  serviceId: string
}

const props = defineProps<Props>()
const { t } = useI18n()
const router = useRouter()
const store = useBooking()
const fmt = useFormat()

const master = computed(() => store.master!)
const service = computed(() => store.serviceById(props.serviceId))
// открываем на ближайшем рабочем дне: у графика «по датам» сегодня часто выходной
const date = ref(firstWorkDay())
const selected = ref<string | null>(null)

/** Первый рабочий день в пределах полоски дат (14 дней), иначе сегодня */
function firstWorkDay(): string {
  const today = todayIn(master.value.timezone)
  for (let i = 0; i < 14; i++) {
    const d = addDays(today, i)
    if (isWorkDay(master.value, d)) return d
  }
  return today
}

const { slots, loading, failed } = useSlots(master, service, date)
const isDayOff = computed(() => !isWorkDay(master.value, date.value))

watch(date, () => (selected.value = null))

onMounted(() => {
  if (!service.value) back()
})

function back() {
  router.push({ name: 'client-master', params: { slug: props.slug } })
}

function next() {
  if (!selected.value) return
  router.push({ name: 'client-confirm', params: { slug: props.slug, serviceId: props.serviceId }, query: { start: selected.value } })
}
</script>

<style scoped lang="scss">
.summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  background: var(--secondary-100);
}

h2 {
  margin: 0;
  font-size: var(--font-size-lg);
}

.state {
  align-items: center;
  padding: var(--space-md) 0;

  p { margin: 0; }
}
</style>
