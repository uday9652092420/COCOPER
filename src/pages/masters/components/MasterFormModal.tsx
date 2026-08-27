
/**
 * @file MasterFormModal.tsx
 * @description
 * Generic modal form used by master screens (Add / Edit).
 *
 * Supports:
 * - Standard master fields
 * - Optional custom section inside the form
 * - Existing Save / Save & New / Reset / Close behavior
 *
 * IMPORTANT:
 * Existing UI styles and component appearance are preserved.
 *
 * IMPORTANT FIX:
 * The form is reset only when the actual default values change,
 * not whenever the parent component re-renders.
 *
 * This prevents custom sections such as the Gunny Bag Bharthi
 * grid from causing the standard form fields to be cleared.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  useForm,
  type FieldValues,
  type Path,
  type DefaultValues,
} from "react-hook-form";
import { Eye, EyeOff, X } from "lucide-react";

/**
 * @description
 * Configuration for a single form field.
 */
export interface FormFieldConfig {
  name: string;
  label: string;
  type: "text" | "password" | "textarea" | "number" | "select";
  required?: boolean;
  readOnly?: boolean;
  options?: {
    label: string;
    value: string | number;
  }[];
}

/**
 * @description
 * Props for the MasterFormModal generic component.
 */
export interface MasterFormModalProps<
  TValues extends FieldValues = FieldValues
> {
  open: boolean;
  title: string;
  fields: FormFieldConfig[];

  /**
   * Default values used when:
   * - Opening Add
   * - Opening Edit
   * - Switching to another record
   * - Save & New creates a new record
   */
  defaultValues?: Partial<TValues>;

  /**
   * Optional custom content rendered after the standard fields
   * and before the footer buttons.
   *
   * Used by Gunny Bag Master for the Bharthi Details grid.
   */
  customSection?: React.ReactNode;

  onClose: () => void;

  onSave: (
    values: TValues,
    resetAfter: boolean
  ) => void | Promise<void>;
}

/**
 * @component MasterFormModal
 * @description
 * Reusable modal form used by master pages to create/edit records.
 *
 * The existing UI has intentionally not been redesigned.
 */
export const MasterFormModal = <
  TValues extends FieldValues = FieldValues
