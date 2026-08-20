import { assertPermission } from "@/server/auth/access-control";
import { Permission, type AuthorizationPrincipal } from "@/server/auth/permissions";
import { ContentValidationError } from "@/server/content/content-errors";

import { professorProfileSchema, type ProfessorProfileInput } from "../profile-schema";

export type ProfessorProfileRecord = ProfessorProfileInput & {
  id: string;
  updatedAt: Date;
};

export type ProfessorProfileRepository = {
  findDefault: () => Promise<ProfessorProfileRecord | null>;
  findPublishedDefault: () => Promise<ProfessorProfileRecord | null>;
  saveDefault: (input: ProfessorProfileInput, actorId: string) => Promise<ProfessorProfileRecord>;
};

export async function getProfessorProfileForActor(
  actor: AuthorizationPrincipal | null,
  repository: ProfessorProfileRepository,
): Promise<ProfessorProfileRecord | null> {
  assertPermission(actor, Permission.MANAGE_PROFESSOR_PROFILE);
  return repository.findDefault();
}

export async function updateProfessorProfileForActor(
  actor: AuthorizationPrincipal | null,
  input: unknown,
  repository: ProfessorProfileRepository,
): Promise<ProfessorProfileRecord> {
  const authorizedActor = assertPermission(actor, Permission.MANAGE_PROFESSOR_PROFILE);
  const parsed = professorProfileSchema.safeParse(input);

  if (!parsed.success) {
    throw new ContentValidationError(
      "Review the highlighted profile fields.",
      parsed.error.flatten().fieldErrors,
    );
  }

  return repository.saveDefault(parsed.data, authorizedActor.id);
}
