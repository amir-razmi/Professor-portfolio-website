import type { Metadata } from "next";
import { AuditAction } from "@prisma/client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  auditTargetResources,
  parseAuditLogQuery,
} from "@/features/audit-log/server/audit-log-schema";
import {
  listAuditLogsForActor,
  type AuditLogRecord,
} from "@/features/audit-log/server/audit-log-service";
import { Permission } from "@/server/auth/authorization";
import { requirePagePermission } from "@/server/auth/page-authorization";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Audit log",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function metadataLabel(log: AuditLogRecord): string | null {
  if (!log.metadata || typeof log.metadata !== "object") {
    return null;
  }

  const text = JSON.stringify(log.metadata);
  return text === "{}" ? null : text;
}

function pageHref(page: number, action?: string, targetResource?: string): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (action) params.set("action", action);
  if (targetResource) params.set("targetResource", targetResource);
  return `/admin/audit-logs?${params.toString()}`;
}

export default async function AuditLogsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const actor = await requirePagePermission(Permission.VIEW_AUDIT_LOGS);
  const query = parseAuditLogQuery(await searchParams);
  const logs = await listAuditLogsForActor(actor, query);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <AdminPageHeader
          eyebrow="Audit log"
          title="Review important workspace activity."
          description="Events are recorded with safe summaries and metadata only. Passwords, hashes, tokens, sessions, and secrets are never shown here."
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <form
            method="get"
            className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end"
          >
            <div>
              <label htmlFor="audit-action" className="text-xs font-semibold text-slate-700">
                Action
              </label>
              <select
                id="audit-action"
                name="action"
                defaultValue={query.action ?? ""}
                className="mt-1 min-h-10 rounded-lg border border-slate-300 px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">All actions</option>
                {Object.values(AuditAction).map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="audit-resource" className="text-xs font-semibold text-slate-700">
                Resource
              </label>
              <select
                id="audit-resource"
                name="targetResource"
                defaultValue={query.targetResource ?? ""}
                className="mt-1 min-h-10 rounded-lg border border-slate-300 px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">All resources</option>
                {auditTargetResources.map((resource) => (
                  <option key={resource} value={resource}>
                    {resource}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="min-h-10 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Filter
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              {logs.total} {logs.total === 1 ? "event" : "events"}
            </p>
            <p className="text-xs text-slate-500">
              Page {logs.page} of {logs.totalPages || 1}
            </p>
          </div>

          {logs.items.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[58rem] border-separate border-spacing-0 text-left">
                <caption className="sr-only">Administrative audit events</caption>
                <thead>
                  <tr className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    <th scope="col" className="border-b border-slate-200 px-3 py-3 font-semibold">
                      When
                    </th>
                    <th scope="col" className="border-b border-slate-200 px-3 py-3 font-semibold">
                      Actor
                    </th>
                    <th scope="col" className="border-b border-slate-200 px-3 py-3 font-semibold">
                      Action
                    </th>
                    <th scope="col" className="border-b border-slate-200 px-3 py-3 font-semibold">
                      Resource
                    </th>
                    <th scope="col" className="border-b border-slate-200 px-3 py-3 font-semibold">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.items.map((log) => (
                    <tr key={log.id} className="align-top">
                      <td className="border-b border-slate-100 px-3 py-4 text-sm text-slate-600">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4">
                        <p className="font-semibold text-slate-950">{log.actorName}</p>
                        {log.actorEmail ? (
                          <p className="mt-1 text-xs text-slate-500">{log.actorEmail}</p>
                        ) : null}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4">
                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-900">
                          {log.action}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4 text-sm text-slate-700">
                        <p className="font-medium">{log.targetResource}</p>
                        {log.targetId ? (
                          <p className="mt-1 font-mono text-xs text-slate-500">{log.targetId}</p>
                        ) : null}
                      </td>
                      <td className="max-w-md border-b border-slate-100 px-3 py-4 text-sm text-slate-600">
                        <p>{log.summary ?? "Activity recorded."}</p>
                        {metadataLabel(log) ? (
                          <code className="mt-2 block break-words text-xs text-slate-500">
                            {metadataLabel(log)}
                          </code>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
              <h2 className="font-semibold text-slate-950">No audit events found.</h2>
              <p className="mt-2 text-sm text-slate-600">
                Try a different filter or return after an administrative action has been completed.
              </p>
            </div>
          )}

          {logs.totalPages > 1 ? (
            <nav
              className="mt-5 flex items-center justify-between border-t border-slate-200 pt-5 text-sm"
              aria-label="Audit log pagination"
            >
              {logs.page > 1 ? (
                <a
                  href={pageHref(logs.page - 1, query.action, query.targetResource)}
                  className="font-semibold text-accent underline underline-offset-4"
                >
                  Previous
                </a>
              ) : (
                <span />
              )}
              {logs.page < logs.totalPages ? (
                <a
                  href={pageHref(logs.page + 1, query.action, query.targetResource)}
                  className="font-semibold text-accent underline underline-offset-4"
                >
                  Next
                </a>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </section>
      </div>
    </div>
  );
}
