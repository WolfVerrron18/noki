// Тексты бота на английском: типизированы по ru, пропущенный ключ — ошибка компиляции
import type { BotMessages } from '~/bot/i18n'

const en: BotMessages = {
  start: {
    title: 'Hi! I am Nidoki',
    text: 'I help beauty professionals take bookings and help clients book in a couple of taps.\n\nProfessionals: open the app and create your booking page.\nClients: book via your professional’s link; all your bookings are in “My bookings”.',
    open: 'Open Nidoki',
    my: 'My bookings',
  },
  startMaster: {
    text: 'Book with {master}',
    book: 'Book',
  },
  master: {
    booked: 'New booking',
    cancelledByClient: 'A client cancelled a booking',
    schedule: 'Open schedule',
  },
  client: {
    booked: 'Booking confirmed',
    cancelledByMaster: 'Your booking was cancelled',
    reminder: 'Booking reminder',
    my: 'My bookings',
    rebook: 'Pick another time',
    cancelHint: 'If your plans change, you can cancel in “My bookings”.',
  },
  field: {
    note: 'Note: {note}',
    phone: 'Phone: {phone}',
    master: 'With: {master}',
  },
  feedback: 'Feedback ({role}, tg {tg})',
  role: {
    master: 'professional',
    client: 'client',
  },
}

export default en
