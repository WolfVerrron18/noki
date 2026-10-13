<template>
  <NokiRive ref="riveEl" :mood="mood" :size="size" :hat="hat" :boop="boop" :phone="phone" @ready="onReady" />
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import NokiRive, { type NokiRiveExpose } from '@/components/mascot/rive/NokiRive.vue'
import { EnumNokiReaction, type EnumNokiPhoneAction } from '@/components/mascot/rive/character'
import { NOKI_LOOK_KEY, type NokiLook } from '@/components/mascot/look'
import { hatOf } from '@/components/mascot/registry'

// Ноки — котёнок-облачко, маскот Nidoki.
// Всегда живой Rive-Ноки. Наряд — из пропа look или из контекста экрана (NOKI_LOOK_KEY).
/**
 * Настроение маскота:
 * - happy — приветствие, обычное состояние
 * - wink — успех, подмигивает и сверкает
 * - sleepy — пусто, нечего показать
 * - thinking — загрузка
 * - sad — ошибка
 */
export type NokiMood = 'happy' | 'wink' | 'sleepy' | 'thinking' | 'sad'

/** Пропсы NokiMascot */
interface Props {
  /** Настроение, по умолчанию happy */
  mood?: NokiMood
  /** Размер стороны в px, по умолчанию 140 */
  size?: number
  /** Внешность. Не задана — берётся из контекста экрана; явно нужна только превью конструктора */
  look?: NokiLook
  /** Тап по Ноки — буп. По умолчанию да; выключать, когда Ноки внутри кнопки */
  boop?: boolean
  /** Ноки держит телефон (ввод данных записи) */
  phone?: boolean
  /** Реакция, которую Ноки сыграет один раз при появлении (привет, ура) */
  greet?: EnumNokiReaction
}

/** События NokiMascot */
interface Emits {
  /** Ноки на экране: файл загружен и реакция при появлении уже стартовала */
  (e: 'ready'): void
}

const emit = defineEmits<Emits>()

const props = withDefaults(defineProps<Props>(), { mood: 'happy', size: 140, boop: true, phone: false })

const contextLook = inject(NOKI_LOOK_KEY, undefined)
const hat = computed(() => hatOf((props.look ?? contextLook?.value)?.head))

const riveEl = ref<NokiRiveExpose | null>(null)

/**
 * Короткая реакция поверх настроения
 * @param reaction какая реакция
 */
function react(reaction: EnumNokiReaction) {
  riveEl.value?.react(reaction)
}

/**
 * Действие с телефоном (тап, отправка, «готово»). Работает, пока включён проп phone
 * @param action какое действие
 */
function phoneAction(action: EnumNokiPhoneAction) {
  riveEl.value?.phone(action)
}

onMounted(() => {
  if (props.greet) react(props.greet)
})

function onReady() {
  emit('ready')
}

// стал грустным (ошибка) — сначала вздрагивает «ой»
watch(() => props.mood, (mood, prev) => {
  if (mood === 'sad' && prev !== 'sad') react(EnumNokiReaction.Oops)
})

/** Публичный интерфейс NokiMascot для родителя (через ref) */
export interface NokiMascotExpose {
  /** Короткая реакция поверх настроения */
  react: typeof react
  /** Действие с телефоном */
  phone: typeof phoneAction
}

defineExpose<NokiMascotExpose>({ react, phone: phoneAction })
</script>
