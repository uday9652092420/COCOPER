import { API } from "../config/api";
import { getOrgHeader } from "../utils/apiHeaders";

export interface LabourAttendanceResponse {
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}/labour-attendance${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...getOrgHeader(), ...(init?.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Labour payment request failed");
  return data.data as T;
}

export const getLabourAttendances = () => request<LabourAttendanceResponse[]>("");

export const createLabourAttendances = (records: LabourAttendancePayload[]) =>
  request<LabourAttendanceResponse[]>("", {
    method: "POST",
    body: JSON.stringify({ records }),
  });

export const updateLabourAttendance = (id: string, payload: LabourAttendancePayload) =>
  request<LabourAttendanceResponse>(`/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteLabourAttendance = (id: string) =>
  request<void>(`/${id}`, { method: "DELETE" });
