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
    <PageHeader :title="existing ? t('services.editTitle') : t('services.newTitle')" :back="back" />

    <NokiInput v-model="form.name" :label="t('services.name')" :placeholder="t('services.namePlaceholder')" :error="errors.name" />

    <ServiceCategoryPicker v-model="form.category" :label="t('services.categoryLabel')" />

    <!-- типовые услуги вида: тап заполняет название и длительность. Место под ряд занято всегда, чтобы экран не прыгал -->
    <div v-if="!existing" class="presets">
      <NokiSegmented v-if="presetOptions.length" v-model="presetPick" :label="t('services.presets')" :options="presetOptions" scroll />
    </div>

    <NokiSegmented v-model="durationPick" :label="t('services.duration')" :options="durationOptions" />
    <NokiNumberInput
      v-if="durationPick === CUSTOM"
      v-model="customDuration"
      :suffix="t('duration.minutes')"
      :step="5"
      :min="5"
      :max="600"
      :error="errors.duration"
    />
    <p v-else-if="errors.duration" class="error">{{ errors.duration }}</p>

    <NokiNumberInput
      v-model="form.price"
      :suffix="fmt.currencySymbol()"
      :label="t('services.price')"
      :placeholder="t('services.pricePlaceholder')"
      :error="errors.price"
    />

    <NokiTextarea
      v-model="form.description"
      :rows="3"
      :maxlength="DESCRIPTION_MAX"
      :label="t('services.description')"
      :placeholder="t('services.descriptionPlaceholder')"
      :hint="t('services.descriptionHint')"
    />

    <NokiSwitch v-model="form.is_active" :label="t('services.visible')" />

    <NokiButton v-if="existing" variant="danger" :disabled="saving" @click="remove">{{ t('services.delete') }}</NokiButton>

    <p v-if="errors.save" class="error">{{ errors.save }}</p>
    <NokiMainButton :text="t('common.save')" :loading="saving" @click="save" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiMainButton from '@/components/ui/NokiMainButton.vue'
import NokiButton from '@/components/ui/NokiButton.vue'
import NokiMascot from '@/components/mascot/NokiMascot.vue'
import NokiInput from '@/components/ui/NokiInput.vue'
import NokiTextarea from '@/components/ui/NokiTextarea.vue'
import NokiNumberInput from '@/components/ui/NokiNumberInput.vue'
import NokiSegmented from '@/components/ui/NokiSegmented.vue'
import NokiSwitch from '@/components/ui/NokiSwitch.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ServiceCategoryPicker from '@/components/services/ServiceCategoryPicker.vue'
import { EnumServiceCategory } from '@/components/services/category'
import { SERVICE_PRESETS } from '@/components/services/presets'
import { useMaster } from '@/stores/master'
import { useFormat } from '@/composables/useFormat'
import { confirmDialog, haptic } from '@/telegram'

const PRESETS = [30, 60, 90, 120, 150]
const CUSTOM = -1
/** Длина описания — как в базе (services.description) */
const DESCRIPTION_MAX = 300

/** Пропсы ServiceEditView */
interface Props {
  /** id услуги из маршрута. Не передан — создаём новую */
  id?: string
}

const props = defineProps<Props>()
const { t } = useI18n()
const router = useRouter()
const store = useMaster()
const fmt = useFormat()

const existing = props.id ? store.services.find((s) => s.id === props.id) : undefined
/** Адрес с id, но такой услуги у мастера нет — не подсовываем пустую форму «новой услуги» */
const notFound = !!props.id && !existing
const form = reactive({
  name: existing?.name ?? '',
  duration_min: existing?.duration_min ?? 60,
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

/** Выбранная подсказка: подсвечена, пока название и длительность совпадают с ней */
const presetPick = computed({
  get() {
    const duration = durationPick.value === CUSTOM ? Number(customDuration.value) : durationPick.value
    const p = SERVICE_PRESETS[form.category].find((x) => t(`services.preset.${x.id}`) === form.name.trim())
    return p && p.duration_min === duration ? p.id : undefined
  },
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
// место под ряд подсказок: подпись + ряд кнопок. У вида без подсказок («Другое») остаётся пустым
.presets { min-height: calc(var(--control-height) + var(--space-md)); }


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
