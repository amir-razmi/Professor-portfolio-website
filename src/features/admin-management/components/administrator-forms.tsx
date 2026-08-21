"use client";

import { useActionState } from "react";

import {
  FormField,
  FormFieldError,
  FormHint,
  FormLabel,
  FormSection,
  FormStatusMessage,
  formControlClassName,
} from "@/components/forms/form-controls";
import { changeAdminRoleAction, type ChangeAdminRoleActionState } from "@/server/admin/actions";
import {
  createAdministratorAction,
  resetAdministratorPasswordAction,
  setAdministratorStatusAction,
  updateAdministratorDetailsAction,
} from "@/server/admin/management-actions";
import type { AdministratorRecord } from "@/server/admin/admin-management-policy";

import {
  ADMIN_ACCOUNT_STATUS,
  ADMIN_ACCOUNT_STATUS_LABELS,
  ADMIN_ROLE,
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_OPTIONS,
  ADMIN_STATUS_OPTIONS,
  type AdminAccountStatusValue,
  type AdminRoleValue,
} from "../admin-ui";
import {
  initialAdminManagementActionState,
  type AdminManagementActionState,
} from "../admin-action-state";

function fieldErrors(state: AdminManagementActionState, field: string): string[] | undefined {
  return state.fieldErrors[field];
}

function AdminStatusBadge({
  status,
  isActive,
}: Readonly<{
  status: AdminAccountStatusValue;
  isActive: boolean;
}>) {
  const tone = isActive ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {ADMIN_ACCOUNT_STATUS_LABELS[status]}
    </span>
  );
}

