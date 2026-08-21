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

import type { SiteSettingsInput } from "../settings-schema";
import { updateSiteSettingsAction, type SiteSettingsActionState } from "../server/actions";

const initialState: SiteSettingsActionState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

type SettingsFormProps = Readonly<{
  settings: SiteSettingsInput | null;
}>;

export function SettingsForm({ settings }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateSiteSettingsAction, initialState);
  const error = (field: keyof SiteSettingsInput) => state.fieldErrors[field];

  return (
    <form action={formAction} className="space-y-6">
      <FormStatusMessage message={state.message} status={state.status} />

      <FormSection
        title="هویت سایت"
        description="این مقادیر هویت سایت عمومی و توضیح پیش‌فرض آن را تعیین می‌کنند."
      >
        <FormField>
          <FormLabel htmlFor="siteName">نام سایت</FormLabel>
          <input
            id="siteName"
            name="siteName"
            type="text"
            required
            maxLength={120}
            defaultValue={settings?.siteName ?? ""}
            aria-invalid={Boolean(error("siteName")?.length)}
            aria-describedby={error("siteName")?.length ? "siteName-error" : undefined}
            className={formControlClassName}
          />
          <FormFieldError id="siteName-error" errors={error("siteName")} />
        </FormField>

        <FormField>
          <FormLabel htmlFor="contactEmail">ایمیل تماس عمومی</FormLabel>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            inputMode="email"
            maxLength={254}
            defaultValue={settings?.contactEmail ?? ""}
            aria-invalid={Boolean(error("contactEmail")?.length)}
            aria-describedby={error("contactEmail")?.length ? "contactEmail-error" : undefined}
            className={formControlClassName}
          />
          <FormFieldError id="contactEmail-error" errors={error("contactEmail")} />
        </FormField>

        <FormField className="sm:col-span-2">
          <FormLabel htmlFor="siteDescription">توضیح سایت</FormLabel>
          <textarea
            id="siteDescription"
            name="siteDescription"
            rows={4}
            maxLength={500}
            defaultValue={settings?.siteDescription ?? ""}
            aria-invalid={Boolean(error("siteDescription")?.length)}
            aria-describedby={
              error("siteDescription")?.length ? "siteDescription-error" : undefined
            }
            className={formControlClassName}
          />
          <FormFieldError id="siteDescription-error" errors={error("siteDescription")} />
        </FormField>

        <FormField className="sm:col-span-2">
          <FormLabel htmlFor="footerText">متن پابرگ</FormLabel>
          <input
            id="footerText"
            name="footerText"
            type="text"
            maxLength={240}
            defaultValue={settings?.footerText ?? ""}
            aria-invalid={Boolean(error("footerText")?.length)}
            aria-describedby={error("footerText")?.length ? "footerText-error" : undefined}
            className={formControlClassName}
          />
          <FormFieldError id="footerText-error" errors={error("footerText")} />
        </FormField>
      </FormSection>

      <FormSection
        title="تنظیمات منطقه‌ای"
        description="زبان و منطقه زمانی، نمایش یکدست تاریخ‌ها و اعداد را در بخش‌های مختلف فراهم می‌کنند."
      >
        <FormField>
          <FormLabel htmlFor="defaultLocale">زبان پیش‌فرض</FormLabel>
          <FormHint id="defaultLocale-hint">نمونه: fa یا fa-IR.</FormHint>
          <input
            id="defaultLocale"
            name="defaultLocale"
            type="text"
            required
            maxLength={16}
            defaultValue={settings?.defaultLocale ?? "en"}
            aria-invalid={Boolean(error("defaultLocale")?.length)}
            aria-describedby={`defaultLocale-hint${
              error("defaultLocale")?.length ? " defaultLocale-error" : ""
            }`}
            className={formControlClassName}
          />
          <FormFieldError id="defaultLocale-error" errors={error("defaultLocale")} />
        </FormField>

        <FormField>
          <FormLabel htmlFor="timezone">منطقه زمانی</FormLabel>
          <FormHint id="timezone-hint">یک منطقه زمانی IANA مانند Asia/Tehran وارد کنید.</FormHint>
          <input
            id="timezone"
            name="timezone"
            type="text"
            required
            maxLength={100}
            defaultValue={settings?.timezone ?? "UTC"}
            aria-invalid={Boolean(error("timezone")?.length)}
            aria-describedby={`timezone-hint${error("timezone")?.length ? " timezone-error" : ""}`}
            className={formControlClassName}
          />
          <FormFieldError id="timezone-error" errors={error("timezone")} />
        </FormField>
      </FormSection>

      <FormSection
        title="تصویر اشتراک‌گذاری"
        description="تا زمان اتصال انتخاب دارایی فایل به این تنظیم، از نشانی تصویر استفاده کنید."
      >
        <FormField className="sm:col-span-2">
          <FormLabel htmlFor="defaultOgImageUrl">نشانی تصویر پیش‌فرض اشتراک‌گذاری</FormLabel>
          <FormHint id="defaultOgImageUrl-hint">
            This field stores only a URL; it does not upload or copy the image.
          </FormHint>
          <input
            id="defaultOgImageUrl"
            name="defaultOgImageUrl"
            type="url"
            inputMode="url"
            maxLength={2048}
            placeholder="https://example.edu/social-card.jpg"
            defaultValue={settings?.defaultOgImageUrl ?? ""}
            aria-invalid={Boolean(error("defaultOgImageUrl")?.length)}
            aria-describedby={`defaultOgImageUrl-hint${
              error("defaultOgImageUrl")?.length ? " defaultOgImageUrl-error" : ""
            }`}
            className={formControlClassName}
          />
          <FormFieldError id="defaultOgImageUrl-error" errors={error("defaultOgImageUrl")} />
        </FormField>
      </FormSection>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            name="maintenanceMode"
            type="checkbox"
            defaultChecked={settings?.maintenanceMode ?? false}
            className="mt-0.5 size-4 rounded border-slate-300 text-accent focus:ring-accent"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-950">پیام تعمیر و نگهداری</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Show a concise maintenance notice on the public website.
            </span>
          </span>
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "در حال ذخیره تنظیمات…" : "ذخیره تنظیمات"}
        </button>
      </div>
    </form>
  );
}
