import React from 'react';

interface YuyanMarkdownRendererProps {
  content: string;
  className?: string;
  fontSize?: 'sm' | 'base';
}

export const YuyanMarkdownRenderer: React.FC<YuyanMarkdownRendererProps> = ({
  content,
  className = '',
  fontSize = 'sm',
}) => {
  if (!content) return null;

  // Split content by lines
  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = '';

  const parseInline = (text: string): React.ReactNode[] => {
    if (!text) return [];

    // Tokenize inline styles: bold (**), italic (*), code (`), link ([text](url))
    // Regex matches bold, italic, code, or links
    const tokens: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // 1. Code inline `code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        tokens.push(
          <code
            key={`code-${keyIdx++}`}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-200 dark:bg-slate-700 font-mono text-2xs text-primary-700 dark:text-primary-300 font-semibold"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // 2. Bold **text** or __text__
      const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
      if (boldMatch) {
        tokens.push(
          <strong key={`b-${keyIdx++}`} className="font-bold text-slate-900 dark:text-white">
            {parseInline(boldMatch[2])}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // 3. Italic *text* or _text_ (excluding bullet points at start of line)
      const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
      if (italicMatch && italicMatch[2].trim().length > 0) {
        tokens.push(
          <em key={`i-${keyIdx++}`} className="italic text-slate-700 dark:text-slate-300">
            {parseInline(italicMatch[2])}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // 4. Link [text](url)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        tokens.push(
          <a
            key={`link-${keyIdx++}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // 5. Plain character chunk until next markdown token
      const nextSpecial = remaining.search(/[`*_\[]/);
      if (nextSpecial === -1) {
        tokens.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        // Unmatched markdown character, take as literal
        tokens.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        tokens.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return tokens;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code block boundary
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <div key={`cb-${i}`} className="my-2 rounded-xl bg-slate-900 overflow-hidden border border-slate-700">
            {codeBlockLang && (
              <div className="px-3 py-1 bg-slate-800 text-3xs font-mono text-slate-400 border-b border-slate-700">
                {codeBlockLang}
              </div>
            )}
            <pre className="p-2.5 text-slate-100 font-mono text-2xs overflow-x-auto">
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          </div>
        );
        codeBlockLines = [];
        codeBlockLang = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBlockLang = trimmed.replace(/^```/, '').trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Empty line -> vertical spacing
    if (!trimmed) {
      elements.push(<div key={`sp-${i}`} className="h-1.5" />);
      continue;
    }

    // Horizontal Rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(
        <hr key={`hr-${i}`} className="my-2.5 border-slate-200 dark:border-slate-700" />
      );
      continue;
    }

    // Pedagogical Callout Box (e.g., 💡 Mẹo nhỏ..., 📌 Lưu ý...)
    if (trimmed.startsWith('💡') || trimmed.startsWith('📌') || trimmed.startsWith('👉')) {
      elements.push(
        <div
          key={`tip-${i}`}
          className="my-1.5 p-2 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 text-slate-800 dark:text-slate-100 text-xs leading-relaxed"
        >
          {parseInline(trimmed)}
        </div>
      );
      continue;
    }

    // Headings
    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h5
          key={`h4-${i}`}
          className="mt-2.5 mb-1 font-bold text-xs text-primary dark:text-primary-400 uppercase tracking-wider"
        >
          {parseInline(trimmed.replace(/^####\s+/, ''))}
        </h5>
      );
      continue;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4
          key={`h3-${i}`}
          className="mt-3 mb-1.5 font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5"
        >
          <span className="w-1.5 h-3.5 rounded-full bg-primary inline-block" />
          <span>{parseInline(trimmed.replace(/^###\s+/, ''))}</span>
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3
          key={`h2-${i}`}
          className="mt-3.5 mb-1.5 font-bold text-base text-slate-900 dark:text-white"
        >
          {parseInline(trimmed.replace(/^##\s+/, ''))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2
          key={`h1-${i}`}
          className="mt-4 mb-2 font-extrabold text-base text-slate-900 dark:text-white"
        >
          {parseInline(trimmed.replace(/^#\s+/, ''))}
        </h2>
      );
      continue;
    }

    // Bullet Lists (- or *)
    if (/^[-*+]\s+/.test(trimmed)) {
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2 my-0.5 pl-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
          <span className="leading-relaxed flex-1">{parseInline(trimmed.replace(/^[-*+]\s+/, ''))}</span>
        </div>
      );
      continue;
    }

    // Numbered Lists (1., 2.)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`nli-${i}`} className="flex items-start gap-2 my-0.5 pl-1.5">
          <span className="font-bold text-2xs px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
            {numMatch[1]}
          </span>
          <span className="leading-relaxed flex-1">{parseInline(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`bq-${i}`}
          className="my-1.5 pl-3 border-l-2 border-primary/60 italic text-slate-600 dark:text-slate-400"
        >
          {parseInline(trimmed.replace(/^>\s+/, ''))}
        </blockquote>
      );
      continue;
    }

    // Normal Paragraph
    elements.push(
      <p key={`p-${i}`} className="my-0.5 leading-relaxed break-words">
        {parseInline(trimmed)}
      </p>
    );
  }

  return (
    <div
      className={`yuyan-markdown leading-relaxed ${
        fontSize === 'sm' ? 'text-xs md:text-sm' : 'text-sm'
      } ${className}`}
    >
      {elements}
    </div>
  );
};
