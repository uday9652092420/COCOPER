/**
 * @file LoginPage.tsx
 * @description Beautiful login screen for COCOS with dummy credentials.
 */

import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { Lock, User2 } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

/**
 * @description Login form values.
 */
interface LoginFormValues {
  username: string;
  password: string;
  rememberMe: boolean;
}

/**
 * @component LoginPage
 * @description Login page component with authentication.
 */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      username: "",
      password: "",
      rememberMe: true,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);

    const result = await login(
      values.username,
      values.password
    );

    if (!result.success) {
      setError(
        result.message ||
          "Invalid credentials. Please try again."
      );
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-500 via-emerald-700 to-lime-500 px-4 py-8">
      <div className="grid w-full max-w-4xl items-center gap-8 rounded-3xl bg-white/10 p-4 shadow-2xl backdrop-blur-lg md:grid-cols-2 md:p-8">

        {/* Desktop Branding */}
        <div className="hidden flex-col gap-4 text-white md:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 p-1 shadow-lg">
              <img
                src="/logo.jpg"
                alt="COCOPER Logo"
                className="h-full w-full rounded-xl object-contain"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-wide">
                COCOPER
              </span>

              <span className="text-xs text-emerald-100">
                Coconut Wholesale Management System
              </span>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-emerald-50">
            Manage warehouses, suppliers, customers,
            purchases, sales and dispatches in a single
            modern, lightweight application designed
            exclusively for coconut wholesalers.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-emerald-50">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[11px] font-semibold">
                Real-time Overview
              </p>

              <p className="mt-1 text-[11px]">
                Dashboard cards and charts keep you on top
                of daily purchases and sales.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[11px] font-semibold">
                Smart Transactions
              </p>

              <p className="mt-1 text-[11px]">
                Business rules for customer credit, OT,
                indirect sales and dispatches.
              </p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl bg-white/95 p-5 shadow-xl md:p-7">

          {/* Mobile Branding */}
          <div className="mb-4 flex items-center gap-3 md:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 p-1 text-sm font-bold text-white shadow-lg">
              <img
                src="/logo.jpg"
                alt="COCOPER Logo"
                className="h-full w-full rounded-xl object-contain"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-base font-semibold text-slate-900">
                COCOPER
              </span>

              <span className="text-[11px] text-slate-500">
                Coconut Wholesale Management System
              </span>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-slate-900">
            Welcome back
          </h2>

          <p className="mb-4 mt-1 text-xs text-slate-500">
            Sign in with your administrator credentials.
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* Username */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Username
              </label>

              <div className="relative">
                <User2 className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />

                <input
                  {...register("username", {
                    required: true,
                  })}
                  className="w-full rounded-full border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                  placeholder="Enter username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Password
              </label>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />

                <input
                  {...register("password", {
                    required: true,
                  })}
                  type="password"
                  className="w-full rounded-full border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between text-[11px]">
              <label className="inline-flex items-center gap-1 text-slate-600">
                <input
                  type="checkbox"
                  className="h-3 w-3 rounded border-slate-300"
                  {...register("rememberMe")}
                />

                Remember me
              </label>

              <button
                type="button"
                className="text-[11px] font-medium text-[#2E7D32] hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Error */}
            {error ? (
              <p className="rounded-full bg-rose-50 px-3 py-1 text-[11px] text-rose-600">
                {error}
              </p>
            ) : null}

            {/* Login */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-[#2E7D32] px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-[#256427] disabled:opacity-60"
            >
              {isSubmitting
                ? "Signing in..."
                : "Login"}
            </button>

            {/* Register */}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-[#2E7D32] bg-white px-4 py-2 text-xs font-semibold text-[#2E7D32] transition hover:bg-emerald-50"
            >
              Register Organization
            </button>

            <p className="mt-3 text-[10px] text-slate-400">
              Super admin:{" "}
              <span className="font-medium text-slate-600">
                Uday / Uday123
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;