/**
 * @file OrganizationMasterPage.tsx
 * @description Organization Master screen — displays and maintains the
 *              details of the currently logged-in organization.
 */

import React, { useEffect, useRef, useState } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Building2,
  MapPin,
  ReceiptIndianRupee,
  Save,
  BadgeCheck,
  RotateCcw,
  Upload,
  FileText,
  Eye,
  Trash2,
  X,
  Download,
} from 'lucide-react'

import { PageHeader } from '../../components/common/PageHeader'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { formatDate } from '../../utils/format'
import { useAuthStore } from '../../store/authStore'

import {
  getCurrentOrganization,
  updateOrganization,
  storeOrganizationId,
  getOrganizationDocuments,
  getOrganizationDocument,
  uploadOrganizationDocument,
  deleteOrganizationDocument,
  type OrganizationDocument,
  type OrganizationUpdatePayload,
} from '../../services/organizationservices/organization.service'

import { INDIAN_STATES } from '../../constants/indianStates'

/**
 * @description Organization form values (frontend camelCase).
 */
interface OrganizationFormValues {
  organizationCode: string
  organizationName: string
  registrationNo: string
  userId: string
  ownerName: string
  contactNo: string
  email: string
  contactPersonName: string

  addressLine1: string
  addressLine2: string
  street: string
  city: string
  state: string
  pincode: string
  country: string

  gstNo: string
  panNo: string
  cinNo: string
  website: string
  logoUrl: string
  contactPerson: string
  alternateContactNo: string
  emailSecondary: string
}

/**
 * @interface FieldProps
 * @description Props for the inline reusable input field.
 */
interface FieldProps {
  label: string
  required?: boolean
  readOnly?: boolean
  hint?: string
  error?: string
  registration: UseFormRegisterReturn
}

const inputClasses = (readOnly: boolean) =>
  `w-full rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32] ${
    readOnly
      ? 'cursor-not-allowed bg-slate-100 text-slate-500'
      : 'bg-white'
  }`

const labelClasses =
  'mb-1 block text-xs font-medium text-slate-700'

/**
 * @component Field
 * @description Label + input wrapper used across all sections.
 */
const Field: React.FC<FieldProps> = ({
  label,
  required,
  readOnly,
  hint,
  error,
  registration,
}) => (
  <div>
    <label className={labelClasses}>
      {label}
      {required ? (
        <span className="text-rose-500"> *</span>
      ) : null}
    </label>

    <input
      className={inputClasses(Boolean(readOnly))}
      readOnly={readOnly}
      {...registration}
    />

    {hint ? (
      <p className="mt-1 text-[10px] text-slate-400">
        {hint}
      </p>
    ) : null}

    {error ? (
      <p className="mt-1 text-[10px] text-rose-600">
        {error}
      </p>
    ) : null}
  </div>
)

/**
 * @component OrganizationMasterPage
 * @description Organization master maintenance screen.
 */
