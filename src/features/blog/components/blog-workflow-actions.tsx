"use client";

import { useActionState } from "react";

import { FormStatusMessage } from "@/components/forms/form-controls";

import {
  deleteBlogPostAction,
  initialBlogActionState,
  publishBlogPostAction,
  unpublishBlogPostAction,
} from "../server/actions";
import { BLOG_POST_STATUS, type BlogPostStatusValue } from "../blog-ui";

export function BlogWorkflowActions({
  canPublish,
  postId,
  status,
}: Readonly<{
  canPublish: boolean;
  postId: string;
  status: BlogPostStatusValue;
}>) {
  const [publishState, publishAction, publishPending] = useActionState(
    publishBlogPostAction,
    initialBlogActionState,
  );
  const [unpublishState, unpublishAction, unpublishPending] = useActionState(
    unpublishBlogPostAction,
    initialBlogActionState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteBlogPostAction,
    initialBlogActionState,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {canPublish && status !== BLOG_POST_STATUS.PUBLISHED ? (
          <form action={publishAction}>
            <input type="hidden" name="postId" value={postId} />
            <button
              type="submit"
              disabled={publishPending}
              className="min-h-10 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {publishPending ? "در حال انتشار…" : "انتشار"}
            </button>
          </form>
        ) : null}

        {canPublish && status === BLOG_POST_STATUS.PUBLISHED ? (
          <form action={unpublishAction}>
            <input type="hidden" name="postId" value={postId} />
            <button
              type="submit"
              disabled={unpublishPending}
              className="min-h-10 rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {unpublishPending ? "در حال لغو انتشار…" : "لغو انتشار"}
            </button>
          </form>
        ) : null}

        <form
          action={deleteAction}
          onSubmit={(event) => {
            if (!window.confirm("این یادداشت حذف شود؟ این عملیات قابل بازگشت نیست.")) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="postId" value={postId} />
          <button
            type="submit"
            disabled={deletePending}
            className="min-h-10 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deletePending ? "در حال حذف…" : "حذف"}
          </button>
        </form>
      </div>

      {publishState.message ? (
        <FormStatusMessage message={publishState.message} status={publishState.status} />
      ) : null}
      {unpublishState.message ? (
        <FormStatusMessage message={unpublishState.message} status={unpublishState.status} />
      ) : null}
      {deleteState.message ? (
        <FormStatusMessage message={deleteState.message} status={deleteState.status} />
      ) : null}
    </div>
  );
}

export function BlogStatusBadge({ status }: Readonly<{ status: BlogPostStatusValue }>) {
  const label =
    status === BLOG_POST_STATUS.PUBLISHED
      ? "منتشرشده"
      : status === BLOG_POST_STATUS.ARCHIVED
        ? "بایگانی‌شده"
        : "پیش‌نویس";
  const styles =
    status === BLOG_POST_STATUS.PUBLISHED
      ? "bg-emerald-50 text-emerald-800"
      : status === BLOG_POST_STATUS.ARCHIVED
        ? "bg-slate-100 text-slate-700"
        : "bg-amber-50 text-amber-800";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>
      {label}
    </span>
  );
}
