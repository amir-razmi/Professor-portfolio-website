import "dotenv/config";

import {
  AdminAccountStatus,
  AdminRole,
  AuditAction,
  BlogPostStatus,
  ContentVisibility,
  FileVisibility,
  PublicationType,
  PrismaClient,
  ResearchItemStatus,
} from "@prisma/client";

import { hashPassword } from "../src/server/auth/password";

const prisma = new PrismaClient();
const seedTimestamp = new Date("2026-01-01T00:00:00.000Z");

function isLikelyDevelopmentDatabase(connectionString: string) {
  try {
    const url = new URL(connectionString);
    const databaseName = decodeURIComponent(url.pathname.replace(/^\/+/, "")).split("/")[0];
    const developmentName = /(?:^|[-_])(dev|development|test)(?:[-_]|$)/i.test(databaseName);

    return developmentName;
  } catch {
    return false;
  }
}

function assertSafeSeedEnvironment() {
  const connectionString = process.env.DATABASE_URL;

  if (
    process.env.NODE_ENV === "production" ||
    process.env.DATABASE_ENV !== "development" ||
    process.env.SEED_DATABASE_CONFIRMATION !== "YES" ||
    !connectionString ||
    !isLikelyDevelopmentDatabase(connectionString)
  ) {
    throw new Error(
      "Refusing to seed. Use a development/test-named MongoDB database and run with DATABASE_ENV=development and SEED_DATABASE_CONFIRMATION=YES.",
    );
  }
}

