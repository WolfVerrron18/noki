<template>
  <div class="stack">
    <PageHeader :title="t('dev.mascot.title')" :back="() => router.push({ name: 'start' })" />

    <NokiSegmented v-model="theme" :label="t('dev.mascot.theme')" :options="themeOptions" />
    <NokiSegmented v-model="size" :label="t('dev.mascot.size')" :options="sizeOptions" />
    <NokiSegmented v-model="hat" :label="t('dev.mascot.hat')" :options="hatOptions" scroll />

    <div class="grid" :style="gridStyle">
      <figure v-for="mood in NOKI_MOODS" :key="mood">
        <NokiRive :mood="mood" :hat="hat" :size="size" />
        <figcaption class="hint">{{ t(`mascot.mood.${mood}`) }}</figcaption>
      </figure>
    </div>
  </div>
</template>

<script setup lang="ts">
// Служебная витрина Ноки: все настроения × выбранная шапка. Только в dev.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiRive from '@/components/mascot/rive/NokiRive.vue'
import { EnumNokiHat, NOKI_HATS, NOKI_MOODS } from '@/components/mascot/rive/character'
import NokiSegmented from '@/components/ui/NokiSegmented.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import type { SelectOption } from '@/components/ui/types'

const { t } = useI18n()
const router = useRouter()

const root = document.documentElement
const initialTheme = root.dataset.theme ?? 'light'
const theme = ref(initialTheme)
const size = ref(140)
const hat = ref<EnumNokiHat>(EnumNokiHat.None)

const themeOptions = computed(() => [
  { value: 'light', label: t('dev.mascot.light') },
  { value: 'dark', label: t('dev.mascot.dark') },
])
const hatOptions = computed<SelectOption<EnumNokiHat>[]>(() => NOKI_HATS.map((h) => ({ value: h, label: t(`mascot.hat.${h}`) })))
const gridStyle = computed(() => ({ gridTemplateColumns: `repeat(auto-fill, minmax(${size.value + 16}px, 1fr))` }))
const sizeOptions = [96, 140, 200].map((v) => ({ value: v, label: String(v) }))

watch(theme, (v) => (root.dataset.theme = v))
onBeforeUnmount(() => (root.dataset.theme = initialTheme))
</script>

<style scoped lang="scss">
.grid {
  display: grid;
  gap: var(--space-md);
}

figure {
  margin: 0;
  padding: var(--space-sm);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

figcaption { margin: 0; }
</style>
