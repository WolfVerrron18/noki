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
