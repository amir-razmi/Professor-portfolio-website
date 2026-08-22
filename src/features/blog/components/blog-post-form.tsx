"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  FormField,
  FormFieldError,
  FormHint,
  FormLabel,
  FormSection,
  FormStatusMessage,
  formControlClassName,
} from "@/components/forms/form-controls";

import type { BlogActionState } from "../server/actions";
import { initialBlogActionState, saveBlogPostAction } from "../server/actions";
import type { BlogPostRecord, BlogTagRecord, BlogTaxonomyRecord } from "../server/blog-policy";
import { BLOG_POST_STATUS, dateToDateTimeLocal, type BlogPostStatusValue } from "../blog-ui";

export type BlogPostFormValue = Omit<
  Pick<
    BlogPostRecord,
    "id" | "title" | "slug" | "excerpt" | "content" | "isFeatured" | "categoryIds" | "tagIds"
  >,
  never
> & {
  status: BlogPostStatusValue;
  publishedAt: string;
};

export function toBlogPostFormValue(post: BlogPostRecord | null): BlogPostFormValue | null {
  if (!post) {
    return null;
  }

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    status: post.status,
    publishedAt: dateToDateTimeLocal(post.publishedAt),
    isFeatured: post.isFeatured,
    categoryIds: post.categoryIds,
    tagIds: post.tagIds,
  };
}

type BlogPostFormProps = Readonly<{
  initialPost: BlogPostFormValue | null;
  categories: BlogTaxonomyRecord[];
  tags: BlogTagRecord[];
  canPublish: boolean;
}>;

