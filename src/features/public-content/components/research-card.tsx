import Link from "next/link";

import type { PublicResearchItem } from "../server/public-content-repository";
import {
  displayLinkLabel,
  formatDateRange,
  researchStatusLabel,
  safeExternalUrl,
} from "./public-content-utils";

export function ResearchCard({
  item,
}: Readonly<{
  item: PublicResearchItem;
}>) {
  const externalUrl = safeExternalUrl(item.externalUrl);
  const dateRange = formatDateRange(item.startDate, item.endDate);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
        <span>{researchStatusLabel(item.status)}</span>
        {dateRange ? <span className="text-slate-400">{dateRange}</span> : null}
      </div>
      <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">{item.title}</h3>
      {item.summary ? <p className="mt-3 text-base leading-7 text-muted">{item.summary}</p> : null}
      {item.description ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">{item.description}</p>
      ) : null}
      {externalUrl ? (
        <div className="mt-auto pt-6">
          <Link
            href={externalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center gap-2 rounded-lg text-sm font-semibold text-accent underline decoration-accent/40 underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <span className="truncate">جزئیات پروژه</span>
            <span className="sr-only"> ({displayLinkLabel(externalUrl)})</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      ) : null}
    </article>
  );
}
