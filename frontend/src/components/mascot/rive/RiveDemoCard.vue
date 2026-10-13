<template>
  <NokiCard class="rive-demo">
    <div class="head">
      <h2>{{ t('mascot.rive.title') }}</h2>
      <p class="hint">{{ t('mascot.rive.hint') }}</p>
    </div>
    <div class="stage">
      <NokiRive :mood="mood" :hat="hat" :size="200" />
    </div>
    <NokiSegmented v-model="mood" :label="t('mascot.rive.moodLabel')" :options="moodOptions" scroll />
    <NokiSegmented v-model="hat" :label="t('mascot.rive.hatLabel')" :options="hatOptions" scroll />
  </NokiCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import NokiCard from '@/components/ui/NokiCard.vue'
import NokiSegmented from '@/components/ui/NokiSegmented.vue'
import NokiRive from '@/components/mascot/rive/NokiRive.vue'
import type { NokiMood } from '@/components/mascot/NokiMascot.vue'
import { EnumNokiHat, NOKI_HATS, NOKI_MOODS } from '@/components/mascot/rive/character'
import type { SelectOption } from '@/components/ui/types'

const { t } = useI18n()

const mood = ref<NokiMood>('happy')
const hat = ref<EnumNokiHat>(EnumNokiHat.Beanie)

const moodOptions = computed<SelectOption<NokiMood>[]>(() => NOKI_MOODS.map((m) => ({ value: m, label: t(`mascot.mood.${m}`) })))
const hatOptions = computed<SelectOption<EnumNokiHat>[]>(() => NOKI_HATS.map((h) => ({ value: h, label: t(`mascot.hat.${h}`) })))
</script>

<style scoped lang="scss">
.rive-demo {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.head {
  h2, p { margin: 0; }
}

.stage {
  display: flex;
  justify-content: center;
  border-radius: var(--radius-lg);
  background: var(--primary-100);
}
</style>
