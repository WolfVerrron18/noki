<template>
  <article class="card" :class="{ cancelled: isCancelled, done: isDone }">
    <!-- верх: когда и в каком статусе -->
    <header class="top">
      <span class="when">
        <span v-if="showDate" class="date">{{ fmt.dateLong(appointment.start_at, timezone) }}</span>
        <span class="time">{{ fmt.time(appointment.start_at, timezone) }} – {{ fmt.time(appointment.end_at, timezone) }}</span>
      </span>
      <span v-if="isCancelled" class="tag danger">{{ t('schedule.cancelled') }}</span>
      <span v-else-if="isDone" class="tag success">{{ t('schedule.done') }}</span>
      <span v-else-if="forMaster && appointment.source === EnumAppointmentSource.Manual" class="tag">{{ t('schedule.manual') }}</span>
    </header>

    <!-- что и с кем -->
    <strong class="service">{{ appointment.service_name }}</strong>
    <p class="who">
      <template v-if="forMaster">
        <span class="name">{{ appointment.client_name }}</span>
        <a v-if="appointment.client_phone" class="phone" :href="`tel:${appointment.client_phone}`">{{ displayPhone(appointment.client_phone) }}</a>
      </template>
      <span v-else>{{ t('booking.with', { name: appointment.master_name }) }}</span>
    </p>

    <footer v-if="canCancel || canComplete" class="actions">
      <NokiButton v-if="canComplete" variant="soft" class="action complete" @click="emit('complete')">
        {{ t('schedule.markDone') }}
      </NokiButton>
      <NokiButton v-if="canCancel" variant="ghost" class="action cancel" @click="emit('cancel')">
        {{ t('booking.cancel') }}
      </NokiButton>
    </footer>
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
  /** Вид для мастера: имя и телефон клиентки вместо имени мастера */
  forMaster?: boolean
  /** Показать дату над названием (список за несколько дней) */
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
</script>

<style scoped lang="scss">
// Слева цветная полоска статуса: предстоящая — основной цвет, выполнена — зелёная, отменена — серая
.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-md) var(--space-md) var(--space-md) calc(var(--space-md) + var(--space-xs));
  border-radius: var(--radius-lg);
  border-left: var(--space-xs) solid var(--primary-500);
  background: var(--bg-card);
  box-shadow: var(--shadow);

  &.done { border-left-color: var(--success-500); }

  &.cancelled {
    border-left-color: var(--neutral-400);

    .service,
    .time { color: var(--text-muted); }

    .service { text-decoration: line-through; }
  }
}

.top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-sm);
}

.when {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.date {
  font-size: var(--font-size-xs);
  color: var(--text-muted);

  &::first-letter { text-transform: uppercase; }
}

.time {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--primary-on-soft);
  font-variant-numeric: tabular-nums;
}

.service {
  font-size: var(--font-size-md);
  overflow-wrap: anywhere;
}

.who {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs) var(--space-md);
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.name {
  color: var(--text);
  font-weight: var(--font-weight-semibold);
}

.phone {
  color: var(--primary-600);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
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
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--neutral-300);
}

.action {
  flex: 1;
  min-height: calc(var(--control-height) - var(--space-sm));
  font-size: var(--font-size-sm);
}

.cancel { color: var(--danger-500); }
</style>
