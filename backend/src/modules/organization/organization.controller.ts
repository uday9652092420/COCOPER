/**
 * @file organization.controller.ts
 * @description Controller for the Organization Master module.
 */

import type { NextFunction, Request, Response } from 'express';
import {
  deleteOrganizationDocument as deleteOrganizationDocumentService,
  getLatestOrganization as getLatestOrganizationService,
  getOrganizationById as getOrganizationByIdService,
  getOrganizationDocument as getOrganizationDocumentService,
  listOrganizationDocuments as listOrganizationDocumentsService,
  listOrganizations as listOrganizationsService,
  updateOrganization as updateOrganizationService,
  upsertOrganizationDocument as upsertOrganizationDocumentService,
} from './organization.service.js';
import { validateOrganizationPayload } from './organization.validation.js';
import { AppError } from '../../utils/AppError.js';

interface OrganizationParams {
  id: string;
}

/**
 * GET /api/organizations/me
 *
 * Returns the currently logged-in organization.
 *
 * The organization id can be supplied through the `x-organization-id`
 * header or the `organizationId` query parameter. When neither is
 * provided, the most recently created organization is returned.
 */
export async function getCurrentOrganizationHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const organizationId =
      req.header('x-organization-id') ||
      (req.query.organizationId as string | undefined);

    if (organizationId) {
      const row = await getOrganizationByIdService(organizationId);

      if (!row) {
        return next(new AppError('Organization not found', 404));
      }

      return res.status(200).json(row);
    }

    const row = await getLatestOrganizationService();

    if (!row) {
      return next(new AppError('No organization found', 404));
    }

    return res.status(200).json(row);
  } catch (error) {
    return next(
      new AppError('Failed to retrieve organization', 500, {
        cause: error,
      })
    );
  }
}

export async function listOrganizationsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rows = await listOrganizationsService();
    return res.status(200).json(rows);
  } catch (error) {
    return next(
      new AppError('Failed to list organizations', 500, {
        cause: error,
      })
    );
  }
}

export async function getOrganizationHandler(
  req: Request<OrganizationParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const row = await getOrganizationByIdService(req.params.id);

    if (!row) {
      return next(new AppError('Organization not found', 404));
    }

    return res.status(200).json(row);
  } catch (error) {
    return next(
      new AppError('Failed to retrieve organization', 500, {
        cause: error,
      })
    );
  }
}

export async function updateOrganizationHandler(
  req: Request<OrganizationParams>,
  res: Response,
  next: NextFunction
) {
  const payload = req.body;

  const errors = validateOrganizationPayload(payload);

  if (errors) {
    return next(
      new AppError('Validation failed', 400, { errors })
    );
  }

  try {
    const updated = await updateOrganizationService(req.params.id, payload);

    if (!updated) {
      return next(new AppError('Organization not found', 404));
    }

    return res.status(200).json(updated);
  } catch (error) {
    return next(
      new AppError('Failed to update organization', 500, {
        cause: error,
      })
    );
  }
}

interface OrganizationDocParams {
  id: string;
  docType: string;
}

export async function listOrganizationDocumentsHandler(
  req: Request<OrganizationDocParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const rows = await listOrganizationDocumentsService(req.params.id);
    return res.status(200).json(rows);
  } catch (error) {
    return next(
      new AppError('Failed to list organization documents', 500, { cause: error })
    );
  }
}

export async function getOrganizationDocumentHandler(
  req: Request<OrganizationDocParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const row = await getOrganizationDocumentService(req.params.id, req.params.docType);
    if (!row) return next(new AppError('Document not found', 404));
    return res.status(200).json(row);
  } catch (error) {
    return next(
      new AppError('Failed to retrieve organization document', 500, { cause: error })
    );
  }
}

export async function upsertOrganizationDocumentHandler(
  req: Request<OrganizationDocParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = {
      doc_type: req.params.docType,
      file_name: req.body?.file_name,
      mime_type: req.body?.mime_type,
      file_data: req.body?.file_data,
    };

    const row = await upsertOrganizationDocumentService(req.params.id, payload);
    return res.status(200).json(row);
  } catch (error) {
    return next(
      new AppError('Failed to save organization document', 500, { cause: error })
    );
  }
}

export async function deleteOrganizationDocumentHandler(
  req: Request<OrganizationDocParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const deleted = await deleteOrganizationDocumentService(req.params.id, req.params.docType);
    if (!deleted) return next(new AppError('Document not found', 404));
    return res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    return next(
      new AppError('Failed to delete organization document', 500, { cause: error })
    );
  }
}
