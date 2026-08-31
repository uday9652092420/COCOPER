/**
 * @file codeGenerator.ts
 * @description Shared helper for scope-aware code generation.
 *
 * Generates codes of the form `<prefix>-NN` where the prefix is derived
 * from the first letter of the scope's name (branch or organization) plus
 * a module letter, and the sequence number is the count of records already
 * present in that scope + 1.
 *
 * Examples:
 *   Item in "Ameerpet" branch      -> AI-01
 *   Supplier in "Maiprosoft" org   -> MS-01
 */

import { pool } from '../config/db.js';

export interface ScopedCodeOptions {
  /** Table to count records in, e.g. 'items'. */
  table: string;
  /** Column used for scoping, e.g. 'branch_id' or 'organization_id'. */
  scopeColumn: string;
  /** The selected scope id (branch id / organization id). */
  scopeId?: string | null;
  /** Table that holds the scope's display name. */
  scopeLabelTable: string;
  /** Column holding the scope's display name. */
  scopeLabelColumn: string;
  /** Module letter appended to the scope's first letter. */
  moduleLetter: string;
  /** Prefix used when no scope is selected. */
  fallbackPrefix: string;
  /** Zero-padding length for the sequence number. */
  padLength?: number;
  /** Use one sequence for the table when its code is globally unique. */
  sequenceScope?: 'scope' | 'global';
}

export async function getNextScopedCode(options: ScopedCodeOptions): Promise<string> {
  const {
    table,
    scopeColumn,
    scopeId,
    scopeLabelTable,
    scopeLabelColumn,
    moduleLetter,
    fallbackPrefix,
    padLength = 2,
    sequenceScope = 'scope',
  } = options;

  let prefix = fallbackPrefix;
  let total = 0;

  if (scopeId) {
    const { rows: labelRows } = await pool.query(
      `SELECT ${scopeLabelColumn} AS label FROM ${scopeLabelTable} WHERE id = $1`,
      [scopeId]
    );

    const label = String(labelRows[0]?.label ?? '').trim();
    const firstLetter = label.match(/[A-Za-z]/)?.[0];

    if (firstLetter) {
      prefix = `${firstLetter.toUpperCase()}${moduleLetter.toUpperCase()}`;
    }

    const scopeCondition =
      sequenceScope === 'global'
        ? ''
        : ` AND ${scopeColumn} = $2`;
    const params =
      sequenceScope === 'global'
        ? [`${prefix}-%`]
        : [`${prefix}-%`, scopeId];
    const { rows } = await pool.query(
      `SELECT COALESCE(MAX(CASE WHEN code ~ '-[0-9]+$' THEN substring(code FROM '([0-9]+)$')::int ELSE 0 END), 0)::int AS total
       FROM ${table}
      WHERE code LIKE $1${scopeCondition}`,
      params
    );

    total = rows[0]?.total ?? 0;
  } else {
    const { rows } = await pool.query(
      `SELECT COALESCE(MAX(CASE WHEN code ~ '-[0-9]+$' THEN substring(code FROM '([0-9]+)$')::int ELSE 0 END), 0)::int AS total
       FROM ${table}
       WHERE code LIKE $1`,
      [`${prefix}-%`]
    );

    total = rows[0]?.total ?? 0;
  }

  return `${prefix}-${String(total + 1).padStart(padLength, '0')}`;
}
