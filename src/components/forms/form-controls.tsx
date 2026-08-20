import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export const formControlClassName =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100";

export function FormField({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return <div className={cn(className)}>{children}</div>;
}

export function FormLabel({
  children,
  htmlFor,
}: Readonly<{
  children: ReactNode;
  htmlFor: string;
}>) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-900">
      {children}
    </label>
  );
}

export function FormHint({
  children,
  id,
}: Readonly<{
  children: ReactNode;
  id: string;
}>) {
  return (
    <p id={id} className="mt-1.5 text-xs leading-5 text-slate-500">
      {children}
    </p>
  );
}

export function FormFieldError({
  errors,
  id,
}: Readonly<{
  errors?: string[];
  id: string;
}>) {
  if (!errors?.length) {
    return null;
  }

  return (
    <p id={id} className="mt-1.5 text-sm text-red-700">
      {errors[0]}
    </p>
  );
}

export function FormSection({
  children,
  description,
  title,
}: Readonly<{
  children: ReactNode;
  description: string;
  title: string;
}>) {
  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <legend className="px-1 text-base font-semibold text-slate-950">{title}</legend>
      <p className="mb-5 text-sm leading-6 text-slate-600">{description}</p>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function FormStatusMessage({
  message,
  status,
}: Readonly<{
  message: string | null;
  status: "idle" | "success" | "error";
}>) {
  if (!message || status === "idle") {
    return null;
  }

  return (
    <p
      role={status === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        status === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800",
      )}
    >
      {message}
    </p>
  );
}
