<template>
  <div class="form">
    <div class="row">
      <div class="field">
        <span class="label">{{ t('hours.start') }}</span>
        <NokiTimePicker :model-value="model.from" :label="t('hours.start')" :is-allowed="(v) => allowedTime(model, 'from', v)" @update:model-value="set('from', $event)" />
      </div>
      <span class="dash">–</span>
      <div class="field">
        <span class="label">{{ t('hours.end') }}</span>
        <NokiTimePicker :model-value="model.to" :label="t('hours.end')" :is-allowed="(v) => allowedTime(model, 'to', v)" @update:model-value="set('to', $event)" />
      </div>
    </div>

    <PauseList v-model="model" />

    <p v-if="error" class="error">{{ t(error) }}</p>
  </div>
</template>

<script setup lang="ts">
// Часы одного дня: начало, конец и любое число перерывов
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PauseList from '@/components/master/PauseList.vue'
import NokiTimePicker from '@/components/ui/NokiTimePicker.vue'
import { allowedTime, validateDayHours, type DayHours } from '@/utils/hours'

/** Часы дня */
const model = defineModel<DayHours>({ required: true })
const { t } = useI18n()

/** Ошибка показывается сразу — кнопка применения у родителя блокируется по ней же */
const error = computed(() => validateDayHours(model.value))

function set(key: 'from' | 'to', value: string) {
  model.value = { ...model.value, [key]: value }
}
</script>

<style scoped lang="scss">
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.row {
  display: flex;
  align-items: flex-end;
  gap: var(--space-sm);
}

.field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.label {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  padding-left: var(--space-xs);
}

.dash {
  padding-bottom: var(--space-sm);
  color: var(--text-muted);
}

.error {
  margin: 0;
  color: var(--danger-500);
  font-size: var(--font-size-sm);
}
</style>
