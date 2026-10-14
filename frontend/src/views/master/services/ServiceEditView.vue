<template>
  <div v-if="notFound" class="stack">
    <!-- открыли по адресу услуги, которой нет (удалили или чужая) -->
    <PageHeader :title="t('services.editTitle')" :back="back" />
    <div class="stack center not-found">
      <NokiMascot mood="sleepy" :size="120" />
      <h2>{{ t('services.notFound') }}</h2>
      <p class="hint">{{ t('services.notFoundHint') }}</p>
      <NokiButton variant="soft" @click="back">{{ t('services.toList') }}</NokiButton>
    </div>
  </div>

  <div v-else class="stack">
    <PageHeader :title="existing ? t('services.editTitle') : t('services.newTitle')" :back="back" :help="startDemo" />

    <NokiInput v-model="form.name" data-tour="name" :label="t('services.name')" :placeholder="t('services.namePlaceholder')" :error="errors.name" />

    <ServiceCategoryPicker v-model="form.category" data-tour="category" :label="t('services.categoryLabel')" />

    <!-- типовые услуги вида: тап заполняет название и длительность. У вида без подсказок («Другое») ряд плавно схлопывается -->
    <NokiCollapse :open="presetOptions.length > 0" data-tour="presets">
      <NokiSegmented v-if="shownPresets.length" v-model="presetPick" :label="t('services.presets')" :options="shownPresets" scroll />
    </NokiCollapse>

    <div class="stack" data-tour="duration">
      <NokiSegmented v-model="durationPick" :label="t('services.duration')" :options="durationOptions" />
      <!-- своя длительность раскрывается под рядом вариантов так же плавно, как ряд подсказок -->
      <NokiCollapse :open="durationPick === CUSTOM">
        <NokiNumberInput
          v-model="customDuration"
          :suffix="t('duration.minutes')"
          :step="5"
          :min="5"
          :max="600"
          :error="durationPick === CUSTOM ? errors.duration : undefined"
        />
      </NokiCollapse>
    </div>
    <p v-if="durationPick !== CUSTOM && errors.duration" class="error">{{ errors.duration }}</p>

    <NokiNumberInput
      v-model="form.price"
      data-tour="price"
      :currency="CURRENCY"
      :quick="PRICE_QUICK"
      :label="t('services.price')"
      :placeholder="t('services.pricePlaceholder')"
      :error="errors.price"
    />

    <NokiTextarea
      v-model="form.description"
      data-tour="description"
      :rows="3"
      :maxlength="DESCRIPTION_MAX"
      :label="t('services.description')"
      :placeholder="t('services.descriptionPlaceholder')"
      :hint="t('services.descriptionHint')"
    />

    <NokiSwitch v-model="form.is_active" data-tour="visible" :label="t('services.visible')" />

    <NokiButton v-if="existing" variant="outline" :disabled="saving" @click="remove">{{ t('services.delete') }}</NokiButton>

    <p v-if="errors.save" class="error">{{ errors.save }}</p>
    <NokiMainButton :text="t('common.save')" :loading="saving" @click="save" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiMainButton from '@/components/ui/NokiMainButton.vue'
import NokiButton from '@/components/ui/NokiButton.vue'
import NokiMascot from '@/components/mascot/NokiMascot.vue'
import NokiInput from '@/components/ui/NokiInput.vue'
import NokiTextarea from '@/components/ui/NokiTextarea.vue'
import NokiNumberInput from '@/components/ui/NokiNumberInput.vue'
import NokiSegmented from '@/components/ui/NokiSegmented.vue'
import NokiSwitch from '@/components/ui/NokiSwitch.vue'
import NokiCollapse from '@/components/ui/NokiCollapse.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ServiceCategoryPicker from '@/components/services/ServiceCategoryPicker.vue'
import { EnumServiceCategory, SERVICE_CATEGORIES } from '@/components/services/category'
import { SERVICE_PRESETS } from '@/components/services/presets'
import { useMaster } from '@/stores/master'
import { CURRENCY, useFormat } from '@/composables/useFormat'
import { confirmDialog, haptic } from '@/telegram'
import { useTour, type TourActions, type TourUndo } from '@/composables/useTour'
import { SERVICE_DEMO_TOUR } from '@/components/tour/tours'
import { robotTap, robotType, robotWait } from '@/components/tour/robot'

