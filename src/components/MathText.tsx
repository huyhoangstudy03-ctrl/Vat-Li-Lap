import katex from 'katex';
import { useMemo } from 'react';

interface MathTextProps {
  latex: string;
  display?: boolean;
  className?: string;
}

export function MathText({ latex, display = false, className = '' }: MathTextProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode: display,
        throwOnError: false,
        strict: false,
        trust: false,
      });
    } catch {
      return '';
    }
  }, [latex, display]);

  if (!html) {
    return <code className={`font-mono text-sm ${className}`}>{latex}</code>;
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
