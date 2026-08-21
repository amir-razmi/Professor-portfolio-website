import { Container } from "@/components/ui/container";

export default function PublicLoading() {
  return (
    <div aria-busy="true" aria-label="Loading public page">
      <div className="border-b border-line bg-white">
        <Container className="animate-pulse py-16 sm:py-20 lg:py-24">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="mt-5 h-12 w-full max-w-3xl rounded bg-slate-200" />
          <div className="mt-5 h-5 w-full max-w-2xl rounded bg-slate-200" />
        </Container>
      </div>
      <Container className="animate-pulse space-y-5 py-16 sm:py-20">
        <div className="h-7 w-52 rounded bg-slate-200" />
        <div className="h-32 w-full rounded-2xl bg-slate-200" />
        <div className="h-32 w-full rounded-2xl bg-slate-200" />
      </Container>
    </div>
  );
}
