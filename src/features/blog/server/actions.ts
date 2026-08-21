"use server";

import { revalidatePath } from "next/cache";

import { Permission, requirePermission } from "@/server/auth/authorization";
import { getContentMutationFailure, type FieldErrors } from "@/server/content/content-errors";

import {
  blogCategoryFormDataToInput,
  blogPostFormDataToInput,
  blogTagFormDataToInput,
} from "../blog-schema";
import {
  deleteBlogCategory,
  deleteBlogPost,
  deleteBlogTag,
  publishBlogPost,
  saveBlogCategory,
  saveBlogPost,
  saveBlogTag,
  unpublishBlogPost,
} from "./blog-service";

export type BlogActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
  fieldErrors: FieldErrors;
  postId?: string | null;
};

export const initialBlogActionState: BlogActionState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  postId: null,
};

function getRecordId(formData: FormData, fieldName: string): string | null {
  const value = formData.get(fieldName);
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function failureState(failure: ReturnType<typeof getContentMutationFailure>): BlogActionState {
  if (!failure) {
    return {
      status: "error",
      message: "The request could not be completed. Please try again.",
      fieldErrors: {},
      postId: null,
    };
  }

  return {
    status: "error",
    message: failure.message,
    fieldErrors: "fieldErrors" in failure ? failure.fieldErrors : {},
    postId: null,
  };
}

export async function saveBlogPostAction(
  previousState: BlogActionState,
  formData: FormData,
): Promise<BlogActionState> {
  void previousState;

  try {
    const admin = await requirePermission(Permission.MANAGE_BLOG_POSTS, {
      onUnauthenticated: "throw",
    });
    const post = await saveBlogPost(admin, blogPostFormDataToInput(formData));

    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/admin/blog");
    revalidatePath(`/admin/blog/${post.id}/edit`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/sitemap.xml");

    return {
      status: "success",
      message: "Blog post saved.",
      fieldErrors: {},
      postId: post.id,
    };
  } catch (error) {
    const failure = getContentMutationFailure(error);

    if (failure) {
      return failureState(failure);
    }

    console.error("Blog post save failed unexpectedly.");
    return failureState(null);
  }
}

export async function publishBlogPostAction(
  previousState: BlogActionState,
  formData: FormData,
): Promise<BlogActionState> {
  void previousState;

  try {
    const admin = await requirePermission(Permission.PUBLISH_BLOG_POSTS, {
      onUnauthenticated: "throw",
    });
    const postId = getRecordId(formData, "postId");

    if (!postId) {
      return {
        status: "error",
        message: "Select a blog post first.",
        fieldErrors: {},
        postId: null,
      };
    }

    const post = await publishBlogPost(admin, postId);
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/admin/blog");
    revalidatePath(`/admin/blog/${post.id}/edit`);
    revalidatePath("/sitemap.xml");

    return {
      status: "success",
      message: "Blog post published.",
      fieldErrors: {},
      postId: post.id,
    };
  } catch (error) {
    const failure = getContentMutationFailure(error);
    if (failure) {
      return failureState(failure);
    }

    console.error("Blog post publish failed unexpectedly.");
    return failureState(null);
  }
}

export async function unpublishBlogPostAction(
  previousState: BlogActionState,
  formData: FormData,
): Promise<BlogActionState> {
  void previousState;

  try {
    const admin = await requirePermission(Permission.PUBLISH_BLOG_POSTS, {
      onUnauthenticated: "throw",
    });
    const postId = getRecordId(formData, "postId");

    if (!postId) {
      return {
        status: "error",
        message: "Select a blog post first.",
        fieldErrors: {},
        postId: null,
      };
    }

    const post = await unpublishBlogPost(admin, postId);
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/admin/blog");
    revalidatePath(`/admin/blog/${post.id}/edit`);
    revalidatePath("/sitemap.xml");

    return {
      status: "success",
      message: "Blog post unpublished and saved as a draft.",
      fieldErrors: {},
      postId: post.id,
    };
  } catch (error) {
    const failure = getContentMutationFailure(error);
    if (failure) {
      return failureState(failure);
    }

    console.error("Blog post unpublish failed unexpectedly.");
    return failureState(null);
  }
}

export async function deleteBlogPostAction(
  previousState: BlogActionState,
  formData: FormData,
): Promise<BlogActionState> {
  void previousState;

  try {
    const admin = await requirePermission(Permission.MANAGE_BLOG_POSTS, {
      onUnauthenticated: "throw",
    });
    const postId = getRecordId(formData, "postId");

    if (!postId) {
      return {
        status: "error",
        message: "Select a blog post first.",
        fieldErrors: {},
        postId: null,
      };
    }

    await deleteBlogPost(admin, postId);
    revalidatePath("/blog");
    revalidatePath("/admin/blog");
    revalidatePath("/sitemap.xml");

    return {
      status: "success",
      message: "Blog post deleted.",
      fieldErrors: {},
      postId,
    };
  } catch (error) {
    const failure = getContentMutationFailure(error);
    if (failure) {
      return failureState(failure);
    }

    console.error("Blog post delete failed unexpectedly.");
    return failureState(null);
  }
}

export async function saveBlogCategoryAction(
  previousState: BlogActionState,
  formData: FormData,
): Promise<BlogActionState> {
  void previousState;

  try {
    const admin = await requirePermission(Permission.MANAGE_BLOG_TAXONOMY, {
      onUnauthenticated: "throw",
    });
    const category = await saveBlogCategory(admin, blogCategoryFormDataToInput(formData));

    revalidatePath("/admin/blog");
    revalidatePath("/blog");

    return {
      status: "success",
      message: "Category saved.",
      fieldErrors: {},
      postId: category.id,
    };
  } catch (error) {
    const failure = getContentMutationFailure(error);
    if (failure) {
      return failureState(failure);
    }

    console.error("Blog category save failed unexpectedly.");
    return failureState(null);
  }
}

export async function saveBlogTagAction(
  previousState: BlogActionState,
  formData: FormData,
): Promise<BlogActionState> {
  void previousState;

  try {
    const admin = await requirePermission(Permission.MANAGE_BLOG_TAXONOMY, {
      onUnauthenticated: "throw",
    });
    const tag = await saveBlogTag(admin, blogTagFormDataToInput(formData));

    revalidatePath("/admin/blog");
    revalidatePath("/blog");

    return {
      status: "success",
      message: "Tag saved.",
      fieldErrors: {},
      postId: tag.id,
    };
  } catch (error) {
    const failure = getContentMutationFailure(error);
    if (failure) {
      return failureState(failure);
    }

    console.error("Blog tag save failed unexpectedly.");
    return failureState(null);
  }
}

export async function deleteBlogCategoryAction(
  previousState: BlogActionState,
  formData: FormData,
): Promise<BlogActionState> {
  void previousState;

  try {
    const admin = await requirePermission(Permission.MANAGE_BLOG_TAXONOMY, {
      onUnauthenticated: "throw",
    });
    const id = getRecordId(formData, "id");

    if (!id) {
      return {
        status: "error",
        message: "Select a category first.",
        fieldErrors: {},
        postId: null,
      };
    }

    await deleteBlogCategory(admin, id);
    revalidatePath("/admin/blog");
    revalidatePath("/blog");

    return {
      status: "success",
      message: "Category deleted.",
      fieldErrors: {},
      postId: id,
    };
  } catch (error) {
    const failure = getContentMutationFailure(error);
    if (failure) {
      return failureState(failure);
    }

    console.error("Blog category delete failed unexpectedly.");
    return failureState(null);
  }
}

export async function deleteBlogTagAction(
  previousState: BlogActionState,
  formData: FormData,
): Promise<BlogActionState> {
  void previousState;

  try {
    const admin = await requirePermission(Permission.MANAGE_BLOG_TAXONOMY, {
      onUnauthenticated: "throw",
    });
    const id = getRecordId(formData, "id");

    if (!id) {
      return {
        status: "error",
        message: "Select a tag first.",
        fieldErrors: {},
        postId: null,
      };
    }

    await deleteBlogTag(admin, id);
    revalidatePath("/admin/blog");
    revalidatePath("/blog");

    return {
      status: "success",
      message: "Tag deleted.",
      fieldErrors: {},
      postId: id,
    };
  } catch (error) {
    const failure = getContentMutationFailure(error);
    if (failure) {
      return failureState(failure);
    }

    console.error("Blog tag delete failed unexpectedly.");
    return failureState(null);
  }
}
