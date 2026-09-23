export interface MobileAttendanceRecord {
  id: string;
  labour_name: string;
  user_id: string;
  attendance_date: string;
  in_time: string;
  out_time: string | null;
  total_working_hours: number;
  is_working: boolean;
  organization_id: string;
  branch_id: string;
}

export interface MobileAttendanceBranchScope {
  organization_id: string;
  branch_id: string;
}