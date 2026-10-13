<template>
  <label class="field">
    <span v-if="label" class="label">{{ label }}</span>
    <textarea
      v-model="model"
      class="box"
      :class="{ invalid: !!error }"
      :placeholder="placeholder"
      :rows="rows"
      :maxlength="maxlength"
    />
    <span class="footer">
      <span v-if="error" class="msg error">{{ error }}</span>
      <span v-else-if="hint" class="msg">{{ hint }}</span>
      <span v-if="maxlength" class="msg counter">{{ (model ?? '').length }} / {{ maxlength }}</span>
    </span>
  </label>
</template>

<script setup lang="ts">
/** Пропсы NokiTextarea */
interface Props {
  /** Подпись над полем */
  label?: string
  /** Подсказка под полем, скрывается при ошибке */
  hint?: string
  /** Текст ошибки: подсвечивает поле красным */
  error?: string
  /** Текст-пример в пустом поле */
  placeholder?: string
  /** Высота в строках, по умолчанию 5 */
  rows?: number
  /** Максимум символов: показывается счётчик */
  maxlength?: number
}

withDefaults(defineProps<Props>(), { rows: 5 })
/** Текст поля */
const model = defineModel<string>()
</script>

<style scoped lang="scss">
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  text-align: left;
}

.label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
  padding-left: var(--space-xs);
}

.box {
  width: 100%;
  padding: var(--space-md);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 2px solid var(--primary-100);
  outline: 0;
  color: var(--text);
  font: inherit;
  font-weight: var(--font-weight-semibold);
  resize: vertical;
  transition: border-color 0.15s;

  &:focus { border-color: var(--primary-400); }
  &.invalid { border-color: var(--danger-400); }
}

.footer {
  display: flex;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: 0 var(--space-xs);
}

.msg {
  font-size: var(--font-size-xs);
  color: var(--text-muted);

  &.error { color: var(--danger-500); }
}

.counter { margin-left: auto; }
</style>
