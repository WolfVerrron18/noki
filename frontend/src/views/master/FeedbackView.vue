<template>
  <div class="stack">
    <PageHeader :title="t('feedback.title')" :back="back" />

    <div v-if="sent" class="stack center done">
      <NokiMascot :size="160" :greet="EnumNokiReaction.Cheer" />
      <h2>{{ t('feedback.thanks') }}</h2>
      <p class="hint">{{ t('feedback.thanksHint') }}</p>
      <NokiButton @click="back">{{ t('feedback.toHome') }}</NokiButton>
      <NokiButton variant="soft" @click="again">{{ t('feedback.more') }}</NokiButton>
    </div>

    <template v-else>
      <div class="intro">
        <NokiMascot mood="thinking" :size="96" />
        <p>{{ t('feedback.subtitle') }}</p>
      </div>

      <NokiSegmented v-model="kind" :options="kindOptions" />

      <NokiTextarea
        v-model="text"
        :placeholder="kind === 'idea' ? t('feedback.ideaPlaceholder') : t('feedback.bugPlaceholder')"
        :maxlength="MAX"
        :error="error"
      />

      <NokiMainButton :text="t('feedback.send')" :loading="sending" @click="send" />
    </template>
  </div>
</template>

<script setup lang="ts">
// «Предложить идею / сообщить об ошибке»: сохраняется и пересылается разработчику
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiMascot from '@/components/mascot/NokiMascot.vue'
import { EnumNokiReaction } from '@/components/mascot/rive/character'
import NokiButton from '@/components/ui/NokiButton.vue'
import NokiMainButton from '@/components/ui/NokiMainButton.vue'
import NokiSegmented from '@/components/ui/NokiSegmented.vue'
import NokiTextarea from '@/components/ui/NokiTextarea.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { repo } from '@/api/repo'
import { EnumFeedbackRole } from '@/api/types'
import { haptic } from '@/telegram'

/** Тип сообщения: от него зависит подсказка и пометка в тексте для разработчика */
type Kind = 'idea' | 'bug'

/** Лимит как у поля feedback.text в базе */
const MAX = 2000

const { t } = useI18n()
const router = useRouter()

const kind = ref<Kind>('idea')
const text = ref('')
const error = ref('')
const sending = ref(false)
const sent = ref(false)

const kindOptions = computed(() => [
  { value: 'idea' as const, label: t('feedback.idea') },
  { value: 'bug' as const, label: t('feedback.bug') },
])

function back() {
  router.push({ name: 'master-home' })
}

function again() {
  text.value = ''
  sent.value = false
}

async function send() {
  const body = text.value.trim()
  if (body.length < 5) {
    error.value = t('feedback.tooShort')
    return haptic.error()
  }
  error.value = ''
  sending.value = true
  try {
    // пометка в начале — чтобы разработчик сразу видел, идея это или ошибка
    await repo().sendFeedback(`[${kind.value}] ${body}`, EnumFeedbackRole.Master)
    haptic.success()
    sent.value = true
  } catch {
    error.value = t('common.error')
    haptic.error()
  } finally {
    sending.value = false
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

.done {
  align-items: center;
  padding-top: var(--space-lg);

  h2, p { margin: 0; }
}
</style>
