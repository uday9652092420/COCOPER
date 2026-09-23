import { API } from '../config/api'
import { getBranchHeader, getOrgHeader } from '../utils/apiHeaders'

export interface MobileAttendanceDetails {
  id: string
  labour_name: string
  user_id: string
  attendance_date: string
  in_time: string
  out_time: string | null
  total_working_hours: number
  is_working: boolean
  organization_id: string
  branch_id: string
}

export async function getMobileAttendanceDetails(): Promise<MobileAttendanceDetails[]> {
  const response = await fetch(`${API}/labour-attendance/details`, {
    headers: { ...getOrgHeader(), ...getBranchHeader() },
  })
  const data = await response.json()
  if (!response.ok) throw data
  return data.data ?? []
}