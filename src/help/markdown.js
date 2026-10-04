// A small Markdown reader for the help documents: headings, paragraphs, bullet and numbered lists,
// fenced code blocks, pipe tables, and inline `code`, **bold** and [links](url). It produces plain data;
// helpDialog.js turns that into DOM, so no HTML strings are ever built.

/** Split inline text into { type: 'text' | 'code' | 'bold' | 'link', text, href? } pieces. */
export function parseInline(text) {
  const pieces = [];
  const re = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) pieces.push({ type: 'text', text: text.slice(last, m.index) });
    if (m[1] !== undefined) pieces.push({ type: 'code', text: m[1] });
    else if (m[2] !== undefined) pieces.push({ type: 'bold', text: m[2] });
    else pieces.push({ type: 'link', text: m[3], href: m[4] });
    last = re.lastIndex;
  }
  if (last < text.length) pieces.push({ type: 'text', text: text.slice(last) });
  return pieces;
}

const FENCE = /^```\s*(\S*)\s*$/;
const HEADING = /^(#{1,6})\s+(.*)$/;
const LIST_ITEM = /^\s*([-*]|\d+\.)\s+(.*)$/;
const TABLE_SEPARATOR = /^\s*\|?\s*:?-{3,}/;

const splitRow = (row) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));

/**
 * Parse Markdown into blocks:
 * { type: 'heading', level, text } | { type: 'paragraph', text } | { type: 'code', lang, text }
 * | { type: 'list', ordered, items: [text] } | { type: 'table', header: [text], rows: [[text]] }
 */
export function parseMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  const startsBlock = (line) => FENCE.test(line) || HEADING.test(line) || LIST_ITEM.test(line) || line.trim().startsWith('|');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }

    const fence = line.match(FENCE);
    if (fence) {
      const code = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) { code.push(lines[i]); i += 1; }
      i += 1; // the closing fence
      blocks.push({ type: 'code', lang: fence[1], text: code.join('\n') });
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() });
      i += 1;
      continue;
    }

    if (line.trim().startsWith('|') && TABLE_SEPARATOR.test(lines[i + 1] ?? '')) {
      const header = splitRow(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(splitRow(lines[i])); i += 1; }
      blocks.push({ type: 'table', header, rows });
      continue;
    }

    const first = line.match(LIST_ITEM);
    if (first) {
      const items = [];
      const ordered = /\d/.test(first[1]);
      while (i < lines.length) {
        const item = lines[i].match(LIST_ITEM);
        if (item) {
          if (/\d/.test(item[1]) !== ordered) break; // a bullet list followed by a numbered one is two lists
          items.push(item[2]);
          i += 1;
          continue;
        }
        // A more-indented line continues the previous item.
        if (lines[i].trim() && /^\s+\S/.test(lines[i]) && items.length) { items[items.length - 1] += ` ${lines[i].trim()}`; i += 1; continue; }
        break;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paragraph = [];
    while (i < lines.length && lines[i].trim() && !(paragraph.length && startsBlock(lines[i]))) { paragraph.push(lines[i].trim()); i += 1; }
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
  }
  return blocks;
}

/** Turn a heading into an id: "Pointing at a component" -> "pointing-at-a-component". */
export const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
