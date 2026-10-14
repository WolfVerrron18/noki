<template>
  <div class="stack">
    <PageHeader :title="t('mascot.editor.title')" :back="back" />

    <div ref="previewEl" class="preview">
      <div class="burst">
        <NokiMascot ref="noki" :look="draft" :mood="justSaved ? 'wink' : 'happy'" :size="180" />
        <NokiConfetti :autoplay="false" :trigger="savedCount" />
      </div>
      <p class="hint center">{{ t('mascot.editor.subtitle') }}</p>
    </div>

    <section class="section">
      <h2>{{ t('mascot.editor.colorTitle') }}</h2>
      <div class="palettes" role="radiogroup">
        <button
          v-for="p in PALETTES"
          :key="p"
          v-press="{ depth: 0.1 }"
          v-pop="theme === p"
          type="button"
          role="radio"
          class="palette"
          :class="{ active: theme === p }"
          :data-palette="p"
          :aria-checked="theme === p"
          @click="pickTheme(p)"
        >
          <span class="swatch" aria-hidden="true" />
          <span>{{ t(`theme.palette.${p}`) }}</span>
        </button>
      </div>
    </section>

    <NokiSchemeSwitch />

    <h2>{{ t('mascot.editor.headTitle') }}</h2>
    <div ref="optionsEl" class="options">
      <button
        v-for="o in options"
        :key="o.value ?? 'none'"
        v-press="{ depth: 0.08 }"
        v-pop="draft.head === o.value"
        type="button"
        class="option"
        :class="{ active: draft.head === o.value }"
        :aria-pressed="draft.head === o.value"
        @click="pick(o.value)"
      >
        {{ o.label }}
      </button>
    </div>

    <NokiButton variant="soft" @click="shuffle">{{ t('mascot.editor.random') }}</NokiButton>
    <!-- неактивна, пока ничего не меняли: сразу видно, что выбор ещё не сохранён -->
    <NokiMainButton :text="t('common.save')" :disabled="!dirty" :loading="saving" @click="save" />
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
// Конструктор Ноки: мастер выбирает наряд, его видят клиентки.
// Пока в Rive есть только головные уборы; остальные слои внешности появятся, когда их нарисуем.
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiMascot, { type NokiMascotExpose } from '@/components/mascot/NokiMascot.vue'
import NokiButton from '@/components/ui/NokiButton.vue'
import NokiConfetti from '@/components/fx/NokiConfetti.vue'
import { useStaggerIn } from '@/animations/useStaggerIn'
import NokiMainButton from '@/components/ui/NokiMainButton.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import NokiSchemeSwitch from '@/components/ui/NokiSchemeSwitch.vue'
import { DEFAULT_LOOK, EnumMascotHead, type NokiLook } from '@/components/mascot/look'
import { MASCOT_HEAD } from '@/components/mascot/registry'
import { EnumNokiReaction } from '@/components/mascot/rive/character'
import type { SelectOption } from '@/components/ui/types'
import { DEFAULT_PALETTE, PALETTES, type EnumPalette } from '@/styles/palettes'
import { useMaster } from '@/stores/master'
import { useDirty } from '@/composables/useDirty'
import { prefersReducedMotion } from '@/animations/gsap'
import { haptic } from '@/telegram'

const { t } = useI18n()
const router = useRouter()
const store = useMaster()

const draft = ref<NokiLook>({ ...(store.master?.mascot ?? DEFAULT_LOOK) })
const theme = ref<EnumPalette>(store.master?.theme ?? DEFAULT_PALETTE)
const saving = ref(false)
const justSaved = ref(false)
const error = ref('')
/** Счётчик сохранений: каждое запускает конфетти */
const savedCount = ref(0)
const noki = ref<NokiMascotExpose | null>(null)
const previewEl = ref<HTMLElement | null>(null)
const { dirty, markSaved, confirmLeave } = useDirty(() => ({ mascot: draft.value, theme: theme.value }))

const optionsEl = ref<HTMLElement | null>(null)
useStaggerIn(optionsEl)

const options = computed<SelectOption<EnumMascotHead | null>[]>(() => [
  { value: null, label: t('mascot.none') },
  ...(Object.entries(MASCOT_HEAD) as [EnumMascotHead, string][]).map(([id, hat]) => ({ value: id, label: t(`mascot.hat.${hat}`) })),
])

function pick(head: EnumMascotHead | null) {
  haptic.tap()
  draft.value = { ...draft.value, head }
  justSaved.value = false
  noki.value?.react(EnumNokiReaction.Admire)
}


/**
 * Примерить тему: всё приложение сразу перекрашивается, сохранится по главной кнопке.
 * @param p тема
 */
function pickTheme(p: EnumPalette) {
  haptic.tap()
  theme.value = p
  store.themePreview = p
  justSaved.value = false
}

// ушла без сохранения — возвращаем сохранённую тему
onBeforeUnmount(() => (store.themePreview = null))
function shuffle() {
  const heads = Object.values(EnumMascotHead).filter((h) => h !== draft.value.head)
  pick(heads[Math.floor(Math.random() * heads.length)])
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    await store.saveAppearance({ mascot: draft.value, theme: theme.value })
    haptic.success()
    markSaved()
    justSaved.value = true
    // кнопка внизу, Ноки наверху: возвращаемся к ней — видно, как она радуется
    previewEl.value?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' })
    savedCount.value++
  } catch {
    error.value = t('common.error')
    haptic.error()
  } finally {
    saving.value = false
  }
}

async function back() {
  if (await confirmLeave()) router.push({ name: 'master-home' })
}
</script>

<style scoped lang="scss">
.preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);

  p { margin: 0; }
}

.burst { position: relative; }

h2 { margin: 0; font-size: var(--font-size-md); }

.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.palettes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(var(--control-height) * 1.4), 1fr));
  gap: var(--space-sm);
}

// образец темы: data-palette на кнопке даёт ей цвета своей темы
.palette {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-xs);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow);
  color: var(--text);
  font: inherit;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: border-color 0.15s;

  &.active { border-color: var(--primary-500); }
}

.swatch {
  width: var(--control-height);
  height: var(--control-height);
  border-radius: 50%;
  // только то, что тема реально красит: кнопки (500), светлые акценты (400) и мягкие подложки (100)
  background: conic-gradient(from 200deg, var(--primary-500) 0 50%, var(--primary-400) 0 75%, var(--primary-100) 0);
  box-shadow: inset 0 0 0 2px var(--primary-200);
}

.options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: var(--space-sm);
}

.option {
  padding: var(--space-sm);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow);
  color: var(--text);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: border-color 0.15s;
  &.active { border-color: var(--primary-500); }
}

.error {
  margin: 0;
  color: var(--danger-500);
  font-size: var(--font-size-sm);
}
</style>
