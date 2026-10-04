import { parse } from '../src/parser/parse.js';
import { SAMPLES, BLANK } from '../src/samples.js';
import { encodeSource, decodeSource, fileStem } from '../src/share.js';

QUnit.module('samples', () => {
  for (const sample of [...SAMPLES, { id: 'blank', source: BLANK }]) {
    QUnit.test(`sample "${sample.id}" parses without errors`, (assert) => {
      const { map, errors } = parse(sample.source);
      assert.deepEqual(errors, []);
      assert.true(map.components.length > 0);
    });
  }

  QUnit.test('sample ids are unique', (assert) => {
    assert.strictEqual(new Set(SAMPLES.map((s) => s.id)).size, SAMPLES.length);
  });
});

QUnit.module('share', () => {
  QUnit.test('encode/decode round-trips text including non-ASCII', (assert) => {
    const text = 'title Café ☕\ncomponent A [product][0.5, 0.5]\n';
    const encoded = encodeSource(text);
    assert.true(/^[A-Za-z0-9_-]*$/.test(encoded), 'URL safe');
    assert.strictEqual(decodeSource(encoded), text);
  });

  QUnit.test('decodeSource returns null for garbage', (assert) => {
    assert.strictEqual(decodeSource('%%%'), null);
  });

  QUnit.test('fileStem makes safe file names', (assert) => {
    assert.strictEqual(fileStem('Tea Shop!'), 'tea-shop');
    assert.strictEqual(fileStem(''), 'wardley-map');
    assert.strictEqual(fileStem('***'), 'wardley-map');
  });
});
