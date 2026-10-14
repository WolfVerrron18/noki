// Таблицы для запросов через Drizzle. Источник правды — SQL в migrations/: здесь те же поля,
// ограничения (CHECK, EXCLUDE) живут только в миграциях.
import { bigint, boolean, integer, jsonb, pgTable, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core'

/** Момент времени в UTC */
const moment = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' })

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  telegramId: bigint('telegram_id', { mode: 'number' }).notNull().unique(),
  name: text('name').notNull().default(''),
  languageCode: text('language_code').notNull().default(''),
  writeAccess: boolean('write_access').notNull().default(false),
  createdAt: moment('created_at').notNull().defaultNow(),
})

export const masters = pgTable('masters', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  timezone: text('timezone').notNull(),
  currency: text('currency').notNull().default('RUB'),
  slotStepMin: smallint('slot_step_min').notNull().default(30),
  scheduleMode: text('schedule_mode').notNull().default('weekly'),
  workHours: jsonb('work_hours').notNull().default({}),
  dayOverrides: jsonb('day_overrides').notNull().default({}),
  hourTemplates: jsonb('hour_templates').notNull().default([]),
  slotMode: text('slot_mode').notNull().default('grid'),
  workSlots: jsonb('work_slots').notNull().default({}),
  slotOverrides: jsonb('slot_overrides').notNull().default({}),
  slotTemplates: jsonb('slot_templates').notNull().default([]),
  mascot: jsonb('mascot').notNull().default({}),
  theme: text('theme').notNull().default('rose'),
  createdAt: moment('created_at').notNull().defaultNow(),
  updatedAt: moment('updated_at').notNull().defaultNow(),
})

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  masterId: uuid('master_id').notNull().references(() => masters.id),
  name: text('name').notNull(),
  durationMin: integer('duration_min').notNull(),
  price: integer('price').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  archived: boolean('archived').notNull().default(false),
  description: text('description').notNull().default(''),
  category: text('category').notNull().default('other'),
  sort: integer('sort').notNull().default(0),
  createdAt: moment('created_at').notNull().defaultNow(),
})

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  masterId: uuid('master_id').notNull().references(() => masters.id),
  serviceId: uuid('service_id').notNull().references(() => services.id),
  serviceName: text('service_name').notNull(),
  price: integer('price').notNull().default(0),
  currency: text('currency').notNull().default('RUB'),
  durationMin: integer('duration_min').notNull(),
  clientName: text('client_name').notNull(),
  clientPhone: text('client_phone').notNull().default(''),
  clientTelegramId: bigint('client_telegram_id', { mode: 'number' }),
  note: text('note').notNull().default(''),
  startAt: moment('start_at').notNull(),
  endAt: moment('end_at').notNull(),
  status: text('status').notNull().default('booked'),
  cancelledBy: text('cancelled_by'),
  cancelledAt: moment('cancelled_at'),
  doneAt: moment('done_at'),
  source: text('source').notNull(),
  reminderSent: boolean('reminder_sent').notNull().default(false),
  createdAt: moment('created_at').notNull().defaultNow(),
  updatedAt: moment('updated_at').notNull().defaultNow(),
})

export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorTelegramId: bigint('author_telegram_id', { mode: 'number' }).notNull(),
  role: text('role').notNull(),
  text: text('text').notNull(),
  createdAt: moment('created_at').notNull().defaultNow(),
})

/** Строка мастера из базы */
export type MasterRow = typeof masters.$inferSelect
/** Строка услуги из базы */
export type ServiceRow = typeof services.$inferSelect
/** Строка записи из базы */
export type AppointmentRow = typeof appointments.$inferSelect

export const consents = pgTable('consents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  document: text('document').notNull(),
  version: text('version').notNull(),
  acceptedAt: moment('accepted_at').notNull().defaultNow(),
})
