<template>
  <div class="stack">
    <PageHeader :title="t('schedule.title')" :back="() => router.push({ name: 'master-home' })" />

    <NokiSegmented v-model="mode" :options="modeOptions" />

    <!-- месяц: тот же календарь, что в редакторе графика, но в режиме просмотра записей -->
    <NokiCalendar
      v-if="mode === 'month'"
      v-model:month="month"
      :timezone="master.timezone"
      :tone-of="toneOf"
      :disable-past="false"
      :months-back="6"
      :months-ahead="6"
      @pick="openDay"
    >
      <template #day="{ date }">
        <span v-if="countOn(date)" class="count">{{ countOn(date) }}</span>
      </template>
    </NokiCalendar>
    <p v-if="mode === 'month'" class="hint legend">{{ t('schedule.monthLegend') }}</p>

    <div v-if="mode !== 'month'" class="nav">
      <button v-press="{ depth: 0.12 }" type="button" class="arrow" :aria-label="t('schedule.prev')" @click="shift(-1)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
      </button>
      <span class="period">{{ periodTitle }}</span>
      <button v-press="{ depth: 0.12 }" type="button" class="arrow" :aria-label="t('schedule.next')" @click="shift(1)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </div>

    <template v-if="mode !== 'month'">
    <div v-if="loading" class="stack center state">
      <NokiMascot :size="110" />
    </div>

    <div v-else-if="!activeCount" class="stack center state">
      <NokiMascot mood="sleepy" :size="120" />
      <p>{{ t('schedule.empty') }}</p>
      <p class="hint">{{ t('schedule.emptyHint') }}</p>
    </div>

    <div v-else ref="listEl" class="stack">
      <section v-for="day in grouped" :key="day.date" class="stack day">
        <!-- в режиме «День» дата уже в навигации -->
        <h2 v-if="mode === 'week'">{{ fmt.dayTitle(day.date) }}</h2>
        <AppointmentCard
          v-for="a in day.items"
          :key="a.id"
          :appointment="a"
          :timezone="master.timezone"
          :price="store.services.find((s) => s.id === a.service)?.price"
          for-master
          cancellable
          completable
          @cancel="cancel(a)"
          @complete="complete(a)"
        />
      </section>
    </div>
    </template>

    <p v-if="error" class="error">{{ error }}</p>

    <NokiButton @click="router.push({ name: 'master-schedule-new', query: { date: anchor } })">{{ t('schedule.add') }}</NokiButton>
    <NokiButton variant="soft" @click="router.push({ name: 'master-hours' })">{{ t('schedule.hours') }}</NokiButton>
  </div>
</template>

<script setup lang="ts">
// Расписание мастера на день или неделю: записи, отмена, переход к ручному добавлению
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiMascot from '@/components/mascot/NokiMascot.vue'
import NokiButton from '@/components/ui/NokiButton.vue'
import NokiSegmented from '@/components/ui/NokiSegmented.vue'
import NokiCalendar, { type CalendarTone } from '@/components/ui/NokiCalendar.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppointmentCard from '@/components/booking/AppointmentCard.vue'
import { repo } from '@/api/repo'
import { EnumAppointmentStatus, type Appointment } from '@/api/types'
import { useMaster } from '@/stores/master'
import { useFormat } from '@/composables/useFormat'
import { addDays, isWorkDay, todayIn, weekdayOf, zonedToUtc } from '@/utils/slots'
import dayjs from '@/utils/date'
import { confirmDialog, haptic } from '@/telegram'
import { useStaggerIn } from '@/animations/useStaggerIn'

/** Режим показа */
type Mode = 'day' | 'week' | 'month'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useMaster()
const fmt = useFormat()

const master = computed(() => store.master!)
const mode = ref<Mode>('day')
/** Опорный день "YYYY-MM-DD": для недели — любой её день */
const anchor = ref(typeof route.query.date === 'string' ? route.query.date : todayIn(master.value.timezone))
const list = ref<Appointment[]>([])
const loading = ref(false)
const error = ref('')

// записи нового периода выезжают каскадом
const listEl = ref<HTMLElement | null>(null)
useStaggerIn(listEl, loading)

const modeOptions = computed(() => [
  { value: 'day' as const, label: t('schedule.day') },
  { value: 'week' as const, label: t('schedule.week') },
  { value: 'month' as const, label: t('schedule.month') },
])

/** Показываемый месяц "YYYY-MM" — следует за опорным днём */
const month = computed({
  get: () => anchor.value.slice(0, 7),
  set: (m: string) => (anchor.value = `${m}-01`),
})

