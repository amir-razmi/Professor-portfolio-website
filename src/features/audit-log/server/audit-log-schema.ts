import { AuditAction } from "@prisma/client";
import { z } from "zod";

export const auditTargetResources = [
  "AdminUser",
  "BlogPost",
  "BlogCategory",
  "BlogTag",
  "FileAsset",
  "ProfessorProfile",
  "SiteSettings",
  "ResearchItem",
  "Publication",
] as const;

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  action: z.nativeEnum(AuditAction).optional(),
  targetResource: z.enum(auditTargetResources).optional(),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;

export function parseAuditLogQuery(
  input: Record<string, string | string[] | undefined>,
): AuditLogQuery {
  const values = {
    page: input.page,
    action: typeof input.action === "string" ? input.action : undefined,
    targetResource: typeof input.targetResource === "string" ? input.targetResource : undefined,
  };

  const parsed = auditLogQuerySchema.safeParse(values);
  return parsed.success ? parsed.data : auditLogQuerySchema.parse({});
}
