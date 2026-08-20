import { Container } from "../ui/container";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <Container className="flex flex-col gap-3 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Academic portfolio foundation</p>
        <p>Built for thoughtful scholarship and clear communication.</p>
      </Container>
    </footer>
  );
}