/** Первый день периода и число дней */
const range = computed(() => {
  if (mode.value === 'day') return { from: anchor.value, days: 1 }
  if (mode.value === 'month') {
    const from = `${month.value}-01`
    return { from, days: dayjs.utc(from).daysInMonth() }
  }
  return { from: addDays(anchor.value, 1 - Number(weekdayOf(anchor.value))), days: 7 }
})

const periodTitle = computed(() => {
  const { from, days } = range.value
  if (days === 1) return fmt.dayTitle(from)
  const a = fmt.dayParts(from)
  const b = fmt.dayParts(addDays(from, 6))
  return t('schedule.period', { from: `${a.day} ${a.month}`, to: `${b.day} ${b.month}` })
})

/** Сколько активных записей (не отменённых) в каждый день месяца */
const countsByDay = computed(() => {
  const m = new Map<string, number>()
  for (const a of list.value) {
    if (a.status === EnumAppointmentStatus.Cancelled) continue
    const date = todayIn(master.value.timezone, new Date(a.start_at))
    m.set(date, (m.get(date) ?? 0) + 1)
  }
  return m
})

const countOn = (date: string) => countsByDay.value.get(date) ?? 0

/** Дни с записями — ярче, рабочие без записей — мягко, выходные — без цвета */
function toneOf(date: string): CalendarTone {
  if (countOn(date)) return 'busy'
  return isWorkDay(master.value, date) ? 'work' : undefined
}

/** Тап по дню в месяце — открыть этот день */
function openDay(date: string) {
  haptic.tap()
  anchor.value = date
  mode.value = 'day'
}

/** Записи по дням в поясе мастера */
const grouped = computed(() => {
  const days = new Map<string, Appointment[]>()
  for (const a of list.value) {
    const date = todayIn(master.value.timezone, new Date(a.start_at))
    days.set(date, [...(days.get(date) ?? []), a])
  }
  return [...days.entries()].map(([date, items]) => ({ date, items }))
})

// отменённые не считаем: день с одними отменами показываем как свободный
const activeCount = computed(() => list.value.filter((a) => a.status !== EnumAppointmentStatus.Cancelled).length)

async function load() {
  const { from, days } = range.value
  const tz = master.value.timezone
  loading.value = true
  error.value = ''
  try {
    list.value = await repo().listMasterAppointments(
      master.value.id,
      zonedToUtc(from, 0, tz).toISOString(),
      zonedToUtc(addDays(from, days), 0, tz).toISOString(),
    )
  } catch {
    error.value = t('common.error')
  } finally {
    loading.value = false
  }
}

function shift(dir: 1 | -1) {
  haptic.tap()
  anchor.value = addDays(anchor.value, dir * range.value.days)
}

async function cancel(a: Appointment) {
  if (!(await confirmDialog(t('schedule.cancelConfirm')))) return
  try {
    const updated = await repo().cancelAppointment(a.id)
    list.value = list.value.map((x) => (x.id === a.id ? updated : x))
    haptic.success()
  } catch {
    error.value = t('common.error')
    haptic.error()
  }
}

async function complete(a: Appointment) {
  try {
    const updated = await repo().completeAppointment(a.id)
    list.value = list.value.map((x) => (x.id === a.id ? updated : x))
    haptic.success()
  } catch {
    error.value = t('common.error')
    haptic.error()
  }
}

watch([mode, anchor], load, { immediate: true })
</script>

<style scoped lang="scss">
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.period {
  font-weight: var(--font-weight-bold);
  text-align: center;
}

.arrow {
  display: grid;
  place-items: center;
  width: calc(var(--control-height) - var(--space-sm));
  height: calc(var(--control-height) - var(--space-sm));
  flex-shrink: 0;
  border: 0;
  border-radius: 50%;
  background: var(--primary-100);
  cursor: pointer;

  svg {
    width: var(--space-lg);
    height: var(--space-lg);
    fill: none;
    stroke: var(--primary-600);
    stroke-width: 2.5;
    stroke-linecap: round;
  }
}

.count {
  min-width: calc(var(--space-md) + var(--space-xs));
  padding: 0 var(--space-xs);
  border-radius: var(--radius-pill);
  background: var(--secondary-500);
  color: var(--on-primary);
  font-size: var(--font-size-2xs);
  font-weight: var(--font-weight-bold);
  line-height: 1.5;
}

.legend { margin: 0; }

.day h2 {
  margin: 0;
  font-size: var(--font-size-lg);
}

.state {
  align-items: center;
  padding: var(--space-lg) 0;

  p { margin: 0; }
}

.error {
  margin: 0;
  color: var(--danger-500);
  font-size: var(--font-size-sm);
}
</style>
