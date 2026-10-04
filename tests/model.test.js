import { STAGE_INFO, HELP_INFO } from '../src/model/stageInfo.js';
import { STAGES, createMap, addComponent, addLink, stageAt, clamp01 } from '../src/model/wardley.js';

QUnit.module('stage info', () => {
  QUnit.test('every stage has complete teaching text', (assert) => {
    for (const s of STAGES) {
      const info = STAGE_INFO[s.key];
      assert.true(!!info, `${s.key} has info`);
      for (const f of ['tagline', 'definition', 'examples', 'insight']) assert.true(info[f]?.length > 0, `${s.key}.${f}`);
      assert.true(info.traits.length >= 3, `${s.key} traits`);
    }
  });
});

QUnit.module('axis info', () => {
  QUnit.test('every axis label and mark has help text', (assert) => {
    assert.deepEqual(Object.keys(HELP_INFO).sort(), ['build', 'buy', 'data', 'ecosystem', 'evolution', 'inertia', 'invisible', 'knowledge', 'market', 'need', 'outsource', 'pipeline', 'practice', 'value-chain', 'visible']);
    for (const [key, info] of Object.entries(HELP_INFO)) {
      for (const f of ['title', 'tagline', 'definition']) assert.true(info[f]?.length > 0, `${key}.${f}`);
      assert.true(info.traits.length > 0 && info.facts.length > 0, `${key} traits and facts`);
    }
  });
});

QUnit.module('model', () => {
  QUnit.test('clamp01 bounds values', (assert) => {
    assert.strictEqual(clamp01(-1), 0);
    assert.strictEqual(clamp01(2), 1);
  });

  QUnit.test('stageAt maps evolution to stage', (assert) => {
    assert.strictEqual(stageAt(0.05).name, 'Genesis');
    assert.strictEqual(stageAt(0.5).name, 'Product (+rental)');
    assert.strictEqual(stageAt(1).name, 'Commodity (+utility)');
  });

  QUnit.test('rejects duplicates and unknown link endpoints', (assert) => {
    const m = createMap();
    addComponent(m, { name: 'A', visibility: 0.5, evolution: 0.5 });
    assert.throws(() => addComponent(m, { name: 'A', visibility: 0, evolution: 0 }), /Duplicate/);
    assert.throws(() => addLink(m, 'A', 'B'), /Unknown/);
  });
});
