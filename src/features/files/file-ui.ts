export const FILE_CATEGORY = {
  PROFILE_IMAGE: "PROFILE_IMAGE",
  PUBLICATION_PDF: "PUBLICATION_PDF",
  BLOG_ASSET: "BLOG_ASSET",
  DOCUMENT: "DOCUMENT",
  OTHER: "OTHER",
} as const;

export type FileCategoryValue = (typeof FILE_CATEGORY)[keyof typeof FILE_CATEGORY];

export const FILE_VISIBILITY = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
} as const;

export type FileVisibilityValue = (typeof FILE_VISIBILITY)[keyof typeof FILE_VISIBILITY];

export const FILE_CATEGORY_LABELS: Record<FileCategoryValue, string> = {
  PROFILE_IMAGE: "Profile image",
  PUBLICATION_PDF: "Publication PDF",
  BLOG_ASSET: "Blog asset",
  DOCUMENT: "Document",
  OTHER: "Other",
};
