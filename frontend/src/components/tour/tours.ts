import type { Tour } from '@/composables/useTour'

// Туры по экранам. Цель шага — элемент с data-tour="<target>" на экране; тексты — tour.<тур>.<шаг>.
// Новый тур: шаги здесь → data-tour на элементах → тексты в локалях → autoStart на экране.

/** Первое знакомство мастера с кабинетом */
export const MASTER_HOME_TOUR: Tour = {
  id: 'master-home',
  steps: [
    { target: 'link', title: 'tour.master.link.title', text: 'tour.master.link.text' },
    { target: 'services', title: 'tour.master.services.title', text: 'tour.master.services.text' },
    { target: 'schedule', title: 'tour.master.schedule.title', text: 'tour.master.schedule.text' },
    { target: 'hours', title: 'tour.master.hours.title', text: 'tour.master.hours.text' },
    { target: 'appearance', title: 'tour.master.appearance.title', text: 'tour.master.appearance.text' },
    { target: 'help', title: 'tour.master.help.title', text: 'tour.master.help.text' },
  ],
}

/** Ноки на примере показывает, как добавить услугу: сам выбирает, печатает и жмёт. Пример не сохраняется */
export const SERVICE_DEMO_TOUR: Tour = {
  id: 'service-demo',
  steps: [
    { target: 'category', title: 'tour.service.category.title', text: 'tour.service.category.text', action: 'category' },
    { target: 'presets', title: 'tour.service.presets.title', text: 'tour.service.presets.text', action: 'preset' },
    { target: 'name', title: 'tour.service.name.title', text: 'tour.service.name.text', action: 'name' },
    { target: 'duration', title: 'tour.service.duration.title', text: 'tour.service.duration.text', action: 'duration' },
    { target: 'price', title: 'tour.service.price.title', text: 'tour.service.price.text', action: 'price' },
    { target: 'description', title: 'tour.service.description.title', text: 'tour.service.description.text', action: 'description' },
    { target: 'visible', title: 'tour.service.visible.title', text: 'tour.service.visible.text' },
  ],
}

/** Ноки на примере настраивает часы работы: режим записи, шаг, график, часы дня, перерыв, выходной. Пример не сохраняется */
export const HOURS_DEMO_TOUR: Tour = {
  id: 'hours-demo',
  steps: [
    { target: 'slot-mode', title: 'tour.hours.slotMode.title', text: 'tour.hours.slotMode.text', action: 'slotMode' },
    { target: 'step', title: 'tour.hours.step.title', text: 'tour.hours.step.text', action: 'step' },
    { target: 'schedule-mode', title: 'tour.hours.scheduleMode.title', text: 'tour.hours.scheduleMode.text', action: 'scheduleMode' },
    { target: 'week-presets', title: 'tour.hours.presets.title', text: 'tour.hours.presets.text', action: 'presets' },
    { target: 'day-1', title: 'tour.hours.day.title', text: 'tour.hours.day.text', action: 'day' },
    { target: 'day-1', title: 'tour.hours.pause.title', text: 'tour.hours.pause.text', action: 'pause' },
    { target: 'day-6', title: 'tour.hours.dayOff.title', text: 'tour.hours.dayOff.text', action: 'dayOn' },
  ],
}

/** Ноки на примере показывает график «по датам»: выбор дней протягиванием, снятие выбора, часы на выбранные дни */
export const DATES_DEMO_TOUR: Tour = {
  id: 'dates-demo',
  steps: [
    { target: 'calendar', title: 'tour.dates.select.title', text: 'tour.dates.select.text', action: 'select' },
    { target: 'selection', title: 'tour.dates.selection.title', text: 'tour.dates.selection.text' },
    { target: 'calendar', title: 'tour.dates.unselect.title', text: 'tour.dates.unselect.text', action: 'unselect' },
    { target: 'calendar', title: 'tour.dates.apply.title', text: 'tour.dates.apply.text', action: 'apply' },
  ],
}
