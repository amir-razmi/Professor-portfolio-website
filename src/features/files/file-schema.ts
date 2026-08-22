import { createHash, randomUUID } from "node:crypto";
import path from "node:path";

import { FileCategory, FileVisibility } from "@prisma/client";
import { z } from "zod";

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const allowedCategoryValues = [
  FileCategory.PROFILE_IMAGE,
  FileCategory.PUBLICATION_PDF,
  FileCategory.BLOG_ASSET,
  FileCategory.DOCUMENT,
  FileCategory.OTHER,
] as const;

const allowedVisibilityValues = [
  FileVisibility.PUBLIC,
  FileVisibility.PASSWORD_PROTECTED,
  FileVisibility.PRIVATE,
] as const;

export const fileCategorySchema = z.enum(allowedCategoryValues);
export const fileVisibilitySchema = z.enum(allowedVisibilityValues);
export const filePasswordSchema = z
  .string()
  .trim()
  .min(12, "گذرواژه فایل باید حداقل ۱۲ کاراکتر داشته باشد.")
  .max(128, "گذرواژه فایل باید حداکثر ۱۲۸ کاراکتر داشته باشد.");
export const fileUnlockSchema = z
  .object({
    password: filePasswordSchema,
  })
  .strict();

const optionalPasswordSchema = z
  .union([filePasswordSchema, z.literal(""), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" && value ? value : undefined));

const booleanFormValueSchema = z
  .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("on"), z.literal("")])
  .transform((value) => value === true || value === "true" || value === "on");

export const fileMetadataSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, "نام نمایشی را وارد کنید.")
      .max(120, "حداکثر ۱۲۰ کاراکتر وارد کنید."),
    category: fileCategorySchema,
    description: z
      .union([z.string().trim().max(500), z.null(), z.undefined()])
      .transform((value) => (typeof value === "string" && value ? value : null)),
    visibility: fileVisibilitySchema,
    password: optionalPasswordSchema,
    clearPassword: booleanFormValueSchema.optional().default(false),
  })
  .strict();

export type FileMetadataInput = z.output<typeof fileMetadataSchema>;
export type FileMetadataPersistenceInput = Omit<FileMetadataInput, "password" | "clearPassword">;

export type StoredPasswordState = {
  passwordHash: string | null;
  passwordVersion: string | null;
};

export function parseFileMetadataInput(input: unknown): FileMetadataInput {
  const parsed = fileMetadataSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("فیلدهای متادیتا فایل را بررسی کنید.");
  }

  return parsed.data;
}

export function fileMetadataFormDataToInput(formData: FormData): unknown {
  return {
    displayName: formData.get("displayName"),
    category: formData.get("category"),
    description: formData.get("description"),
    visibility: formData.get("visibility"),
    password: formData.get("password"),
    clearPassword: formData.get("clearPassword") ?? undefined,
  };
}

const executableExtensions = new Set([
  "apk",
  "app",
  "bat",
  "bin",
  "cgi",
  "cmd",
  "com",
  "cpl",
  "dll",
  "dmg",
  "exe",
  "jar",
  "js",
  "mjs",
  "cjs",
  "msi",
  "php",
  "ps1",
  "py",
  "rb",
  "sh",
  "so",
  "wasm",
]);

const mimeExtensions: Record<string, readonly string[]> = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "text/plain": ["txt"],
};

const safeFileTypeSet = new Set(Object.keys(mimeExtensions));

export function isSafeFileType(fileType: string): boolean {
  return safeFileTypeSet.has(fileType);
}

function normalizedExtension(filename: string): string {
  return path.extname(filename).slice(1).toLowerCase();
}

export function sanitizeOriginalFilename(filename: string): string {
  if (filename.includes("/") || filename.includes("\\") || filename.includes("\0")) {
    throw new Error("استفاده از جداکننده‌های مسیر در نام فایل مجاز نیست.");
  }

  const basename = path.basename(filename.replaceAll("\\", "/"));
  const normalized = basename.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, "");
  const safe = normalized
    .replace(/[^\p{L}\p{N}._ -]+/gu, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+$/, "");

  if (!safe || safe === "." || safe === "..") {
    throw new Error("نام فایل بارگذاری‌شده ایمن نیست.");
  }

  const extension = normalizedExtension(safe);

  if (!extension || executableExtensions.has(extension) || extension.length > 10) {
    throw new Error("پسوند این فایل مجاز نیست.");
  }

  const stem = safe.slice(0, safe.length - extension.length - 1).slice(0, 170);
  return `${stem || "uploaded-file"}.${extension}`;
}

