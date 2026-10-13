<template>
  <div class="stack">
    <PageHeader :title="t('services.title')" :back="() => router.push({ name: 'master-home' })" />

    <div v-if="!store.services.length" class="stack center empty">
      <NokiMascot mood="sleepy" :size="120" />
      <h2>{{ t('services.empty') }}</h2>
      <p class="hint">{{ t('services.emptyHint') }}</p>
    </div>

    <ul v-else ref="listEl" class="list">
      <li
        v-for="s in items"
        :key="s.id"
        v-press="{ depth: 0.03 }"
        :class="{ hidden: !s.is_active }"
        @click="router.push({ name: 'master-service-edit', params: { id: s.id } })"
      >
        <button
          v-if="store.services.length > 1"
          type="button"
          class="grip"
          data-no-press
          :aria-label="t('services.drag')"
          @click.stop
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
          </svg>
        </button>
        <ServiceCategoryIcon :category="s.category" :size="28" />
        <div class="info">
          <span class="name">{{ s.name }}</span>
          <span class="meta">
            {{ fmt.duration(s.duration_min) }} · {{ fmt.price(s.price) }}
            <span v-if="!s.is_active" class="badge">{{ t('services.hidden') }}</span>
          </span>
        </div>
        <NokiSwitch :model-value="s.is_active" :label="t('services.visible')" class="switch" @update:model-value="toggle(s, !!$event)" />
      </li>
    </ul>

    <NokiButton @click="router.push({ name: 'master-service-new' })">{{ t('services.add') }}</NokiButton>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDraggable } from 'vue-draggable-plus'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Service } from '@/api/types'
import NokiMascot from '@/components/mascot/NokiMascot.vue'
import NokiButton from '@/components/ui/NokiButton.vue'
import NokiSwitch from '@/components/ui/NokiSwitch.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ServiceCategoryIcon from '@/components/services/ServiceCategoryIcon.vue'
import { useMaster } from '@/stores/master'
import { useFormat } from '@/composables/useFormat'
import { useStaggerIn } from '@/animations/useStaggerIn'
import { haptic, lockVerticalSwipes } from '@/telegram'

const { t } = useI18n()
const router = useRouter()
const store = useMaster()
const fmt = useFormat()
const listEl = ref<HTMLElement | null>(null)
useStaggerIn(listEl)

// копия списка для перетаскивания: SortableJS сам переставляет её, а сохраняем мы через стор
const items = ref<Service[]>([])
watch(() => store.services.slice(), (v) => (items.value = v), { immediate: true })

// порядок меняем, перетаскивая карточку за ручку слева — подальше от тумблера справа
const sortable = useDraggable(listEl, items, {
  immediate: false,
  handle: '.grip',
  animation: 200,
  ghostClass: 'ghost',
  chosenClass: 'chosen',
  onStart() {
    lockVerticalSwipes(true)
    haptic.tap()
  },
  onEnd() {
    lockVerticalSwipes(false)
  },
  onUpdate(e) {
    if (e.oldIndex === undefined || e.newIndex === undefined) return
    store.moveService(e.oldIndex, e.newIndex).catch(() => haptic.error())
  },
})
// список появляется, только когда есть услуги
watch(listEl, (el) => {
  if (el) sortable.start(el)
})

async function toggle(s: Service, on: boolean) {
  const { id, master: _m, ...data } = s
  await store.saveService({ ...data, is_active: on }, id)
}
</script>

<style scoped lang="scss">
.empty { align-items: center; padding: var(--space-lg) 0; }

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    padding: var(--space-md);
    border-radius: var(--radius-lg);
    background: var(--bg-card);
    box-shadow: var(--shadow);
    cursor: pointer;
    transition: opacity 0.2s;

    &.hidden { opacity: 0.6; }
  }
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.grip {
  display: grid;
  place-items: center;
  width: var(--space-lg);
  height: var(--space-xl);
  margin-left: calc(var(--space-sm) * -1);
  padding: 0;
  border: 0;
  background: none;
  color: var(--text-muted);
  cursor: grab;
  // палец на ручке не прокручивает страницу
  touch-action: none;

  svg { width: 100%; height: 100%; fill: currentColor; }
}

// карточка в пальце и место, куда она встанет
.chosen { box-shadow: var(--shadow), var(--shadow); }
.ghost { opacity: 0.4; }

.name { font-weight: var(--font-weight-bold); }

.meta {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}

.badge {
  margin-left: var(--space-xs);
  padding: 0 var(--space-sm);
  border-radius: var(--radius-pill);
  background: var(--neutral-300);
  font-size: var(--font-size-xs);
}

// подпись нужна только для доступности, визуально — один тумблер
.switch :deep(.text) {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
