<template>
  <header class="header">
    <button v-if="back && !native" v-press="{ depth: 0.12 }" type="button" class="back" :aria-label="t('common.back')" @click="onBack">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
    </button>
    <h1>{{ title }}</h1>
  </header>
</template>

<script setup lang="ts">
// Шапка экрана. В Telegram «назад» — системная BackButton, в браузере — своя кнопка
import { onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { tg, isInTelegram } from '@/telegram'

/** Пропсы PageHeader */
interface Props {
  /** Заголовок экрана */
  title: string
  /** Обработчик «назад». Не передан — кнопки нет */
  back?: () => void
}

const props = defineProps<Props>()
const { t } = useI18n()
const native = isInTelegram()

function onBack() {
  props.back?.()
}

function setNative(visible: boolean) {
  if (!native) return
  tg!.BackButton.offClick(onBack)
  if (visible) {
    tg!.BackButton.onClick(onBack)
    tg!.BackButton.show()
  } else {
    tg!.BackButton.hide()
  }
}

watch(() => !!props.back, setNative, { immediate: true })
onBeforeUnmount(() => setNative(false))
</script>

<style scoped lang="scss">
.header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-height: var(--control-height);

  h1 { margin: 0; }
}

.back {
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
</style>
