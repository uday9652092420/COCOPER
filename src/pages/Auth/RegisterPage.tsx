/**
 * @file RegisterPage.tsx
 * @description Organization registration screen for COCOPER ERP.
 */

import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";

import {
  Building2,
  User2,
  Phone,
  Mail,
  Lock,
  MapPin,
  Hash,
  ArrowLeft,
} from "lucide-react";

import {
  registerOrganization,
  type RegisterOrganizationPayload,
} from "../../services/registerservices/register.service";

import {
  INDIAN_STATES,
} from "../../constants/indianStates";

/**
 * Registration form values.
 *
 * These are frontend form fields.
 *
 * NOTE:
 * organizationCode and street are kept here because
 * they already exist in the current UI.
 *
 * organizationCode is NOT sent to backend because
 * backend generates ORG-001, ORG-002, etc.
 *
 * street is also NOT sent because the current backend
 * registration API does not have a street field.
 */
interface RegisterFormValues {
  organizationCode: string;

  organizationName: string;

  organizationRegistrationNo: string;

  contactPersonName: string;

  userId: string;

  password: string;

  confirmPassword: string;

  contactNo: string;

  email: string;

  addressLine1: string;

  addressLine2: string;

  street: string;

  city: string;

  pincode: string;

  state: string;

  country: string;
}

/**
 * @component RegisterPage
 * @description Organization registration page.
 */
