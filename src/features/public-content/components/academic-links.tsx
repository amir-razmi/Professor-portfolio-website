import Link from "next/link";

import type { ProfessorProfileRecord } from "@/features/professor-profile/server/profile-service";

import { displayLinkLabel, safeExternalUrl } from "./public-content-utils";

const linkFields = [
  ["وب‌سایت", "websiteUrl"],
  ["ORCID", "orcid"],
  ["گوگل اسکالر", "googleScholarUrl"],
  ["ریسرچ‌گیت", "researchGateUrl"],
  ["LinkedIn", "linkedinUrl"],
  ["GitHub", "githubUrl"],
] as const;

export function AcademicLinks({
  profile,
}: Readonly<{
  profile: ProfessorProfileRecord;
}>) {
  const links = linkFields.flatMap(([label, field]) => {
    const url = safeExternalUrl(profile[field]);
    return url ? [{ label, url }] : [];
  });

  if (!links.length) {
    return <p className="text-sm leading-7 text-muted">لینکهای علمی به‌زودی افزوده می‌شوند.</p>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-950">لینکهای علمی و اجتماعی</h3>
      <ul className="mt-4 flex flex-wrap gap-3">
        {links.map((link) => (
          <li key={link.url}>
            <Link
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full rounded-full border border-line px-3 py-2 text-sm font-medium text-accent transition hover:border-accent hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span className="truncate">{link.label}</span>
              <span className="sr-only"> ({displayLinkLabel(link.url)})</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
