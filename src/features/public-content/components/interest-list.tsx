import { Surface } from "@/components/ui/surface";

export function InterestList({
  emptyMessage,
  items,
}: Readonly<{
  emptyMessage: string;
  items: readonly string[];
}>) {
  return items.length ? (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-2xl border border-line bg-white p-5 text-base leading-7 text-muted"
        >
          {item}
        </li>
      ))}
    </ul>
  ) : (
    <Surface className="bg-white">
      <p className="text-sm leading-7 text-muted">{emptyMessage}</p>
    </Surface>
  );
}
