// Единая точка подключения dayjs: плагины и локали настраиваются здесь, остальные модули импортируют отсюда
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/ru'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

export default dayjs
