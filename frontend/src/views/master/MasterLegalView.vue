<template>
  <div class="stack">
    <PageHeader :title="t('legal.update.title')" />

    <div class="intro">
      <NokiMascot mood="thinking" :size="96" />
      <p>{{ t('legal.update.text') }}</p>
    </div>

    <LegalConsent v-model="checked" :action="t('legal.update.accept')" :consent="EnumLegalDoc.ConsentMaster" :error="error" />

    <p v-if="saveError" class="error">{{ saveError }}</p>
    <NokiMainButton :text="t('legal.update.accept')" :loading="saving" @click="accept" />
  </div>
</template>

<script setup lang="ts">
// Новая редакция документов: мастер принимает её, прежде чем вернуться в кабинет.
// Сюда отправляет роутер, если у мастера не приняты текущие MASTER_DOCS.
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { EnumLegalDoc } from '@/api/types'
import NokiMascot from '@/components/mascot/NokiMascot.vue'
import NokiMainButton from '@/components/ui/NokiMainButton.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import LegalConsent from '@/components/legal/LegalConsent.vue'
import { MASTER_DOCS } from '@/legal/documents'
import { useLegal } from '@/stores/legal'
import { haptic } from '@/telegram'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const legal = useLegal()

const checked = ref(false)
const error = ref('')
const saveError = ref('')
const saving = ref(false)

async function accept() {
  error.value = checked.value ? '' : t('legal.consentRequired')
  if (error.value) return haptic.error()
  saving.value = true
  saveError.value = ''
  try {
    await legal.accept(MASTER_DOCS)
    haptic.success()
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : null
    router.replace(redirect ?? { name: 'master-home' })
  } catch (e) {
    saveError.value = (e as { status?: number }).status === 409 ? t('legal.outdated') : t('common.error')
    haptic.error()
  } finally {
    saving.value = false
  }
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
