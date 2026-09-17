import React from 'react';

/**
 * Parses and renders inline markdown tokens:
 * - Bold: **text** or __text__
 * - Italic: *text* or _text_
 * - Bold & Italic: ***text***
 * - Inline Code: `code`
 * - Strikethrough: ~~text~~
 * - Links: [label](url)
 * - Mentions: @username
 * - Escaped characters & entities
 */
export function renderInlineMarkdown(text) {
  if (!text || typeof text !== 'string') return '';

  // Clean raw escape sequences
  let cleanText = text
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Tokenize using regex covering bold-italic, bold, italic, strikethrough, inline code, links, and mentions
  const tokenRegex = /(\*\*\*.*?\*\*\*|___.*?___|\*\*.*?\*\*|__.*?__|~~.*?~~|`.*?`|\[.*?\]\(https?:\/\/[^\s)]+\)|@[a-zA-Z0-9._-]+|\*[^*]+\*|_[^_]+_)/g;
  const parts = cleanText.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Bold + Italic: ***text*** or ___text___
    if ((part.startsWith('***') && part.endsWith('***') && part.length >= 6) ||
        (part.startsWith('___') && part.endsWith('___') && part.length >= 6)) {
      return (
        <strong key={idx} className="font-bold italic text-foreground">
          {part.slice(3, -3)}
        </strong>
      );
    }

    // Bold: **text** or __text__
    if ((part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
        (part.startsWith('__') && part.endsWith('__') && part.length >= 4)) {
      return (
        <strong key={idx} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Strikethrough: ~~text~~
    if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
      return (
        <span key={idx} className="line-through text-muted-foreground">
          {part.slice(2, -2)}
        </span>
      );
    }

    // Inline code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={idx} className="px-1.5 py-0.5 rounded bg-muted/90 font-mono text-[11px] text-primary border border-border/80">
          {part.slice(1, -1)}
        </code>
      );
    }

    // Links: [label](url)
    const linkMatch = part.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 font-medium inline-flex items-center gap-0.5"
        >
          {linkMatch[1] || linkMatch[2]}
        </a>
      );
    }

    // Mentions: @username
    if (part.startsWith('@') && part.length >= 2) {
      return (
        <span
          key={idx}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-xs font-semibold bg-primary/15 border border-primary/30 text-primary"
        >
          {part}
        </span>
      );
    }

    // Italic: *text* or _text_
    if ((part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
        (part.startsWith('_') && part.endsWith('_') && part.length >= 2)) {
      return (
        <em key={idx} className="italic text-foreground/90">
          {part.slice(1, -1)}
        </em>
      );
    }

    return part;
  });
}

/**
 * Strips all markdown syntax and symbols to return plain, natural human-readable text.
 */
export function stripMarkdownToPlainText(content) {
  if (!content || typeof content !== 'string') return '';
  return content
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\n/g, ' ')
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/___([^_]+)___/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*>\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const isTableLine = (line) => {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 1;
};

const parseTableRow = (line) => {
  const trimmed = line.trim();
  const raw = trimmed.split('|');
  if (raw.length > 0 && raw[0].trim() === '') raw.shift();
  if (raw.length > 0 && raw[raw.length - 1].trim() === '') raw.pop();
  return raw.map((c) => c.trim());
};

const isDelimiterRow = (cells) => {
  return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c.trim()));
};

const peekNextNonEmptyStartsTable = (linesArr, currentIndex) => {
  for (let j = currentIndex + 1; j < linesArr.length; j++) {
    const nextTrimmed = linesArr[j].trim();
    if (nextTrimmed === '') continue;
    return isTableLine(nextTrimmed);
  }
  return false;
};

/**
 * Renders full structured Markdown including headers, code blocks, lists, blockquotes, and tables.
 */
