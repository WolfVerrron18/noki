<template>
  <button v-press="{ depth: 0.1 }" type="button" class="noki-help" data-tour="help">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.8 9.6a2.3 2.3 0 0 1 4.4.9c0 1.6-2.2 1.9-2.2 3.3" />
      <circle class="dot" cx="12" cy="16.6" r="0.6" />
    </svg>
    <span>{{ t('tour.howItWorks') }}</span>
  </button>
</template>

<script setup lang="ts">
// Кнопка «Как это работает»: запускает тур экрана. Всегда справа вверху — мастер знает, где искать помощь
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped lang="scss">
.noki-help {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  flex-shrink: 0;
  padding: var(--space-xs) var(--space-sm) var(--space-xs) var(--space-xs);
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--primary-100);
  color: var(--primary-on-soft);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  cursor: pointer;

  svg {
    width: var(--space-lg);
    height: var(--space-lg);
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .dot { fill: currentColor; }
}
</style>
