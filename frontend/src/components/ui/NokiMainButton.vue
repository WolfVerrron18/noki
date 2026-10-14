<template>
  <div v-if="!native" class="main-button">
    <!-- в браузере кнопка закреплена снизу, как MainButton в Telegram: видна, куда бы ни прокрутили -->
    <NokiButton :disabled="disabled" :loading="loading" @click="emit('click')">{{ text }}</NokiButton>
  </div>
</template>

<script setup lang="ts">
// Главное действие экрана. В Telegram — нативная MainButton внизу экрана, в браузере — обычная NokiButton.
// На экране должна быть только одна NokiMainButton.
import { onBeforeUnmount, watch } from 'vue'
import NokiButton from '@/components/ui/NokiButton.vue'
import { isInTelegram, tg } from '@/telegram'

/** Пропсы NokiMainButton */
interface Props {
  /** Текст кнопки (уже переведённый): у MainButton нет слота */
  text: string
  /** Заблокировать */
  disabled?: boolean
  /** Индикатор загрузки, кнопка заблокирована */
  loading?: boolean
}

/** События NokiMainButton */
interface Emits {
  /** Нажатие (не срабатывает в disabled и loading) */
  click: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const native = isInTelegram()

function onClick() {
  if (!props.disabled && !props.loading) emit('click')
}

/** Цвет из нашей палитры: CSS-переменные Telegram не понимает, нужен #RRGGBB */
function cssColor(name: string): string | undefined {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return /^#[0-9a-f]{6}$/i.test(value) ? value : undefined
}

if (native) {
  const mb = tg!.MainButton
  const paint = () => mb.setParams({ color: cssColor('--primary-500'), text_color: cssColor('--on-primary') })
  paint()
  // цветовая тема мастера меняется на лету (выбор в «Оформлении», переход на страницу записи) — кнопка за ней
  const themeObserver = new MutationObserver(paint)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-palette', 'data-theme'] })
  mb.onClick(onClick)
  mb.show()

  watch(
    () => [props.text, props.disabled, props.loading] as const,
    ([text, disabled, loading]) => {
      mb.setText(text)
      if (disabled || loading) mb.disable()
      else mb.enable()
      if (loading) mb.showProgress(false)
      else mb.hideProgress()
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    mb.offClick(onClick)
    themeObserver.disconnect()
    mb.hideProgress()
    mb.hide()
  })
}
</script>

<style scoped lang="scss">
.main-button {
  position: sticky;
  bottom: 0;
  z-index: 5;
  // сверху без отступа: в покое расстояние до блока выше — обычный gap, как между остальными
  margin: 0 calc(var(--space-md) * -1);
  padding: 0 var(--space-md) calc(var(--space-sm) + env(safe-area-inset-bottom));
  background: var(--bg);

  // растворение над кнопкой: прокручиваемое мягко уходит под неё. В покое лежит на пустом gap и не видно
  &::before {
    content: '';
    position: absolute;
    right: 0;
    bottom: 100%;
    left: 0;
    height: var(--space-md);
    background: linear-gradient(to top, var(--bg), transparent);
    pointer-events: none;
  }
}
</style>
