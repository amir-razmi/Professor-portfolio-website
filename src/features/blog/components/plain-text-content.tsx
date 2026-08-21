export function splitPlainTextParagraphs(content: string): string[] {
  return content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/**
 * Blog content is intentionally stored and rendered as plain text.
 *
 * React escapes each string node, so angle brackets, scripts, and event-handler
 * attributes are displayed as text rather than interpreted as HTML. We do not
 * parse Markdown or enable raw HTML in this stage; a future rich-text format
 * must add an explicit sanitizer before rendering.
 */
export function PlainTextContent({
  content,
  className = "",
}: Readonly<{
  content: string;
  className?: string;
}>) {
  const paragraphs = splitPlainTextParagraphs(content);

  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 24)}`} className="whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