const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      organizationCode: "",

      organizationName: "",

      organizationRegistrationNo: "",

      contactPersonName: "",

      userId: "",

      password: "",

      confirmPassword: "",

      contactNo: "",

      email: "",

      addressLine1: "",

      addressLine2: "",

      street: "",

      city: "",

      pincode: "",

      state: "",

      country: "India",
    },
  });

  const password =
    watch("password");

  /**
   * Submit registration.
   *
   * Converts frontend camelCase form values
   * into the exact snake_case payload expected
   * by the backend API.
   */
  const onSubmit = async (
    values: RegisterFormValues
  ) => {
    setError(null);

    setSuccess(null);

    try {
      /**
       * IMPORTANT:
       *
       * Backend expects:
       *
       * organization_name
       * registration_no
       * contact_person_name
       * contact_no
       * email
       * address_line1
       * address_line2
       * city
       * pincode
       * state
       * country
       * username
       * password
       *
       * Do NOT send:
       *
       * organizationCode
       * street
       * confirmPassword
       */
      const payload: RegisterOrganizationPayload = {
        organization_name:
          values.organizationName.trim(),

        registration_no:
          values.organizationRegistrationNo.trim() ||
          undefined,

        contact_person_name:
          values.contactPersonName.trim(),

        contact_no:
          values.contactNo.trim(),

        email:
          values.email.trim().toLowerCase(),

        address_line1:
          values.addressLine1.trim(),

        address_line2:
          values.addressLine2.trim() ||
          undefined,

        city:
          values.city.trim(),

        pincode:
          values.pincode.trim(),

        state:
          values.state.trim(),

        country:
          values.country.trim(),

        username:
          values.userId.trim(),

        password:
          values.password,
      };

      console.log(
        "Organization Registration Payload:",
        payload
      );

      /**
       * Call backend API.
       */
      const result =
        await registerOrganization(
          payload
        );

      console.log(
        "Organization Registration Response:",
        result
      );

      /**
       * Backend success.
       */
      if (result.success) {
        const organizationCode =
          result.organization
            ?.organization_code;

        /**
         * Remember the newly created organization so the
         * Organization Master screen can scope its API calls
         * to the currently logged-in organization.
         */
        if (result.organization?.id) {
          localStorage.setItem(
            "cocoper_org_id",
            result.organization.id
          );
        }

        setSuccess(
          organizationCode
            ? `Organization registered successfully. Organization Code: ${organizationCode}`
            : "Organization registration completed successfully."
        );

        /**
         * Redirect to login after
         * successful registration.
         */
        setTimeout(() => {
          navigate("/login");
        }, 1500);

        return;
      }

      /**
       * Safety fallback.
       */
      setError(
        result.message ||
          "Unable to register organization."
      );
    } catch (error: unknown) {
      console.error(
        "Organization registration error:",
        error
      );

      /**
       * Handle backend validation errors.
       */
      if (
        error &&
        typeof error === "object" &&
        "details" in error
      ) {
        const apiError =
          error as {
            message?: string;

            details?: {
              errors?: Record<
                string,
                string
              >;
            };
          };

        const validationErrors =
          apiError.details?.errors;

        if (
          validationErrors &&
          Object.keys(
            validationErrors
          ).length > 0
        ) {
          const firstError =
            Object.values(
              validationErrors
            )[0];

          setError(
            firstError ||
              "Please check the registration details."
          );

          return;
        }
      }

      /**
       * Handle normal Error.
       */
      if (error instanceof Error) {
        setError(
          error.message
        );

        return;
      }

      setError(
        "Failed to register organization."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-emerald-700 to-lime-500 px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              navigate("/login")
            }
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            <ArrowLeft className="h-3.5 w-3.5" />

            Back to Login
          </button>

          <div className="flex items-center gap-3 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold shadow-lg">
              CO
            </div>

            <div className="hidden flex-col sm:flex">
              <span className="text-sm font-semibold tracking-wide">
                COCOPER
              </span>

              <span className="text-[10px] text-emerald-100">
                Coconut Wholesale Management System
              </span>
            </div>
          </div>
        </div>

        {/* Registration Card */}
        <div className="rounded-3xl bg-white/95 p-5 shadow-2xl backdrop-blur-lg md:p-8">

          {/* Title */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 text-white shadow-lg">
                <Building2 className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Register Your Organization
                </h1>

                <p className="mt-1 text-xs text-slate-500">
                  Create your organization account to get started with COCOPER ERP.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(
              onSubmit
            )}
            className="space-y-6"
          >

            {/* =====================================================
                ORGANIZATION INFORMATION
                ===================================================== */}

            <div>
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#2E7D32]" />

                <h2 className="text-sm font-semibold text-slate-800">
                  Organization Information
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">

                {/* Organization Code */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Organization Code*
                  </label>

                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />

                    <input
                      {...register(
                        "organizationCode"
                      )}
                      readOnly
                      className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                      placeholder="Generated automatically"
                    />
                  </div>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Generated automatically after registration
                  </p>

                  {errors.organizationCode && (
                    <p className="mt-1 text-[10px] text-rose-600">
                      {
                        errors
                          .organizationCode
                          .message
                      }
                    </p>
                  )}
                </div>

                {/* Organization Name */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Organization Name*
                  </label>

                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />

                    <input
                      {...register(
                        "organizationName",
                        {
                          required:
                            "Organization Name is required",
                        }
                      )}
                      className="w-full rounded-full border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                      placeholder="Enter organization name"
                    />
                  </div>

                  {errors.organizationName && (
                    <p className="mt-1 text-[10px] text-rose-600">
                      {
                        errors
                          .organizationName
                          .message
                      }
                    </p>
                  )}
                </div>

                {/* Registration Number */}
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Organization Registration No
                  </label>

                  <input
                    {...register(
                      "organizationRegistrationNo"
                    )}
                    className="w-full rounded-full border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                    placeholder="Enter registration number"
                  />
                </div>
              </div>
            </div>

            {/* =====================================================
                CONTACT & LOGIN INFORMATION
                ===================================================== */}

            <div>
              <div className="mb-3 flex items-center gap-2">
                <User2 className="h-4 w-4 text-[#2E7D32]" />

                <h2 className="text-sm font-semibold text-slate-800">
                  Contact & Login Information
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">

                {/* Contact Person Name */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Contact Person Name*
                  </label>

                  <div className="relative">
                    <User2 className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />

                    <input
                      {...register(
                        "contactPersonName",
                        {
                          required:
                            "Contact Person Name is required",
                        }
                      )}
                      className="w-full rounded-full border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                      placeholder="Enter contact person name"
                    />
                  </div>

                  {errors.contactPersonName && (
                    <p className="mt-1 text-[10px] text-rose-600">
                      {
                        errors
                          .contactPersonName
                          .message
                      }
                    </p>
                  )}
                </div>

                {/* User ID */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    User ID*
                  </label>

                  <div className="relative">
                    <User2 className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />

                    <input
                      {...register(
                        "userId",
                        {
                          required:
                            "User ID is required",
                        }
                      )}
                      className="w-full rounded-full border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                      placeholder="Create login user ID"
                    />
                  </div>

                  {errors.userId && (
                    <p className="mt-1 text-[10px] text-rose-600">
                      {
                        errors.userId
                          .message
                      }
                    </p>
                  )}
                </div>

                {/* Contact Number */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Contact No*
                  </label>

                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />

                    <input
                      {...register(
                        "contactNo",
                        {
                          required:
                            "Contact No is required",

                          pattern: {
                            value:
                              /^[0-9]{10}$/,

                            message:
                              "Enter a valid 10 digit mobile number",
                          },
                        }
                      )}
                      type="tel"
                      maxLength={10}
                      className="w-full rounded-full border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                      placeholder="Enter 10 digit contact number"
                    />
                  </div>

                  {errors.contactNo && (
                    <p className="mt-1 text-[10px] text-rose-600">
                      {
                        errors
                          .contactNo
                          .message
                      }
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Organization Email*
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />

                    <input
                      {...register(
                        "email",
                        {
                          required:
                            "Organization Email is required",

                          pattern: {
                            value:
                              /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

                            message:
                              "Enter a valid email address",
                          },
                        }
                      )}
                      type="email"
                      className="w-full rounded-full border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                      placeholder="Enter organization email"
                    />
                  </div>

                  {errors.email && (
                    <p className="mt-1 text-[10px] text-rose-600">
                      {
                        errors.email
                          .message
                      }
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Password*
                  </label>

                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />

                    <input
                      {...register(
                        "password",
                        {
                          required:
                            "Password is required",

                          minLength: {
                            value: 6,

                            message:
                              "Password must be at least 6 characters",
                          },
                        }
                      )}
                      type="password"
                      className="w-full rounded-full border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                      placeholder="Create password"
                    />
                  </div>

                  {errors.password && (
                    <p className="mt-1 text-[10px] text-rose-600">
                      {
                        errors
                          .password
                          .message
                      }
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Confirm Password*
                  </label>

                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />

                    <input
                      {...register(
                        "confirmPassword",
                        {
                          required:
                            "Please confirm your password",

                          validate: (
                            value
                          ) =>
                            value ===
                              password ||
                            "Passwords do not match",
                        }
                      )}
                      type="password"
                      className="w-full rounded-full border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                      placeholder="Confirm password"
                    />
                  </div>

                  {errors.confirmPassword && (
                    <p className="mt-1 text-[10px] text-rose-600">
                      {
                        errors
                          .confirmPassword
                          .message
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* =====================================================
                ORGANIZATION ADDRESS
                ===================================================== */}

            <div>
              <div className="mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#2E7D32]" />

                <h2 className="text-sm font-semibold text-slate-800">
                  Organization Address
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">

                {/* Address Line 1 */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Address Line 1*
                  </label>

                  <input
                    {...register(
                      "addressLine1",
                      {
                        required:
                          "Address Line 1 is required",
                      }
                    )}
                    className="w-full rounded-full border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                    placeholder="Enter address line 1"
                  />

                  {errors.addressLine1 && (
                    <p className="mt-1 text-[10px] text-rose-600">
                      {
                        errors
                          .addressLine1
                          .message
                      }
                    </p>
                  )}
                </div>

                {/* Address Line 2 */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Address Line 2
                  </label>

                  <input
                    {...register(
                      "addressLine2"
                    )}
                    className="w-full rounded-full border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                    placeholder="Apartment, building, landmark etc."
                  />
                </div>

                {/* Street */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Street*
                  </label>

                  <input
                    {...register("street")}
                    className="w-full rounded-full border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                    placeholder="Enter street"
                  />

                  <p className="mt-1 text-[10px] text-slate-400">
                    Used for address details; not sent as a separate API field.
                  </p>

                  {errors.street && (
                    <p className="mt-1 text-[10px] text-rose-600">
                      {
                        errors.street
                          .message
                      }
                    </p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    City*
                  </label>

                  <input
                    {...register(
                      "city",
                      {
                        required:
                          "City is required",
                      }
                    )}
                    className="w-full rounded-full border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                    placeholder="Enter city"
                  />

                  {errors.city && (
                    <p className="mt-1 text-[10px] text-rose-600">
                      {
                        errors.city
                          .message
                      }
                    </p>
                  )}
                </div>

                {/* Pincode */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Pincode*
                  </label>

                  <input
                    {...register(
                      "pincode",
                      {
                        required:
                          "Pincode is required",

                        pattern: {
                          value:
                            /^[0-9]{6}$/,

                          message:
                            "Enter a valid 6 digit pincode",
                        },
                      }
                    )}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full rounded-full border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                    placeholder="Enter 6 digit pincode"
                  />

                  {errors.pincode && (
                    <p className="mt-1 text-[10px] text-rose-600">
                      {
                        errors
                          .pincode
                          .message
                      }
                    </p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    State*
                  </label>

                  <select
                    {...register(
                      "state",
                      {
                        required:
                          "State is required",
                      }
                    )}
                    className="w-full rounded-full border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                  >
                    <option value="">
                      Select State
                    </option>

                    {INDIAN_STATES.map((state) => (
                      <option
                        key={state}
                        value={state}
                      >
                        {state}
                      </option>
                    ))}
                  </select>

                  {errors.state && (
                    <p className="mt-1 text-[10px] text-rose-600">
                      {
                        errors.state
                          .message
                      }
                    </p>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Country*
                  </label>

                  <input
                    {...register(
                      "country",
                      {
                        required:
                          "Country is required",
                      }
                    )}
                    className="w-full rounded-full border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                    placeholder="Enter country"
                  />

                  {errors.country && (
                    <p className="mt-1 text-[10px] text-rose-600">
                      {
                        errors
                          .country
                          .message
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-full bg-rose-50 px-4 py-2 text-[11px] text-rose-600">
                {error}
              </p>
            )}

            {/* Success */}
            {success && (
              <p className="rounded-full bg-emerald-50 px-4 py-2 text-[11px] text-emerald-700">
                {success}
              </p>
            )}

            {/* Submit */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-[#2E7D32] px-4 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-[#256427] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Registering..."
                  : "Register Organization"}
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/login")
                }
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>

            <p className="text-center text-[10px] text-slate-400">
              Already have an organization account?{" "}

              <button
                type="button"
                onClick={() =>
                  navigate("/login")
                }
                className="font-medium text-[#2E7D32] hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;