<template>
  <article class="card" :class="{ cancelled: isCancelled, done: isDone }">
    <div class="when">
      <span class="time">{{ fmt.time(appointment.start_at, timezone) }}</span>
      <span class="hint">{{ fmt.time(appointment.end_at, timezone) }}</span>
    </div>

    <div class="info">
      <span v-if="showDate" class="hint">{{ fmt.dateLong(appointment.start_at, timezone) }}</span>
      <strong>{{ appointment.service_name }}</strong>
      <template v-if="forMaster">
        <span>{{ appointment.client_name }}</span>
        <a v-if="appointment.client_phone" class="phone" :href="`tel:${appointment.client_phone}`">{{ displayPhone(appointment.client_phone) }}</a>
      </template>
      <span v-else class="hint">{{ t('booking.with', { name: appointment.master_name }) }}</span>

      <div class="tags">
        <span v-if="isCancelled" class="tag danger">{{ t('schedule.cancelled') }}</span>
        <span v-else-if="isDone" class="tag success">{{ t('schedule.done') }}</span>
        <span v-else-if="forMaster && appointment.source === EnumAppointmentSource.Manual" class="tag">{{ t('schedule.manual') }}</span>
      </div>

      <div v-if="canCancel || canComplete" class="actions">
        <NokiButton v-if="canComplete" variant="soft" class="action complete" @click="emit('complete')">
          {{ t('schedule.markDone') }}
        </NokiButton>
        <NokiButton v-if="canCancel" variant="ghost" class="action cancel" @click="emit('cancel')">
          {{ t('booking.cancel') }}
        </NokiButton>
      </div>
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
.card {
  display: flex;
  gap: var(--space-md);
  align-items: flex-start;
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow);

  &.cancelled { opacity: 0.55; }
  &.done { opacity: 0.8; }
}

.when {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: calc(var(--control-height) + var(--space-xs));
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  background: var(--primary-100);
}

.time {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--primary-on-soft);
}

.when .hint { font-size: var(--font-size-xs); }

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.phone {
  color: var(--primary-600);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
}

.tags {
  display: flex;
  gap: var(--space-xs);

  &:empty { display: none; }
}

.tag {
  padding: 0 var(--space-sm);
  border-radius: var(--radius-pill);
  background: var(--secondary-100);
  color: var(--secondary-on-soft);
  font-size: var(--font-size-xs);

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
  flex-wrap: wrap;
  gap: var(--space-md);
  align-items: center;
}

.action {
  width: auto;
  min-height: auto;
  font-size: var(--font-size-sm);
}

.complete { padding: var(--space-xs) var(--space-md); }

.cancel {
  padding: var(--space-xs) 0;
  color: var(--danger-500);
}
</style>
