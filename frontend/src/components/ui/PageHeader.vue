<template>
  <header class="header">
    <button v-if="back && !native" v-press="{ depth: 0.12 }" type="button" class="back" :aria-label="t('common.back')" @click="onBack">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
    </button>
    <h1>{{ title }}</h1>
    <NokiHelpButton v-if="help" @click="help" />
  </header>
</template>

<script setup lang="ts">
// Шапка экрана: закреплена сверху — всегда видно, где ты и как вернуться.
// В Telegram «назад» — системная BackButton, в браузере — своя кнопка
import { onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { tg, isInTelegram } from '@/telegram'
import NokiHelpButton from '@/components/ui/NokiHelpButton.vue'

/** Пропсы PageHeader */
interface Props {
  /** Заголовок экрана */
  title: string
  /** Обработчик «назад». Не передан — кнопки нет */
  back?: () => void
  /** Запустить тур экрана: справа появится «Как это работает». Не передан — кнопки нет */
  help?: () => void
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
  // на всю ширину поверх полей #app: прокручиваемое уходит под шапку, а не просвечивает по бокам
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-height: var(--control-height);
  // вверх — только на свой padding: заголовок стоит, где стоял, и не наезжает на то, что над экраном (плашка режима просмотра)
  margin: calc(var(--space-sm) * -1) calc(var(--space-md) * -1) 0;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg);
  // фон продолжается вверх до края экрана: под полупрозрачной адресной строкой iOS не просвечивает интерфейс.
  // Тень, а не блок: высоту страницы не меняет
  box-shadow: 0 -50vh 0 50vh var(--bg);

  h1 {
    flex: 1;
    min-width: 0;
    margin: 0;
  }
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
