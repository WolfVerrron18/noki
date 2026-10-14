<template>
  <div class="legal-consent">
    <!-- согласие на обработку данных — отдельной галочкой: по закону оно не входит в другие документы -->
    <NokiCheckbox v-model="checked" :error="error">
      <i18n-t keypath="legal.consent" tag="span" scope="global">
        <template #link>
          <button type="button" class="link" @click="show(consent)">{{ t('legal.consentLink') }}</button>
        </template>
      </i18n-t>
    </NokiCheckbox>
    <!-- соглашение и политика принимаются нажатием главной кнопки -->
    <i18n-t keypath="legal.byAction" tag="p" class="hint" scope="global">
      <template #action>{{ action }}</template>
      <template #terms>
        <button type="button" class="link" @click="show(EnumLegalDoc.Terms)">{{ t('legal.termsLink') }}</button>
      </template>
      <template #privacy>
        <button type="button" class="link" @click="show(EnumLegalDoc.Privacy)">{{ t('legal.privacyLink') }}</button>
      </template>
    </i18n-t>

    <!-- документ открывается шторкой поверх экрана: введённое в форму не теряется -->
    <NokiSheet v-model:open="sheetOpen" :title="opened ? legalText(opened).title : ''">
      <LegalDocument v-if="opened" :doc="opened" />
    </NokiSheet>
  </div>
</template>

<script setup lang="ts">
// Согласие с документами у главной кнопки: галочка согласия на обработку данных
// и строка «Нажимая „…“, ты принимаешь соглашение и политику». Документы открываются шторкой.
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { EnumLegalDoc } from '@/api/types'
import NokiCheckbox from '@/components/ui/NokiCheckbox.vue'
import NokiSheet from '@/components/ui/NokiSheet.vue'
import LegalDocument from '@/components/legal/LegalDocument.vue'
import { useLegalText } from '@/composables/useLegalText'

/** Пропсы LegalConsent */
interface Props {
  /** Подпись главной кнопки, нажатием которой принимаются соглашение и политика */
  action: string
  /** Какое согласие на обработку данных даётся галочкой */
  consent: EnumLegalDoc.ConsentMaster | EnumLegalDoc.ConsentClient
  /** Ошибка под галочкой (уже переведённая) */
  error?: string
}

defineProps<Props>()
/** Отмечена ли галочка согласия */
const checked = defineModel<boolean>({ default: false })
const { t } = useI18n()
const legalText = useLegalText()

const sheetOpen = ref(false)
/** Документ в шторке; остаётся, пока шторка закрывается, чтобы текст не пропадал рывком */
const opened = ref<EnumLegalDoc | null>(null)

/**
 * Открыть документ шторкой.
 * @param doc документ
 */
function show(doc: EnumLegalDoc) {
  opened.value = doc
  sheetOpen.value = true
}
</script>

<style scoped lang="scss">
.legal-consent {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);

  .hint { margin: 0; font-size: var(--font-size-xs); }
}

.link {
  display: inline;
  padding: 0;
  border: 0;
  background: none;
  color: var(--primary-600);
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}
</style>
