<template>
  <div class="stack">
    <!-- мастер открыла свою же ссылку: так её страницу видят клиентки -->
    <div v-if="isOwnPage" class="own">
      <span>{{ t('client.ownPage') }}</span>
      <button type="button" class="own-link" @click="router.push({ name: 'master-home' })">{{ t('client.toCabinet') }}</button>
    </div>

    <div class="hero">
      <NokiMascot mood="happy" :size="160" :greet="EnumNokiReaction.Wave" />
      <h1>{{ master.name }}</h1>
    </div>

    <h2>{{ t('booking.servicesTitle') }}</h2>

    <div v-if="!store.services.length" class="stack center empty">
      <NokiMascot mood="sleepy" :size="96" />
      <p>{{ t('booking.noServices') }}</p>
      <p class="hint">{{ t('booking.noServicesHint') }}</p>
    </div>

    <template v-else>
      <!-- если видов услуг несколько — быстрый переход к группе -->
      <div v-if="groups.length > 1" class="chips">
        <button
          v-for="g in groups"
          :key="g.category"
          v-press="{ depth: 0.08 }"
          type="button"
          class="chip"
          @click="scrollTo(g.category)"
        >
          <ServiceCategoryIcon :category="g.category" :size="20" />
          {{ t(CATEGORY_DEFS[g.category].label) }}
        </button>
      </div>

      <div ref="list" class="stack">
        <section v-for="g in groups" :id="sectionId(g.category)" :key="g.category" class="group">
          <h3 v-if="groups.length > 1" class="group-title">
            <ServiceCategoryIcon :category="g.category" :size="24" />
            {{ t(CATEGORY_DEFS[g.category].label) }}
          </h3>
          <ul class="services">
            <li v-for="s in g.items" :key="s.id">
              <button v-press="{ depth: 0.04 }" type="button" @click="open(s.id)">
                <ServiceCategoryIcon v-if="groups.length === 1" :category="s.category" :size="28" />
                <span class="body">
                  <span class="name">{{ s.name }}</span>
                  <span v-if="s.description" class="description">{{ s.description }}</span>
                  <span class="meta">
                    <span class="hint">{{ fmt.duration(s.duration_min) }}</span>
                    <span class="price">{{ fmt.price(s.price) }}</span>
                  </span>
                </span>
              </button>
            </li>
          </ul>
        </section>
      </div>
    </template>

    <NokiButton variant="soft" @click="router.push({ name: 'client-my' })">{{ t('booking.myBookings') }}</NokiButton>
  </div>
</template>

<script setup lang="ts">
// Страница мастера для клиентки: Ноки мастера и список услуг
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiMascot from '@/components/mascot/NokiMascot.vue'
import { EnumNokiReaction } from '@/components/mascot/rive/character'
import NokiButton from '@/components/ui/NokiButton.vue'
import { useBooking } from '@/stores/booking'
import { useMaster } from '@/stores/master'
import { useFormat } from '@/composables/useFormat'
import { haptic } from '@/telegram'
import { useStaggerIn } from '@/animations/useStaggerIn'
import { prefersReducedMotion } from '@/animations/gsap'
import type { Service } from '@/api/types'
import type { EnumServiceCategory } from '@/components/services/category'
import { CATEGORY_DEFS } from '@/components/services/registry'
import ServiceCategoryIcon from '@/components/services/ServiceCategoryIcon.vue'

/** Пропсы MasterPageView */
interface Props {
  /** Адрес мастера из ссылки (startapp) */
  slug: string
}

const props = defineProps<Props>()
const { t } = useI18n()
const router = useRouter()
const store = useBooking()
const fmt = useFormat()

// BookingLayout показывает экран только когда мастер загружен
const master = computed(() => store.master!)
const own = useMaster()
/** Это страница самой мастерицы, которая сейчас в приложении */
const isOwnPage = computed(() => own.master?.id === master.value.id)
const list = ref<HTMLElement | null>(null)
useStaggerIn(list)

/** Услуги одного вида */
interface ServiceGroup {
  /** Вид услуги */
  category: EnumServiceCategory
  /** Услуги в порядке мастера */
  items: Service[]
}

// группы идут в порядке первой услуги каждого вида — порядок задаёт мастер
const groups = computed<ServiceGroup[]>(() => {
  const map = new Map<EnumServiceCategory, Service[]>()
  for (const s of store.services) map.set(s.category, [...(map.get(s.category) ?? []), s])
  return [...map].map(([category, items]) => ({ category, items }))
})

/**
 * id секции группы для перехода по чипу.
 * @param c вид услуги
 */
function sectionId(c: EnumServiceCategory) {
  return `services-${c}`
}

/**
 * Прокрутить к группе.
 * @param c вид услуги
 */
function scrollTo(c: EnumServiceCategory) {
  haptic.tap()
  document.getElementById(sectionId(c))?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}

function open(serviceId: string) {
  haptic.tap()
  router.push({ name: 'client-time', params: { slug: props.slug, serviceId } })
}
</script>

<style scoped lang="scss">
.own {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  background: var(--secondary-100);
  color: var(--secondary-on-soft);
  font-size: var(--font-size-sm);
}

.own-link {
  flex-shrink: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: var(--font-weight-semibold);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding-top: var(--space-md);
  text-align: center;

  h1 { margin: 0; }
}

h2 { margin: 0; }

.empty {
  align-items: center;
  padding: var(--space-md) 0;

  p { margin: 0; }
}

.chips {
  display: flex;
  gap: var(--space-sm);
  overflow-x: auto;
  margin: 0 calc(var(--space-md) * -1);
  padding: var(--space-xs) var(--space-md);
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }
}

.chip {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md) var(--space-xs) var(--space-sm);
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--bg-card);
  box-shadow: var(--shadow);
  color: var(--text);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  cursor: pointer;
}

.group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  scroll-margin-top: var(--space-md);
}

.group-title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin: 0;
}

.services {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);

  button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md);
    border: 0;
    border-radius: var(--radius-lg);
    background: var(--bg-card);
    box-shadow: var(--shadow);
    color: var(--text);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
}

.body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.name { font-weight: var(--font-weight-bold); }

.description {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-weight: var(--font-weight-bold);
  color: var(--primary-600);
}
</style>
