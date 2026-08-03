/**
 * @file labors.ts
 * @description Mock labour staff master data used by the Labour Master page.
 */

import { daysFromNow, rand } from './db-helpers' // lightweight helper we will create for date/random reuse

/**
 * @interface LabourStaff
 * @description Labour staff master record used in UI mocks.
 */
export interface LabourStaff {
  id: string
  labourName: string
  gender: 'Male' | 'Female'
  contactNumber: string
  address: string
  inTime: string
  outTime: string
  overtime_5_8: number
  overtime_6_8: number
  overtime_7_8: number
  overtime_7p_9p: number
  overtime_7p_10p: number
  loadingAmount: number
  status: 'Active' | 'Inactive'
  createdAt: string
}

/**
 * @description Simple mock list of labour staff.
 */
export const labors: LabourStaff[] = Array.from({ length: 25 }).map((_, idx) => {
  const genders: LabourStaff['gender'][] = ['Male', 'Female']
  const gender = genders[idx % genders.length]
  return {
    id: `LABS${idx + 1}`,
    labourName: `Labour Staff ${idx + 1}`,
    gender,
    contactNumber: `98${(100000 + idx).toString().slice(-6)}`,
    address: `No ${idx + 1}, Work Lane, Coconut Town`,
    inTime: idx % 2 === 0 ? '09:00' : '08:30',
    outTime: idx % 2 === 0 ? '18:00' : '17:30',
    overtime_5_8: Math.floor(Math.random() * 300) + 50,
    overtime_6_8: Math.floor(Math.random() * 250) + 40,
    overtime_7_8: Math.floor(Math.random() * 200) + 30,
    overtime_7p_9p: Math.floor(Math.random() * 400) + 60,
    overtime_7p_10p: Math.floor(Math.random() * 500) + 80,
    loadingAmount: Math.floor(Math.random() * 800) + 100,
    status: idx % 11 === 0 ? 'Inactive' : 'Active',
    createdAt: daysFromNow(-((idx % 90) + 1)),
  }
})