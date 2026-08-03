/**
 * @file dataStore.ts
 * @description In-memory + localStorage backed data store providing async add/edit/delete/list
 *              operations for labour attendance. Simulates network latency for frontend usage.
 *
 * Usage:
 *  import { listAttendances, getAttendance, createAttendance, updateAttendance, deleteAttendance } from './dataStore'
 */

import type {
  LabourAttendance,
  LabourAttendanceCreatePayload,
  LabourAttendanceUpdatePayload,
} from './types'

/**
 * @constant STORAGE_KEY
 * @description localStorage key used to persist labour attendance records.
 */
const STORAGE_KEY = 'wc_labour_attendance_v1'

/**
 * @function nowDate
 * @description Returns current date in YYYY-MM-DD format.
 */
const nowDate = (): string => new Date().toISOString().slice(0, 10)

/**
 * @function generateId
 * @description Generate a reasonably unique id using timestamp and random suffix.
 */
const generateId = (prefix = 'LA'): string => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/**
 * @function seedData
 * @description Default initial records when no persisted data exists.
 */
const seedData = (): LabourAttendance[] => [
  {
    id: 'LA-1',
    labourId: 'LABS1',
    attendanceDate: nowDate(),
    status: 'Present',
    inTime: '09:00',
    outTime: '18:00',
    hoursWorked: 8,
    overtimeHours: 0,
    remarks: 'Seeded present',
    createdAt: nowDate(),
  },
  {
    id: 'LA-2',
    labourId: 'LABS2',
    attendanceDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: 'Absent',
    inTime: '',
    outTime: '',
    hoursWorked: 0,
    overtimeHours: 0,
    remarks: 'Seeded absent',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  },
]

/**
 * @function readStorage
 * @description Read and parse persisted attendance records, fallback to seedData().
 */
const readStorage = (): LabourAttendance[] => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) return seedData()
    const parsed = JSON.parse(raw) as LabourAttendance[]
    if (!Array.isArray(parsed)) return seedData()
    return parsed
  } catch (e) {
    return seedData()
  }
}

/**
 * @function writeStorage
 * @description Persist attendance records to localStorage.
 */
const writeStorage = (data: LabourAttendance[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

/**
 * @description Internal in-memory cache (initialized lazily).
 */
let cache: LabourAttendance[] | null = null

/**
 * @function getCache
 * @description Ensure cache is available and return it.
 */
const getCache = (): LabourAttendance[] => {
  if (!cache) {
    cache = readStorage()
  }
  return cache
}

/**
 * @function persist
 * @description Persist current cache to storage.
 */
const persist = () => {
  if (cache) writeStorage(cache)
}

/**
 * @function listAttendances
 * @description Return all attendance records (async simulated).
 */
export const listAttendances = async (): Promise<LabourAttendance[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getCache()!.slice())
    }, 140)
  })
}

/**
 * @function getAttendance
 * @description Get single attendance record by id.
 */
export const getAttendance = async (id: string): Promise<LabourAttendance | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = getCache()!.find((r) => r.id === id)
      resolve(found)
    }, 100)
  })
}

/**
 * @function createAttendance
 * @description Create a new attendance record and persist it.
 */
export const createAttendance = async (payload: LabourAttendanceCreatePayload): Promise<LabourAttendance> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      // Enforce required fields
      if (!payload.labourId || !payload.attendanceDate) {
        reject(new Error('labourId and attendanceDate are required'))
        return
      }
      // Ensure uniqueness per labour/date
      if (current.some((c) => c.labourId === payload.labourId && c.attendanceDate === payload.attendanceDate)) {
        reject(new Error('Attendance for this labour on the given date already exists'))
        return
      }
      const rec: LabourAttendance = {
        id: generateId('LA'),
        labourId: payload.labourId,
        attendanceDate: payload.attendanceDate,
        status: payload.status ?? 'Present',
        inTime: payload.inTime ?? '',
        outTime: payload.outTime ?? '',
        hoursWorked: Number(payload.hoursWorked ?? 0),
        overtimeHours: Number(payload.overtimeHours ?? 0),
        remarks: payload.remarks ?? '',
        createdAt: nowDate(),
      }
      current.unshift(rec)
      persist()
      resolve(rec)
    }, 160)
  })
}

/**
 * @function updateAttendance
 * @description Update an existing attendance record by id.
 */
export const updateAttendance = async (id: string, payload: LabourAttendanceUpdatePayload): Promise<LabourAttendance> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      const idx = current.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('Attendance record not found'))
        return
      }
      // If changing labourId or date, ensure uniqueness
      const newLabourId = payload.labourId ?? current[idx].labourId
      const newDate = payload.attendanceDate ?? current[idx].attendanceDate
      if (current.some((c, i) => i !== idx && c.labourId === newLabourId && c.attendanceDate === newDate)) {
        reject(new Error('Attendance for this labour on the given date already exists'))
        return
      }
      const updated: LabourAttendance = {
        ...current[idx],
        labourId: newLabourId,
        attendanceDate: newDate,
        status: payload.status ?? current[idx].status,
        inTime: payload.inTime ?? current[idx].inTime,
        outTime: payload.outTime ?? current[idx].outTime,
        hoursWorked: payload.hoursWorked !== undefined ? Number(payload.hoursWorked) : current[idx].hoursWorked,
        overtimeHours: payload.overtimeHours !== undefined ? Number(payload.overtimeHours) : current[idx].overtimeHours,
        remarks: payload.remarks ?? current[idx].remarks,
        createdAt: current[idx].createdAt,
      }
      current[idx] = updated
      persist()
      resolve(updated)
    }, 160)
  })
}

/**
 * @function deleteAttendance
 * @description Delete an attendance record by id.
 */
export const deleteAttendance = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = getCache()!
      const idx = current.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('Attendance record not found'))
        return
      }
      current.splice(idx, 1)
      persist()
      resolve()
    }, 120)
  })
}