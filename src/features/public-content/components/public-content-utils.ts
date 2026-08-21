import type { PublicationType, ResearchItemStatus } from "@prisma/client";

export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function displayLinkLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function doiUrl(doi: string | null | undefined): string | null {
  if (!doi?.trim()) {
    return null;
  }

  const value = doi.trim();

  if (/^https?:\/\//i.test(value)) {
    return safeExternalUrl(value);
  }

  return `https://doi.org/${encodeURI(value.replace(/^doi:/i, ""))}`;
}

export function formatYear(date: Date | null | undefined): string | null {
  return date
    ? new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "UTC" }).format(date)
    : null;
}

export function formatDateRange(
  startDate: Date | null | undefined,
  endDate: Date | null | undefined,
): string | null {
  const start = formatYear(startDate);
  const end = formatYear(endDate);

  if (!start && !end) {
    return null;
  }

  if (start && end && start !== end) {
    return `${start}–${end}`;
  }

  return start ?? end;
}

export function researchStatusLabel(status: ResearchItemStatus): string {
  const labels: Record<ResearchItemStatus, string> = {
    PLANNED: "Planned",
    ACTIVE: "Active",
    COMPLETED: "Completed",
    ON_HOLD: "On hold",
  };

  return labels[status];
}

export function publicationTypeLabel(type: PublicationType): string {
  const labels: Record<PublicationType, string> = {
    JOURNAL_ARTICLE: "Journal article",
    CONFERENCE_PAPER: "Conference paper",
    BOOK: "Book",
    BOOK_CHAPTER: "Book chapter",
    THESIS: "Thesis",
    REPORT: "Report",
    OTHER: "Publication",
  };

  return labels[type];
}
