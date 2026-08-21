import { Container } from "../ui/container";

export function SiteFooter({
  contactEmail,
  footerText,
  siteName,
}: Readonly<{
  contactEmail?: string | null;
  footerText?: string | null;
  siteName: string;
}>) {
  return (
    <footer className="border-t border-line bg-white">
      <Container className="flex flex-col gap-3 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{footerText ?? `${siteName} · پرتفولیوی دانشگاهی`}</p>
        {contactEmail ? (
          <a
            href={`mailto:${contactEmail}`}
            className="underline decoration-accent/50 underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            {contactEmail}
          </a>
        ) : (
          <p>برای ارائه روشن و دقیق فعالیت‌های علمی.</p>
        )}
      </Container>
    </footer>
  );
}
