<template>
  <div class="stack">
    <NokiSelect v-model="form.timezone" :label="t('onboarding.time.timezone')" :options="tzOptions" />
    <NokiSegmented v-model="form.slot_step_min" :label="t('onboarding.time.step')" :options="stepOptions" />
    <p class="hint">{{ t('onboarding.time.stepHint') }}</p>

    <NokiSegmented v-model="form.schedule_mode" :label="t('scheduleEditor.mode')" :options="modeOptions" />
    <p class="hint">{{ form.schedule_mode === EnumScheduleMode.Weekly ? t('scheduleEditor.weeklyHint') : t('scheduleEditor.datesHint') }}</p>
    <WorkHoursEditor v-if="form.schedule_mode === EnumScheduleMode.Weekly" v-model="form.work_hours" :invalid-days="invalidDays" />
    <MonthScheduleEditor
      v-else
      ref="monthEditor"
      v-model="form.day_overrides"
      v-model:templates="form.hour_templates"
      v-model:selected-count="selectedDays"
      v-model:sheet-open="sheetOpen"
      :timezone="form.timezone"
    />
    <p v-if="errors.hours" class="error">{{ errors.hours }}</p>
  </div>
</template>

<script setup lang="ts">
// Всё про время работы: пояс, шаг записи, режим графика и сами часы. Состояние — в useMasterForm у экрана.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { EnumScheduleMode } from '@/api/types'
import NokiSelect from '@/components/ui/NokiSelect.vue'
import NokiSegmented from '@/components/ui/NokiSegmented.vue'
import WorkHoursEditor from '@/components/master/WorkHoursEditor.vue'
import MonthScheduleEditor from '@/components/master/MonthScheduleEditor.vue'
import { timezoneOptions } from '@/utils/time'
import type { MasterForm } from '@/composables/useMasterForm'

/** Пропсы HoursFields */
interface Props {
  /** Форма профиля экрана */
  ctx: MasterForm
}

const props = defineProps<Props>()
const { t, locale } = useI18n()
const { form, errors, invalidDays, selectedDays, sheetOpen } = props.ctx
const monthEditor = ref<InstanceType<typeof MonthScheduleEditor> | null>(null)

const tzOptions = computed(() => timezoneOptions(locale.value))
const stepOptions = computed(() => [
  { value: 15 as const, label: t('onboarding.time.step15') },
  { value: 30 as const, label: t('onboarding.time.step30') },
])
const modeOptions = computed(() => [
  { value: EnumScheduleMode.Weekly, label: t('scheduleEditor.weekly') },
  { value: EnumScheduleMode.Dates, label: t('scheduleEditor.dates') },
])

/** Открыть шторку часов для выбранных в календаре дней */
function openSheet() {
  monthEditor.value?.openSheet()
}

defineExpose({ openSheet })
</script>

<style scoped lang="scss">
.error {
  margin: 0;
  color: var(--danger-500);
  font-size: var(--font-size-sm);
}
</style>
