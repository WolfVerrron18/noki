<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="open" class="sheet-root" @keydown.esc="close">
        <div class="backdrop" @click="close" />
        <section class="sheet" role="dialog" aria-modal="true" :aria-label="title">
          <header class="head">
            <h2>{{ title }}</h2>
            <button v-press="{ depth: 0.12 }" type="button" class="close" :aria-label="t('common.close')" @click="close">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </header>
          <div class="body"><slot /></div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
// Шторка снизу экрана: для коротких действий поверх текущего экрана
import { onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'

/** Пропсы NokiSheet */
interface Props {
  /** Заголовок шторки */
  title: string
}

defineProps<Props>()
/** Открыта ли шторка */
const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()

function close() {
  open.value = false
}

// пока шторка открыта, страница под ней не прокручивается
// шторки бывают вложенными (выбор времени поверх шторки часов), поэтому считаем открытые
function lock(on: boolean) {
  const n = Math.max(Number(document.body.dataset.sheets ?? 0) + (on ? 1 : -1), 0)
  document.body.dataset.sheets = String(n)
  document.body.classList.toggle('sheet-lock', n > 0)
}
watch(open, lock)
onBeforeUnmount(() => {
  if (open.value) lock(false)
})
</script>

<style lang="scss">
body.sheet-lock { overflow: hidden; }
</style>

<style scoped lang="scss">
.sheet-root {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.backdrop {
  position: absolute;
  inset: 0;
  background: var(--overlay);
}

.sheet {
  position: relative;
  width: 100%;
  max-width: var(--container-width);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  background: var(--bg);
  box-shadow: var(--shadow);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-md) var(--space-sm);

  h2 {
    margin: 0;
    font-size: var(--font-size-lg);
  }
}

.close {
  display: grid;
  place-items: center;
  width: calc(var(--control-height) - var(--space-md));
  height: calc(var(--control-height) - var(--space-md));
  flex-shrink: 0;
  border: 0;
  border-radius: 50%;
  background: var(--primary-100);
  cursor: pointer;

  svg {
    width: var(--space-md);
    height: var(--space-md);
    stroke: var(--primary-600);
    stroke-width: 2.5;
    stroke-linecap: round;
  }
}

.body {
  overflow-y: auto;
  padding: 0 var(--space-md) calc(var(--space-lg) + env(safe-area-inset-bottom));
}

.sheet-enter-active, .sheet-leave-active {
  transition: opacity 0.25s ease;

  .sheet { transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.15); }
}
.sheet-enter-from, .sheet-leave-to {
  opacity: 0;

  .sheet { transform: translateY(100%); }
}
</style>
