<template>
  <div class="noki" :class="[mood, scene && `scene-${scene}`, { boopable: boop }]" :style="rootStyle" @pointerdown="onBoop">
    <svg viewBox="0 0 200 200" role="img" :aria-label="t('mascot.label')">
      <!-- тень -->
      <ellipse class="shadow" cx="100" cy="182" rx="52" ry="8" />

      <!-- фон из конструктора: не качается вместе с телом -->
      <component :is="parts.background" v-if="parts.background" />

      <!-- обёртка для «бупа» (GSAP): у .body свой CSS-transform покачивания, их нельзя смешивать -->
      <g ref="boopEl">
      <g class="body">
        <!-- ушки -->
        <path class="fur" d="M52 78 L60 30 L92 62 Z" />
        <path class="fur" d="M148 78 L140 30 L108 62 Z" />
        <path class="ear-in" d="M60 66 L64 42 L82 60 Z" />
        <path class="ear-in" d="M140 66 L136 42 L118 60 Z" />

        <!-- ножки выглядывают из-под облачка; в сценах свои позы -->
        <template v-if="!sceneDef">
          <ellipse class="fur" cx="82" cy="171" rx="11" ry="6.5" />
          <ellipse class="fur" cx="118" cy="171" rx="11" ry="6.5" />
        </template>

        <!-- тело-облачко -->
        <path
          class="fur"
          d="M50 150 C24 150 22 116 44 110 C34 86 56 62 80 70 C88 52 112 52 120 70
             C144 62 166 86 156 110 C178 116 176 150 150 150 C146 166 118 172 100 164
             C82 172 54 166 50 150 Z"
        />

        <!-- головной убор -->
        <component :is="parts.head" v-if="parts.head" />

        <!-- щёчки -->
        <ellipse class="blush" cx="66" cy="122" rx="11" ry="7" />
        <ellipse class="blush" cx="134" cy="122" rx="11" ry="7" />

        <!-- глазки: смотрят на предмет сцены -->
        <g class="eyes" :style="gazeStyle">
          <template v-if="mood === 'happy' || mood === 'thinking'">
            <g class="blink">
              <ellipse class="eye" cx="78" cy="106" rx="7" ry="9" />
              <ellipse class="eye" cx="122" cy="106" rx="7" ry="9" />
              <circle class="shine" cx="80.5" cy="102.5" r="2.6" />
              <circle class="shine" cx="124.5" cy="102.5" r="2.6" />
            </g>
          </template>
          <template v-else-if="mood === 'wink'">
            <path class="line" d="M70 106 Q78 98 86 106" />
            <ellipse class="eye" cx="122" cy="106" rx="7" ry="9" />
            <circle class="shine" cx="124.5" cy="102.5" r="2.6" />
          </template>
          <template v-else-if="mood === 'sleepy'">
            <path class="line" d="M70 104 Q78 112 86 104" />
            <path class="line" d="M114 104 Q122 112 130 104" />
          </template>
          <template v-else>
            <ellipse class="eye" cx="78" cy="108" rx="6" ry="7" />
            <ellipse class="eye" cx="122" cy="108" rx="6" ry="7" />
            <path class="line thin" d="M68 94 L86 98" />
            <path class="line thin" d="M132 94 L114 98" />
            <ellipse class="tear" cx="74" cy="122" rx="3" ry="5" />
          </template>
        </g>

        <!-- носик и ротик -->
        <path class="nose" d="M96 116 L104 116 L100 121 Z" />
        <path v-if="mood === 'sad'" class="line thin" d="M92 132 Q100 126 108 132" />
        <path v-else-if="mood === 'thinking'" class="line thin" d="M94 129 L106 129" />
        <path v-else class="line thin" d="M90 124 Q95 131 100 124 Q105 131 110 124" />

        <!-- украшение на шее -->
        <component :is="parts.neck" v-if="parts.neck" />

        <!-- сцена (занятие) или лапки -->
        <component :is="sceneDef.component" v-if="sceneDef" />
        <template v-else>
          <!-- значок Ноки обнимает: лапки поверх предмета -->
          <g v-if="showBadge" :transform="hugTransform">
            <component :is="parts.badge" />
          </g>
          <ellipse class="fur paw" cx="83" cy="160" rx="8.5" ry="7" transform="rotate(30 83 160)" />
          <ellipse class="fur paw" cx="117" cy="160" rx="8.5" ry="7" transform="rotate(-30 117 160)" />
        </template>
      </g>
      </g>

      <!-- Zzz / мысли -->
      <text v-if="mood === 'sleepy'" class="zzz" x="148" y="54">z<tspan dy="-12" font-size="22">z</tspan></text>
      <g v-if="mood === 'thinking'" class="think">
        <circle cx="160" cy="62" r="5" /><circle cx="172" cy="46" r="8" />
      </g>
      <g v-if="mood === 'wink'" class="sparkles">
        <path d="M38 52 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z" />
        <path d="M168 150 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 Z" />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref } from 'vue'
