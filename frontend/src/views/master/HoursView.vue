<template>
  <div class="stack">
    <PageHeader :title="t('hours.title')" :back="() => router.back()" />

    <div class="intro">
      <NokiMascot :mood="ctx.hasError.value ? 'sad' : 'happy'" :size="96" />
      <p>{{ t('onboarding.hours.subtitle') }}</p>
    </div>

    <HoursFields ref="hoursFields" :ctx="ctx" />

    <p v-if="ctx.errors.save" class="error">{{ ctx.errors.save }}</p>

    <!-- Ноки сам настроит часы на примере; после тура всё возвращается как было -->
    <button type="button" class="demo-link" @click="startDemo(demoTour(), false)">{{ t('tour.demo') }}</button>

    <!-- при выборе дней в календаре главная кнопка становится «Задать часы · N», при открытой шторке прячется -->
    <NokiMainButton v-if="!ctx.sheetOpen.value" :text="mainText" :loading="ctx.saving.value" @click="onMain" />
  </div>
</template>

<script setup lang="ts">
// Часы работы мастера: пояс, шаг записи и график на одном экране.
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiMascot from '@/components/mascot/NokiMascot.vue'
import NokiMainButton from '@/components/ui/NokiMainButton.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import HoursFields from '@/components/master/HoursFields.vue'
import { useMasterForm } from '@/composables/useMasterForm'
import { haptic } from '@/telegram'
import { EnumScheduleMode, EnumSlotMode, type MasterInput } from '@/api/types'
import { useTour, type Tour, type TourActions, type TourUndo } from '@/composables/useTour'
import { DATES_DEMO_TOUR, HOURS_DEMO_TOUR } from '@/components/tour/tours'
import { buttonIn, robotDrag, robotPress, robotTap } from '@/components/tour/robot'
import { fromRanges, toRanges, type DayHours } from '@/utils/hours'

/** Пауза перед примером: экран успевает появиться */
const DEMO_DELAY_MS = 600
/** Часы понедельника в примере */
const DEMO_FROM = '11:00'
const DEMO_TO = '20:00'
/** Сколько дней Ноки выделяет протягиванием в примере «по датам» */
const DEMO_DAYS = 5
/** Сколько из них потом снимает обратным протягиванием */
const DEMO_UNSELECT = 2
/** Часы, которые Ноки ставит выбранным дням */
const DEMO_DAY_RANGES: [string, string][] = [['10:00', '19:00']]

const { t } = useI18n()
const router = useRouter()
const ctx = useMasterForm()
const hoursFields = ref<InstanceType<typeof HoursFields> | null>(null)

const mainText = computed(() =>
  ctx.pickingDays.value ? t(ctx.form.slot_mode === EnumSlotMode.Fixed ? 'scheduleEditor.setTimes' : 'scheduleEditor.setHours', { n: ctx.selectedDays.value }) : t('common.save'),
)

// Пример «как настроить часы»: Ноки сам выбирает режимы, быстрый выбор дней, часы понедельника, перерыв
// и включает субботу. Сохраняется только по главной кнопке, а после тура форма возвращается как была
const tour = useTour()
/** Часы до примера — вернуть их после тура */
let before: MasterInput | null = null

/**
 * Поменять часы понедельника прямо в форме: шторку выбора времени поверх тура не открываем.
 * @param part изменённые поля
 */
function patchMonday(part: Partial<DayHours>) {
  const h = fromRanges(ctx.form.work_hours['1'])
  if (h) ctx.form.work_hours = { ...ctx.form.work_hours, 1: toRanges({ ...h, ...part }) }
}

const demoActions: TourActions = {
  slotMode: (signal) => robotTap(buttonIn('slot-mode', t('scheduleEditor.slotGrid')), signal),
  step: (signal) => robotTap(buttonIn('step', t('onboarding.time.step30')), signal),
  scheduleMode: (signal) => robotTap(buttonIn('schedule-mode', t('scheduleEditor.weekly')), signal),
  presets: (signal) => robotTap(buttonIn('week-presets', t('onboarding.hours.presetWeekdays')), signal),
  async day(signal) {
    const [from, to] = document.querySelectorAll('[data-tour="day-1"] .times button')
    if (!(await robotPress(from, signal))) return
    patchMonday({ from: DEMO_FROM })
    if (!(await robotPress(to, signal))) return
    patchMonday({ to: DEMO_TO })
  },
  pause: (signal) => robotTap(document.querySelector('[data-tour="day-1"] .add'), signal),
  dayOn: (signal) => robotTap(document.querySelector('[data-tour="day-6"] [role="switch"]'), signal),
}

// Пример «по датам»: Ноки протягивает пальцем по дням недели, снимает часть выбора обратным протягиванием
// и ставит выбранным дням часы. Выделение — настоящими касаниями в календаре, часы — без шторки
/** Форму возвращают после примера: смена режима — не её выбор, второй пример сам не запускаем */
let restoring = false
/** Дни, которые Ноки выделил, — по ним же снимает выбор */
let demoDays: string[] = []

