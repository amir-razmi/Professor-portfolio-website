"use client";

import { useActionState } from "react";

import {
  FormFieldError,
  FormStatusMessage,
  formControlClassName,
} from "@/components/forms/form-controls";

import {
  deleteBlogCategoryAction,
  deleteBlogTagAction,
  initialBlogActionState,
  saveBlogCategoryAction,
  saveBlogTagAction,
} from "../server/actions";
import type { BlogTagRecord, BlogTaxonomyRecord } from "../server/blog-policy";

function CategoryForm({
  category,
}: Readonly<{
  category: BlogTaxonomyRecord | null;
}>) {
  const [state, formAction, isPending] = useActionState(
    saveBlogCategoryAction,
    initialBlogActionState,
  );
  const prefix = category?.id ?? "new-category";

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-slate-200 p-4">
      <input type="hidden" name="id" value={category?.id ?? ""} />
      <div>
        <label htmlFor={`${prefix}-name`} className="text-sm font-semibold text-slate-900">
          نام دسته‌بندی
        </label>
        <input
          id={`${prefix}-name`}
          name="name"
          type="text"
          required
          maxLength={80}
          defaultValue={category?.name ?? ""}
          className={formControlClassName}
        />
        <FormFieldError id={`${prefix}-name-error`} errors={state.fieldErrors?.name} />
      </div>
      <div>
        <label htmlFor={`${prefix}-slug`} className="text-sm font-semibold text-slate-900">
          شناسه نشانی (Slug)
        </label>
        <input
          id={`${prefix}-slug`}
          name="slug"
          type="text"
          required
          maxLength={120}
          defaultValue={category?.slug ?? ""}
          className={formControlClassName}
        />
        <FormFieldError id={`${prefix}-slug-error`} errors={state.fieldErrors?.slug} />
      </div>
      <div>
        <label htmlFor={`${prefix}-description`} className="text-sm font-semibold text-slate-900">
          توضیح
        </label>
        <textarea
          id={`${prefix}-description`}
          name="description"
          rows={2}
          maxLength={240}
          defaultValue={category?.description ?? ""}
          className={formControlClassName}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          name="isActive"
          type="checkbox"
          defaultChecked={category?.isActive ?? true}
          className="size-4 rounded border-slate-300 text-accent focus:ring-accent"
        />
        فعال برای یادداشت‌های جدید و فیلترهای عمومی
      </label>
      {state.message ? <FormStatusMessage message={state.message} status={state.status} /> : null}
      <button
        type="submit"
        disabled={isPending}
        className="min-h-10 rounded-lg bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "در حال ذخیره…" : category ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی"}
      </button>
    </form>
  );
}

function TagForm({
  tag,
}: Readonly<{
  tag: BlogTagRecord | null;
}>) {
  const [state, formAction, isPending] = useActionState(saveBlogTagAction, initialBlogActionState);
  const prefix = tag?.id ?? "new-tag";

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-slate-200 p-4">
      <input type="hidden" name="id" value={tag?.id ?? ""} />
      <div>
        <label htmlFor={`${prefix}-name`} className="text-sm font-semibold text-slate-900">
          نام برچسب
        </label>
        <input
          id={`${prefix}-name`}
          name="name"
          type="text"
          required
          maxLength={80}
          defaultValue={tag?.name ?? ""}
          className={formControlClassName}
        />
        <FormFieldError id={`${prefix}-name-error`} errors={state.fieldErrors?.name} />
      </div>
      <div>
        <label htmlFor={`${prefix}-slug`} className="text-sm font-semibold text-slate-900">
          شناسه نشانی (Slug)
        </label>
        <input
          id={`${prefix}-slug`}
          name="slug"
          type="text"
          required
          maxLength={120}
          defaultValue={tag?.slug ?? ""}
          className={formControlClassName}
        />
        <FormFieldError id={`${prefix}-slug-error`} errors={state.fieldErrors?.slug} />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          name="isActive"
          type="checkbox"
          defaultChecked={tag?.isActive ?? true}
          className="size-4 rounded border-slate-300 text-accent focus:ring-accent"
        />
        فعال برای یادداشت‌های جدید و فیلترهای عمومی
      </label>
      {state.message ? <FormStatusMessage message={state.message} status={state.status} /> : null}
      <button
        type="submit"
        disabled={isPending}
        className="min-h-10 rounded-lg bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "در حال ذخیره…" : tag ? "ویرایش برچسب" : "افزودن برچسب"}
      </button>
    </form>
  );
}

function DeleteTaxonomyButton({
  id,
  kind,
}: Readonly<{
  id: string;
  kind: "category" | "tag";
}>) {
  const action = kind === "category" ? deleteBlogCategoryAction : deleteBlogTagAction;
  const [state, formAction, isPending] = useActionState(action, initialBlogActionState);

  return (
    <div className="mt-3">
      <form
        action={formAction}
        onSubmit={(event) => {
          if (
            !window.confirm(
              `آیا از حذف ${kind === "category" ? "این دسته‌بندی" : "این برچسب"} مطمئن هستید؟ این کار قابل بازگشت نیست.`,
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={isPending}
          className="text-xs font-semibold text-red-700 underline underline-offset-4 hover:text-red-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-60"
        >
          {isPending ? "در حال حذف…" : kind === "category" ? "حذف دسته‌بندی" : "حذف برچسب"}
        </button>
      </form>
      {state.message ? <FormStatusMessage message={state.message} status={state.status} /> : null}
    </div>
  );
}

export function BlogTaxonomyManager({
  categories,
  tags,
}: Readonly<{
  categories: BlogTaxonomyRecord[];
  tags: BlogTagRecord[];
}>) {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
      aria-labelledby="taxonomy-heading"
    >
      <div className="border-b border-slate-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          دسته‌بندی محتوا
        </p>
        <h2
          id="taxonomy-heading"
          className="mt-2 text-xl font-semibold tracking-tight text-slate-950"
        >
          دسته‌بندی‌ها و برچسب‌ها
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          نام‌ها را کوتاه و ثابت نگه دارید. رکوردهای مرتبط با یادداشت‌ها حذف نمی‌شوند؛ اگر دیگر
          نباید برای محتوای جدید نمایش داده شوند، آن‌ها را غیرفعال کنید.
        </p>
      </div>

      <div className="mt-6 grid gap-8 xl:grid-cols-2">
        <div>
          <h3 className="text-base font-semibold text-slate-950">دسته‌بندی‌ها</h3>
          <div className="mt-4 space-y-4">
            <CategoryForm category={null} />
            {categories.map((category) => (
              <div key={category.id}>
                <CategoryForm category={category} />
                <p className="mt-2 text-xs text-slate-500">{category.postCount} یادداشت مرتبط</p>
                <DeleteTaxonomyButton id={category.id} kind="category" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-950">برچسب‌ها</h3>
          <div className="mt-4 space-y-4">
            <TagForm tag={null} />
            {tags.map((tag) => (
              <div key={tag.id}>
                <TagForm tag={tag} />
                <p className="mt-2 text-xs text-slate-500">{tag.postCount} یادداشت مرتبط</p>
                <DeleteTaxonomyButton id={tag.id} kind="tag" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