>({
  open,
  title,
  fields,
  defaultValues,
  customSection,
  onClose,
  onSave,
}: MasterFormModalProps<TValues>) => {
  /**
   * React Hook Form
   */
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TValues>({
    defaultValues: defaultValues as DefaultValues<TValues>,
  });

  /**
   * Keep track of the previous default values.
   *
   * We intentionally do NOT depend directly on the
   * defaultValues object because parent components may
   * create a new object on every render.
   *
   * Example:
   *
   * Adding a Bharthi row causes GunnyBagMasterPage to render.
   *
   * Without this protection:
   *
   * render
   * -> new defaultValues object
   * -> useEffect runs
   * -> reset()
   * -> Name / Size / Rate / Opening Stock cleared
   *
   * With this protection:
   *
   * render
   * -> values are unchanged
   * -> no reset
   * -> Bharthi grid can update safely
   */
  const previousDefaultsRef = useRef<string | null>(null);

  /**
   * Create a stable representation of the actual values.
   *
   * This is only used for detecting changes.
   * It does not affect the rendered UI.
   */
  const defaultValuesKey = JSON.stringify(defaultValues ?? {});
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  /**
   * Reset only when the actual default values change.
   *
   * This preserves entered form values when the parent
   * re-renders because of customSection state changes.
   */
  useEffect(() => {
    if (previousDefaultsRef.current !== defaultValuesKey) {
      reset(defaultValues as DefaultValues<TValues>);

      previousDefaultsRef.current = defaultValuesKey;
    }
  }, [defaultValuesKey, reset, defaultValues]);

  /**
   * Save
   */
  const submit = async (values: TValues) => {
    await onSave(values, false);
  };

  /**
   * Save & New
   *
   * The parent remains responsible for creating the
   * next record/default values.
   */
  const submitAndNew = async (values: TValues) => {
    await onSave(values, true);
  };

  /**
   * Reset current form back to the active default values.
   *
   * This keeps the existing Reset behavior.
   */
  const handleReset = () => {
    reset(defaultValues as DefaultValues<TValues>);
  };

  /**
   * Modal is not rendered when closed.
   */
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(submit)}
          className="grid max-h-[70vh] grid-rows-[1fr_auto] gap-3 overflow-y-auto px-4 py-4"
        >
          {/* Standard Fields */}
          <div className="grid gap-3 md:grid-cols-2">
            {fields.map((field) => (
              <div
                key={field.name}
                className="text-xs"
              >
                <label className="mb-1 block text-[11px] font-medium text-slate-700">
                  {field.label}

                  {field.required && (
                    <span className="text-rose-500">
                      {" "}*
                    </span>
                  )}
                </label>

                {/* Textarea */}
                {field.type === "textarea" ? (
                  <textarea
                    rows={3}
                    readOnly={field.readOnly}
                    className={`w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs text-slate-800
                    focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]
                    ${
                      field.readOnly
                        ? "cursor-not-allowed bg-slate-100"
                        : ""
                    }`}
                    {...register(
                      field.name as Path<TValues>,
                      {
                        required: field.required,
                      }
                    )}
                  />
                ) : field.type === "select" ? (
                  /* Select */
                  <select
                    disabled={field.readOnly}
                    className={`w-full rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-800
                    focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]
                    ${
                      field.readOnly
                        ? "cursor-not-allowed bg-slate-100"
                        : ""
                    }`}
                    {...register(
                      field.name as Path<TValues>,
                      {
                        required: field.required,
                      }
                    )}
                  >
                    <option value="">
                      Select {field.label}
                    </option>

                    {field.options?.map((opt) => (
                      <option
                        key={String(opt.value)}
                        value={String(opt.value)}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "password" ? (
                  <div className="relative">
                    <input
                      type={visiblePasswords[field.name] ? "text" : "password"}
                      readOnly={field.readOnly}
                      className={`w-full rounded-full border border-slate-200 px-3 py-2 pr-9 text-xs text-slate-800
                      focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]
                      ${field.readOnly ? "cursor-not-allowed bg-slate-100" : ""}`}
                      {...register(field.name as Path<TValues>, { required: field.required })}
                    />
                    <button
                      type="button"
                      aria-label={visiblePasswords[field.name] ? "Hide password" : "Show password"}
                      onClick={() => setVisiblePasswords((current) => ({
                        ...current,
                        [field.name]: !current[field.name],
                      }))}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {visiblePasswords[field.name] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                ) : (
                  /* Text / Number */
                  <input
                    type={field.type}
                    readOnly={field.readOnly}
                    className={`w-full rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-800
                    focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]
                    ${
                      field.readOnly
                        ? "cursor-not-allowed bg-slate-100"
                        : ""
                    }`}
                    {...register(
                      field.name as Path<TValues>,
                      {
                        required: field.required,
                      }
                    )}
                  />
                )}

                {/* Validation */}
                {errors[
                  field.name as keyof TValues
                ] && (
                  <p className="mt-1 text-[10px] text-rose-500">
                    Required
                  </p>
                )}
              </div>
            ))}
          </div>

          {/*
            Optional Custom Section

            GunnyBagMasterPage will use this for:
            Bharthi Details grid.

            Existing master screens that don't provide
            customSection are completely unaffected.
          */}
          {customSection && (
            <div className="mt-1">
              {customSection}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            {/* Reset */}
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Reset
            </button>

            <div className="flex gap-2">
              {/* Save & New */}
              <button
                type="button"
                onClick={handleSubmit(
                  submitAndNew
                )}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Save &amp; New
              </button>

              {/* Save */}
              <button
                type="submit"
                className="rounded-full bg-[#2E7D32] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#256427]"
              >
                Save
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MasterFormModal;
