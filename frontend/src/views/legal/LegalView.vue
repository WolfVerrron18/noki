<template>
  <div class="stack">
    <PageHeader :title="text.title" :back="back" />
    <LegalDocument :doc="doc" />
  </div>
</template>

<script setup lang="ts">
// Документ отдельной страницей: ссылки из профиля. Открывается и без входа (meta.public).
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { EnumLegalDoc } from '@/api/types'
import PageHeader from '@/components/ui/PageHeader.vue'
import LegalDocument from '@/components/legal/LegalDocument.vue'
import { useLegalText } from '@/composables/useLegalText'

/** Пропсы LegalView */
interface Props {
  /** Документ из адреса (маршрут проверяет, что такой есть) */
  doc: EnumLegalDoc
}

const props = defineProps<Props>()
const router = useRouter()
const legalText = useLegalText()
const text = computed(() => legalText(props.doc))

function back() {
  // открыли по прямой ссылке — возвращаться некуда, идём на старт
  if (window.history.state?.back) router.back()
  else router.push({ name: 'start' })
}
</script>
