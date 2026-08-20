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

const lineList = z
  .union([z.string().max(20_000), z.array(z.string())])
  .transform((value) => {
    const entries = Array.isArray(value) ? value : value.split(/\r?\n/);

    return [...new Set(entries.map((entry) => entry.trim()).filter(Boolean))];
  })
  .pipe(z.array(z.string().min(1).max(500)).max(40));

export const professorProfileSchema = z
  .object({
    fullName: z.string().trim().min(2, "Name must contain at least 2 characters.").max(120),
    title: optionalText(160),
    department: optionalText(160),
    institution: optionalText(160),
    shortBio: optionalText(600),
    biography: optionalText(20_000),
    education: lineList,
    academicPositions: lineList,
    researchInterests: lineList,
    teachingInterests: lineList,
    awards: lineList,
    experience: lineList,
    email: optionalEmail,
    office: optionalText(240),
    phone: optionalText(80),
    websiteUrl: optionalHttpUrl,
    orcid: optionalHttpUrl,
    googleScholarUrl: optionalHttpUrl,
    researchGateUrl: optionalHttpUrl,
    linkedinUrl: optionalHttpUrl,
    githubUrl: optionalHttpUrl,
    profileImageUrl: optionalHttpUrl,
    isPublished: z.boolean(),
  })
  .strict();

export type ProfessorProfileInput = z.output<typeof professorProfileSchema>;

export function professorProfileFormDataToInput(formData: FormData): unknown {
  return {
    fullName: formData.get("fullName"),
    title: formData.get("title"),
    department: formData.get("department"),
    institution: formData.get("institution"),
    shortBio: formData.get("shortBio"),
    biography: formData.get("biography"),
    education: formData.get("education"),
    academicPositions: formData.get("academicPositions"),
    researchInterests: formData.get("researchInterests"),
    teachingInterests: formData.get("teachingInterests"),
    awards: formData.get("awards"),
    experience: formData.get("experience"),
    email: formData.get("email"),
    office: formData.get("office"),
    phone: formData.get("phone"),
    websiteUrl: formData.get("websiteUrl"),
    orcid: formData.get("orcid"),
    googleScholarUrl: formData.get("googleScholarUrl"),
    researchGateUrl: formData.get("researchGateUrl"),
    linkedinUrl: formData.get("linkedinUrl"),
    githubUrl: formData.get("githubUrl"),
    profileImageUrl: formData.get("profileImageUrl"),
    isPublished: formData.get("isPublished") === "on",
  };
}
