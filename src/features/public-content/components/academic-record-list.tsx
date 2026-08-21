import { Surface } from "@/components/ui/surface";

export function AcademicRecordList({
  emptyMessage = "هنوز موردی منتشر نشده است.",
  items,
  title,
}: Readonly<{
  emptyMessage?: string;
  items: readonly string[];
  title: string;
}>) {
  return (
    <Surface className="h-full bg-slate-50">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      {items.length ? (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li
              key={item}
              className="border-r-2 border-accent/50 pr-4 text-sm leading-6 text-muted"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm leading-6 text-muted">{emptyMessage}</p>
      )}
    </Surface>
  );
}
