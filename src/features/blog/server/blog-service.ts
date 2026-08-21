import "server-only";

import { cache } from "react";

import type { AuthorizationPrincipal } from "@/server/auth/permissions";

import type { BlogListQuery } from "../blog-schema";
import {
  deleteBlogCategoryForActor,
  deleteBlogPostForActor,
  deleteBlogTagForActor,
  getAdminBlogPostForActor,
  getAdminBlogPostsForActor,
  getBlogTaxonomyForActor,
  getPublicBlogPostBySlug,
  getPublicBlogPosts,
  getPublicBlogTaxonomy,
  getPublishedBlogSlugs,
  publishBlogPostForActor,
  saveBlogCategoryForActor,
  saveBlogPostForActor,
  saveBlogTagForActor,
  unpublishBlogPostForActor,
} from "./blog-policy";
import { blogPostRepository } from "./blog-repository";

export function getAdminBlogPosts(actor: AuthorizationPrincipal, query: BlogListQuery) {
  return getAdminBlogPostsForActor(actor, query, blogPostRepository);
}

export function getAdminBlogPost(actor: AuthorizationPrincipal, postId: string) {
  return getAdminBlogPostForActor(actor, postId, blogPostRepository);
}

export function getAdminBlogTaxonomy(actor: AuthorizationPrincipal) {
  return getBlogTaxonomyForActor(actor, blogPostRepository);
}

export function saveBlogPost(actor: AuthorizationPrincipal, input: unknown) {
  return saveBlogPostForActor(actor, input, blogPostRepository);
}

export function publishBlogPost(actor: AuthorizationPrincipal, postId: string) {
  return publishBlogPostForActor(actor, postId, blogPostRepository);
}

export function unpublishBlogPost(actor: AuthorizationPrincipal, postId: string) {
  return unpublishBlogPostForActor(actor, postId, blogPostRepository);
}

export function deleteBlogPost(actor: AuthorizationPrincipal, postId: string) {
  return deleteBlogPostForActor(actor, postId, blogPostRepository);
}

export function saveBlogCategory(actor: AuthorizationPrincipal, input: unknown) {
  return saveBlogCategoryForActor(actor, input, blogPostRepository);
}

export function saveBlogTag(actor: AuthorizationPrincipal, input: unknown) {
  return saveBlogTagForActor(actor, input, blogPostRepository);
}

export function deleteBlogCategory(actor: AuthorizationPrincipal, id: string) {
  return deleteBlogCategoryForActor(actor, id, blogPostRepository);
}

export function deleteBlogTag(actor: AuthorizationPrincipal, id: string) {
  return deleteBlogTagForActor(actor, id, blogPostRepository);
}

export function getPublicBlogList(query: BlogListQuery) {
  return getPublicBlogPosts(query, blogPostRepository);
}

export const getCachedPublicBlogPost = cache((slug: string) =>
  getPublicBlogPostBySlug(slug, blogPostRepository),
);

export function getPublicBlogFilters() {
  return getPublicBlogTaxonomy(blogPostRepository);
}

export function getPublicBlogSitemapSlugs() {
  return getPublishedBlogSlugs(blogPostRepository);
}
