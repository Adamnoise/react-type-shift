
import { useEffect, useState } from "react";
import { Prism as PrismSyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeHighlighterProps {
  code: string;
  language: string;
}

export const SyntaxHighlighter = ({ code, language }: CodeHighlighterProps) => {
  const [mounted, setMounted] = useState(false);

  // Avoid hydration issues with syntax highlighting
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-4 text-sm font-mono whitespace-pre-wrap">{code}</div>;
  }

  return (
    <PrismSyntaxHighlighter 
      language={language} 
      style={vscDarkPlus}
      customStyle={{
        margin: 0,
        borderRadius: 0,
        fontSize: "0.9rem",
        background: 'transparent',
      }}
      wrapLines={true}
      wrapLongLines={true}
    >
      {code || "// No code to display"}
    </PrismSyntaxHighlighter>
  );
};
