<template>
  <label class="field">
    <span v-if="label" class="label">{{ label }}</span>
    <span class="box" :class="{ invalid: !!error }">
      <span v-if="prefix" class="prefix">{{ prefix }}</span>
      <input v-model="model" :type="type ?? 'text'" :inputmode="inputmode" :maxlength="maxlength" :placeholder="placeholder" />
    </span>
    <span v-if="error" class="msg error">{{ error }}</span>
    <span v-else-if="hint" class="msg">{{ hint }}</span>
  </label>
</template>

<script setup lang="ts">
/** Пропсы NokiInput */
interface Props {
  /** Подпись над полем */
  label?: string
  /** Подсказка под полем, скрывается при ошибке */
  hint?: string
  /** Текст ошибки: подсвечивает поле красным */
  error?: string
  /** Неизменяемый текст слева от ввода */
  prefix?: string
  /** HTML-тип поля, по умолчанию text */
  type?: 'text' | 'number' | 'time' | 'tel'
  /** Какую клавиатуру показать на телефоне */
  inputmode?: 'text' | 'numeric' | 'tel'
  /** Текст-пример в пустом поле */
  placeholder?: string
  /** Максимум символов */
  maxlength?: number
}

defineProps<Props>()
/** Значение поля */
const model = defineModel<string | number>()
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
  display: flex;
  align-items: center;
  min-height: var(--control-height);
  padding: 0 var(--space-md);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 2px solid var(--primary-100);
  transition: border-color 0.15s;

  &:focus-within { border-color: var(--primary-400); }
  &.invalid { border-color: var(--danger-400); }
}

.prefix {
  color: var(--text-muted);
  white-space: nowrap;
}

input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-weight: var(--font-weight-semibold);
}

.msg {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  padding-left: var(--space-xs);

  &.error { color: var(--danger-500); }
}
</style>
