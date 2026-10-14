<template>
  <div class="stack">
    <PageHeader :title="t('onboarding.profile.editTitle')" :back="back" />

    <div class="intro">
      <NokiMascot :mood="ctx.hasError.value ? 'sad' : 'happy'" :size="96" />
      <p>{{ t('onboarding.profile.subtitle') }}</p>
    </div>

    <ProfileFields :ctx="ctx" />

    <section class="docs">
      <h2>{{ t('legal.documents') }}</h2>
      <RouterLink v-for="doc in MASTER_DOCS" :key="doc" :to="{ name: 'legal-doc', params: { doc } }">{{ legalText(doc).title }}</RouterLink>
    </section>

    <p v-if="ctx.errors.save" class="error">{{ ctx.errors.save }}</p>

    <NokiMainButton :text="t('common.save')" :disabled="!ctx.dirty.value" :loading="ctx.saving.value" @click="onSave" />
  </div>
</template>

<script setup lang="ts">
// Правка профиля мастера: имя и адрес ссылки. Часы работы — на своём экране.
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiMascot from '@/components/mascot/NokiMascot.vue'
import NokiMainButton from '@/components/ui/NokiMainButton.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ProfileFields from '@/components/master/ProfileFields.vue'
import { useMasterForm } from '@/composables/useMasterForm'
import { useLegalText } from '@/composables/useLegalText'
import { MASTER_DOCS } from '@/legal/documents'
import { haptic } from '@/telegram'

const { t } = useI18n()
const router = useRouter()
const ctx = useMasterForm()
const legalText = useLegalText()

async function back() {
  if (await ctx.confirmLeave()) router.back()
}

async function onSave() {
  if (!(await ctx.validateProfile()) || !(await ctx.save())) return haptic.error()
  haptic.success()
  router.push({ name: 'master-home' })
}
</script>

<style scoped lang="scss">
.intro {
  display: flex;
  align-items: center;
  gap: var(--space-md);

  p { margin: 0; }
}

.docs {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);

  h2 { margin: 0; font-size: var(--font-size-md); }

  a {
    color: var(--primary-600);
    font-size: var(--font-size-sm);
    text-underline-offset: 2px;
  }
}

.error {
  margin: 0;
  color: var(--danger-500);
  font-size: var(--font-size-sm);
}
</style>