/** Клетка календаря по дате */
const cellOf = (date: string) => document.querySelector<HTMLElement>(`[data-tour="calendar"] [data-date="${date}"]`)

/** Ряд будущих дней для протягивания: первая неделя, где их хватает, иначе самая длинная */
function demoRow(): HTMLElement[] {
  const rows = new Map<number, HTMLElement[]>()
  // data-date есть только у дней, которые можно выбрать (не прошедших)
  for (const cell of document.querySelectorAll<HTMLElement>('[data-tour="calendar"] [data-date]')) {
    const top = Math.round(cell.getBoundingClientRect().top)
    rows.set(top, [...(rows.get(top) ?? []), cell])
  }
  const list = [...rows.values()]
  const row = list.find((r) => r.length >= DEMO_DAYS) ?? list.sort((a, b) => b.length - a.length)[0] ?? []
  return row.slice(0, DEMO_DAYS)
}

const datesActions: TourActions = {
  async select(signal) {
    const row = demoRow()
    demoDays = row.map((c) => c.dataset.date!)
    await robotDrag(row, signal)
  },
  async unselect(signal) {
    // с последнего выбранного дня назад: первый день уже выбран — значит, протягивание снимает
    const cells = demoDays.slice(-DEMO_UNSELECT).reverse().map(cellOf).filter((c): c is HTMLElement => !!c)
    await robotDrag(cells, signal)
  },
  apply() {
    hoursFields.value?.datesEditor()?.applyDay(DEMO_DAY_RANGES)
  },
}

/** Снимок для «Назад» в примере: форма и выбранные в календаре дни */
interface DemoState {
  /** Поля формы */
  form: MasterInput
  /** Выбранные дни календаря «по датам» */
  selection: string[]
}

/** «Назад» в примере: экран — как до действия шага */
const demoUndo: TourUndo = {
  save: (): DemoState => ({
    form: JSON.parse(JSON.stringify(ctx.form)),
    selection: hoursFields.value?.datesEditor()?.getSelection() ?? [],
  }),
  restore(state) {
    const { form, selection } = state as DemoState
    restoring = true
    nextTick(() => (restoring = false))
    Object.assign(ctx.form, form)
    hoursFields.value?.datesEditor()?.setSelection(selection)
    ctx.invalidDays.value = []
    ctx.errors.hours = undefined
  },
}

/** Какой пример показать: календарь по датам или недельный график — по тому, что сейчас на экране */
const demoTour = () => (ctx.form.schedule_mode === EnumScheduleMode.Dates ? DATES_DEMO_TOUR : HOURS_DEMO_TOUR)

/**
 * Запустить пример.
 * @param demo тур: часы или «по датам»
 * @param auto сам при первом знакомстве (один раз) или по ссылке
 */
function startDemo(demo: Tour, auto: boolean) {
  before = JSON.parse(JSON.stringify(ctx.form))
  const actions = demo === DATES_DEMO_TOUR ? datesActions : demoActions
  if (auto) tour.autoStart(demo, actions, demoUndo)
  else tour.start(demo, actions, demoUndo)
  if (!tour.active.value) before = null
  // подсказка «?» у календаря рассказывает то же — не показываем её поверх тура
  else if (demo === DATES_DEMO_TOUR) hoursFields.value?.datesEditor()?.hideHint()
}

// первый раз переключилась на «по датам» — Ноки показывает календарь (когда он появится на экране)
watch(
  () => ctx.form.schedule_mode,
  (mode) => {
    if (mode === EnumScheduleMode.Dates && !tour.active.value && !restoring) setTimeout(() => startDemo(DATES_DEMO_TOUR, true), DEMO_DELAY_MS)
  },
)

watch(tour.active, (on) => {
  if (on || !before) return
  // недоделанный выбор дней снимаем, пока календарь ещё на экране
  hoursFields.value?.datesEditor()?.clearSelection()
  restoring = true
  nextTick(() => (restoring = false))
  Object.assign(ctx.form, before)
  before = null
  ctx.invalidDays.value = []
  ctx.errors.hours = undefined
})

onMounted(() => setTimeout(() => startDemo(demoTour(), true), DEMO_DELAY_MS))

async function onMain() {
  if (ctx.pickingDays.value) return hoursFields.value?.openSheet()
  if (!ctx.validateHours() || !(await ctx.save())) return haptic.error()
  haptic.success()
  router.back()
}
</script>

<style scoped lang="scss">
.intro {
  display: flex;
  align-items: center;
  gap: var(--space-md);

  p { margin: 0; }
}

.demo-link {
  align-self: center;
  padding: var(--space-sm) var(--space-md);
  border: 0;
  background: none;
  color: var(--text-muted);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.error {
  margin: 0;
  color: var(--danger-500);
  font-size: var(--font-size-sm);
}
</style>
