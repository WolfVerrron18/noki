<template>
  <div class="noki-rive" :class="{ boopable: boop }" :style="rootStyle" @pointerdown="onBoop">
    <canvas ref="canvasEl" :aria-label="t('mascot.label')" role="img" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Rive, RuntimeLoader, type ViewModelInstance } from '@rive-app/canvas'
import riveWasmUrl from '@rive-app/canvas/rive.wasm?url'
import riveFallbackWasmUrl from '@rive-app/canvas/rive_fallback.wasm?url'
import type { NokiMood } from '@/components/mascot/NokiMascot.vue'
import { EnumNokiHat, EnumNokiPhoneAction, EnumNokiReaction, NOKI_RIVE, type RiveCharacterSource } from '@/components/mascot/rive/character'
import { useRiveBlink } from '@/composables/useRiveBlink'
import { prefersReducedMotion } from '@/animations/gsap'
import { haptic } from '@/telegram'

// wasm рантайма (и запасной для старых браузеров) отдаём со своего сервера, а не с CDN Rive
RuntimeLoader.setWasmUrl(riveWasmUrl)
RuntimeLoader.setWasmFallbackUrl(riveFallbackWasmUrl)

/** Пропсы NokiRive */
interface Props {
  /** Настроение, по умолчанию happy */
  mood?: NokiMood
  /** Головной убор, по умолчанию без него */
  hat?: EnumNokiHat
  /** Размер стороны в px, по умолчанию 160 */
  size?: number
  /** Тап по Ноки — «буп». Выключать, когда Ноки внутри кнопки */
  boop?: boolean
  /** Rive-файл персонажа. По умолчанию Ноки */
  source?: RiveCharacterSource
  /** Ноки держит телефон (ввод данных записи). Действия с телефоном — через phone() */
  phone?: boolean
}

/** События NokiRive */
interface Emits {
  /** Файл загружен, Ноки на экране и уже в нужном настроении */
  (e: 'ready'): void
}

const emit = defineEmits<Emits>()

const props = withDefaults(defineProps<Props>(), {
  mood: 'happy',
  hat: EnumNokiHat.None,
  size: 160,
  boop: true,
  source: () => NOKI_RIVE,
  phone: false,
})

const { t } = useI18n()
const canvasEl = ref<HTMLCanvasElement | null>(null)
const rive = shallowRef<Rive | null>(null)
const vmi = shallowRef<ViewModelInstance | null>(null)

const rootStyle = computed(() => ({ width: `${props.size}px`, height: `${props.size}px` }))

useRiveBlink(vmi)

/** При уменьшении движения Ноки стоит: даём state machine перейти в новую позу и снова ставим на паузу */
let pauseTimer: ReturnType<typeof setTimeout> | undefined
function settle() {
  if (!prefersReducedMotion() || !rive.value) return
  rive.value.play()
  clearTimeout(pauseTimer)
  pauseTimer = setTimeout(() => rive.value?.pause(), 600)
}

/** Когда последний раз менялось настроение или телефон: триггер в тот же кадр Rive теряет */
let moodChangedAt = 0

function apply() {
  const v = vmi.value
  if (!v) return
  const mood = v.enum('mood')
  if (mood && mood.value !== props.mood) {
    mood.value = props.mood
    moodChangedAt = performance.now()
  }
  const hat = v.enum('hat')
  if (hat) hat.value = props.hat
  const phone = v.boolean('phone')
  if (phone && phone.value !== props.phone) {
    phone.value = props.phone
    moodChangedAt = performance.now()
  }
  const boopEnabled = v.boolean('boopEnabled')
  if (boopEnabled) boopEnabled.value = props.boop
  settle()
}

watch(() => [props.mood, props.hat, props.phone, props.boop], apply)

/** Триггеры, вызванные до загрузки файла: сыграем их сразу после загрузки */
const pending: string[] = []
/** Сколько ждать после смены настроения или телефона, мс: переход в Rive длится до 200 мс */
const MOOD_SETTLE_MS = 250
const timers = new Set<ReturnType<typeof setTimeout>>()

/**
 * Дёрнуть триггер ViewModel. Пока файл грузится — запомнить; сразу после смены настроения — чуть подождать,
 * иначе Rive обработает переход настроения и триггер пропадёт; при уменьшении движения — ничего
 */
function fire(name: string) {
  if (prefersReducedMotion()) return
  if (!vmi.value) {
    pending.push(name)
    return
  }
  const wait = MOOD_SETTLE_MS - (performance.now() - moodChangedAt)
  if (wait > 0) {
    const id = setTimeout(() => {
      timers.delete(id)
      fire(name)
    }, wait)
    timers.add(id)
    return
  }
  vmi.value.trigger(name)?.trigger()
}

/**
 * Короткая реакция поверх настроения
 * @param reaction какая реакция
 */
function react(reaction: EnumNokiReaction) {
  fire(reaction)
}

/**
 * Действие с телефоном. Срабатывает, только пока включён проп phone
 * @param action тап, отправка или «готово»
 */
function phoneAction(action: EnumNokiPhoneAction) {
  if (props.phone) fire(action)
}

/** Публичный интерфейс NokiRive для родителя (через ref) */
export interface NokiRiveExpose {
  /** Короткая реакция поверх настроения */
  react: typeof react
  /** Действие с телефоном */
  phone: typeof phoneAction
}

defineExpose<NokiRiveExpose>({ react, phone: phoneAction })

function onBoop() {
  if (!props.boop || !vmi.value || prefersReducedMotion()) return
  haptic.tap()
  vmi.value.trigger('boop')?.trigger()
}

function resize() {
  rive.value?.resizeDrawingSurfaceToCanvas()
}

onMounted(() => {
  if (!canvasEl.value) return
  const r = new Rive({
    src: props.source.src,
    canvas: canvasEl.value,
    artboard: props.source.artboard,
    stateMachines: props.source.stateMachine,
    // стартуем только после того, как выставим настроение: иначе Ноки сначала сыграет вход в настроение по умолчанию
    autoplay: false,
    autoBind: true,
    onLoad: () => {
      resize()
      vmi.value = r.viewModelInstance
      apply()
      if (!prefersReducedMotion()) r.play()
      pending.splice(0).forEach(fire)
      emit('ready')
    },
  })
  rive.value = r
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  clearTimeout(pauseTimer)
  timers.forEach(clearTimeout)
  window.removeEventListener('resize', resize)
  rive.value?.cleanup()
})
</script>

<style scoped lang="scss">
.noki-rive {
  flex-shrink: 0;
  touch-action: manipulation;

  &.boopable { cursor: pointer; }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
}
</style>