export function BlogPostForm({ categories, canPublish, initialPost, tags }: BlogPostFormProps) {
  const [state, formAction, isPending] = useActionState<BlogActionState, FormData>(
    saveBlogPostAction,
    initialBlogActionState,
  );
  const fieldError = (field: string) => state.fieldErrors[field];
  const selectedCategoryIds = new Set(initialPost?.categoryIds ?? []);
  const selectedTagIds = new Set(initialPost?.tagIds ?? []);
  const nonPublishingStatus = initialPost?.status ?? BLOG_POST_STATUS.DRAFT;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <FormStatusMessage message={state.message} status={state.status} />

      {state.status === "success" && state.postId ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <Link
            href={`/admin/blog/${state.postId}/edit`}
            className="font-semibold underline underline-offset-4"
          >
            ادامه ویرایش یادداشت
          </Link>
          .
        </p>
      ) : null}

      <input type="hidden" name="postId" value={initialPost?.id ?? ""} />

      <FormSection
        title="جزئیات یادداشت"
        description="عنوانی روشن و یک شناسه نشانی انگلیسی، کوتاه و ثابت انتخاب کنید. محتوای یادداشت در این مرحله به‌صورت متن ساده ذخیره می‌شود و HTML یا Markdown تفسیر نمی‌شود."
      >
        <FormField className="sm:col-span-2">
          <FormLabel htmlFor="title">عنوان</FormLabel>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={180}
            defaultValue={initialPost?.title ?? ""}
            aria-invalid={Boolean(fieldError("title")?.length)}
            aria-describedby={fieldError("title")?.length ? "title-error" : undefined}
            className={formControlClassName}
          />
          <FormFieldError id="title-error" errors={fieldError("title")} />
        </FormField>

        <FormField>
          <FormLabel htmlFor="slug">شناسه نشانی (Slug)</FormLabel>
          <FormHint id="slug-hint">نمونه: field-notes-on-research-design</FormHint>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            maxLength={160}
            defaultValue={initialPost?.slug ?? ""}
            aria-invalid={Boolean(fieldError("slug")?.length)}
            aria-describedby={`slug-hint${fieldError("slug")?.length ? " slug-error" : ""}`}
            className={formControlClassName}
          />
          <FormFieldError id="slug-error" errors={fieldError("slug")} />
        </FormField>

        <FormField>
          <FormLabel htmlFor="status">وضعیت انتشار</FormLabel>
          {canPublish ? (
            <>
              <select
                id="status"
                name="status"
                defaultValue={initialPost?.status ?? BLOG_POST_STATUS.DRAFT}
                aria-invalid={Boolean(fieldError("status")?.length)}
                aria-describedby={fieldError("status")?.length ? "status-error" : undefined}
                className={formControlClassName}
              >
                <option value={BLOG_POST_STATUS.DRAFT}>پیش‌نویس</option>
                <option value={BLOG_POST_STATUS.PUBLISHED}>منتشرشده</option>
                <option value={BLOG_POST_STATUS.ARCHIVED}>بایگانی‌شده</option>
              </select>
              <FormFieldError id="status-error" errors={fieldError("status")} />
            </>
          ) : (
            <>
              <input type="hidden" name="status" value={nonPublishingStatus} />
              <p className="mt-2 rounded-xl bg-slate-100 px-3.5 py-2.5 text-sm text-slate-700">
                {nonPublishingStatus === BLOG_POST_STATUS.PUBLISHED
                  ? "منتشرشده (تغییر وضعیت به مجوز انتشار نیاز دارد)"
                  : nonPublishingStatus === BLOG_POST_STATUS.ARCHIVED
                    ? "بایگانی‌شده (تغییر وضعیت به مجوز انتشار نیاز دارد)"
                    : "پیش‌نویس"}
              </p>
            </>
          )}
        </FormField>

        <FormField className="sm:col-span-2">
          <FormLabel htmlFor="excerpt">خلاصه</FormLabel>
          <FormHint id="excerpt-hint">
            خلاصه‌ای کوتاه برای نمایش در فهرست عمومی و پیش‌نمایش شبکه‌های اجتماعی.
          </FormHint>
          <textarea
            id="excerpt"
            name="excerpt"
            rows={3}
            maxLength={500}
            defaultValue={initialPost?.excerpt ?? ""}
            aria-invalid={Boolean(fieldError("excerpt")?.length)}
            aria-describedby={`excerpt-hint${fieldError("excerpt")?.length ? " excerpt-error" : ""}`}
            className={formControlClassName}
          />
          <FormFieldError id="excerpt-error" errors={fieldError("excerpt")} />
        </FormField>

        <FormField className="sm:col-span-2">
          <FormLabel htmlFor="content">محتوا</FormLabel>
          <FormHint id="content-hint">
            فقط متن ساده وارد کنید. پاراگراف‌ها را با یک خط خالی جدا کنید؛ HTML ناامن هرگز نمایش
            داده نمی‌شود.
          </FormHint>
          <textarea
            id="content"
            name="content"
            rows={18}
            required
            maxLength={100_000}
            defaultValue={initialPost?.content ?? ""}
            aria-invalid={Boolean(fieldError("content")?.length)}
            aria-describedby={`content-hint${fieldError("content")?.length ? " content-error" : ""}`}
            className={formControlClassName}
          />
          <FormFieldError id="content-error" errors={fieldError("content")} />
        </FormField>
      </FormSection>

      <FormSection
        title="جزئیات انتشار"
        description="تاریخ‌ها در پایگاه داده بر اساس UTC ذخیره می‌شوند. فقط یادداشت‌های منتشرشده در صفحات عمومی و متادیتا‌ها نمایش داده می‌شوند."
      >
        <FormField>
          <FormLabel htmlFor="publishedAt">تاریخ انتشار</FormLabel>
          {canPublish ? (
            <>
              <input
                id="publishedAt"
                name="publishedAt"
                type="datetime-local"
                defaultValue={initialPost?.publishedAt ?? ""}
                aria-invalid={Boolean(fieldError("publishedAt")?.length)}
                aria-describedby={
                  fieldError("publishedAt")?.length ? "publishedAt-error" : undefined
                }
                className={formControlClassName}
              />
              <FormFieldError id="publishedAt-error" errors={fieldError("publishedAt")} />
            </>
          ) : (
            <input type="hidden" name="publishedAt" value={initialPost?.publishedAt ?? ""} />
          )}
        </FormField>

        <FormField>
          <span className="block text-sm font-semibold text-slate-900">نمایش منتخب</span>
          {canPublish ? (
            <label className="mt-3 flex items-start gap-3 text-sm text-slate-700">
              <input
                name="isFeatured"
                type="checkbox"
                defaultChecked={initialPost?.isFeatured ?? false}
                className="mt-0.5 size-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
              <span>این یادداشت در بخش‌های منتخب آینده برجسته شود.</span>
            </label>
          ) : (
            <>
              <input
                type="hidden"
                name="isFeatured"
                value={initialPost?.isFeatured ? "on" : "off"}
              />
              <p className="mt-3 text-sm leading-6 text-slate-600">
                نمایش منتخب فقط در اختیار مدیرانی است که مجوز انتشار دارند.
              </p>
            </>
          )}
        </FormField>
      </FormSection>

      <FormSection
        title="دسته‌بندی و برچسب‌ها"
        description="از واژگانی محدود و منسجم استفاده کنید تا خوانندگان بتوانند یادداشت‌های مرتبط را پیدا کنند."
      >
        <FormField className="sm:col-span-2">
          <span className="block text-sm font-semibold text-slate-900">دسته‌بندی‌ها</span>
          {categories.length ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700"
                >
                  <input
                    name="categoryIds"
                    type="checkbox"
                    value={category.id}
                    defaultChecked={selectedCategoryIds.has(category.id)}
                    className="mt-0.5 size-4 rounded border-slate-300 text-accent focus:ring-accent"
                  />
                  <span>
                    <span className="block font-medium text-slate-900">{category.name}</span>
                    {!category.isActive ? (
                      <span className="text-xs text-amber-700">غیرفعال</span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">هنوز دسته‌بندی‌ای ایجاد نشده است.</p>
          )}
          <FormFieldError id="categoryIds-error" errors={fieldError("categoryIds")} />
        </FormField>

        <FormField className="sm:col-span-2">
          <span className="block text-sm font-semibold text-slate-900">برچسب‌ها</span>
          {tags.length ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700"
                >
                  <input
                    name="tagIds"
                    type="checkbox"
                    value={tag.id}
                    defaultChecked={selectedTagIds.has(tag.id)}
                    className="mt-0.5 size-4 rounded border-slate-300 text-accent focus:ring-accent"
                  />
                  <span>
                    <span className="block font-medium text-slate-900">{tag.name}</span>
                    {!tag.isActive ? <span className="text-xs text-amber-700">غیرفعال</span> : null}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">هنوز برچسبی ایجاد نشده است.</p>
          )}
          <FormFieldError id="tagIds-error" errors={fieldError("tagIds")} />
        </FormField>
      </FormSection>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <p className="text-sm leading-6 text-slate-600">
          Save frequently while drafting. Server-side validation runs for every submission.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "در حال ذخیره…" : initialPost ? "ذخیره تغییرات" : "ذخیره یادداشت"}
        </button>
      </div>
    </form>
  );
}
