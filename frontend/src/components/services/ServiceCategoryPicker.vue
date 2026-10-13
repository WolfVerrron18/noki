<template>
  <div class="field">
    <span v-if="label" class="label">{{ label }}</span>
    <div class="grid" role="radiogroup">
      <button
        v-for="c in SERVICE_CATEGORIES"
        :key="c"
        v-press="{ depth: 0.08 }"
        v-pop="model === c"
        type="button"
        role="radio"
        class="option"
        :class="{ active: model === c }"
        :aria-checked="model === c"
        @click="pick(c)"
      >
        <ServiceCategoryIcon :category="c" :size="28" :active="model === c" />
        <span class="name">{{ t(CATEGORY_DEFS[c].label) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// Выбор категории услуги: сетка иконок с подписями
import { useI18n } from 'vue-i18n'
import { SERVICE_CATEGORIES, type EnumServiceCategory } from '@/components/services/category'
import { CATEGORY_DEFS } from '@/components/services/registry'
import ServiceCategoryIcon from '@/components/services/ServiceCategoryIcon.vue'
import { haptic } from '@/telegram'

/** Пропсы ServiceCategoryPicker */
interface Props {
  /** Подпись над сеткой */
  label?: string
}

defineProps<Props>()
/** Выбранная категория */
const model = defineModel<EnumServiceCategory>({ required: true })
const { t } = useI18n()

/**
 * Выбрать категорию.
 * @param c категория
 */
function pick(c: EnumServiceCategory) {
  haptic.tap()
  model.value = c
}
</script>

<style scoped lang="scss">
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
  padding-left: var(--space-xs);
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-sm);
}

.option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-xs);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text);
  font: inherit;
  cursor: pointer;

  &.active {
    border-color: var(--primary-400);
    background: var(--primary-100);
  }
}

.name {
  font-size: var(--font-size-xs);
  line-height: 1.2;
  text-align: center;
}
</style>
