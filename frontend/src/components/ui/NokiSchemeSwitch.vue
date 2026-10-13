<template>
  <div class="scheme">
    <NokiSegmented v-model="pref" :label="t('scheme.label')" :options="options" />
    <p class="hint">{{ t('scheme.hint') }}</p>
  </div>
</template>

<script setup lang="ts">
// Светлая / тёмная тема для себя: «как в Telegram» или вручную. Хранится на устройстве, клиенток не касается
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import NokiSegmented from '@/components/ui/NokiSegmented.vue'
import type { SelectOption } from '@/components/ui/types'
import { colorSchemePref, setColorSchemePref, type ColorSchemePref } from '@/telegram'

const { t } = useI18n()
const pref = ref<ColorSchemePref>(colorSchemePref())

const options = computed<SelectOption<ColorSchemePref>[]>(() => [
  { value: 'auto', label: t('scheme.auto') },
  { value: 'light', label: t('scheme.light') },
  { value: 'dark', label: t('scheme.dark') },
])

watch(pref, setColorSchemePref)
</script>

<style scoped lang="scss">
.scheme {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);

  .hint { margin: 0; padding-left: var(--space-xs); }
}
</style>