export function AdministratorCreateForm() {
  const [state, formAction, isPending] = useActionState(
    createAdministratorAction,
    initialAdminManagementActionState,
  );

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <FormStatusMessage message={state.message} status={state.status} />

      {state.status === "success" && state.adminId ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          حساب آماده است. صفحه مدیریت آن را از فهرست مدیران باز کنید.
        </p>
      ) : null}

      <FormSection
        title="جزئیات حساب"
        description="از نشانی ایمیل دانشگاهی و نامی قابل تشخیص استفاده کنید. گذرواژه پیش از ذخیره در پایگاه داده به‌صورت امن درهم‌سازی می‌شود."
      >
        <FormField>
          <FormLabel htmlFor="admin-display-name">نام نمایشی</FormLabel>
          <input
            id="admin-display-name"
            name="displayName"
            type="text"
            required
            maxLength={120}
            autoComplete="name"
            className={formControlClassName}
            aria-invalid={Boolean(fieldErrors(state, "displayName")?.length)}
          />
          <FormFieldError
            id="admin-display-name-error"
            errors={fieldErrors(state, "displayName")}
          />
        </FormField>

        <FormField>
          <FormLabel htmlFor="admin-email">نشانی ایمیل</FormLabel>
          <input
            id="admin-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            className={formControlClassName}
            aria-invalid={Boolean(fieldErrors(state, "email")?.length)}
          />
          <FormFieldError id="admin-email-error" errors={fieldErrors(state, "email")} />
        </FormField>

        <FormField>
          <FormLabel htmlFor="admin-role">نقش</FormLabel>
          <select
            id="admin-role"
            name="role"
            defaultValue={ADMIN_ROLE.EDITOR}
            className={formControlClassName}
            aria-invalid={Boolean(fieldErrors(state, "role")?.length)}
          >
            {ADMIN_ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {ADMIN_ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <FormFieldError id="admin-role-error" errors={fieldErrors(state, "role")} />
        </FormField>

        <FormField>
          <FormLabel htmlFor="admin-status">وضعیت اولیه حساب</FormLabel>
          <select
            id="admin-status"
            name="status"
            defaultValue={ADMIN_ACCOUNT_STATUS.ACTIVE}
            className={formControlClassName}
            aria-invalid={Boolean(fieldErrors(state, "status")?.length)}
          >
            {ADMIN_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {ADMIN_ACCOUNT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <FormHint id="admin-status-hint">
            فقط حساب فعال می‌تواند وارد شود؛ وضعیت‌های دیگر حساب را غیرفعال نگه می‌دارند.
          </FormHint>
          <FormFieldError id="admin-status-error" errors={fieldErrors(state, "status")} />
        </FormField>
      </FormSection>

      <FormSection
        title="گذرواژه اولیه"
        description="حداقل ۱۲ نویسه استفاده کنید و گذرواژه موقت را از یک کانال امن دانشگاهی به اشتراک بگذارید."
      >
        <FormField>
          <FormLabel htmlFor="admin-password">گذرواژه</FormLabel>
          <input
            id="admin-password"
            name="password"
            type="password"
            required
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            className={formControlClassName}
            aria-invalid={Boolean(fieldErrors(state, "password")?.length)}
          />
          <FormFieldError id="admin-password-error" errors={fieldErrors(state, "password")} />
        </FormField>

        <FormField>
          <FormLabel htmlFor="admin-password-confirmation">تکرار گذرواژه</FormLabel>
          <input
            id="admin-password-confirmation"
            name="passwordConfirmation"
            type="password"
            required
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            className={formControlClassName}
            aria-invalid={Boolean(fieldErrors(state, "passwordConfirmation")?.length)}
          />
          <FormFieldError
            id="admin-password-confirmation-error"
            errors={fieldErrors(state, "passwordConfirmation")}
          />
        </FormField>
      </FormSection>

      <button
        type="submit"
        disabled={isPending}
        className="min-h-11 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "در حال ایجاد حساب…" : "ایجاد مدیر"}
      </button>
    </form>
  );
}

export function AdministratorDetailsForm({
  administrator,
}: Readonly<{
  administrator: AdministratorRecord;
}>) {
  const [state, formAction, isPending] = useActionState(
    updateAdministratorDetailsAction,
    initialAdminManagementActionState,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="targetAdminId" value={administrator.id} />
      <FormStatusMessage message={state.message} status={state.status} />
      <FormField>
        <FormLabel htmlFor="edit-admin-display-name">نام نمایشی</FormLabel>
        <input
          id="edit-admin-display-name"
          name="displayName"
          type="text"
          required
          maxLength={120}
          defaultValue={administrator.displayName}
          autoComplete="name"
          className={formControlClassName}
          aria-invalid={Boolean(fieldErrors(state, "displayName")?.length)}
        />
        <FormFieldError
          id="edit-admin-display-name-error"
          errors={fieldErrors(state, "displayName")}
        />
      </FormField>
      <FormField>
        <FormLabel htmlFor="edit-admin-email">نشانی ایمیل</FormLabel>
        <input
          id="edit-admin-email"
          name="email"
          type="email"
          required
          maxLength={254}
          defaultValue={administrator.email}
          autoComplete="email"
          className={formControlClassName}
          aria-invalid={Boolean(fieldErrors(state, "email")?.length)}
        />
        <FormFieldError id="edit-admin-email-error" errors={fieldErrors(state, "email")} />
      </FormField>
      <button
        type="submit"
        disabled={isPending}
        className="min-h-10 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "در حال ذخیره…" : "ذخیره جزئیات"}
      </button>
    </form>
  );
}

export function AdministratorRoleForm({
  administrator,
}: Readonly<{
  administrator: AdministratorRecord;
}>) {
  const initialState: ChangeAdminRoleActionState = {
    ok: false,
    code: "INITIAL",
    message: "",
  };
  const [state, formAction, isPending] = useActionState(changeAdminRoleAction, initialState);

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={(event) => {
        const nextRole = new FormData(event.currentTarget).get("role");

        if (typeof nextRole === "string" && nextRole !== administrator.role) {
          const confirmed = window.confirm(
            `Change this administrator's role to ${ADMIN_ROLE_LABELS[nextRole as AdminRoleValue]}?`,
          );

          if (!confirmed) {
            event.preventDefault();
          }
        }
      }}
    >
      <input type="hidden" name="targetAdminId" value={administrator.id} />
      <div>
        <label htmlFor="edit-admin-role" className="block text-sm font-semibold text-slate-900">
          نقش
        </label>
        <select
          id="edit-admin-role"
          name="role"
          defaultValue={administrator.role}
          className={formControlClassName}
        >
          {ADMIN_ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {ADMIN_ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>
      {state.ok ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          نقش ذخیره شد.
        </p>
      ) : state.message ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="min-h-10 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "در حال ذخیره…" : "ذخیره نقش"}
      </button>
    </form>
  );
}

export function AdministratorStatusActions({
  administrator,
  currentAdminId,
  isLastActiveSuperAdmin = false,
}: Readonly<{
  administrator: AdministratorRecord;
  currentAdminId: string;
  isLastActiveSuperAdmin?: boolean;
}>) {
  const [state, formAction, isPending] = useActionState(
    setAdministratorStatusAction,
    initialAdminManagementActionState,
  );
  const canDeactivate =
    administrator.isActive && administrator.id !== currentAdminId && !isLastActiveSuperAdmin;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <AdminStatusBadge status={administrator.status} isActive={administrator.isActive} />
        {administrator.id === currentAdminId ? (
          <span className="text-xs text-slate-500">این حساب شماست.</span>
        ) : null}
      </div>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (canDeactivate && !window.confirm("آیا از غیرفعال‌کردن این حساب مدیر مطمئن هستید؟")) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="targetAdminId" value={administrator.id} />
        <input
          type="hidden"
          name="status"
          value={
            administrator.isActive ? ADMIN_ACCOUNT_STATUS.DISABLED : ADMIN_ACCOUNT_STATUS.ACTIVE
          }
        />
        <button
          type="submit"
          disabled={isPending || (!canDeactivate && administrator.isActive)}
          className={
            administrator.isActive
              ? "min-h-10 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              : "min-h-10 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          }
        >
          {isPending
            ? "در حال ذخیره…"
            : administrator.isActive
              ? "غیرفعال‌کردن حساب"
              : "فعال‌کردن دوباره حساب"}
        </button>
      </form>
      <FormStatusMessage message={state.message} status={state.status} />
      {isLastActiveSuperAdmin ? (
        <p className="text-xs leading-5 text-slate-500">
          این حساب آخرین مدیر ارشد فعال است و نمی‌توان آن را غیرفعال کرد.
        </p>
      ) : null}
    </div>
  );
}

export function AdministratorPasswordResetForm({
  administrator,
}: Readonly<{
  administrator: AdministratorRecord;
}>) {
  const [state, formAction, isPending] = useActionState(
    resetAdministratorPasswordAction,
    initialAdminManagementActionState,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="targetAdminId" value={administrator.id} />
      <FormStatusMessage message={state.message} status={state.status} />
      <FormField>
        <FormLabel htmlFor="reset-admin-password">گذرواژه جدید</FormLabel>
        <FormHint id="reset-admin-password-hint">
          حداقل ۱۲ نویسه؛ گذرواژه فعلی هرگز نمایش داده نمی‌شود.
        </FormHint>
        <input
          id="reset-admin-password"
          name="password"
          type="password"
          required
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          className={formControlClassName}
          aria-invalid={Boolean(fieldErrors(state, "password")?.length)}
          aria-describedby="reset-admin-password-hint"
        />
        <FormFieldError id="reset-admin-password-error" errors={fieldErrors(state, "password")} />
      </FormField>
      <FormField>
        <FormLabel htmlFor="reset-admin-password-confirmation">تکرار گذرواژه جدید</FormLabel>
        <input
          id="reset-admin-password-confirmation"
          name="passwordConfirmation"
          type="password"
          required
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          className={formControlClassName}
          aria-invalid={Boolean(fieldErrors(state, "passwordConfirmation")?.length)}
        />
        <FormFieldError
          id="reset-admin-password-confirmation-error"
          errors={fieldErrors(state, "passwordConfirmation")}
        />
      </FormField>
      <button
        type="submit"
        disabled={isPending}
        className="min-h-10 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "در حال بازنشانی…" : "بازنشانی گذرواژه"}
      </button>
    </form>
  );
}

export { AdminStatusBadge };
