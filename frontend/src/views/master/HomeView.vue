<template>
  <div class="stack">
    <!-- тур по кабинету: справа вверху, как кнопка в шапке других экранов -->
    <div class="top">
      <NokiHelpButton @click="tour.start(MASTER_HOME_TOUR)" />
    </div>

    <div class="hello">
      <NokiMascot ref="noki" mood="happy" :size="96" :greet="EnumNokiReaction.Wave" />
      <div>
        <h1>{{ t('master.greeting', { name: master.name }) }}</h1>
        <p class="hint">{{ t('master.homeSubtitle') }}</p>
      </div>
    </div>

    <NokiCard class="link-card" data-tour="link">
      <h2>{{ t('master.linkTitle') }}</h2>
      <p class="hint">{{ t('master.linkHint') }}</p>
      <code class="link">{{ bookingLink(master.slug) }}</code>
      <div class="row">
        <NokiButton @click="onShare">{{ t('master.share') }}</NokiButton>
        <NokiButton variant="soft" @click="onCopy">{{ t('master.copy') }}</NokiButton>
      </div>
    </NokiCard>

    <p v-if="!activeCount" class="warning">{{ t('master.noServicesWarning') }}</p>

    <!-- пока Ноки стандартный — зовём собрать своего -->
    <button v-if="isDefaultLook" v-press="{ depth: 0.04 }" type="button" class="mascot-card" @click="router.push({ name: 'master-mascot' })">
      <NokiMascot :look="TEASER_LOOK" :size="72" :boop="false" />
      <span>
        <strong>{{ t('mascot.card.title') }}</strong>
        <span class="hint">{{ t('mascot.card.hint') }}</span>
      </span>
    </button>

    <nav class="menu">
      <button v-press="{ depth: 0.04 }" v-fill type="button" data-tour="services" @click="router.push({ name: 'master-services' })">
        <span>{{ t('master.menu.services') }}</span>
        <span class="hint">{{ t('master.menu.servicesCount', activeCount) }}</span>
      </button>
      <button v-press="{ depth: 0.04 }" v-fill type="button" data-tour="schedule" @click="router.push({ name: 'master-schedule' })">
        <span>{{ t('master.menu.schedule') }}</span>
      </button>
      <button v-press="{ depth: 0.04 }" v-fill type="button" data-tour="hours" @click="router.push({ name: 'master-hours' })">
        <span>{{ t('master.menu.hours') }}</span>
      </button>
      <button v-press="{ depth: 0.04 }" v-fill type="button" data-tour="appearance" @click="router.push({ name: 'master-mascot' })">
        <span>{{ t('master.menu.mascot') }}</span>
      </button>
      <button v-press="{ depth: 0.04 }" v-fill type="button" @click="router.push({ name: 'master-profile' })">
        <span>{{ t('master.menu.profile') }}</span>
      </button>
    </nav>

    <div class="footer-links">
      <button type="button" class="feedback-link" @click="router.push({ name: 'master-feedback' })">
        {{ t('master.menu.feedback') }}
      </button>
    </div>

    <Transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NokiMascot, { type NokiMascotExpose } from '@/components/mascot/NokiMascot.vue'
import { EnumNokiReaction } from '@/components/mascot/rive/character'
import NokiButton from '@/components/ui/NokiButton.vue'
import NokiCard from '@/components/ui/NokiCard.vue'
import NokiHelpButton from '@/components/ui/NokiHelpButton.vue'
import { useMaster } from '@/stores/master'
import { useShareLink } from '@/composables/useShareLink'
import { DEFAULT_LOOK, EnumMascotHead, type NokiLook } from '@/components/mascot/look'
import { DEFAULT_PALETTE } from '@/styles/palettes'
import { useTour } from '@/composables/useTour'
import { MASTER_HOME_TOUR } from '@/components/tour/tours'

/** Пауза перед туром: экран успевает появиться, Ноки — поздороваться */
const TOUR_DELAY_MS = 900

/** Пример наряда для карточки-приглашения в конструктор */
const TEASER_LOOK: NokiLook = { ...DEFAULT_LOOK, head: EnumMascotHead.FlowerCrown }

const { t } = useI18n()
const router = useRouter()
const store = useMaster()
const { bookingLink, copy, share } = useShareLink()

const master = computed(() => store.master!)
// пока оформление не трогали — зовём оформить страницу
const isDefaultLook = computed(
  () => JSON.stringify(master.value.mascot) === JSON.stringify(DEFAULT_LOOK) && master.value.theme === DEFAULT_PALETTE,
)
const activeCount = computed(() => store.services.filter((s) => s.is_active).length)
const toast = ref('')
const noki = ref<NokiMascotExpose | null>(null)
const tour = useTour()

// первое знакомство с кабинетом: тур показывается сам один раз, дальше — по ссылке внизу
onMounted(() => setTimeout(() => tour.autoStart(MASTER_HOME_TOUR), TOUR_DELAY_MS))

function flash(key: string) {
  toast.value = t(key)
  setTimeout(() => (toast.value = ''), 2000)
}

async function onShare() {
  const res = await share(master.value.slug)
  if (res !== 'failed') noki.value?.react(EnumNokiReaction.Love)
  if (res === 'copied') flash('master.copied')
  else if (res === 'failed') flash('common.error')
}

async function onCopy() {
  const ok = await copy(master.value.slug)
  if (ok) noki.value?.react(EnumNokiReaction.Love)
  flash(ok ? 'master.copied' : 'common.error')
}
</script>

<style scoped lang="scss">
.hello {
  display: flex;
  align-items: center;
  gap: var(--space-md);

  h1, p { margin: 0; }
}

.top {
  display: flex;
  justify-content: flex-end;
  // не раздвигаем экран: строка с кнопкой заходит под приветствие
  margin-bottom: calc(-1 * var(--space-md));
}

.link-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);

  h2, p { margin: 0; }
}

.link {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  background: var(--primary-100);
  color: var(--primary-on-soft);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  word-break: break-all;
}

.row {
  display: flex;
  gap: var(--space-sm);
}

.warning {
  margin: 0;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  background: var(--warning-100);
  color: var(--warning-on-soft);
  font-size: var(--font-size-sm);
}

.menu {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);

  button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: var(--control-height);
    padding: 0 var(--space-md);
    border: 0;
    border-radius: var(--radius-md);
    background: var(--bg-card);
    box-shadow: var(--shadow);
    color: var(--text);
    font: inherit;
    font-weight: var(--font-weight-semibold);
    text-align: left;
    cursor: pointer;

    &:disabled { opacity: 0.6; cursor: default; }
  }
}

.footer-links {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.feedback-link {
  align-self: center;
  padding: var(--space-sm) var(--space-md);
  border: 0;
  background: none;
  color: var(--text-muted);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.mascot-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border: 2px dashed var(--secondary-300);
  border-radius: var(--radius-lg);
  background: var(--secondary-100);
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;

  > span {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

}

.badge {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-pill);
  background: var(--secondary-100);
  color: var(--secondary-on-soft);
  font-size: var(--font-size-xs);
}

.toast {
  position: fixed;
  left: 50%;
  bottom: calc(var(--space-lg) + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-pill);
  background: var(--neutral-900);
  color: var(--neutral-100);
  font-weight: var(--font-weight-semibold);
}

.toast-enter-active, .toast-leave-active { transition: opacity 0.2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; }
</style>
