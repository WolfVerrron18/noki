<template>
  <div class="stack">
    <PageHeader :title="t('mascot.editor.title')" :back="back" />

    <div class="preview">
      <div class="burst">
        <NokiMascot ref="noki" :look="draft" :mood="justSaved ? 'wink' : 'happy'" :size="180" />
        <NokiConfetti :autoplay="false" :trigger="savedCount" />
      </div>
      <p class="hint center">{{ t('mascot.editor.subtitle') }}</p>
    </div>

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
    <NokiMainButton :text="t('common.save')" :loading="saving" @click="save" />
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
// Конструктор Ноки: мастер выбирает наряд, его видят клиентки.
// Пока в Rive есть только головные уборы; остальные слои внешности появятся, когда их нарисуем.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiMascot, { type NokiMascotExpose } from '@/components/mascot/NokiMascot.vue'
import NokiButton from '@/components/ui/NokiButton.vue'
import NokiConfetti from '@/components/fx/NokiConfetti.vue'
import { useStaggerIn } from '@/animations/useStaggerIn'
import NokiMainButton from '@/components/ui/NokiMainButton.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { DEFAULT_LOOK, EnumMascotHead, type NokiLook } from '@/components/mascot/look'
import { MASCOT_HEAD } from '@/components/mascot/registry'
import { EnumNokiReaction } from '@/components/mascot/rive/character'
import type { SelectOption } from '@/components/ui/types'
import { useMaster } from '@/stores/master'
import { haptic } from '@/telegram'

const { t } = useI18n()
const router = useRouter()
const store = useMaster()

const draft = ref<NokiLook>({ ...(store.master?.mascot ?? DEFAULT_LOOK) })
const saving = ref(false)
const justSaved = ref(false)
const error = ref('')
/** Счётчик сохранений: каждое запускает конфетти */
const savedCount = ref(0)
const noki = ref<NokiMascotExpose | null>(null)

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

function shuffle() {
  const heads = Object.values(EnumMascotHead).filter((h) => h !== draft.value.head)
  pick(heads[Math.floor(Math.random() * heads.length)])
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    await store.saveMascot(draft.value)
    haptic.success()
    justSaved.value = true
    savedCount.value++
  } catch {
    error.value = t('common.error')
    haptic.error()
  } finally {
    saving.value = false
  }
}

function back() {
  router.push({ name: 'master-home' })
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
