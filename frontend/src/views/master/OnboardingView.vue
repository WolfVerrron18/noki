<template>
  <div class="stack">
    <PageHeader :title="title" :back="step > 1 ? back : undefined" />

    <div class="intro">
      <NokiMascot :mood="ctx.hasError.value ? 'sad' : 'happy'" :size="96" />
      <div>
        <p class="hint">{{ t('onboarding.step', { n: step, total: TOTAL }) }}</p>
        <p>{{ step === 1 ? t('onboarding.profile.subtitle') : t('onboarding.hours.subtitle') }}</p>
        <div class="dots">
          <i v-for="n in TOTAL" :key="n" :class="{ active: n <= step }" />
        </div>
      </div>
    </div>

    <Transition name="slide" mode="out-in">
      <div v-if="step === 1" key="1" class="stack">
        <ProfileFields :ctx="ctx" />
        <LegalConsent v-model="consent" :action="t('common.next')" :consent="EnumLegalDoc.ConsentMaster" :error="consentError" />
      </div>
      <HoursFields v-else key="2" ref="hoursFields" :ctx="ctx" />
    </Transition>

    <p v-if="ctx.errors.save" class="error">{{ ctx.errors.save }}</p>

    <!-- одна главная кнопка на экране: при выборе дней в календаре она становится «Задать часы · N»,
         а пока открыта шторка — прячется (у шторки своя) -->
    <NokiMainButton v-if="!ctx.sheetOpen.value" :text="mainText" :loading="ctx.saving.value" @click="onMain" />
  </div>
</template>

<script setup lang="ts">
// Первый вход мастера: профиль, затем часы работы. Потом они правятся на отдельных экранах.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiMascot from '@/components/mascot/NokiMascot.vue'
import NokiMainButton from '@/components/ui/NokiMainButton.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ProfileFields from '@/components/master/ProfileFields.vue'
import HoursFields from '@/components/master/HoursFields.vue'
import { useMasterForm } from '@/composables/useMasterForm'
import { haptic } from '@/telegram'
import { EnumLegalDoc, EnumSlotMode } from '@/api/types'
import LegalConsent from '@/components/legal/LegalConsent.vue'
import { MASTER_DOCS } from '@/legal/documents'
import { useLegal } from '@/stores/legal'

const TOTAL = 2
const { t } = useI18n()
const router = useRouter()
const ctx = useMasterForm()

const step = ref(1)
const legal = useLegal()
/** Галочка согласия мастера; уже давала (вернулась на шаг 1) — отмечена */
const consent = ref(!legal.missing(MASTER_DOCS).length)
const consentError = ref('')
const hoursFields = ref<InstanceType<typeof HoursFields> | null>(null)

const title = computed(() => (step.value === 1 ? t('onboarding.profile.title') : t('onboarding.hours.title')))

const mainText = computed(() => {
  if (step.value === 1) return t('common.next')
  if (ctx.pickingDays.value) return t(ctx.form.slot_mode === EnumSlotMode.Fixed ? 'scheduleEditor.setTimes' : 'scheduleEditor.setHours', { n: ctx.selectedDays.value })
  return t('onboarding.hours.finish')
})

async function onMain() {
  if (step.value === 1) {
    consentError.value = consent.value ? '' : t('legal.consentRequired')
    const profileOk = await ctx.validateProfile()
    if (!profileOk || !consent.value) return haptic.error()
    // документы принимаются здесь: без них сервер не создаст страницу на шаге 2
    try {
      await legal.accept(MASTER_DOCS)
    } catch (e) {
      ctx.errors.save = (e as { status?: number }).status === 409 ? t('legal.outdated') : t('common.error')
      return haptic.error()
    }
    step.value = 2
    return
  }
  if (ctx.pickingDays.value) return hoursFields.value?.openSheet()
  if (!ctx.validateHours()) return haptic.error()
  if (!(await ctx.save())) return haptic.error()
  haptic.success()
  router.replace({ name: 'master-home' })
}

function back() {
  step.value = 1
}
</script>

<style scoped lang="scss">
.intro {
  display: flex;
  align-items: center;
  gap: var(--space-md);

  p { margin: 0; }
}

.dots {
  display: flex;
  gap: var(--space-xs);
  margin-top: var(--space-sm);

  i {
    width: var(--space-lg);
    height: var(--space-xs);
    border-radius: var(--radius-pill);
    background: var(--primary-200);
    transition: background 0.2s;

    &.active { background: var(--primary-500); }
  }
}

.error {
  margin: 0;
  color: var(--danger-500);
  font-size: var(--font-size-sm);
}

.slide-enter-active, .slide-leave-active { transition: opacity 0.15s, transform 0.15s; }
.slide-enter-from { opacity: 0; transform: translateX(var(--space-md)); }
.slide-leave-to { opacity: 0; transform: translateX(calc(var(--space-md) * -1)); }
</style>
