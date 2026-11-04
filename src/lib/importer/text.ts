/**
 * Text-only sanitising for imported fields: removes HTML (including <img>),
 * markdown images, data: URIs and bare image URLs. Never downloads anything.
 */
const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function toPlainText(input: unknown, max = 5000): string {
  let s = typeof input === "string" ? input : "";
  s = s
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/p>|<\/li>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi, " ")
    .replace(
      /https?:\/\/\S+\.(?:png|jpe?g|gif|webp|svg|avif|bmp)(?:\?\S*)?/gi,
      " ",
    )
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const code =
          e[1] === "x" || e[1] === "X"
            ? parseInt(e.slice(2), 16)
            : parseInt(e.slice(1), 10);
        return Number.isFinite(code) && code > 0 && code < 0x110000
          ? String.fromCodePoint(code)
          : " ";
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/<[^>]*>/g, " ");
  s = s
    .split("\n")
    .map((l) => l.replace(/[ \t\f\v\r]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}
