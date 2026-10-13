<template>
  <button
    v-press
    class="btn"
    :class="variant ?? 'primary'"
    :disabled="disabled || loading"
    @click="haptic.tap(); emit('click')"
  >
    <span v-if="loading" class="dots"><i /><i /><i /></span>
    <slot v-else />
  </button>
</template>

<script setup lang="ts">
import { haptic } from '@/telegram'

/** Пропсы NokiButton */
interface Props {
  /** Вид: primary — основное действие, soft — второстепенное, ghost — без фона, outline — отмена или удаление (контур цветом темы) */
  variant?: 'primary' | 'soft' | 'ghost' | 'outline'
  /** Заблокировать кнопку */
  disabled?: boolean
  /** Показать индикатор загрузки вместо текста, кнопка заблокирована */
  loading?: boolean
}

/** События NokiButton */
interface Emits {
  /** Нажатие (не срабатывает в disabled и loading) */
  click: []
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<style scoped lang="scss">
.btn {
  width: 100%;
  min-height: var(--control-height);
  border: 0;
  border-radius: var(--radius-pill);
  font: inherit;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
  cursor: pointer;
  transition: opacity 0.2s;

  &:disabled { opacity: 0.55; cursor: default; }
}
.primary {
  background: linear-gradient(135deg, var(--primary-400), var(--primary-600));
  color: var(--on-primary);
  box-shadow: var(--shadow);
}
.soft { background: var(--primary-100); color: var(--primary-600); }
.ghost { background: transparent; color: var(--text-muted); }
// отмена, удаление: контур и текст цветом темы, без заливки. Красный выбивался из пастельных тем,
// а случайного нажатия не боимся — такие действия всё равно спрашивают подтверждение
.outline {
  background: var(--bg-card);
  color: var(--primary-on-soft);
  box-shadow: inset 0 0 0 1.5px var(--primary-300);
}

.dots {
  display: inline-flex;
  gap: var(--space-xs);

  i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    animation: bounce 0.9s infinite ease-in-out;
    &:nth-child(2) { animation-delay: 0.15s; }
    &:nth-child(3) { animation-delay: 0.3s; }
  }
}
@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
  40% { transform: translateY(-6px); opacity: 1; }
}
</style>
