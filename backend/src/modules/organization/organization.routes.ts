/**
 * @file organization.routes.ts
 * @description Routes for the Organization Master module.
 */

import express from 'express';
import {
  deleteOrganizationDocumentHandler,
  getCurrentOrganizationHandler,
  getOrganizationDocumentHandler,
  getOrganizationHandler,
  listOrganizationDocumentsHandler,
  listOrganizationsHandler,
  updateOrganizationHandler,
  upsertOrganizationDocumentHandler,
} from './organization.controller.js';

const router = express.Router();

router.get('/me', getCurrentOrganizationHandler);
router.get('/', listOrganizationsHandler);
router.get('/:id', getOrganizationHandler);
router.put('/:id', updateOrganizationHandler);

router.get('/:id/documents', listOrganizationDocumentsHandler);
router.get('/:id/documents/:docType', getOrganizationDocumentHandler);
router.put('/:id/documents/:docType', upsertOrganizationDocumentHandler);
router.delete('/:id/documents/:docType', deleteOrganizationDocumentHandler);

export default router;
