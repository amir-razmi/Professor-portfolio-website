import assert from "node:assert/strict";
import test from "node:test";

import { AdminRole } from "@prisma/client";

import { ContentValidationError } from "../../src/server/content/content-errors";
import {
  professorProfileSchema,
  type ProfessorProfileInput,
} from "../../src/features/professor-profile/profile-schema";
import {
  updateProfessorProfileForActor,
  type ProfessorProfileRepository,
} from "../../src/features/professor-profile/server/profile-policy";
import {
  siteSettingsSchema,
  type SiteSettingsInput,
} from "../../src/features/site-settings/settings-schema";
import {
  updateSiteSettingsForActor,
  type SiteSettingsRepository,
} from "../../src/features/site-settings/server/settings-policy";
import { ForbiddenError } from "../../src/server/auth/authorization-error";

const admin = {
  id: "507f1f77bcf86cd799439011",
  role: AdminRole.ADMIN,
};
const editor = {
  id: "507f1f77bcf86cd799439012",
  role: AdminRole.EDITOR,
};

function validProfileInput(): ProfessorProfileInput {
  return professorProfileSchema.parse({
    fullName: "Dr. Example Scholar",
    title: "Professor of Example Studies",
    department: "Example Department",
    institution: "Example University",
    shortBio: "A short public biography.",
    biography: "A longer public biography.",
    education: ["PhD — Example University"],
    academicPositions: ["Professor — Example University"],
    researchInterests: ["Research methods"],
    teachingInterests: ["Academic writing"],
    awards: ["Example award"],
    experience: ["Example experience"],
    email: "professor@example.test",
    office: "Building 1",
    phone: "+1 555 0100",
    websiteUrl: "https://example.test",
    orcid: "https://orcid.org/0000-0000-0000-0000",
    googleScholarUrl: null,
    researchGateUrl: null,
    linkedinUrl: null,
    githubUrl: null,
    profileImageUrl: null,
    isPublished: true,
  });
}

function validSettingsInput(): SiteSettingsInput {
  return siteSettingsSchema.parse({
    siteName: "Example Academic Portfolio",
    siteDescription: "A public academic site.",
    contactEmail: "contact@example.test",
    defaultLocale: "en-US",
    timezone: "UTC",
    footerText: "Example footer.",
    defaultOgImageUrl: "https://example.test/social-card.jpg",
    maintenanceMode: false,
  });
}

test("profile schema normalizes lists and optional blank fields", () => {
  const parsed = professorProfileSchema.parse({
    ...validProfileInput(),
    title: "  ",
    education: "PhD — Example University\n\nPhD — Example University",
    websiteUrl: "",
  });

  assert.deepEqual(parsed.education, ["PhD — Example University"]);
  assert.equal(parsed.title, null);
  assert.equal(parsed.websiteUrl, null);
});

test("ADMIN can update profile content through the policy service", async () => {
  const input = validProfileInput();
  const savedValues: { value: ProfessorProfileInput | null } = { value: null };
  const repository: ProfessorProfileRepository = {
    findDefault: async () => null,
    findPublishedDefault: async () => null,
    saveDefault: async (nextInput, actorId) => {
      savedValues.value = nextInput;
      return { ...nextInput, id: actorId, updatedAt: new Date() };
    },
  };

  const result = await updateProfessorProfileForActor(admin, input, repository);

  assert.equal(result.fullName, input.fullName);
  const saved = savedValues.value;
  assert.ok(saved);
  assert.equal(saved.isPublished, true);
});

test("EDITOR cannot update profile content and no repository write occurs", async () => {
  let saveCalls = 0;
  const repository: ProfessorProfileRepository = {
    findDefault: async () => null,
    findPublishedDefault: async () => null,
    saveDefault: async (input, actorId) => {
      saveCalls += 1;
      return { ...input, id: actorId, updatedAt: new Date() };
    },
  };

  await assert.rejects(
    () => updateProfessorProfileForActor(editor, validProfileInput(), repository),
    ForbiddenError,
  );
  assert.equal(saveCalls, 0);
});

test("invalid profile input is rejected before persistence", async () => {
  let saveCalls = 0;
  const repository: ProfessorProfileRepository = {
    findDefault: async () => null,
    findPublishedDefault: async () => null,
    saveDefault: async (input, actorId) => {
      saveCalls += 1;
      return { ...input, id: actorId, updatedAt: new Date() };
    },
  };

  await assert.rejects(
    () =>
      updateProfessorProfileForActor(
        admin,
        { ...validProfileInput(), fullName: "x", websiteUrl: "javascript:alert(1)" },
        repository,
      ),
    ContentValidationError,
  );
  assert.equal(saveCalls, 0);
});

test("ADMIN can update site settings through the policy service", async () => {
  const input = validSettingsInput();
  const savedValues: { value: SiteSettingsInput | null } = { value: null };
  const repository: SiteSettingsRepository = {
    findDefault: async () => null,
    saveDefault: async (nextInput, actorId) => {
      savedValues.value = nextInput;
      return { ...nextInput, id: actorId, updatedAt: new Date() };
    },
  };

  const result = await updateSiteSettingsForActor(admin, input, repository);

  assert.equal(result.siteName, input.siteName);
  const saved = savedValues.value;
  assert.ok(saved);
  assert.equal(saved.timezone, "UTC");
});

test("EDITOR cannot update site settings", async () => {
  let saveCalls = 0;
  const repository: SiteSettingsRepository = {
    findDefault: async () => null,
    saveDefault: async (input, actorId) => {
      saveCalls += 1;
      return { ...input, id: actorId, updatedAt: new Date() };
    },
  };

  await assert.rejects(
    () => updateSiteSettingsForActor(editor, validSettingsInput(), repository),
    ForbiddenError,
  );
  assert.equal(saveCalls, 0);
});

test("invalid site settings are rejected server-side", async () => {
  const repository: SiteSettingsRepository = {
    findDefault: async () => null,
    saveDefault: async (input, actorId) => ({ ...input, id: actorId, updatedAt: new Date() }),
  };

  await assert.rejects(
    () =>
      updateSiteSettingsForActor(
        admin,
        { ...validSettingsInput(), timezone: "Not/A_Timezone" },
        repository,
      ),
    ContentValidationError,
  );
});
