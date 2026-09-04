import katex from "katex";

function render(tex: string, displayMode: boolean) {
  try {
    return katex.renderToString(tex, { displayMode, throwOnError: false, strict: false, output: "html" });
  } catch {
    return tex;
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
