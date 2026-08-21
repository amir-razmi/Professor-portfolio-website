"use client";

import { useState } from "react";

import {
  FILE_CATEGORY,
  FILE_CATEGORY_LABELS,
  FILE_VISIBILITY,
  type FileCategoryValue,
  type FileVisibilityValue,
} from "../file-ui";

type FileView = {
  id: string;
  displayName: string;
  safeOriginalName: string;
  fileType: string;
  sizeBytes: number;
  category: FileCategoryValue;
  description: string | null;
  visibility: FileVisibilityValue;
  checksum: string | null;
  uploadedAt: string;
  uploaderName: string;
  updatedAt: string;
  downloadUrl: string | null;
  adminDownloadUrl: string;
};

type ApiFailure = {
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

type RowMessage = {
  message: string;
  tone: "error" | "success";
};

const categories = Object.values(FILE_CATEGORY) as FileCategoryValue[];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function firstError(error: ApiFailure | null, field: string): string | null {
  return error?.fieldErrors?.[field]?.[0] ?? null;
}

function StatusMessage({
  children,
  tone,
}: Readonly<{
  children: string | null;
  tone: "error" | "success";
}>) {
  if (!children) return null;

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      {children}
    </p>
  );
}

function FieldError({ message }: Readonly<{ message: string | null }>) {
  return message ? <p className="mt-1 text-xs text-red-700">{message}</p> : null;
}