export default function FormattedMarkdown({ content, className = '' }) {
  if (!content || typeof content !== 'string') return null;

  // Normalize newlines and unescape stringified JSON line breaks
  const normalized = content.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const elements = [];

  let inList = null; // 'ul' | 'ol'
  let listItems = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines = [];

  // Table state
  let inTable = false;
  let tableHeader = [];
  let tableAlignments = [];
  let tableRows = [];

  const flushTable = (key) => {
    if (!inTable) return;
    if (tableHeader.length > 0 || tableRows.length > 0) {
      elements.push(
        <div key={`table-${key}`} className="my-3.5 overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-950/70 shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            {tableHeader.length > 0 && (
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-700/80 text-amber-300 font-semibold">
                  {tableHeader.map((cell, idx) => (
                    <th
                      key={idx}
                      className="py-2.5 px-3.5 font-semibold text-amber-300 tracking-wide border-r border-slate-800 last:border-r-0 whitespace-nowrap"
                      style={{ textAlign: tableAlignments[idx] || 'left' }}
                    >
                      {renderInlineMarkdown(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-800/60">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="py-2.5 px-3.5 text-slate-200 leading-relaxed border-r border-slate-800/40 last:border-r-0"
                      style={{ textAlign: tableAlignments[cIdx] || 'left' }}
                    >
                      {cell ? renderInlineMarkdown(cell) : <span className="text-slate-600">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    inTable = false;
    tableHeader = [];
    tableAlignments = [];
    tableRows = [];
  };

  const flushList = (key) => {
    if (!inList || listItems.length === 0) return;
    if (inList === 'ul') {
      elements.push(
        <ul key={`ul-${key}`} className="list-disc pl-5 space-y-1 my-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed text-foreground/90">{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
    } else if (inList === 'ol') {
      elements.push(
        <ol key={`ol-${key}`} className="list-decimal pl-5 space-y-1 my-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed text-foreground/90">{renderInlineMarkdown(item)}</li>
          ))}
        </ol>
      );
    }
    inList = null;
    listItems = [];
  };

  const flushCodeBlock = (key) => {
    if (!inCodeBlock) return;
    const code = codeBlockLines.join('\n');
    elements.push(
      <div key={`code-${key}`} className="my-3 rounded-lg overflow-hidden border border-border bg-muted/60">
        {codeBlockLang && (
          <div className="bg-muted/90 px-3 py-1 text-[11px] font-mono text-muted-foreground border-b border-border font-semibold uppercase tracking-wider">
            {codeBlockLang}
          </div>
        )}
        <pre className="p-3.5 text-xs font-mono overflow-x-auto text-foreground/90 leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    );
    inCodeBlock = false;
    codeBlockLang = '';
    codeBlockLines = [];
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Code block fences
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock(i);
      } else {
        flushList(i);
        flushTable(i);
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Markdown Table Rows (with support for blank lines between rows)
    if (isTableLine(line)) {
      flushList(i);
      const cells = parseTableRow(line);
      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else if (tableRows.length === 0 && isDelimiterRow(cells)) {
        tableAlignments = cells.map((c) => {
          const t = c.trim();
          if (t.startsWith(':') && t.endsWith(':')) return 'center';
          if (t.endsWith(':')) return 'right';
          return 'left';
        });
      } else if (!isDelimiterRow(cells)) {
        tableRows.push(cells);
      }
      return;
    }

    // Handle empty line: if inside table and next non-empty line is table, keep table open
    if (trimmed === '') {
      if (inTable && peekNextNonEmptyStartsTable(lines, i)) {
        return;
      }
      flushTable(i);
      flushList(i);
      return;
    }

    // Non-table line encountered while inTable
    if (inTable) {
      flushTable(i);
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList(i);
      elements.push(<hr key={i} className="my-3.5 border-t border-border" />);
      return;
    }

    // Blockquote
    if (trimmed.startsWith('> ') || trimmed === '>') {
      flushList(i);
      elements.push(
        <blockquote key={i} className="border-l-4 border-primary/50 pl-3 py-1 my-2 italic text-muted-foreground bg-primary/5 rounded-r-md">
          {renderInlineMarkdown(trimmed.replace(/^>\s*/, ''))}
        </blockquote>
      );
      return;
    }

    // Phase Callout Banner: e.g. "Phase 1: Foundational Phase (Month 1)"
    const phaseMatch = trimmed.match(/^(?:#{1,3}\s*)?(Phase\s+\d+[:\s][^#\n]+)/i);
    if (phaseMatch) {
      flushList(i);
      elements.push(
        <div key={`phase-${i}`} className="mt-5 mb-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-transparent border-l-4 border-amber-500 border-y border-r border-slate-800/60 shadow-xs">
          <span className="font-display font-bold text-sm text-amber-300 tracking-wide flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold uppercase">Phase Target</span>
            {renderInlineMarkdown(phaseMatch[1].replace(/^(?:#{1,3}\s*)?Phase\s+\d+[:\s]*/i, ''))}
          </span>
        </div>
      );
      return;
    }

    // Objectives Callout
    if (/^Objectives?:/i.test(trimmed)) {
      flushList(i);
      elements.push(
        <div key={`obj-${i}`} className="my-2.5 p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-200">
          <strong className="font-semibold text-indigo-300">🎯 Objective: </strong>
          {renderInlineMarkdown(trimmed.replace(/^Objectives?:\s*/i, ''))}
        </div>
      );
      return;
    }

    // Major Section Header: e.g. "1. Phase-wise Breakdown", "2. State-specific Local Laws"
    const sectionMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (sectionMatch && /^(Phase|State-specific|Transition|Daily|Overall|Requirements|Objectives|End Note|Summary|Key)/i.test(sectionMatch[2].trim())) {
      flushList(i);
      elements.push(
        <h3 key={`sec-${i}`} className="font-display font-bold text-base text-white mt-5 mb-2 pb-1 border-b border-slate-800 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
            {sectionMatch[1]}
          </span>
          <span>{renderInlineMarkdown(sectionMatch[2].trim())}</span>
        </h3>
      );
      return;
    }

    // Headers
    if (trimmed.startsWith('#### ')) {
      flushList(i);
      elements.push(
        <h4 key={i} className="font-display font-semibold text-sm text-foreground mt-3 mb-1">
          {renderInlineMarkdown(trimmed.replace(/^####\s+/, ''))}
        </h4>
      );
    } else if (trimmed.startsWith('### ')) {
      flushList(i);
      elements.push(
        <h3 key={i} className="font-display font-bold text-base text-foreground mt-3.5 mb-1.5">
          {renderInlineMarkdown(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList(i);
      elements.push(
        <h2 key={i} className="font-display font-bold text-lg text-foreground mt-4 mb-2">
          {renderInlineMarkdown(trimmed.replace(/^##\s+/, ''))}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      flushList(i);
      elements.push(
        <h1 key={i} className="font-display font-bold text-xl text-foreground mt-4.5 mb-2.5">
          {renderInlineMarkdown(trimmed.replace(/^#\s+/, ''))}
        </h1>
      );
    } else if (/^[-*•]\s+/.test(trimmed)) {
      // Unordered list item
      if (inList !== 'ul') {
        flushList(i);
        inList = 'ul';
      }
      listItems.push(trimmed.replace(/^[-*•]\s+/, ''));
    } else if (/^\d+\.\s+/.test(trimmed)) {
      // Ordered list item
      if (inList !== 'ol') {
        flushList(i);
        inList = 'ol';
      }
      listItems.push(trimmed.replace(/^\d+\.\s+/, ''));
    } else {
      flushList(i);
      elements.push(
        <p key={i} className="my-1.5 leading-relaxed text-foreground/90">
          {renderInlineMarkdown(line)}
        </p>
      );
    }
  });

  flushList('final');
  flushTable('final');
  flushCodeBlock('final');

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}