function isPdf(bytes: Uint8Array): boolean {
  return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
}

function isPng(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isWebp(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
  );
}

function decodePlainText(bytes: Uint8Array): string | null {
  if (bytes.includes(0)) {
    return null;
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function detectFileType(bytes: Uint8Array): string | null {
  if (isPdf(bytes)) return "application/pdf";
  if (isPng(bytes)) return "image/png";
  if (isJpeg(bytes)) return "image/jpeg";
  if (isWebp(bytes)) return "image/webp";

  const text = decodePlainText(bytes);

  if (text && !/^\s*(?:#!|<\?php|<script\b|@echo\b|using\s+System\b|import\s+os\b)/i.test(text)) {
    return "text/plain";
  }

  return null;
}

export function assertCategoryMatchesType(category: FileCategory, fileType: string): void {
  if (category === FileCategory.PROFILE_IMAGE && !fileType.startsWith("image/")) {
    throw new Error("تصویر پروفایل باید از نوع تصویر باشد.");
  }

  if (category === FileCategory.PUBLICATION_PDF && fileType !== "application/pdf") {
    throw new Error("فایل انتشارات باید PDF باشد.");
  }
}

export type ValidatedUpload = FileMetadataPersistenceInput & {
  bytes: Uint8Array;
  checksum: string;
  fileType: string;
  password?: string;
  safeOriginalName: string;
  sizeBytes: number;
  storageKey: string;
};

export type StoredUpload = FileMetadataPersistenceInput &
  StoredPasswordState & {
    bytes: Uint8Array;
    checksum: string;
    fileType: string;
    safeOriginalName: string;
    sizeBytes: number;
    storageKey: string;
  };

export async function validateUpload(file: File, metadataInput: unknown): Promise<ValidatedUpload> {
  const metadata = parseFileMetadataInput(metadataInput);

  if (metadata.clearPassword) {
    throw new Error("A new upload cannot remove a file password.");
  }

  if (metadata.visibility === FileVisibility.PASSWORD_PROTECTED && !metadata.password) {
    throw new Error("برای فایل دارای گذرواژه، یک گذرواژه وارد کنید.");
  }

  if (metadata.visibility !== FileVisibility.PASSWORD_PROTECTED && metadata.password) {
    throw new Error("پیش از افزودن گذرواژه، وضعیت «دارای گذرواژه» را انتخاب کنید.");
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Files must be between 1 byte and ${MAX_FILE_SIZE_BYTES} bytes.`);
  }

  const safeOriginalName = sanitizeOriginalFilename(file.name);
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (bytes.byteLength !== file.size) {
    throw new Error("خواندن ایمن فایل بارگذاری‌شده ممکن نشد.");
  }

  const fileType = detectFileType(bytes);

  if (!fileType || !isSafeFileType(fileType)) {
    throw new Error("نوع فایل مجاز نیست یا امکان تأیید آن وجود ندارد.");
  }

  const extension = normalizedExtension(safeOriginalName);

  if (!mimeExtensions[fileType]?.includes(extension)) {
    throw new Error("پسوند نام فایل با محتوای آن سازگار نیست.");
  }

  if (file.type && file.type !== "application/octet-stream" && file.type !== fileType) {
    throw new Error("نوع MIME اعلام‌شده با محتوای فایل سازگار نیست.");
  }

  assertCategoryMatchesType(metadata.category, fileType);

  const displayName =
    metadata.displayName ||
    safeOriginalName.slice(0, Math.max(1, safeOriginalName.length - extension.length - 1));
  const checksum = createHash("sha256").update(bytes).digest("hex");
  const storageKey = `${metadata.category.toLowerCase()}/${randomUUID()}.${extension}`;
  const password = metadata.password;
  const persistedMetadata: FileMetadataPersistenceInput = {
    displayName: metadata.displayName,
    category: metadata.category,
    description: metadata.description,
    visibility: metadata.visibility,
  };

  return {
    ...persistedMetadata,
    bytes,
    checksum,
    displayName,
    fileType,
    ...(password ? { password } : {}),
    safeOriginalName,
    sizeBytes: bytes.byteLength,
    storageKey,
  };
}

export function objectIdIsSafe(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}
