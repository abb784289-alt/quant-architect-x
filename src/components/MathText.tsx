import katex from "katex";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toArabicDigits = (s: string) => s.replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);

/** يحوّل الأرقام إلى العربية داخل النصوص فقط دون المساس بسمات HTML. */
const arabizeHtml = (html: string) =>
  html.replace(/>([^<]+)</g, (_m, text: string) => ">" + toArabicDigits(text) + "<");

function render(tex: string, displayMode: boolean) {
  try {
    return arabizeHtml(
      katex.renderToString(tex, { displayMode, throwOnError: false, strict: false, output: "html" }),
    );
  } catch {
    return toArabicDigits(tex);
  }
}

/** Renders a mixed Arabic/LaTeX string: anything between $...$ or $$...$$ is typeset with KaTeX. */
export function MathText({ text }: { text: string }) {
  const parts = String(text ?? "").split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);
  return (
    <span className="whitespace-pre-line">
      {parts.map((part, index) => {
        if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) {
          return (
            <span
              key={index}
              dir="ltr"
              className="block my-1 [unicode-bidi:isolate]"
              dangerouslySetInnerHTML={{ __html: render(part.slice(2, -2), true) }}
            />
          );
        }
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          return (
            <span
              key={index}
              dir="ltr"
              className="inline-block align-middle [unicode-bidi:isolate]"
              dangerouslySetInnerHTML={{ __html: render(part.slice(1, -1), false) }}
            />
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

export default MathText;
