<template>
  <NokiButton v-if="!native" :disabled="disabled" :loading="loading" @click="emit('click')">{{ text }}</NokiButton>
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
  mb.setParams({ color: cssColor('--primary-500'), text_color: cssColor('--on-primary') })
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
    mb.hideProgress()
    mb.hide()
  })
}
</script>
