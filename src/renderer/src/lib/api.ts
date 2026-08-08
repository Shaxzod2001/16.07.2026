import type { AttendanceApi } from '../../../shared/types'
import { webApi } from './webApi'

export const api: AttendanceApi = window.api ?? webApi
