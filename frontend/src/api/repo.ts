import type { AcceptedDoc, Appointment, BookingInput, EnumFeedbackRole, Master, MasterInput, Service, ServiceInput } from '@/api/types'
import { apiRepo } from '@/api/apiRepo'
import { mockRepo } from '@/api/mockRepo'

/** Единый интерфейс данных: экраны не знают, откуда данные — наш сервер или браузер */
export interface Repo {
  /**
   * Профиль мастера текущего пользователя.
   * @param userId id пользователя
   * @returns профиль или null, если пользователь ещё не мастер
   */
  getMyMaster(userId: string): Promise<Master | null>

  /**
   * Свободен ли адрес ссылки.
   * @param slug проверяемый адрес
   * @param exceptMasterId не считать занятым адрес этого мастера (при правке своего профиля)
   */
  isSlugFree(slug: string, exceptMasterId?: string): Promise<boolean>

  /**
   * Публичный профиль мастера по адресу ссылки (страница записи клиентки).
   * @param slug адрес из startapp
   * @returns профиль или null, если такого адреса нет
   */
  getMasterBySlug(slug: string): Promise<Master | null>

  /**
   * Создать профиль мастера.
   * @param userId id пользователя-владельца
   * @param data данные профиля
   */
  createMaster(userId: string, data: MasterInput): Promise<Master>

  /**
   * Обновить профиль мастера.
   * @param id id профиля
   * @param data изменённые поля
   */
  updateMaster(id: string, data: Partial<MasterInput>): Promise<Master>

  /**
   * Все услуги мастера, включая скрытые, в порядке мастера (sort, затем создание).
   * @param masterId id мастера
   */
  listServices(masterId: string): Promise<Service[]>

  /**
   * Создать услугу. Новая встаёт в конец списка.
   * @param masterId id мастера
   * @param data данные услуги
   */
  createService(masterId: string, data: ServiceInput): Promise<Service>

  /**
   * Обновить услугу.
   * @param id id услуги
   * @param data изменённые поля
   */
  updateService(id: string, data: Partial<ServiceInput>): Promise<Service>

  /**
   * Удалить услугу. Удаление мягкое: на услугу могут ссылаться записи, поэтому она только пропадает из списков.
   * @param id id услуги
   */
  deleteService(id: string): Promise<void>

  /**
   * Задать порядок услуг: sort = место в списке.
   * @param ids id услуг мастера в новом порядке
   */
  reorderServices(ids: string[]): Promise<void>

  /**
   * Видимые клиенткам услуги мастера, в порядке мастера.
   * @param masterId id мастера
   */
  listActiveServices(masterId: string): Promise<Service[]>

  /**
   * Свободные начала записи на день. Клиентке — не раньше чем через `MIN_LEAD_MIN` и без начал,
   * оставляющих бесполезные окна; мастеру при ручной записи — вся свободная сетка начиная с текущего момента.
   * @param masterId id мастера
   * @param serviceId id услуги (длительность)
   * @param date день "YYYY-MM-DD" в поясе мастера
   * @param manual слоты для ручной записи мастером
   * @returns начала слотов, ISO в UTC
   */
  getFreeSlots(masterId: string, serviceId: string, date: string, manual?: boolean): Promise<string[]>

  /**
   * Записаться (клиентка). Сервер повторно проверяет, что время свободно.
   * @param input данные записи
   * @throws ошибка со status 409, если время уже заняли
   */
  book(input: BookingInput): Promise<Appointment>

  /**
   * Добавить запись вручную (мастер).
   * @param input данные записи
   * @throws ошибка со status 409, если время пересекается с другой записью
   */
  addManualAppointment(input: BookingInput): Promise<Appointment>

  /** Будущие записи текущей клиентки ко всем мастерам, по времени */
  listMyBookings(): Promise<Appointment[]>

  /**
   * Записи мастера за период, включая отменённые, по времени.
   * @param masterId id мастера
   * @param from начало периода, ISO в UTC
   * @param to конец периода (не включая), ISO в UTC
   */
  listMasterAppointments(masterId: string, from: string, to: string): Promise<Appointment[]>

  /**
   * Отменить запись. Может клиентка (свою) или мастер (любую свою), только пока запись не началась.
   * @param id id записи
   * @throws ошибка со status 409, если запись уже началась
   */
  cancelAppointment(id: string): Promise<Appointment>

  /**
   * Отметить запись выполненной (мастер), только если она уже началась.
   * @param id id записи
   * @throws ошибка со status 409, если запись ещё не началась
   */
  completeAppointment(id: string): Promise<Appointment>

  /**
   * Отправить идею или сообщение об ошибке: сохраняется и пересылается разработчику.
   * @param text текст сообщения
   * @param role кто пишет
   */
  sendFeedback(text: string, role: EnumFeedbackRole): Promise<void>

  /** Документы, которые текущий пользователь уже принял (все редакции) */
  acceptedDocuments(): Promise<AcceptedDoc[]>

  /**
   * Принять документы. Принимается только текущая редакция — та, что показали.
   * @param docs документы и их редакции
   * @returns все принятые документы после приёма
   * @throws ошибка со status 409, если редакция устарела
   */
  acceptDocuments(docs: AcceptedDoc[]): Promise<AcceptedDoc[]>

  /**
   * Запомнить ответ на «Разрешить боту писать?»: без разрешения бот не шлёт уведомления и напоминания.
   * @param allowed разрешил ли
   */
  setBotAccess(allowed: boolean): Promise<void>
}

let current: Repo = apiRepo

/** Переключиться на данные в localStorage: режим просмотра без бэкенда */
export function enableMockRepo() {
  current = mockRepo
}

/** Текущая реализация репозитория */
export const repo = (): Repo => current