export function FileManager({
  initialFiles,
}: Readonly<{
  initialFiles: FileView[];
}>) {
  const [files, setFiles] = useState(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<ApiFailure | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowMessages, setRowMessages] = useState<Record<string, RowMessage>>({});

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setUploading(true);
    setUploadMessage(null);
    setUploadError(null);

    try {
      const response = await fetch("/api/admin/files", {
        method: "POST",
        body: new FormData(form),
      });
      const payload = (await response.json().catch(() => null)) as {
        file?: FileView;
        message?: string;
        fieldErrors?: Record<string, string[] | undefined>;
      } | null;

      if (!response.ok || !payload?.file) {
        setUploadError(payload ?? { message: "Upload failed." });
        return;
      }

      setFiles((current) => [payload.file!, ...current]);
      form.reset();
      setUploadMessage("File uploaded.");
    } catch {
      setUploadError({ message: "The upload request could not be completed." });
    } finally {
      setUploading(false);
    }
  }

  async function updateFile(event: React.FormEvent<HTMLFormElement>, fileId: string) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusyId(fileId);
    setRowMessages((current) => ({
      ...current,
      [fileId]: { message: "", tone: "success" },
    }));

    const form = new FormData(formElement);
    const input = {
      displayName: form.get("displayName"),
      category: form.get("category"),
      description: form.get("description"),
      visibility: form.get("visibility"),
    };

    try {
      const response = await fetch(`/api/admin/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = (await response.json().catch(() => null)) as {
        file?: FileView;
        message?: string;
      } | null;

      if (!response.ok || !payload?.file) {
        setRowMessages((current) => ({
          ...current,
          [fileId]: {
            message: payload?.message ?? "The metadata could not be saved.",
            tone: "error",
          },
        }));
        return;
      }

      setFiles((current) => current.map((file) => (file.id === fileId ? payload.file! : file)));
      setRowMessages((current) => ({
        ...current,
        [fileId]: { message: "Metadata saved.", tone: "success" },
      }));
    } catch {
      setRowMessages((current) => ({
        ...current,
        [fileId]: {
          message: "The metadata request could not be completed.",
          tone: "error",
        },
      }));
    } finally {
      setBusyId(null);
    }
  }

  async function removeFile(file: FileView) {
    if (!window.confirm(`Delete “${file.displayName}”? This cannot be undone.`)) {
      return;
    }

    setBusyId(file.id);
    setRowMessages((current) => ({
      ...current,
      [file.id]: { message: "", tone: "success" },
    }));

    try {
      const response = await fetch(`/api/admin/files/${file.id}/delete`, { method: "DELETE" });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ApiFailure | null;
        setRowMessages((current) => ({
          ...current,
          [file.id]: {
            message: payload?.message ?? "The file could not be deleted.",
            tone: "error",
          },
        }));
        return;
      }

      setFiles((current) => current.filter((item) => item.id !== file.id));
    } catch {
      setRowMessages((current) => ({
        ...current,
        [file.id]: {
          message: "The delete request could not be completed.",
          tone: "error",
        },
      }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Upload a file</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            PDF, plain text, PNG, JPEG, and WebP files up to 10 MiB are accepted. Files are stored
            outside MongoDB; only metadata and an opaque storage key are persisted.
          </p>
        </div>

        <form
          className="mt-6 grid gap-5 sm:grid-cols-2"
          encType="multipart/form-data"
          onSubmit={upload}
        >
          <div className="sm:col-span-2">
            <label htmlFor="file-upload" className="block text-sm font-semibold text-slate-900">
              File
            </label>
            <input
              id="file-upload"
              name="file"
              type="file"
              required
              accept=".pdf,.txt,.png,.jpg,.jpeg,.webp,application/pdf,text/plain,image/png,image/jpeg,image/webp"
              className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold"
            />
            <FieldError message={firstError(uploadError, "file")} />
          </div>

          <div>
            <label
              htmlFor="file-display-name"
              className="block text-sm font-semibold text-slate-900"
            >
              Display name
            </label>
            <input
              id="file-display-name"
              name="displayName"
              required
              maxLength={120}
              placeholder="Research methods handout"
              className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <FieldError message={firstError(uploadError, "displayName")} />
          </div>

          <div>
            <label htmlFor="file-category" className="block text-sm font-semibold text-slate-900">
              Category
            </label>
            <select
              id="file-category"
              name="category"
              defaultValue={FILE_CATEGORY.OTHER}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {FILE_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
            <FieldError message={firstError(uploadError, "category")} />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="file-description"
              className="block text-sm font-semibold text-slate-900"
            >
              Description
            </label>
            <textarea
              id="file-description"
              name="description"
              rows={3}
              maxLength={500}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <FieldError message={firstError(uploadError, "description")} />
          </div>

          <div>
            <label htmlFor="file-visibility" className="block text-sm font-semibold text-slate-900">
              Visibility
            </label>
            <select
              id="file-visibility"
              name="visibility"
              defaultValue={FILE_VISIBILITY.PRIVATE}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value={FILE_VISIBILITY.PRIVATE}>Private</option>
              <option value={FILE_VISIBILITY.PUBLIC}>Public download</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={uploading}
              className="min-h-11 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Upload file"}
            </button>
          </div>
        </form>
        <div className="mt-5 space-y-3">
          <StatusMessage tone="success">{uploadMessage}</StatusMessage>
          <StatusMessage tone="error">{uploadError?.message ?? null}</StatusMessage>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">File records</h2>
            <p className="mt-1 text-sm text-slate-600">
              {files.length} {files.length === 1 ? "file" : "files"} in the workspace.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Private files never receive public download links.
          </p>
        </div>

        {files.length ? (
          <div className="mt-6 space-y-5">
            {files.map((file) => (
              <form
                key={file.id}
                onSubmit={(event) => updateFile(event, file.id)}
                className="rounded-xl border border-slate-200 p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="break-all text-xs font-medium text-slate-500">
                      {file.safeOriginalName} · {file.fileType} · {formatBytes(file.sizeBytes)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Uploaded {formatDate(file.uploadedAt)} by {file.uploaderName}
                    </p>
                    {file.checksum ? (
                      <p className="mt-1 break-all text-xs text-slate-400">
                        SHA-256: {file.checksum}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span
                      className={`rounded-full px-2.5 py-1 ${
                        file.visibility === FILE_VISIBILITY.PUBLIC
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {file.visibility === FILE_VISIBILITY.PUBLIC ? "Public" : "Private"}
                    </span>
                    {file.downloadUrl ? (
                      <a
                        href={file.downloadUrl}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        Download
                      </a>
                    ) : (
                      <a
                        href={file.adminDownloadUrl}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        Secure download
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor={`display-${file.id}`}
                      className="block text-sm font-semibold text-slate-900"
                    >
                      Display name
                    </label>
                    <input
                      id={`display-${file.id}`}
                      name="displayName"
                      defaultValue={file.displayName}
                      maxLength={120}
                      required
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`category-${file.id}`}
                      className="block text-sm font-semibold text-slate-900"
                    >
                      Category
                    </label>
                    <select
                      id={`category-${file.id}`}
                      name="category"
                      defaultValue={file.category}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {FILE_CATEGORY_LABELS[category]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor={`visibility-${file.id}`}
                      className="block text-sm font-semibold text-slate-900"
                    >
                      Visibility
                    </label>
                    <select
                      id={`visibility-${file.id}`}
                      name="visibility"
                      defaultValue={file.visibility}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    >
                      <option value={FILE_VISIBILITY.PRIVATE}>Private</option>
                      <option value={FILE_VISIBILITY.PUBLIC}>Public download</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor={`description-${file.id}`}
                      className="block text-sm font-semibold text-slate-900"
                    >
                      Description
                    </label>
                    <textarea
                      id={`description-${file.id}`}
                      name="description"
                      rows={2}
                      maxLength={500}
                      defaultValue={file.description ?? ""}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={busyId === file.id}
                    className="min-h-10 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyId === file.id ? "Saving…" : "Save metadata"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === file.id}
                    onClick={() => removeFile(file)}
                    className="min-h-10 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Delete
                  </button>
                  <StatusMessage tone={rowMessages[file.id]?.tone ?? "success"}>
                    {rowMessages[file.id]?.message || null}
                  </StatusMessage>
                </div>
              </form>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
            <h3 className="text-lg font-semibold text-slate-950">No files yet.</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Upload a verified document or image to create the first file record.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
