import Link from "next/link";

import { FILE_CATEGORY_LABELS } from "../file-ui";
import type { PublicFileRecord } from "../server/public-file-policy";
import { PasswordUnlockForm } from "./password-unlock-form";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

function formatFileType(fileType: string): string {
  return fileType.includes("/") ? (fileType.split("/")[1]?.toUpperCase() ?? fileType) : fileType;
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 10V8a5 5 0 0 1 10 0v2m-11 0h12v9H6v-9Z"
      />
    </svg>
  );
}

export function PublicFileCard({
  file,
}: Readonly<{
  file: PublicFileRecord;
}>) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-orange-900">
          {FILE_CATEGORY_LABELS[file.category]}
        </span>
        {file.isPasswordProtected ? (
          <span
            aria-label="Password-protected file"
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
          >
            <LockIcon />
            Password protected
          </span>
        ) : file.isRestricted ? (
          <span
            aria-label="Restricted file"
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
          >
            <LockIcon />
            Restricted
          </span>
        ) : (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            Public
          </span>
        )}
      </div>

      <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
        {file.displayName}
      </h2>
      {file.description ? (
        <p className="mt-3 flex-1 whitespace-pre-line text-sm leading-7 text-muted">
          {file.description}
        </p>
      ) : (
        <p className="mt-3 flex-1 text-sm leading-7 text-muted">Academic resource.</p>
      )}

      <dl className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
        <div>
          <dt className="sr-only">File type</dt>
          <dd>{formatFileType(file.fileType)}</dd>
        </div>
        <div>
          <dt className="sr-only">Uploaded</dt>
          <dd>
            <time dateTime={file.uploadedAt.toISOString()}>{formatDate(file.uploadedAt)}</time>
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        {file.downloadUrl ? (
          <Link
            href={file.downloadUrl}
            download
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Download file <span aria-hidden="true">↓</span>
          </Link>
        ) : file.unlockUrl && file.isPasswordProtected ? (
          <PasswordUnlockForm
            downloadUrl={`/api/files/public/${file.id}`}
            fileName={file.displayName}
            unlockUrl={file.unlockUrl}
          />
        ) : (
          <p className="inline-flex items-center gap-2 text-sm font-medium text-muted">
            <LockIcon />
            Available to administrators only
          </p>
        )}
      </div>
    </article>
  );
}