async function main() {
  assertSafeSeedEnvironment();

  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: "admin@example.test" },
    select: { passwordHash: true },
  });

  const passwordHash =
    existingAdmin?.passwordHash ?? (await hashPassword(requireSeedAdminPassword()));

  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@example.test" },
    update: {
      displayName: "Development Admin",
      role: AdminRole.SUPER_ADMIN,
      status: AdminAccountStatus.ACTIVE,
      isActive: true,
      passwordHash,
      updatedAt: seedTimestamp,
    },
    create: {
      email: "admin@example.test",
      displayName: "Development Admin",
      role: AdminRole.SUPER_ADMIN,
      status: AdminAccountStatus.ACTIVE,
      isActive: true,
      passwordHash,
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    },
  });

  const fileAsset = await prisma.fileAsset.upsert({
    where: { storageKey: "seed/academic-portfolio-placeholder.txt" },
    update: {
      originalName: "academic-portfolio-placeholder.txt",
      mimeType: "text/plain",
      sizeBytes: BigInt(0),
      visibility: FileVisibility.PUBLIC,
      uploadedById: admin.id,
      updatedById: admin.id,
      updatedAt: seedTimestamp,
    },
    create: {
      storageKey: "seed/academic-portfolio-placeholder.txt",
      originalName: "academic-portfolio-placeholder.txt",
      mimeType: "text/plain",
      sizeBytes: BigInt(0),
      visibility: FileVisibility.PUBLIC,
      uploadedById: admin.id,
      createdById: admin.id,
      updatedById: admin.id,
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    },
  });

  await prisma.professorProfile.upsert({
    where: { key: "default" },
    update: {
      fullName: "Dr. Development Example",
      title: "Professor of Example Studies",
      department: "Example Department",
      institution: "Development University",
      shortBio: "Development-only profile content for local setup.",
      biography:
        "Replace this development profile with real content through a future administration workflow.",
      education: ["PhD in Example Studies — Development University"],
      academicPositions: ["Professor — Development University"],
      researchInterests: ["Example research methods", "Academic communication"],
      teachingInterests: ["Research design", "Scholarly writing"],
      awards: ["Development Academic Award"],
      experience: ["Development-only academic experience entry"],
      email: "professor@example.test",
      office: "Development Building, Room 101",
      phone: "+1 555 0100",
      websiteUrl: "https://example.test",
      orcid: "https://orcid.org/0000-0000-0000-0000",
      googleScholarUrl: "https://scholar.google.com",
      linkedinUrl: "https://www.linkedin.com",
      profileImageAssetId: fileAsset.id,
      isPublished: true,
      updatedById: admin.id,
      updatedAt: seedTimestamp,
    },
    create: {
      key: "default",
      fullName: "Dr. Development Example",
      title: "Professor of Example Studies",
      department: "Example Department",
      institution: "Development University",
      shortBio: "Development-only profile content for local setup.",
      biography:
        "Replace this development profile with real content through a future administration workflow.",
      education: ["PhD in Example Studies — Development University"],
      academicPositions: ["Professor — Development University"],
      researchInterests: ["Example research methods", "Academic communication"],
      teachingInterests: ["Research design", "Scholarly writing"],
      awards: ["Development Academic Award"],
      experience: ["Development-only academic experience entry"],
      email: "professor@example.test",
      office: "Development Building, Room 101",
      phone: "+1 555 0100",
      websiteUrl: "https://example.test",
      orcid: "https://orcid.org/0000-0000-0000-0000",
      googleScholarUrl: "https://scholar.google.com",
      linkedinUrl: "https://www.linkedin.com",
      profileImageAssetId: fileAsset.id,
      isPublished: true,
      createdById: admin.id,
      updatedById: admin.id,
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    },
  });

  await prisma.siteSettings.upsert({
    where: { key: "default" },
    update: {
      siteName: "Academic Portfolio",
      siteDescription: "Development settings for the academic portfolio.",
      contactEmail: "contact@example.test",
      defaultLocale: "en",
      timezone: "UTC",
      maintenanceMode: false,
      footerText: "Development academic portfolio.",
      defaultOgImageId: fileAsset.id,
      updatedById: admin.id,
      updatedAt: seedTimestamp,
    },
    create: {
      key: "default",
      siteName: "Academic Portfolio",
      siteDescription: "Development settings for the academic portfolio.",
      contactEmail: "contact@example.test",
      defaultLocale: "en",
      timezone: "UTC",
      maintenanceMode: false,
      footerText: "Development academic portfolio.",
      defaultOgImageId: fileAsset.id,
      createdById: admin.id,
      updatedById: admin.id,
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    },
  });

  const category = await prisma.blogCategory.upsert({
    where: { slug: "research" },
    update: {
      name: "Research",
      description: "Development category for research updates.",
      isActive: true,
      updatedById: admin.id,
      updatedAt: seedTimestamp,
    },
    create: {
      name: "Research",
      slug: "research",
      description: "Development category for research updates.",
      isActive: true,
      postIds: [],
      createdById: admin.id,
      updatedById: admin.id,
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    },
  });

  const tag = await prisma.blogTag.upsert({
    where: { slug: "foundation" },
    update: {
      name: "Foundation",
      isActive: true,
      updatedById: admin.id,
      updatedAt: seedTimestamp,
    },
    create: {
      name: "Foundation",
      slug: "foundation",
      isActive: true,
      postIds: [],
      createdById: admin.id,
      updatedById: admin.id,
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    },
  });

  const blogPost = await prisma.blogPost.upsert({
    where: { slug: "development-foundation" },
    update: {
      title: "Development Foundation",
      excerpt: "A development-only post used to verify the initial data layer.",
      content: "This content is intentionally fake and should be replaced before production use.",
      status: BlogPostStatus.PUBLISHED,
      publishedAt: seedTimestamp,
      isFeatured: true,
      authorId: admin.id,
      categoryIds: [category.id],
      tagIds: [tag.id],
      coverAssetId: fileAsset.id,
      updatedById: admin.id,
      updatedAt: seedTimestamp,
    },
    create: {
      title: "Development Foundation",
      slug: "development-foundation",
      excerpt: "A development-only post used to verify the initial data layer.",
      content: "This content is intentionally fake and should be replaced before production use.",
      status: BlogPostStatus.PUBLISHED,
      publishedAt: seedTimestamp,
      isFeatured: true,
      authorId: admin.id,
      categoryIds: [category.id],
      tagIds: [tag.id],
      coverAssetId: fileAsset.id,
      createdById: admin.id,
      updatedById: admin.id,
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    },
  });

  await prisma.blogCategory.update({
    where: { id: category.id },
    data: { postIds: [blogPost.id], updatedAt: seedTimestamp },
  });

  await prisma.blogTag.update({
    where: { id: tag.id },
    data: { postIds: [blogPost.id], updatedAt: seedTimestamp },
  });

  const researchItem = await prisma.researchItem.upsert({
    where: { slug: "development-research-item" },
    update: {
      title: "Development Research Item",
      summary: "A development-only research record.",
      description: "Replace this record with a real research project in a future content workflow.",
      externalUrl: "https://example.test/research",
      status: ResearchItemStatus.ACTIVE,
      visibility: ContentVisibility.PUBLIC,
      sortOrder: 10,
      isPublished: true,
      publishedAt: seedTimestamp,
      updatedById: admin.id,
      updatedAt: seedTimestamp,
    },
    create: {
      title: "Development Research Item",
      slug: "development-research-item",
      summary: "A development-only research record.",
      description: "Replace this record with a real research project in a future content workflow.",
      externalUrl: "https://example.test/research",
      status: ResearchItemStatus.ACTIVE,
      visibility: ContentVisibility.PUBLIC,
      sortOrder: 10,
      isPublished: true,
      publishedAt: seedTimestamp,
      createdById: admin.id,
      updatedById: admin.id,
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    },
  });

  await prisma.publication.upsert({
    where: { slug: "development-publication" },
    update: {
      title: "Development Publication",
      citation: "Example, D. (2026). Development publication.",
      abstract: "A development-only publication record.",
      authors: ["Dr. Development Example"],
      venue: "Development Journal",
      publicationType: PublicationType.JOURNAL_ARTICLE,
      doi: "10.0000/development-publication",
      url: "https://example.test/publication",
      pdfUrl: "https://example.test/publication.pdf",
      publicationDate: seedTimestamp,
      isPublished: true,
      publishedAt: seedTimestamp,
      isFeatured: true,
      researchItemId: researchItem.id,
      updatedById: admin.id,
      updatedAt: seedTimestamp,
    },
    create: {
      title: "Development Publication",
      slug: "development-publication",
      citation: "Example, D. (2026). Development publication.",
      abstract: "A development-only publication record.",
      authors: ["Dr. Development Example"],
      venue: "Development Journal",
      publicationType: PublicationType.JOURNAL_ARTICLE,
      doi: "10.0000/development-publication",
      url: "https://example.test/publication",
      pdfUrl: "https://example.test/publication.pdf",
      publicationDate: seedTimestamp,
      isPublished: true,
      publishedAt: seedTimestamp,
      isFeatured: true,
      researchItemId: researchItem.id,
      createdById: admin.id,
      updatedById: admin.id,
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    },
  });

  const existingAuditLog = await prisma.auditLog.findFirst({
    where: {
      action: AuditAction.CREATE,
      targetResource: "seed",
      targetId: "foundation",
      requestId: "development-seed-v1",
    },
  });

  if (!existingAuditLog) {
    await prisma.auditLog.create({
      data: {
        action: AuditAction.CREATE,
        targetResource: "seed",
        targetId: "foundation",
        summary: "Development data layer seed initialized.",
        actorId: admin.id,
        requestId: "development-seed-v1",
        createdAt: seedTimestamp,
      },
    });
  }

  console.log("Development seed completed.");
}

function requireSeedAdminPassword() {
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!password) {
    throw new Error(
      "Refusing to seed. Set ADMIN_SEED_PASSWORD for the first development administrator seed.",
    );
  }

  return password;
}

main()
  .catch((error: unknown) => {
    if (error instanceof Error && error.message.startsWith("Refusing to seed.")) {
      console.error(error.message);
    } else {
      console.error("Development seed failed.");
      console.error(error);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
