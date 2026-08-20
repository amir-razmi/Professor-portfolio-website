import "server-only";

import { AuditAction, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { ProfessorProfileRecord, ProfessorProfileRepository } from "./profile-policy";

const profileSelect = {
  id: true,
  fullName: true,
  title: true,
  department: true,
  institution: true,
  shortBio: true,
  biography: true,
  education: true,
  academicPositions: true,
  researchInterests: true,
  teachingInterests: true,
  awards: true,
  experience: true,
  email: true,
  office: true,
  phone: true,
  websiteUrl: true,
  orcid: true,
  googleScholarUrl: true,
  researchGateUrl: true,
  linkedinUrl: true,
  githubUrl: true,
  profileImageUrl: true,
  isPublished: true,
  updatedAt: true,
} satisfies Prisma.ProfessorProfileSelect;

export const professorProfileRepository: ProfessorProfileRepository = {
  findDefault() {
    return prisma.professorProfile.findUnique({
      where: { key: "default" },
      select: profileSelect,
    }) as Promise<ProfessorProfileRecord | null>;
  },
  findPublishedDefault() {
    return prisma.professorProfile.findFirst({
      where: {
        key: "default",
        isPublished: true,
      },
      select: profileSelect,
    }) as Promise<ProfessorProfileRecord | null>;
  },
  saveDefault(input, actorId) {
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.professorProfile.findUnique({
        where: { key: "default" },
        select: { id: true },
      });
      const profile = await transaction.professorProfile.upsert({
        where: { key: "default" },
        update: {
          ...input,
          updatedById: actorId,
        },
        create: {
          key: "default",
          ...input,
          createdById: actorId,
          updatedById: actorId,
        },
        select: profileSelect,
      });

      await transaction.auditLog.create({
        data: {
          action: existing ? AuditAction.UPDATE : AuditAction.CREATE,
          targetResource: "ProfessorProfile",
          targetId: profile.id,
          summary: existing
            ? "Professor profile content updated."
            : "Professor profile content created.",
          actorId,
        },
      });

      return profile;
    }) as Promise<ProfessorProfileRecord>;
  },
};