import { gsap, prefersReducedMotion } from '@/animations/gsap'
import { haptic } from '@/telegram'
import { useI18n } from 'vue-i18n'
import { SCENES, type NokiScene } from '@/components/mascot/scenes'
import { DEFAULT_LOOK, EnumMascotBadge, NOKI_LOOK_KEY, type NokiLook } from '@/components/mascot/look'
import { MASCOT_BACKGROUND, MASCOT_BADGE, MASCOT_FUR, MASCOT_HEAD, MASCOT_NECK } from '@/components/mascot/parts/registry'

// SVG-Ноки с нарядом из конструктора. Нужен, пока наряд не перенесён в Rive (превью конструктора)
import type { NokiMood } from '@/components/mascot/NokiMascot.vue'

/** Пропсы NokiSvgMascot */
interface Props {
  /** Настроение, по умолчанию happy */
  mood?: NokiMood
  /** Размер стороны в px, по умолчанию 140 */
  size?: number
  /** Занятие под контекст экрана. Не задано — сидит, сложив лапки */
  scene?: NokiScene
  /** Внешность из конструктора. Не задана — из контекста экрана (NOKI_LOOK_KEY), иначе розовый Ноки без нарядов */
  look?: NokiLook
  /** Тап по Ноки — он подпрыгивает. По умолчанию да; выключать, когда Ноки внутри кнопки */
  boop?: boolean
}

const { t } = useI18n()

const props = withDefaults(defineProps<Props>(), { mood: 'happy', size: 140, boop: true })

const sceneDef = computed(() => (props.scene ? SCENES[props.scene] : undefined))
const gazeStyle = computed(() => {
  const gaze = sceneDef.value?.gaze
  return gaze ? { transform: `translate(${gaze.x}px, ${gaze.y}px)` } : undefined
})

const contextLook = inject(NOKI_LOOK_KEY, undefined)
const look = computed(() => props.look ?? contextLook?.value ?? DEFAULT_LOOK)

/** Компоненты выбранных деталей; неизвестный id — деталь не рисуется */
const parts = computed(() => ({
  background: look.value.background ? MASCOT_BACKGROUND[look.value.background]?.component : undefined,
  head: look.value.head ? MASCOT_HEAD[look.value.head]?.component : undefined,
  neck: look.value.neck ? MASCOT_NECK[look.value.neck]?.component : undefined,
  badge: look.value.badge ? MASCOT_BADGE[look.value.badge]?.component : undefined,
}))

/**
 * Как Ноки обнимает значок. Детали значков нарисованы вокруг центра (123,137).
 * Длинные предметы держит поперёк за концы, флакончик — стоя.
 * Всё ниже украшения на шее (оно заканчивается около y=151), чтобы его было видно.
 */
