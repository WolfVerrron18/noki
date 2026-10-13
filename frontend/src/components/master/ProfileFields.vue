<template>
  <div class="stack">
    <NokiInput v-model="form.name" :label="t('onboarding.profile.name')" :placeholder="t('onboarding.profile.namePlaceholder')" :error="errors.name" />
    <NokiInput
      :model-value="form.slug"
      :label="t('onboarding.profile.slug')"
      :hint="slugHint"
      :error="errors.slug"
      @update:model-value="onSlugInput"
    />
  </div>
</template>

<script setup lang="ts">
// Поля профиля мастера: имя и адрес ссылки. Состояние — в useMasterForm у экрана.
import { useI18n } from 'vue-i18n'
import NokiInput from '@/components/ui/NokiInput.vue'
import type { MasterForm } from '@/composables/useMasterForm'

/** Пропсы ProfileFields */
interface Props {
  /** Форма профиля экрана */
  ctx: MasterForm
}

const props = defineProps<Props>()
const { t } = useI18n()
const { form, errors, slugHint, onSlugInput } = props.ctx
</script>
