import { parse } from '../src/parser/parse.js';
import { parseMarkdown, parseInline, slug } from '../src/help/markdown.js';

// The syntax document is read from disk under Node and over HTTP in the browser.
async function loadDoc() {
  const url = new URL('../docs/syntax.md', import.meta.url);
  if (url.protocol === 'file:') {
    const { readFile } = await import('node:fs/promises');
    return readFile(url, 'utf8');
  }
  return (await fetch(url)).text();
}

QUnit.module('markdown reader', () => {
  QUnit.test('headings, paragraphs (joined lines), lists and code blocks', (assert) => {
    const blocks = parseMarkdown(`# Title

First line
second line

- one
- two
  continued
1. a
2. b

\`\`\`wardley
component A [0.5, 0.5]

// blank line above is kept
\`\`\`
`);
    assert.deepEqual(blocks, [
      { type: 'heading', level: 1, text: 'Title' },
      { type: 'paragraph', text: 'First line second line' },
      { type: 'list', ordered: false, items: ['one', 'two continued'] },
      { type: 'list', ordered: true, items: ['a', 'b'] },
      { type: 'code', lang: 'wardley', text: 'component A [0.5, 0.5]\n\n// blank line above is kept' },
    ]);
  });

  QUnit.test('pipe tables, including an escaped pipe in a cell', (assert) => {
    const [table] = parseMarkdown(`| Name | Example |
| --- | --- |
| Either | \`a\\|b\` |
| Plain | x |`);
    assert.deepEqual(table, { type: 'table', header: ['Name', 'Example'], rows: [['Either', '`a|b`'], ['Plain', 'x']] });
  });

  QUnit.test('inline code, bold and links; everything else is text', (assert) => {
    assert.deepEqual(parseInline('Use `note` and **bold** or [docs](docs/x.md).'), [
      { type: 'text', text: 'Use ' },
      { type: 'code', text: 'note' },
      { type: 'text', text: ' and ' },
      { type: 'bold', text: 'bold' },
      { type: 'text', text: ' or ' },
      { type: 'link', text: 'docs', href: 'docs/x.md' },
      { type: 'text', text: '.' },
    ]);
    assert.deepEqual(parseInline('<b>not html</b>'), [{ type: 'text', text: '<b>not html</b>' }]);
  });

  QUnit.test('slug makes heading ids', (assert) => {
    assert.strictEqual(slug('Pointing at a component'), 'pointing-at-a-component');
  });
});

QUnit.module('syntax document', () => {
  QUnit.test('every ```wardley example parses without errors', async (assert) => {
    const examples = parseMarkdown(await loadDoc()).filter((b) => b.type === 'code' && b.lang === 'wardley');
    assert.true(examples.length >= 15, `found ${examples.length} examples`);
    examples.forEach((example, i) => {
      assert.deepEqual(parse(example.text).errors, [], `example ${i + 1}:\n${example.text}`);
    });
  });

  QUnit.test('every statement the parser understands is documented', async (assert) => {
    const text = await loadDoc();
    const statements = ['title', 'component', 'anchor', 'evolve', 'inertia', 'build', 'buy', 'outsource', 'pipeline', 'note', 'end note', 'color', '->', '`capability Name`', '`need Name`', '`practice Name`', '`data Name`', '`knowledge Name`', '`market Name`', '`ecosystem Name`', 'pipeline Kettle "Variants" {'];
    for (const s of statements) assert.true(text.includes(s), `documents "${s}"`);
  });

  QUnit.test('has a section for each feature', async (assert) => {
    const headings = parseMarkdown(await loadDoc()).filter((b) => b.type === 'heading').map((b) => b.text);
    for (const h of ['The basics', 'Components and anchors', 'Component types', 'Links', 'Evolution arrows', 'Inertia', 'Sourcing', 'Pipelines', 'Notes', 'Stage colours', 'Quick reference']) {
      assert.true(headings.includes(h), `has "${h}"`);
    }
  });
});