const OrganizationMasterPage: React.FC = () => {
  const selectedOrganizationId = useAuthStore(
    (s) => s.selectedOrganizationId
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [organizationId, setOrganizationId] =
    useState<string | null>(null)

  const [organizationCode, setOrganizationCode] =
    useState('')

  const [status, setStatus] = useState('')

  const [profileCompleted, setProfileCompleted] =
    useState(false)

  const [createdAt, setCreatedAt] = useState('')

  const [documents, setDocuments] = useState<
    OrganizationDocument[]
  >([])

  const [uploadingDoc, setUploadingDoc] = useState(false)

  const docInputRef = useRef<HTMLInputElement | null>(null)

  const [previewDoc, setPreviewDoc] =
    useState<OrganizationDocument | null>(null)

  const [isDragging, setIsDragging] =
    useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrganizationFormValues>({
    defaultValues: {
      organizationCode: '',
      organizationName: '',
      registrationNo: '',
      userId: '',
      ownerName: '',
      contactNo: '',
      email: '',
      contactPersonName: '',

      addressLine1: '',
      addressLine2: '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',

      gstNo: '',
      panNo: '',
      cinNo: '',
      website: '',
      logoUrl: '',
      contactPerson: '',
      alternateContactNo: '',
      emailSecondary: '',
    },
  })

  /**
   * @function loadOrganization
   * @description Fetch the currently logged-in organization.
   */
  const loadOrganization = async () => {
    try {
      setLoading(true)

      const org = await getCurrentOrganization(
        selectedOrganizationId
      )

      storeOrganizationId(org.id)

      setOrganizationId(org.id)
      setOrganizationCode(org.organization_code)
      setStatus(org.status)
      setProfileCompleted(
        org.is_profile_completed
      )
      setCreatedAt(org.created_at)

      loadDocuments(org.id)

      reset({
        organizationCode:
          org.organization_code,

        organizationName:
          org.organization_name,

        registrationNo:
          org.registration_no ?? '',

        userId:
          org.user_id ?? '',

        ownerName:
          org.owner_name ?? '',

        contactNo:
          org.contact_no ?? '',

        email:
          org.email ?? '',

        contactPersonName:
          org.contact_person_name ?? '',

        addressLine1:
          org.address_line1 ?? '',

        addressLine2:
          org.address_line2 ?? '',

        street:
          org.street ?? '',

        city:
          org.city ?? '',

        state:
          org.state ?? '',

        pincode:
          org.pincode ?? '',

        country:
          org.country ?? 'India',

        gstNo:
          org.gst_no ?? '',

        panNo:
          org.pan_no ?? '',

        cinNo:
          org.cin_no ?? '',

        website:
          org.website ?? '',

        logoUrl:
          org.logo_url ?? '',

        contactPerson:
          org.contact_person ?? '',

        alternateContactNo:
          org.alternate_contact_no ?? '',

        emailSecondary:
          org.email_secondary ?? '',
      })
    } catch (error) {
      console.error(error)

      toast.error(
        'Failed to load organization details'
      )
    } finally {
      setLoading(false)
    }
  }

  /**
   * @function loadDocuments
   * @description Fetch required documents for the current organization.
   */
  const loadDocuments = async (orgId: string) => {
    try {
      const rows = await getOrganizationDocuments(orgId)
      setDocuments(rows)
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * @function processFile
   * @description Validate, read and upload a single document file.
   */
  const processFile = async (file: File) => {
    if (!organizationId) return

    const allowed = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
    ]

    if (!allowed.includes(file.type)) {
      toast.error('Only JPG, PNG or PDF files are allowed')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be smaller than 5MB')
      return
    }

    try {
      setUploadingDoc(true)

      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })

      const docType = `DOC_${Date.now()}`
      const uploaded = await uploadOrganizationDocument(organizationId, docType, {
        file_name: file.name,
        mime_type: file.type,
        file_data: fileData,
      })

      setDocuments((prev) => [...prev, { ...uploaded, file_data: fileData }])
      toast.success('Document uploaded successfully')
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Failed to upload document')
    } finally {
      setUploadingDoc(false)
    }
  }

  /**
   * @function handleDocFileChange
   * @description Handle document selection from the file input.
   */
  const handleDocFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    e.target.value = ''

    if (file) processFile(file)
  }

  /**
   * @function handleDragOver
   * @description Highlight the drop zone while dragging a file over it.
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  /**
   * @function handleDragLeave
   * @description Remove drop zone highlight when the file leaves.
   */
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  /**
   * @function handleDrop
   * @description Upload a file dropped onto the documents section.
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  /**
   * @function handleDocView
   * @description Open the stored document in an in-app preview modal.
   */
  const handleDocView = async (docType: string) => {
    if (!organizationId) return

    try {
      const doc = await getOrganizationDocument(organizationId, docType)
      if (doc.file_data) {
        setPreviewDoc(doc)
      } else {
        toast.error('No document file found')
      }
    } catch {
      toast.error('Failed to open document')
    }
  }

  /**
   * @function handleDocRemove
   * @description Delete the stored document.
   */
  const handleDocRemove = async (docType: string) => {
    if (!organizationId) return

    try {
      await deleteOrganizationDocument(organizationId, docType)
      setDocuments((prev) => prev.filter((d) => d.doc_type !== docType))
      toast.success('Document removed successfully')
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Failed to remove document')
    }
  }

  useEffect(() => {
    loadOrganization()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrganizationId])

  /**
   * @function onSubmit
   * @description Save organization + additional details.
   */
  const onSubmit = async (
    values: OrganizationFormValues
  ) => {
    if (!organizationId) {
      toast.error(
        'Organization not loaded yet'
      )
      return
    }

    try {
      setSaving(true)

      const payload: OrganizationUpdatePayload = {
        organization_name:
          values.organizationName.trim(),

        registration_no:
          values.registrationNo.trim() ||
          null,

        owner_name:
          values.ownerName.trim() ||
          null,

        contact_no:
          values.contactNo.trim(),

        email:
          values.email.trim().toLowerCase(),

        contact_person_name:
          values.contactPersonName.trim() ||
          null,

        address_line1:
          values.addressLine1.trim() ||
          null,

        address_line2:
          values.addressLine2.trim() ||
          null,

        street:
          values.street.trim() ||
          null,

        city:
          values.city.trim() ||
          null,

        state:
          values.state.trim() ||
          null,

        pincode:
          values.pincode.trim() ||
          null,

        country:
          values.country.trim() ||
          null,

        gst_no:
          values.gstNo.trim() ||
          null,

        pan_no:
          values.panNo.trim() ||
          null,

        cin_no:
          values.cinNo.trim() ||
          null,

        website:
          values.website.trim() ||
          null,

        logo_url:
          values.logoUrl.trim() ||
          null,

        contact_person:
          values.contactPerson.trim() ||
          null,

        alternate_contact_no:
          values.alternateContactNo.trim() ||
          null,

        email_secondary:
          values.emailSecondary
            .trim()
            .toLowerCase() ||
          null,
      }

      const updated =
        await updateOrganization(
          organizationId,
          payload
        )

      setProfileCompleted(
        updated.is_profile_completed
      )

      setStatus(updated.status)

      toast.success(
        'Organization details saved successfully'
      )
    } catch (error: any) {
      console.error(error)

      const validationErrors =
        error?.details?.errors

      const firstError = validationErrors
        ? Object.values(
            validationErrors
          )[0]
        : null

      toast.error(
        firstError ||
          error?.message ||
          'Failed to save organization details'
      )
    } finally {
      setSaving(false)
    }
  }

  /**
   * @function handleReset
   * @description Reload the persisted values from the server.
   */
  const handleReset = async () => {
    await loadOrganization()

    toast.success(
      'Form reset to saved values'
    )
  }

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Organization Master"
          breadcrumb={[
            'Main',
            'Organization Master',
          ]}
        />

        <LoadingSpinner
          label="Loading organization details..."
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Organization Master"
        breadcrumb={[
          'Main',
          'Organization Master',
        ]}
      />

      {/* Summary strip */}
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 text-white">
              <Building2 className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Organization Code
              </p>

              <p className="truncate text-sm font-semibold text-slate-900">
                {organizationCode || '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <BadgeCheck className="h-4 w-4" />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Status
              </p>

              <p className="text-sm font-semibold text-slate-900">
                {status || '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <BadgeCheck className="h-4 w-4" />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Profile Completion
              </p>

              <p className="text-sm font-semibold text-slate-900">
                {profileCompleted
                  ? 'Completed'
                  : 'Incomplete'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Organization Information */}
        <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm md:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#2E7D32]" />

            <h2 className="text-sm font-semibold text-slate-800">
              Organization Information
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Organization Code"
              readOnly
              hint="Generated automatically"
              registration={register(
                'organizationCode'
              )}
            />

            <Field
              label="Organization Name"
              required
              error={
                errors.organizationName?.message
              }
              registration={register(
                'organizationName',
                {
                  required:
                    'Organization name is required',
                }
              )}
            />

            <Field
              label="Registration No"
              registration={register(
                'registrationNo'
              )}
            />

            <Field
              label="User ID"
              readOnly
              hint="Primary login user"
              registration={register('userId')}
            />

            <Field
              label="Owner Name"
              registration={register(
                'ownerName'
              )}
            />

            <Field
              label="Contact No"
              required
              error={
                errors.contactNo?.message
              }
              registration={register(
                'contactNo',
                {
                  required:
                    'Contact number is required',
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message:
                      'Enter a valid 10 digit mobile number',
                  },
                }
              )}
            />

            <Field
              label="Organization Email"
              required
              error={
                errors.email?.message
              }
              registration={register(
                'email',
                {
                  required:
                    'Email address is required',
                  pattern: {
                    value:
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message:
                      'Enter a valid email address',
                  },
                }
              )}
            />

            <Field
              label="Contact Person Name"
              required
              error={errors.contactPersonName?.message}
              registration={register(
                'contactPersonName',
                { required: 'Contact person name is required' }
              )}
            />
          </div>
        </div>

        {/* Address Information */}
        <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm md:p-5">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#2E7D32]" />

            <h2 className="text-sm font-semibold text-slate-800">
              Address Information
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Address Line 1"
              required
              error={errors.addressLine1?.message}
              registration={register(
                'addressLine1',
                { required: 'Address line 1 is required' }
              )}
            />

            <Field
              label="Address Line 2"
              registration={register(
                'addressLine2'
              )}
            />

            <Field
              label="Street"
              required
              error={errors.street?.message}
              registration={register('street', {
                required: 'Street is required',
              })}
            />

            <Field
              label="City"
              required
              error={errors.city?.message}
              registration={register('city', {
                required: 'City is required',
              })}
            />

            <div>
              <label className={labelClasses}>
                State
                <span className="text-rose-500"> *</span>
              </label>

              <select
                className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                {...register('state', {
                  required: 'State is required',
                })}
              >
                <option value="">
                  Select State
                </option>

                {INDIAN_STATES.map(
                  (state) => (
                    <option
                      key={state}
                      value={state}
                    >
                      {state}
                    </option>
                  )
                )}
              </select>
            </div>

            <Field
              label="Pincode"
              required
              error={
                errors.pincode?.message
              }
              registration={register(
                'pincode',
                {
                  required: 'Pincode is required',
                  pattern: {
                    value: /^[0-9]{6}$/,
                    message:
                      'Enter a valid 6 digit pincode',
                  },
                }
              )}
            />

            <Field
              label="Country"
              required
              error={errors.country?.message}
              registration={register(
                'country',
                { required: 'Country is required' }
              )}
            />
          </div>
        </div>

        {/* Additional Information */}
        <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm md:p-5">
          <div className="mb-3 flex items-center gap-2">
            <ReceiptIndianRupee className="h-4 w-4 text-[#2E7D32]" />

            <h2 className="text-sm font-semibold text-slate-800">
              Additional Information
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="GST No"
              registration={register('gstNo')}
            />

            <Field
              label="PAN No"
              registration={register('panNo')}
            />

            <Field
              label="CIN No"
              registration={register('cinNo')}
            />

            <Field
              label="Website"
              registration={register('website')}
            />

            <Field
              label="Logo URL"
              registration={register('logoUrl')}
            />

            <Field
              label="Contact Person"
              registration={register(
                'contactPerson'
              )}
            />

            <Field
              label="Alternate Contact No"
              registration={register(
                'alternateContactNo'
              )}
            />

            <Field
              label="Secondary Email"
              error={
                errors.emailSecondary?.message
              }
              registration={register(
                'emailSecondary',
                {
                  pattern: {
                    value:
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message:
                      'Enter a valid email address',
                  },
                }
              )}
            />
          </div>
        </div>

        {/* Required Documents */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-2xl border bg-white/90 p-4 shadow-sm transition-colors md:p-5 ${
            isDragging
              ? 'border-emerald-400 bg-emerald-50/50'
              : 'border-slate-100'
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#2E7D32]" />

              <h2 className="text-sm font-semibold text-slate-800">
                Required Documents
              </h2>
            </div>

            <input
              ref={docInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="hidden"
              onChange={handleDocFileChange}
            />

            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              disabled={uploadingDoc}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              <Upload className="h-3.5 w-3.5" />
              {uploadingDoc ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>

          <p className="mb-4 text-[11px] text-slate-500">
            Upload supporting documents in JPG, PNG or PDF format (max 5MB each).
            Drag &amp; drop a file anywhere in this section or use the
            Upload Document button.
          </p>

          {documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-xs text-slate-400">
              {isDragging
                ? 'Drop the file here to upload'
                : 'No documents uploaded yet. Drag & drop a file here.'}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <FileText className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-slate-700">
                        {doc.file_name || 'Document'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {(doc.mime_type ?? '').split('/').pop()?.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDocView(doc.doc_type)}
                      className="rounded-full p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                      title="View"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDocRemove(doc.doc_type)}
                      className="rounded-full p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
          <div className="text-xs text-slate-500">
            {createdAt ? (
              <>
                Created on{' '}
                <span className="font-medium text-slate-700">
                  {formatDate(createdAt)}
                </span>
              </>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              {saving
                ? 'Saving...'
                : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>

      {/* Document preview modal */}
      {previewDoc ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-slate-800">
                {previewDoc.file_name || 'Document'}
              </p>

              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={previewDoc.file_data ?? '#'}
                  download={previewDoc.file_name || 'document'}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-100 p-4">
              {previewDoc.mime_type === 'application/pdf' ? (
                <iframe
                  src={previewDoc.file_data ?? ''}
                  title={previewDoc.file_name || 'document'}
                  className="h-[78vh] w-full rounded-xl border border-slate-200 bg-white"
                />
              ) : (
                <img
                  src={previewDoc.file_data ?? ''}
                  alt={previewDoc.file_name || 'document'}
                  className="max-h-[78vh] max-w-full rounded-xl object-contain"
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default OrganizationMasterPage;