const PRESETS = [30, 60, 90, 120, 150]
const CUSTOM = -1
/** Быстрые прибавки к цене */
const PRICE_QUICK = [100, 500, 1000]
/** Длительность новой услуги, пока её не выбрали */
const DEFAULT_DURATION = 60
/** Пауза перед примером: экран успевает появиться */
const DEMO_DELAY_MS = 600
/** Пауза, пока раскрывается поле своей длительности, мс */
const DEMO_COLLAPSE_MS = 350
/** Пауза между нажатиями Ноки в примере, мс */
const DEMO_STEP_MS = 300
/** Длина описания — как в базе (services.description) */
const DESCRIPTION_MAX = 300

/** Пропсы ServiceEditView */
interface Props {
  /** id услуги из маршрута. Не передан — создаём новую */
  id?: string
}

const props = defineProps<Props>()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useMaster()
const fmt = useFormat()

const existing = props.id ? store.services.find((s) => s.id === props.id) : undefined
/** Адрес с id, но такой услуги у мастера нет — не подсовываем пустую форму «новой услуги» */
const notFound = !!props.id && !existing
const form = reactive({
  name: existing?.name ?? '',
  duration_min: existing?.duration_min ?? DEFAULT_DURATION,
  price: existing?.price ? String(existing.price) : '',
  is_active: existing?.is_active ?? true,
  description: existing?.description ?? '',
  // новая услуга — того же вида, что последняя: обычно их добавляют подряд
  category: existing?.category ?? store.services[store.services.length - 1]?.category ?? EnumServiceCategory.Other,
})
const durationPick = ref(PRESETS.includes(form.duration_min) ? form.duration_min : CUSTOM)
const customDuration = ref(String(form.duration_min))
const errors = reactive<{ name?: string; duration?: string; price?: string; save?: string }>({})
const saving = ref(false)

const durationOptions = computed(() => [
  ...PRESETS.map((m) => ({ value: m, label: fmt.duration(m) })),
  { value: CUSTOM, label: t('services.durationCustom') },
])

/** Подсказки для выбранного вида */
const presetOptions = computed(() =>
  SERVICE_PRESETS[form.category].map((p) => ({ value: p.id, label: t(`services.preset.${p.id}`) })),
)

// у «Другого» подсказок нет: пока ряд схлопывается, в нём остаются прежние — не пустеет рывком
const shownPresets = ref(presetOptions.value)
watch(presetOptions, (v) => v.length && (shownPresets.value = v))

/** Длительность из формы, минуты */
const currentDuration = () => (durationPick.value === CUSTOM ? Number(customDuration.value) : durationPick.value)

/**
 * Подсказка вида, с которой совпадают название и длительность.
 * @param category вид услуги
 */
function matchedPreset(category: EnumServiceCategory) {
  const p = SERVICE_PRESETS[category].find((x) => t(`services.preset.${x.id}`) === form.name.trim())
  return p && p.duration_min === currentDuration() ? p : undefined
}

/** Форму возвращает тур («Назад» в примере): смена вида — не её выбор, название не чистим */
let restoring = false

// сменили вид, а название и длительность — из подсказки прежнего вида: очищаем, чтобы не стирать руками.
// Своё название мастера не трогаем
watch(
  () => form.category,
  (_, prev) => {
    if (restoring || !matchedPreset(prev)) return
    form.name = ''
    durationPick.value = DEFAULT_DURATION
    customDuration.value = String(DEFAULT_DURATION)
  },
)

/** Выбранная подсказка: подсвечена, пока название и длительность совпадают с ней */
const presetPick = computed({
  get: () => matchedPreset(form.category)?.id,
  set(id) {
    const p = SERVICE_PRESETS[form.category].find((x) => x.id === id)
    if (!p) return
    form.name = t(`services.preset.${p.id}`)
    durationPick.value = PRESETS.includes(p.duration_min) ? p.duration_min : CUSTOM
    customDuration.value = String(p.duration_min)
    errors.name = undefined
    errors.duration = undefined
  },
})

// Пример «как добавить услугу»: Ноки сам выбирает вид, подсказку, длительность и цену, печатает описание.
// Запускается по ссылке «Показать на примере» (?demo=1) или сам при первой услуге. Пример не сохраняется:
// когда тур закрывается, форма возвращается к началу
const tour = useTour()
const blank = { form: { ...form }, durationPick: durationPick.value, customDuration: customDuration.value }
let demoRunning = false

/** Вид для примера: текущий, если у него есть подсказки, иначе первый с подсказками */
const demoCategory = () =>
  SERVICE_PRESETS[form.category].length ? form.category : SERVICE_CATEGORIES.find((c) => SERVICE_PRESETS[c].length)!

