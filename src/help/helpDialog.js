import { parseMarkdown, parseInline, slug } from './markdown.js';

const SAFE_HREF = /^(https?:|\.{0,2}\/|#)/i; // never let a document link run script

function inline(parent, text) {
  for (const piece of parseInline(text)) {
    if (piece.type === 'text') { parent.append(document.createTextNode(piece.text)); continue; }
    const el = document.createElement({ code: 'code', bold: 'strong', link: 'a' }[piece.type]);
    el.textContent = piece.text;
    if (piece.type === 'link' && SAFE_HREF.test(piece.href)) { el.href = piece.href; el.target = '_blank'; el.rel = 'noopener'; }
    parent.append(el);
  }
  return parent;
}

const el = (tag, text) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
};

function renderBlock(block, onTry) {
  switch (block.type) {
    case 'heading': {
      const h = inline(el(`h${Math.min(block.level + 1, 6)}`), block.text); // the dialog title is the h1
      h.id = slug(block.text);
      return h;
    }
    case 'paragraph':
      return inline(el('p'), block.text);
    case 'list': {
      const list = el(block.ordered ? 'ol' : 'ul');
      block.items.forEach((item) => list.append(inline(el('li'), item)));
      return list;
    }
    case 'table': {
      const table = el('table');
      const head = table.createTHead().insertRow();
      block.header.forEach((cell) => head.append(inline(el('th'), cell)));
      const body = table.createTBody();
      block.rows.forEach((row) => {
        const tr = body.insertRow();
        row.forEach((cell) => tr.insertCell().append(inline(el('span'), cell)));
      });
      return table;
    }
    case 'code': {
      const wrap = el('div');
      wrap.className = 'doc-code';
      const pre = el('pre');
      pre.append(el('code', block.text));
      wrap.append(pre);
      if (block.lang === 'wardley' && onTry) {
        const btn = el('button', 'Try it');
        btn.type = 'button';
        btn.addEventListener('click', () => onTry(block.text));
        wrap.append(btn);
      }
      return wrap;
    }
    default:
      return el('div');
  }
}

/**
 * The help window: a <dialog> that loads a Markdown document and shows it with a contents list.
 * `onTry(code)` is called when someone presses "Try it" under an example.
 */
export function initHelpDialog({ dialog, body, url, onTry }) {
  let loaded = false;

  function show(markdown) {
    const blocks = parseMarkdown(markdown);
    const nodes = blocks.map((b) => renderBlock(b, onTry));
    // A contents list from the level-2 headings, placed after the intro heading and first paragraph.
    const toc = el('nav');
    toc.setAttribute('aria-label', 'Contents');
    toc.className = 'doc-toc';
    const list = el('ul');
    blocks.filter((b) => b.type === 'heading' && b.level === 2).forEach((b) => {
      const li = el('li');
      const link = el('button', b.text);
      link.type = 'button';
      link.addEventListener('click', () => body.querySelector(`#${CSS.escape(slug(b.text))}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      li.append(link);
      list.append(li);
    });
    toc.append(list);
    const firstSection = blocks.findIndex((b) => b.type === 'heading' && b.level === 2);
    nodes.splice(firstSection < 0 ? nodes.length : firstSection, 0, toc);
    body.replaceChildren(...nodes);
  }

  async function open() {
    if (!dialog.open) dialog.showModal();
    if (loaded) return;
    body.textContent = 'Loading…';
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      show(await response.text());
      loaded = true;
    } catch (e) {
      body.textContent = `The help document could not be loaded (${e.message}). If you opened this page directly from disk, serve it with a local web server instead.`;
    }
  }

  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); }); // click on the backdrop
  dialog.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
  return { open, close: () => dialog.close() };
}
