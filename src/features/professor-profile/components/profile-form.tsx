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
import { cn } from "@/lib/cn";

import type { ProfessorProfileInput } from "../profile-schema";
import { updateProfessorProfileAction, type ProfessorProfileActionState } from "../server/actions";

const initialState: ProfessorProfileActionState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

type ProfileFormProps = Readonly<{
  profile: ProfessorProfileInput | null;
}>;

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfessorProfileAction, initialState);
  const error = (field: keyof ProfessorProfileInput) => state.fieldErrors[field];
  const describedBy = (field: keyof ProfessorProfileInput, hasHint = false) => {
    const ids = [
      hasHint ? `${field}-hint` : null,
      error(field)?.length ? `${field}-error` : null,
    ].filter(Boolean);

    return ids.length ? ids.join(" ") : undefined;
  };

  return (
    <form action={formAction} className="space-y-6">
      <FormStatusMessage message={state.message} status={state.status} />

      <FormSection
        title="Academic identity"
        description="The primary identity and affiliation shown at the top of the public portfolio."
      >
        <FormField>
          <FormLabel htmlFor="fullName">Name</FormLabel>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            maxLength={120}
            autoComplete="name"
            defaultValue={profile?.fullName ?? ""}
            aria-invalid={Boolean(error("fullName")?.length)}
            aria-describedby={describedBy("fullName")}
            className={formControlClassName}
          />
          <FormFieldError id="fullName-error" errors={error("fullName")} />
        </FormField>

        <FormField>
          <FormLabel htmlFor="title">Academic title</FormLabel>
          <input
            id="title"
            name="title"
            type="text"
            maxLength={160}
            defaultValue={profile?.title ?? ""}
            aria-invalid={Boolean(error("title")?.length)}
            aria-describedby={describedBy("title")}
            className={formControlClassName}
          />
          <FormFieldError id="title-error" errors={error("title")} />
        </FormField>

        <FormField>
          <FormLabel htmlFor="department">Department</FormLabel>
          <input
            id="department"
            name="department"
            type="text"
            maxLength={160}
            defaultValue={profile?.department ?? ""}
            aria-invalid={Boolean(error("department")?.length)}
            aria-describedby={describedBy("department")}
            className={formControlClassName}
          />
          <FormFieldError id="department-error" errors={error("department")} />
        </FormField>

        <FormField>
          <FormLabel htmlFor="institution">University</FormLabel>
          <input
            id="institution"
            name="institution"
            type="text"
            maxLength={160}
            defaultValue={profile?.institution ?? ""}
            aria-invalid={Boolean(error("institution")?.length)}
            aria-describedby={describedBy("institution")}
            className={formControlClassName}
          />
          <FormFieldError id="institution-error" errors={error("institution")} />
        </FormField>

        <FormField className="sm:col-span-2">
          <FormLabel htmlFor="profileImageUrl">Profile image URL</FormLabel>
          <FormHint id="profileImageUrl-hint">
            Use an HTTP or HTTPS image URL. File uploads will be added in a later stage.
          </FormHint>
          <input
            id="profileImageUrl"
            name="profileImageUrl"
            type="url"
            inputMode="url"
            maxLength={2048}
            placeholder="https://example.edu/profile.jpg"
            defaultValue={profile?.profileImageUrl ?? ""}
            aria-invalid={Boolean(error("profileImageUrl")?.length)}
            aria-describedby={describedBy("profileImageUrl", true)}
            className={formControlClassName}
          />
          <FormFieldError id="profileImageUrl-error" errors={error("profileImageUrl")} />
        </FormField>
      </FormSection>

      <FormSection
        title="Biography"
        description="Use the short biography for introductions and the full biography for the public about section."
      >
        <FormField className="sm:col-span-2">
          <FormLabel htmlFor="shortBio">Short biography</FormLabel>
          <textarea
            id="shortBio"
            name="shortBio"
            rows={3}
            maxLength={600}
            defaultValue={profile?.shortBio ?? ""}
            aria-invalid={Boolean(error("shortBio")?.length)}
            aria-describedby={describedBy("shortBio")}
            className={formControlClassName}
          />
          <FormFieldError id="shortBio-error" errors={error("shortBio")} />
        </FormField>

        <FormField className="sm:col-span-2">
          <FormLabel htmlFor="biography">Biography</FormLabel>
          <textarea
            id="biography"
            name="biography"
            rows={9}
            maxLength={20_000}
            defaultValue={profile?.biography ?? ""}
            aria-invalid={Boolean(error("biography")?.length)}
            aria-describedby={describedBy("biography")}
            className={formControlClassName}
          />
          <FormFieldError id="biography-error" errors={error("biography")} />
        </FormField>
      </FormSection>

      <FormSection
        title="Academic background"
        description="Enter one item per line. Blank lines are ignored and duplicate entries are removed."
      >
        <ListField
          name="education"
          label="Education"
          rows={6}
          value={profile?.education}
          errors={error("education")}
        />
        <ListField
          name="academicPositions"
          label="Academic positions"
          rows={6}
          value={profile?.academicPositions}
          errors={error("academicPositions")}
        />
        <ListField
          name="experience"
          label="Experience"
          rows={6}
          value={profile?.experience}
          errors={error("experience")}
        />
        <ListField
          name="awards"
          label="Awards"
          rows={6}
          value={profile?.awards}
          errors={error("awards")}
        />
      </FormSection>

      <FormSection
        title="Academic interests"
        description="These concise lists help visitors quickly understand current research and teaching areas."
      >
        <ListField
          name="researchInterests"
          label="Research interests"
          rows={7}
          value={profile?.researchInterests}
          errors={error("researchInterests")}
        />
        <ListField
          name="teachingInterests"
          label="Teaching interests"
          rows={7}
          value={profile?.teachingInterests}
          errors={error("teachingInterests")}
        />
      </FormSection>

      <FormSection
        title="Contact information"
        description="Professional contact details published in the contact section."
      >
        <FormField>
          <FormLabel htmlFor="email">Email address</FormLabel>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            maxLength={254}
            autoComplete="email"
            defaultValue={profile?.email ?? ""}
            aria-invalid={Boolean(error("email")?.length)}
            aria-describedby={describedBy("email")}
            className={formControlClassName}
          />
          <FormFieldError id="email-error" errors={error("email")} />
        </FormField>

        <FormField>
          <FormLabel htmlFor="phone">Phone</FormLabel>
          <input
            id="phone"
            name="phone"
            type="tel"
            maxLength={80}
            autoComplete="tel"
            defaultValue={profile?.phone ?? ""}
            aria-invalid={Boolean(error("phone")?.length)}
            aria-describedby={describedBy("phone")}
            className={formControlClassName}
          />
          <FormFieldError id="phone-error" errors={error("phone")} />
        </FormField>

        <FormField className="sm:col-span-2">
          <FormLabel htmlFor="office">Office</FormLabel>
          <input
            id="office"
            name="office"
            type="text"
            maxLength={240}
            autoComplete="street-address"
            defaultValue={profile?.office ?? ""}
            aria-invalid={Boolean(error("office")?.length)}
            aria-describedby={describedBy("office")}
            className={formControlClassName}
          />
          <FormFieldError id="office-error" errors={error("office")} />
        </FormField>
      </FormSection>

      <FormSection
        title="Academic and social links"
        description="Only validated HTTP or HTTPS links are accepted."
      >
        <UrlField
          name="websiteUrl"
          label="Personal or university website"
          value={profile?.websiteUrl}
          errors={error("websiteUrl")}
        />
        <UrlField name="orcid" label="ORCID URL" value={profile?.orcid} errors={error("orcid")} />
        <UrlField
          name="googleScholarUrl"
          label="Google Scholar URL"
          value={profile?.googleScholarUrl}
          errors={error("googleScholarUrl")}
        />
        <UrlField
          name="researchGateUrl"
          label="ResearchGate URL"
          value={profile?.researchGateUrl}
          errors={error("researchGateUrl")}
        />
        <UrlField
          name="linkedinUrl"
          label="LinkedIn URL"
          value={profile?.linkedinUrl}
          errors={error("linkedinUrl")}
        />
        <UrlField
          name="githubUrl"
          label="GitHub URL"
          value={profile?.githubUrl}
          errors={error("githubUrl")}
        />
      </FormSection>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            name="isPublished"
            type="checkbox"
            defaultChecked={profile?.isPublished ?? false}
            className="mt-0.5 size-4 rounded border-slate-300 text-accent focus:ring-accent"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-950">Publish this profile</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Unpublished profiles remain available only in administration.
            </span>
          </span>
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving profile…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}

