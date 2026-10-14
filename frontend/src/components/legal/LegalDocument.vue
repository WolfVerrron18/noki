<template>
  <article class="legal-document">
    <p class="meta">{{ t('legal.edition', { date: edition }) }}</p>
    <p v-if="t('legal.ruOnly')" class="meta">{{ t('legal.ruOnly') }}</p>
    <template v-for="(block, i) in text.intro" :key="`intro-${i}`">
      <ul v-if="Array.isArray(block)">
        <li v-for="item in block" :key="item">{{ item }}</li>
      </ul>
      <p v-else>{{ block }}</p>
    </template>
    <section v-for="section in text.sections" :key="section.heading">
      <h3>{{ section.heading }}</h3>
      <template v-for="(block, i) in section.blocks" :key="i">
        <ul v-if="Array.isArray(block)">
          <li v-for="item in block" :key="item">{{ item }}</li>
        </ul>
        <p v-else>{{ block }}</p>
      </template>
    </section>
  </article>
</template>

<script setup lang="ts">
// Текст юридического документа. Документы только на русском — это юридически значимая редакция;
// на других языках интерфейса над текстом пояснение (legal.ruOnly).
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EnumLegalDoc } from '@/api/types'
import { LEGAL_VERSIONS } from '@/legal/documents'
import { useLegalText } from '@/composables/useLegalText'
import dayjs from '@/utils/date'
import { DAY_FORMAT } from '@/utils/slots'

/** Пропсы LegalDocument */
interface Props {
  /** Какой документ показать */
  doc: EnumLegalDoc
}

const props = defineProps<Props>()
const { t, locale } = useI18n()
const legalText = useLegalText()

const text = computed(() => legalText(props.doc))
/** Дата редакции словами: версия документа — это дата */
const edition = computed(() => dayjs.utc(LEGAL_VERSIONS[props.doc], DAY_FORMAT).locale(locale.value).format('D MMMM YYYY'))
</script>

<style scoped lang="scss">
.legal-document {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  font-size: var(--font-size-sm);
  line-height: 1.55;
  overflow-wrap: anywhere;

  p, ul { margin: 0; }
  ul { padding-left: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-xs); }

  section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    margin-top: var(--space-sm);
  }

  h3 {
    margin: 0;
    font-size: var(--font-size-md);
  }
}

.meta {
  color: var(--text-muted);
  font-size: var(--font-size-xs);
}
</style>
