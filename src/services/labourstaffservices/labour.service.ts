/**
 * @file labour.service.ts
 * @description Labour Staff Master API Service
 */

import { API } from "../../config/api";
import { getOrgHeader } from "../../utils/apiHeaders";

/**
 * Labour Response
 */
export interface LabourResponse {
  id: string;

  labour_name: string;

  gender: "Male" | "Female";

  contact_number?: string;

  address?: string;

  in_time?: string;

  out_time?: string;

  overtime_5_8: number;

  overtime_6_8: number;

  overtime_7_8: number;

  overtime_7p_9p: number;

  overtime_7p_10p: number;

  loading_amount: number;

  status: "Active" | "Inactive";

  created_at: string;
}

/**
 * Create Labour
 */
export async function createLabour(
  payload: {
    labour_name: string;

    gender: "Male" | "Female";

    contact_number?: string;

    address?: string;

    in_time?: string;

    out_time?: string;

    overtime_5_8: number;

    overtime_6_8: number;

    overtime_7_8: number;

    overtime_7p_9p: number;

    overtime_7p_10p: number;

    loading_amount: number;

    status: "Active" | "Inactive";
  }
): Promise<LabourResponse> {

  const response = await fetch(
    `${API}/labour-staff`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        ...getOrgHeader(),
      },

      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * Get All Labour Staff
 */
export async function getLabours(): Promise<LabourResponse[]> {

  const response = await fetch(
    `${API}/labour-staff`,
    { headers: getOrgHeader() }
  );

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * Get Labour By Id
 */
export async function getLabour(
  id: string
): Promise<LabourResponse> {

  const response = await fetch(
    `${API}/labour-staff/${id}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * Update Labour
 */
export async function updateLabour(
  id: string,
  payload: {
    labour_name: string;

    gender: "Male" | "Female";

    contact_number?: string;

    address?: string;

    in_time?: string;

    out_time?: string;

    overtime_5_8: number;

    overtime_6_8: number;

    overtime_7_8: number;

    overtime_7p_9p: number;

    overtime_7p_10p: number;

    loading_amount: number;

    status: "Active" | "Inactive";
  }
): Promise<LabourResponse> {

  const response = await fetch(
    `${API}/labour-staff/${id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * Delete Labour
 */
export async function deleteLabour(
  id: string
): Promise<{ message: string }> {

  const response = await fetch(
    `${API}/labour-staff/${id}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data;
}