import Link from "next/link";

import type { PublicPublication } from "../server/public-content-repository";
import {
  displayLinkLabel,
  doiUrl,
  formatYear,
  publicationTypeLabel,
  safeExternalUrl,
} from "./public-content-utils";

export function PublicationCard({
  publication,
}: Readonly<{
  publication: PublicPublication;
}>) {
  const articleUrl = safeExternalUrl(publication.url);
  const pdfUrl = safeExternalUrl(publication.pdfUrl);
  const publicationYear = formatYear(publication.publicationDate);
  const publicationDoiUrl = doiUrl(publication.doi);

  return (
    <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
        <span>{publicationTypeLabel(publication.publicationType)}</span>
        {publicationYear ? <span className="text-slate-400">{publicationYear}</span> : null}
        {publication.isFeatured ? (
          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] text-orange-900">
            منتخب
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
        {publication.title}
      </h3>
      {publication.authors.length ? (
        <p className="mt-3 text-sm leading-6 text-slate-700">
          <span className="font-semibold">نویسندگان:</span> {publication.authors.join("، ")}
        </p>
      ) : null}
      {publication.venue ? (
        <p className="mt-2 text-sm italic leading-6 text-muted">{publication.venue}</p>
      ) : null}
      {publication.citation ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">
          {publication.citation}
        </p>
      ) : null}
      {publication.abstract ? (
        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted">
          {publication.abstract}
        </p>
      ) : null}
      {publicationDoiUrl || articleUrl || pdfUrl ? (
        <ul className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
          {publicationDoiUrl ? (
            <li>
              <Link
                href={publicationDoiUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg text-accent underline decoration-accent/40 underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                DOI
              </Link>
            </li>
          ) : null}
          {articleUrl ? (
            <li>
              <Link
                href={articleUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg text-accent underline decoration-accent/40 underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                <span>رکورد خارجی</span>
                <span className="sr-only"> ({displayLinkLabel(articleUrl)})</span>
              </Link>
            </li>
          ) : null}
          {pdfUrl ? (
            <li>
              <Link
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg text-accent underline decoration-accent/40 underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                PDF
              </Link>
            </li>
          ) : null}
        </ul>
      ) : null}
    </article>
  );
}