function ListField({
  errors,
  label,
  name,
  rows,
  value,
}: Readonly<{
  errors?: string[];
  label: string;
  name: keyof ProfessorProfileInput;
  rows: number;
  value?: string[];
}>) {
  return (
    <FormField>
      <FormLabel htmlFor={name}>{label}</FormLabel>
      <FormHint id={`${name}-hint`}>One entry per line, up to 40 entries.</FormHint>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={value?.join("\n") ?? ""}
        aria-invalid={Boolean(errors?.length)}
        aria-describedby={`${name}-hint${errors?.length ? ` ${name}-error` : ""}`}
        className={formControlClassName}
      />
      <FormFieldError id={`${name}-error`} errors={errors} />
    </FormField>
  );
}

function UrlField({
  errors,
  label,
  name,
  value,
}: Readonly<{
  errors?: string[];
  label: string;
  name: keyof ProfessorProfileInput;
  value: string | null | undefined;
}>) {
  return (
    <FormField>
      <FormLabel htmlFor={name}>{label}</FormLabel>
      <input
        id={name}
        name={name}
        type="url"
        inputMode="url"
        maxLength={2048}
        defaultValue={value ?? ""}
        aria-invalid={Boolean(errors?.length)}
        aria-describedby={errors?.length ? `${name}-error` : undefined}
        className={cn(formControlClassName)}
      />
      <FormFieldError id={`${name}-error`} errors={errors} />
    </FormField>
  );
}