const hugTransform = computed(() =>
  look.value.badge === EnumMascotBadge.Polish
    ? 'translate(100 160) scale(0.7) translate(-123 -137)'
    : 'translate(100 159) rotate(-72) scale(0.72) translate(-123 -137)',
)

const boopEl = ref<SVGGElement | null>(null)
let boopTl: gsap.core.Timeline | null = null

/** «Бупнули»: сплющился, подпрыгнул, пружинисто приземлился */
function onBoop() {
  if (!props.boop || !boopEl.value || prefersReducedMotion() || boopTl?.isActive()) return
  haptic.tap()
  boopTl = gsap
    // точка опоры — у ножек, в координатах viewBox
    .timeline({ defaults: { svgOrigin: '100 176' } })
    .to(boopEl.value, { scaleX: 1.15, scaleY: 0.82, duration: 0.1, ease: 'power2.out' })
    .to(boopEl.value, { y: -24, scaleX: 0.92, scaleY: 1.1, duration: 0.22, ease: 'power2.out' })
    .to(boopEl.value, { y: 0, scaleX: 1, scaleY: 1, duration: 0.7, ease: 'elastic.out(1.1, 0.35)' })
}

onBeforeUnmount(() => boopTl?.kill())

/** Значок показываем без сцены: в сцене лапки заняты */
const showBadge = computed(() => !!parts.value.badge && !sceneDef.value)

/** Размер и окрас: цвет шёрстки задаётся CSS-переменными, их подхватывают и сцены */
const rootStyle = computed(() => {
  const token = (MASCOT_FUR[look.value.fur] ?? MASCOT_FUR[DEFAULT_LOOK.fur]).token
  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
    '--noki-fur-500': `var(--${token}-500)`,
    '--noki-fur-400': `var(--${token}-400)`,
  }
})
</script>

<style scoped lang="scss">
@use '@/components/mascot/mascot' as m;

.noki {
  display: inline-block;

  &.boopable {
    cursor: pointer;
    touch-action: manipulation;
    -webkit-user-select: none;
    user-select: none;
  }
}
svg { width: 100%; height: 100%; overflow: visible; }

.fur { @include m.fur; }
.ear-in { fill: m.$fur-inner; }
.blush { fill: var(--primary-400); opacity: 0.45; }
.eye { fill: m.$ink; }
.shine { fill: m.$shine; }
.nose { fill: var(--primary-500); }
.line {
  @include m.ink-line(3.5);
  &.thin { stroke-width: 2.6; }
}
.tear { fill: var(--secondary-400); }
.shadow { fill: var(--primary-500); opacity: 0.12; }
.zzz { fill: var(--secondary-400); font: var(--font-weight-bold) 16px var(--font-family); }
.think circle, .sparkles path { fill: var(--secondary-400); }

// взгляд плавно переводится при смене сцены
.eyes { transition: transform 0.4s ease; }

// анимации
.body { transform-origin: 100px 160px; animation: sway 3.2s ease-in-out infinite; }
.blink { transform-origin: 100px 106px; animation: blink 4.5s infinite; }
.zzz, .think circle { animation: float 2.4s ease-in-out infinite; }
.sparkles path {
  transform-box: fill-box;
  transform-origin: center;
  animation: twinkle 1.4s ease-in-out infinite;
  &:nth-child(2) { animation-delay: 0.5s; }
}
.sleepy .body { animation-duration: 5s; }
.wink .body { animation: hop 0.9s ease-in-out infinite; }
.sad .body { animation: none; }

@keyframes sway { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
@keyframes hop { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes blink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
@keyframes float { 0%, 100% { transform: translateY(0); opacity: 0.7; } 50% { transform: translateY(-5px); opacity: 1; } }
@keyframes twinkle { 0%, 100% { transform: scale(0.7); opacity: 0.6; } 50% { transform: scale(1.1); opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .body, .blink, .zzz, .sparkles path, .think circle { animation: none; }
}
</style>
