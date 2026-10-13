<template>
  <article class="card" :class="status">
    <!-- шапка: когда, сколько длится и сколько стоит; цвет — по статусу -->
    <header class="head">
      <span class="when">
        <span v-if="showDate" class="date">{{ fmt.dateLong(appointment.start_at, timezone) }}</span>
        <span class="time">{{ fmt.time(appointment.start_at, timezone) }} – {{ fmt.time(appointment.end_at, timezone) }}</span>
      </span>
      <span class="meta">{{ meta }}</span>
    </header>

    <div class="body">
      <div class="title">
        <strong class="service">{{ appointment.service_name }}</strong>
        <span v-if="isCancelled" class="tag danger">{{ t('schedule.cancelled') }}</span>
        <span v-else-if="isDone" class="tag success">{{ t('schedule.done') }}</span>
        <span v-else-if="forMaster && appointment.source === EnumAppointmentSource.Manual" class="tag">{{ t('schedule.manual') }}</span>
      </div>

      <!-- с кем: мастеру — клиентка и её телефон, клиентке — мастер -->
      <div class="person">
        <span class="avatar" aria-hidden="true">{{ initial }}</span>
        <span class="person-text">
          <span class="name">{{ forMaster ? appointment.client_name : appointment.master_name }}</span>
          <a v-if="forMaster && appointment.client_phone" class="phone" :href="`tel:${appointment.client_phone}`">
            {{ displayPhone(appointment.client_phone) }}
          </a>
          <span v-else-if="!forMaster" class="role">{{ t('booking.masterLabel') }}</span>
        </span>
      </div>

      <p v-if="appointment.note" class="note">
        <span class="note-label">{{ t('booking.noteLabel') }}</span>
        {{ appointment.note }}
      </p>

      <footer v-if="canCancel || canComplete" class="actions">
        <NokiButton v-if="canComplete" variant="soft" class="action" @click="emit('complete')">
          {{ t('schedule.markDone') }}
        </NokiButton>
        <NokiButton v-if="canCancel" variant="danger" class="action" @click="emit('cancel')">
          {{ t('booking.cancel') }}
        </NokiButton>
      </footer>
    </div>
  </article>
</template>

<script setup lang="ts">
// Карточка записи: в расписании мастера и в «Моих записях» клиентки
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { EnumAppointmentSource, EnumAppointmentStatus, isCancellable, isCompletable, type Appointment } from '@/api/types'
import NokiButton from '@/components/ui/NokiButton.vue'
import { useFormat } from '@/composables/useFormat'
import { displayPhone } from '@/utils/phone'

/** Пропсы AppointmentCard */
interface Props {
  /** Запись */
  appointment: Appointment
  /** Пояс мастера: время показывается в нём */
  timezone: string
  /** Цена услуги, если экран её знает (расписание мастера); не задана — в шапке только длительность */
  price?: number
  /** Вид для мастера: клиентка и её телефон вместо имени мастера */
  forMaster?: boolean
  /** Показать дату в шапке (список за несколько дней) */
  showDate?: boolean
  /** Разрешить отмену: кнопка появится, только пока запись не началась */
  cancellable?: boolean
  /** Разрешить отметку «Выполнено»: кнопка появится, когда запись началась */
  completable?: boolean
}

/** События AppointmentCard */
interface Emits {
  /** Нажали «Отменить» — подтверждение спрашивает родитель */
  cancel: []
  /** Нажали «Выполнено» */
  complete: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()
const fmt = useFormat()

const isCancelled = computed(() => props.appointment.status === EnumAppointmentStatus.Cancelled)
const isDone = computed(() => props.appointment.status === EnumAppointmentStatus.Done)
const canCancel = computed(() => props.cancellable && isCancellable(props.appointment))
const canComplete = computed(() => props.completable && isCompletable(props.appointment))

/** Класс статуса: красит шапку */
const status = computed(() => (isCancelled.value ? 'cancelled' : isDone.value ? 'done' : 'booked'))

/** «1 ч · 2 500 ₽» или только длительность */
const meta = computed(() => {
  const minutes = Math.round((Date.parse(props.appointment.end_at) - Date.parse(props.appointment.start_at)) / 60000)
  const parts = [fmt.duration(minutes)]
  if (props.price !== undefined) parts.push(fmt.price(props.price))
  return parts.join(' · ')
})

/** Первая буква имени для кружка-аватарки */
const initial = computed(() => {
  const name = (props.forMaster ? props.appointment.client_name : props.appointment.master_name).trim()
  return name ? name[0].toUpperCase() : '·'
})
</script>

<style scoped lang="scss">
.card {
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--primary-200);
  color: var(--primary-on-soft);

  .done & {
    background: var(--success-200);
    color: var(--success-on-soft);
  }

  .cancelled & {
    background: var(--neutral-300);
    color: var(--text-muted);
  }
}

.when {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.date {
  font-size: var(--font-size-xs);
  opacity: 0.85;

  &::first-letter { text-transform: uppercase; }
}

.time {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  font-variant-numeric: tabular-nums;
}

.meta {
  flex-shrink: 0;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.body {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md) var(--space-md);
}

.title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-sm);
}

.service {
  font-size: var(--font-size-md);
  overflow-wrap: anywhere;

  .cancelled & {
    color: var(--text-muted);
    text-decoration: line-through;
  }
}

.person {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.avatar {
  display: grid;
  place-items: center;
  width: calc(var(--control-height) - var(--space-md));
  height: calc(var(--control-height) - var(--space-md));
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--secondary-100);
  color: var(--secondary-on-soft);
  font-weight: var(--font-weight-bold);
}

.person-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.name {
  font-weight: var(--font-weight-semibold);
  overflow-wrap: anywhere;
}

.phone {
  color: var(--primary-600);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
}

.role {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}

.note {
  margin: 0;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  background: var(--neutral-200);
  font-size: var(--font-size-sm);
  overflow-wrap: anywhere;
}

.note-label {
  display: block;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
}

.tag {
  flex-shrink: 0;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-pill);
  background: var(--secondary-100);
  color: var(--secondary-on-soft);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;

  &.danger {
    background: var(--danger-100);
    color: var(--danger-on-soft);
  }

  &.success {
    background: var(--success-100);
    color: var(--success-on-soft);
  }
}

.actions {
  display: flex;
  gap: var(--space-sm);
}

.action {
  flex: 1;
  min-height: calc(var(--control-height) - var(--space-sm));
  font-size: var(--font-size-sm);
}

</style>
