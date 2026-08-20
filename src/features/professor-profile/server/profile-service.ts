import "server-only";

import type { AuthorizationPrincipal } from "@/server/auth/permissions";

import {
  getProfessorProfileForActor,
  updateProfessorProfileForActor,
  type ProfessorProfileRecord,
} from "./profile-policy";
import { professorProfileRepository } from "./profile-repository";

export function getProfessorProfileForAdmin(
  actor: AuthorizationPrincipal,
): Promise<ProfessorProfileRecord | null> {
  return getProfessorProfileForActor(actor, professorProfileRepository);
}

export function updateProfessorProfileAs(
  actor: AuthorizationPrincipal,
  input: unknown,
): Promise<ProfessorProfileRecord> {
  return updateProfessorProfileForActor(actor, input, professorProfileRepository);
}

export function getPublishedProfessorProfile(): Promise<ProfessorProfileRecord | null> {
  return professorProfileRepository.findPublishedDefault();
}

export type { ProfessorProfileRecord };
