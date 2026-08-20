import { z } from "zod";

const optionalText = (maximumLength: number) =>
  z
    .union([z.string().trim().max(maximumLength), z.null(), z.undefined()])
    .transform((value) => (typeof value === "string" && value.length > 0 ? value : null));

const optionalEmail = z
  .union([z.string().trim().max(254), z.null(), z.undefined()])
  .refine(
    (value) =>
      typeof value !== "string" ||
      value.length === 0 ||
      z.string().email().safeParse(value).success,
    {
      message: "Enter a valid email address.",
    },
  )
  .transform((value) => (typeof value === "string" && value.length > 0 ? value : null));

const optionalHttpUrl = z
  .union([z.string().trim().max(2048), z.null(), z.undefined()])
  .refine(
    (value) => {
      if (typeof value !== "string" || value.length === 0) {
        return true;
      }

      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    {
      message: "Enter a valid HTTP or HTTPS URL.",
    },
  )
  .transform((value) => (typeof value === "string" && value.length > 0 ? value : null));

function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export const siteSettingsSchema = z
  .object({
    siteName: z.string().trim().min(2, "Site name must contain at least 2 characters.").max(120),
    siteDescription: optionalText(500),
    contactEmail: optionalEmail,
    defaultLocale: z
      .string()
      .trim()
      .regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$/, "Use a locale such as en or en-US."),
    timezone: z.string().trim().min(1).max(100).refine(isValidTimezone, {
      message: "Enter a valid IANA timezone such as UTC or America/New_York.",
    }),
    footerText: optionalText(240),
    defaultOgImageUrl: optionalHttpUrl,
    maintenanceMode: z.boolean(),
  })
  .strict();

export type SiteSettingsInput = z.output<typeof siteSettingsSchema>;

export function siteSettingsFormDataToInput(formData: FormData): unknown {
  return {
    siteName: formData.get("siteName"),
    siteDescription: formData.get("siteDescription"),
    contactEmail: formData.get("contactEmail"),
    defaultLocale: formData.get("defaultLocale"),
    timezone: formData.get("timezone"),
    footerText: formData.get("footerText"),
    defaultOgImageUrl: formData.get("defaultOgImageUrl"),
    maintenanceMode: formData.get("maintenanceMode") === "on",
  };
}
