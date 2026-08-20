/**
 * @file salesOrder.service.ts
 * @description Business logic layer for Sales Order module.
 */

import {
  createSalesOrderRepo,
  updateSalesOrderRepo,
  deleteSalesOrderRepo,
  listSalesOrdersRepo,
  getSalesOrderByIdRepo,
} from "./salesOrder.repository.js";
import {
  SalesOrderCreateDTO,
  SalesOrderUpdateDTO,
} from "./salesOrder.types.js";

export async function listSalesOrders(organizationId?: string | null) {
  return listSalesOrdersRepo(organizationId ?? null);
}

export async function getSalesOrderById(id: string) {
  return getSalesOrderByIdRepo(id);
}

export async function createSalesOrder(payload: SalesOrderCreateDTO) {
  if (!payload.soNumber) {
    throw new Error("soNumber is required");
  }
  return createSalesOrderRepo(payload);
}

export async function updateSalesOrder(
  id: string,
  payload: SalesOrderUpdateDTO
) {
  return updateSalesOrderRepo(id, payload);
}

export async function deleteSalesOrder(id: string) {
  return deleteSalesOrderRepo(id);
}