const demoActions: TourActions = {
  async category(signal) {
    const buttons = document.querySelectorAll('[data-tour="category"] button')
    await robotTap(buttons[SERVICE_CATEGORIES.indexOf(demoCategory())], signal)
  },
  async preset(signal) {
    await robotTap(document.querySelector('[data-tour="presets"] button'), signal)
  },
  // название уже из подсказки — Ноки набирает его заново, показывая, что можно написать своё
  async name(signal) {
    await robotType((v) => (form.name = v), form.name, signal)
  },
  async duration(signal) {
    const custom = [...document.querySelectorAll<HTMLElement>('[data-tour="duration"] [role="radio"]')].at(-1)
    if (!(await robotTap(custom, signal)) || !(await robotWait(DEMO_COLLAPSE_MS, signal))) return
    const plus = [...document.querySelectorAll<HTMLElement>('[data-tour="duration"] .step')].at(-1)
    for (let i = 0; i < 3; i++) {
      if (!(await robotTap(plus, signal)) || !(await robotWait(DEMO_STEP_MS, signal))) return
    }
  },
  async price(signal) {
    // быстрые прибавки по порядку PRICE_QUICK: +1 000, +1 000, +500
    const chips = document.querySelectorAll<HTMLElement>('[data-tour="price"] .chip')
    for (const i of [2, 2, 1]) {
      if (!(await robotTap(chips[i], signal)) || !(await robotWait(DEMO_STEP_MS, signal))) return
    }
  },
  async description(signal) {
    await robotType((v) => (form.description = v), t('services.demoDescription'), signal)
  },
}

/** Снимок формы примера */
interface DemoState {
  /** Поля формы */
  form: typeof form
  /** Выбранная длительность */
  durationPick: number
  /** Своя длительность */
  customDuration: string
}

/**
 * Вернуть форму к снимку.
 * @param state снимок
 */
function restoreForm(state: DemoState) {
  restoring = true
  Object.assign(form, state.form)
  durationPick.value = state.durationPick
  customDuration.value = state.customDuration
  Object.assign(errors, { name: undefined, duration: undefined, price: undefined, save: undefined })
  nextTick(() => (restoring = false))
}

/** «Назад» в примере: форма — как до действия шага */
const demoUndo: TourUndo = {
  save: (): DemoState => ({ form: { ...form }, durationPick: durationPick.value, customDuration: customDuration.value }),
  restore: (state) => restoreForm(state as DemoState),
}

/** Вернуть форму к началу после примера */
function resetDemo() {
  restoreForm(blank)
}

watch(tour.active, (on) => {
  if (on || !demoRunning) return
  demoRunning = false
  resetDemo()
})

/**
 * Запустить пример. На услуге, которую правят, тоже можно: после тура форма вернётся к её данным.
 * @param auto сам при первой услуге (один раз) или по кнопке «Как это работает»
 */
function startDemo(auto = false) {
  if (auto) tour.autoStart(SERVICE_DEMO_TOUR, demoActions, demoUndo)
  else tour.start(SERVICE_DEMO_TOUR, demoActions, demoUndo)
  demoRunning = tour.active.value
}

onMounted(() => {
  if (existing || notFound) return
  setTimeout(() => {
    // из списка услуг по «Как это работает» — всегда; сам — один раз, пока у мастера нет ни одной услуги
    if (route.query.demo === '1') startDemo()
    else if (!store.services.length) startDemo(true)
  }, DEMO_DELAY_MS)
})

function back() {
  router.push({ name: 'master-services' })
}

async function remove() {
  if (!existing || !(await confirmDialog(t('services.deleteConfirm', { name: existing.name })))) return
  saving.value = true
  errors.save = undefined
  try {
    await store.deleteService(existing.id)
    haptic.success()
    back()
  } catch {
    errors.save = t('common.error')
    haptic.error()
  } finally {
    saving.value = false
  }
}

async function save() {
  const duration = durationPick.value === CUSTOM ? Number(customDuration.value) : durationPick.value
  const price = form.price === '' ? 0 : Number(form.price)
  errors.name = form.name.trim() ? undefined : t('services.nameRequired')
  errors.duration = Number.isInteger(duration) && duration >= 5 && duration <= 600 ? undefined : t('services.durationInvalid')
  errors.price = Number.isFinite(price) && price >= 0 ? undefined : t('services.priceInvalid')
  if (errors.name || errors.duration || errors.price) return haptic.error()

  saving.value = true
  errors.save = undefined
  try {
    await store.saveService({
        name: form.name.trim(),
        duration_min: duration,
        price,
        is_active: form.is_active,
        description: String(form.description).trim(),
        category: form.category,
      }, props.id)
    haptic.success()
    back()
  } catch {
    errors.save = t('common.error')
    haptic.error()
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.not-found {
  align-items: center;

  h2, p { margin: 0; }
}

.error {
  margin: 0;
  color: var(--danger-500);
  font-size: var(--font-size-sm);
}
</style>
