import "dotenv/config";

import {
  AdminAccountStatus,
  AdminRole,
  AuditAction,
  BlogPostStatus,
  ContentVisibility,
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
      displayName: "مدیر توسعه",
      role: AdminRole.SUPER_ADMIN,
      status: AdminAccountStatus.ACTIVE,
      isActive: true,
      passwordHash,
      updatedAt: seedTimestamp,
    },
    create: {
      email: "admin@example.test",
      displayName: "مدیر توسعه",
      role: AdminRole.SUPER_ADMIN,
      status: AdminAccountStatus.ACTIVE,
      isActive: true,
      passwordHash,
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    },
  });

  // Remove the placeholder asset created by the pre-storage seed. It never had a
  // corresponding binary and is safe to remove because the seed is development-only.
  await prisma.fileAsset.deleteMany({
    where: { storageKey: "seed/academic-portfolio-placeholder.txt" },
  });

  await prisma.professorProfile.upsert({
    where: { key: "default" },
    update: {
      fullName: "دکتر نمونه توسعه",
      title: "استاد مطالعات نمونه",
      department: "گروه مطالعات نمونه",
      institution: "دانشگاه توسعه",
      shortBio: "محتوای نمونه فارسی برای راه‌اندازی محلی.",
      biography:
        "این پروفایل نمونه را پیش از استفاده واقعی از طریق محیط مدیریت با محتوای اصلی جایگزین کنید.",
      education: ["دکتری مطالعات نمونه — دانشگاه توسعه"],
      academicPositions: ["استاد — دانشگاه توسعه"],
      researchInterests: ["روش‌های پژوهش نمونه", "ارتباطات دانشگاهی"],
      teachingInterests: ["طراحی پژوهش", "نگارش علمی"],
      awards: ["جایزه دانشگاهی توسعه"],
      experience: ["سابقه دانشگاهی نمونه برای توسعه"],
      email: "professor@example.test",
      office: "ساختمان توسعه، اتاق ۱۰۱",
      phone: "+1 555 0100",
      websiteUrl: "https://example.test",
      orcid: "https://orcid.org/0000-0000-0000-0000",
      googleScholarUrl: "https://scholar.google.com",
      linkedinUrl: "https://www.linkedin.com",
      profileImageAssetId: null,
      isPublished: true,
      updatedById: admin.id,
      updatedAt: seedTimestamp,
    },
    create: {
      key: "default",
      fullName: "دکتر نمونه توسعه",
      title: "استاد مطالعات نمونه",
      department: "گروه مطالعات نمونه",
      institution: "دانشگاه توسعه",
      shortBio: "محتوای نمونه فارسی برای راه‌اندازی محلی.",
      biography:
        "این پروفایل نمونه را پیش از استفاده واقعی از طریق محیط مدیریت با محتوای اصلی جایگزین کنید.",
      education: ["دکتری مطالعات نمونه — دانشگاه توسعه"],
      academicPositions: ["استاد — دانشگاه توسعه"],
      researchInterests: ["روش‌های پژوهش نمونه", "ارتباطات دانشگاهی"],
      teachingInterests: ["طراحی پژوهش", "نگارش علمی"],
      awards: ["جایزه دانشگاهی توسعه"],
      experience: ["سابقه دانشگاهی نمونه برای توسعه"],
      email: "professor@example.test",
      office: "ساختمان توسعه، اتاق ۱۰۱",
      phone: "+1 555 0100",
      websiteUrl: "https://example.test",
      orcid: "https://orcid.org/0000-0000-0000-0000",
      googleScholarUrl: "https://scholar.google.com",
      linkedinUrl: "https://www.linkedin.com",
      profileImageAssetId: null,
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
      siteName: "پرتفولیوی دانشگاهی",
      siteDescription: "تنظیمات نمونه فارسی برای پرتفولیوی دانشگاهی.",
      contactEmail: "contact@example.test",
      defaultLocale: "fa-IR",
      timezone: "Asia/Tehran",
      maintenanceMode: false,
      footerText: "پرتفولیوی دانشگاهی نمونه.",
      defaultOgImageId: null,
      updatedById: admin.id,
      updatedAt: seedTimestamp,
    },
    create: {
      key: "default",
      siteName: "پرتفولیوی دانشگاهی",
      siteDescription: "تنظیمات نمونه فارسی برای پرتفولیوی دانشگاهی.",
      contactEmail: "contact@example.test",
      defaultLocale: "fa-IR",
      timezone: "Asia/Tehran",
      maintenanceMode: false,
      footerText: "پرتفولیوی دانشگاهی نمونه.",
      defaultOgImageId: null,
      createdById: admin.id,
      updatedById: admin.id,
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    },
  });

  const category = await prisma.blogCategory.upsert({
    where: { slug: "research" },
    update: {
      name: "پژوهش",
      description: "دسته‌بندی نمونه برای تازه‌های پژوهش.",
      isActive: true,
      updatedById: admin.id,
      updatedAt: seedTimestamp,
    },
    create: {
      name: "پژوهش",
      slug: "research",
      description: "دسته‌بندی نمونه برای تازه‌های پژوهش.",
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
      name: "مبانی",
      isActive: true,
      updatedById: admin.id,
      updatedAt: seedTimestamp,
    },
    create: {
      name: "مبانی",
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
      title: "مبانی توسعه",
      excerpt: "یادداشت نمونه برای بررسی لایه داده اولیه.",
      content: "این متن عمداً نمونه است و باید پیش از استفاده واقعی جایگزین شود.",
      status: BlogPostStatus.PUBLISHED,
      publishedAt: seedTimestamp,
      isFeatured: true,
      authorId: admin.id,
      categoryIds: [category.id],
      tagIds: [tag.id],
      coverAssetId: null,
      updatedById: admin.id,
      updatedAt: seedTimestamp,
    },
    create: {
      title: "مبانی توسعه",
      slug: "development-foundation",
      excerpt: "یادداشت نمونه برای بررسی لایه داده اولیه.",
      content: "این متن عمداً نمونه است و باید پیش از استفاده واقعی جایگزین شود.",
      status: BlogPostStatus.PUBLISHED,
      publishedAt: seedTimestamp,
      isFeatured: true,
      authorId: admin.id,
      categoryIds: [category.id],
      tagIds: [tag.id],
      coverAssetId: null,
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
      title: "پروژه پژوهشی توسعه",
      summary: "رکورد پژوهشی نمونه برای راه‌اندازی محلی.",
      description: "این رکورد را پیش از استفاده واقعی با یک پروژه پژوهشی معتبر جایگزین کنید.",
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
      title: "پروژه پژوهشی توسعه",
      slug: "development-research-item",
      summary: "رکورد پژوهشی نمونه برای راه‌اندازی محلی.",
      description: "این رکورد را پیش از استفاده واقعی با یک پروژه پژوهشی معتبر جایگزین کنید.",
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
      title: "انتشار نمونه توسعه",
      citation: "نمونه، د. (۲۰۲۶). انتشار نمونه توسعه.",
      abstract: "سابقه انتشار نمونه برای توسعه.",
      authors: ["دکتر نمونه توسعه"],
      venue: "نشریه توسعه",
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
      title: "انتشار نمونه توسعه",
      slug: "development-publication",
      citation: "نمونه، د. (۲۰۲۶). انتشار نمونه توسعه.",
      abstract: "سابقه انتشار نمونه برای توسعه.",
      authors: ["دکتر نمونه توسعه"],
      venue: "نشریه توسعه",
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
        summary: "داده‌های نمونه فارسی با موفقیت ایجاد شدند.",
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
