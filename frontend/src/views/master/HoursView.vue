<template>
  <div class="stack">
    <PageHeader :title="t('hours.title')" :back="() => router.back()" />

    <div class="intro">
      <NokiMascot :mood="ctx.hasError.value ? 'sad' : 'happy'" :size="96" />
      <p>{{ t('onboarding.hours.subtitle') }}</p>
    </div>

    <HoursFields ref="hoursFields" :ctx="ctx" />

    <p v-if="ctx.errors.save" class="error">{{ ctx.errors.save }}</p>

    <!-- при выборе дней в календаре главная кнопка становится «Задать часы · N», при открытой шторке прячется -->
    <NokiMainButton v-if="!ctx.sheetOpen.value" :text="mainText" :loading="ctx.saving.value" @click="onMain" />
  </div>
</template>

<script setup lang="ts">
// Часы работы мастера: пояс, шаг записи и график на одном экране.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiMascot from '@/components/mascot/NokiMascot.vue'
import NokiMainButton from '@/components/ui/NokiMainButton.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import HoursFields from '@/components/master/HoursFields.vue'
import { useMasterForm } from '@/composables/useMasterForm'
import { haptic } from '@/telegram'
import { EnumSlotMode } from '@/api/types'

const { t } = useI18n()
const router = useRouter()
const ctx = useMasterForm()
const hoursFields = ref<InstanceType<typeof HoursFields> | null>(null)

const mainText = computed(() =>
  ctx.pickingDays.value ? t(ctx.form.slot_mode === EnumSlotMode.Fixed ? 'scheduleEditor.setTimes' : 'scheduleEditor.setHours', { n: ctx.selectedDays.value }) : t('common.save'),
)

async function onMain() {
  if (ctx.pickingDays.value) return hoursFields.value?.openSheet()
  if (!ctx.validateHours() || !(await ctx.save())) return haptic.error()
  haptic.success()
  router.back()
}
</script>

<style scoped lang="scss">
.intro {
  display: flex;
  align-items: center;
  gap: var(--space-md);

  p { margin: 0; }
}

.error {
  margin: 0;
  color: var(--danger-500);
  font-size: var(--font-size-sm);
}
</style>
