export interface LabourAttendanceRecord {
  id: string;
  labour_id: string | null;
  labour_name: string;
  type: "Regular" | "Temporary";
  attendance_date: string;
  shift: "Morning" | "Evening" | "Night" | "Both";
  in_time: string;
  out_time: string;
  hours: number;
  morning_ot: number;
  evening_ot: number;
  ot_hours: number;
  ot_rate: number;
  loading_10_tons_amount: number;
  loading_20_tons_amount: number;
  total_ot_amount: number;
  organization_id: string;
  created_at: string;
}

export interface LabourAttendancePayload {
  labour_id?: string | null;
  labour_name: string;
  type: "Regular" | "Temporary";
  attendance_date: string;
  shift: "Morning" | "Evening" | "Night" | "Both";
  in_time?: string;
  out_time?: string;
  hours?: number;
  morning_ot?: number;
  evening_ot?: number;
  ot_rate?: number;
  loading_10_tons_amount?: number;
  loading_20_tons_amount?: number;
}
