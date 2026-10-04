import { parse } from '../src/parser/parse.js';
import { TUTORIALS } from '../src/tutorial/tutorials.js';
import { resolveTarget, arrowGeometry, roughRing } from '../src/tutorial/geometry.js';

const point = (v, e) => [100 * e, 100 * (1 - v)];

QUnit.module('tutorial content', () => {
  for (const tutorial of TUTORIALS) {
    QUnit.test(`"${tutorial.id}": every step parses cleanly and its notes point at real things`, (assert) => {
      tutorial.steps.forEach((step, i) => {
        const { map, errors } = parse(step.source);
        assert.strictEqual(errors.length, step.expectErrors ?? 0, `step ${i + 1} parses${step.expectErrors ? ' with the intended error' : ' cleanly'}: ${JSON.stringify(errors)}`);
        assert.true(step.title.length > 0 && step.body.length > 0, `step ${i + 1} has text`);
        for (const note of step.notes) {
          assert.true(note.at.length === 2 && note.text.length > 0, `step ${i + 1} note placed`);
          assert.notStrictEqual(resolveTarget(note.target, map, point), null, `step ${i + 1}: "${note.text}" has a valid target`);
        }
      });
    });
  }

  QUnit.test('tutorials have unique ids and names, and every deep link target exists', (assert) => {
    assert.strictEqual(new Set(TUTORIALS.map((t) => t.id)).size, TUTORIALS.length);
    assert.strictEqual(new Set(TUTORIALS.map((t) => t.name)).size, TUTORIALS.length);
    assert.true(TUTORIALS.length >= 6);
  });

  QUnit.test('the last step is the finished map', (assert) => {
    const steps = TUTORIALS[0].steps;
    const { map } = parse(steps[steps.length - 1].source);
    assert.strictEqual(map.components.length, 5);
    assert.strictEqual(map.evolutions.length, 1);
    assert.deepEqual(map.components.filter((c) => c.inertia).map((c) => c.name), ['Kettle']);
  });
});

QUnit.module('tutorial geometry', () => {
  const { map } = parse(`component A [product][50, 50]
evolve A [commodity][50]`);

  QUnit.test('resolveTarget handles each target kind and unknown names', (assert) => {
    const near = (pos, [x, y]) => Math.abs(pos[0] - x) < 1e-9 && Math.abs(pos[1] - y) < 1e-9;
    assert.true(near(resolveTarget({ component: 'A' }, map, point).pos, [55, 50]));
    assert.true(resolveTarget({ component: 'A' }, map, point).ring);
    assert.true(near(resolveTarget({ evolve: 'A' }, map, point).pos, [85, 50]));
    assert.deepEqual(resolveTarget({ point: [1, 0] }, map, point).pos, [0, 0]);
    assert.strictEqual(resolveTarget({ stage: 'product' }, map, point).pos[1], 110);
    assert.strictEqual(resolveTarget({ component: 'Nope' }, map, point), null);
    const linked = parse(`component A [product][50, 50]
component B [commodity][10, 50]`).map;
    const [kx, ky] = resolveTarget({ link: ['A', 'B'] }, linked, point).pos;
    assert.true(Math.abs(kx - 70) < 1e-9 && Math.abs(ky - 70) < 1e-9, 'halfway between the two components');
    assert.strictEqual(resolveTarget({ link: ['A', 'Nope'] }, linked, point), null);
    const rich = parse(`component K [product][50, 50]
pipeline K {
 component A [genesis][50]
 component B [commodity][50]
}
note hi [commodity][10, 50]`).map;
    const [px, py] = resolveTarget({ pipeline: 'K' }, rich, point).pos;
    assert.true(Math.abs(px - 46.75) < 1e-9 && Math.abs(py - 57) < 1e-9, 'middle of the pipeline box, 0.07 below its owner');
    assert.strictEqual(resolveTarget({ pipeline: 'Nope' }, rich, point), null);
    const [lx, ly] = resolveTarget({ pipelineLabel: 'K' }, rich, point).pos;
    assert.true(Math.abs(lx - 38.5) < 1e-9 && Math.abs(ly - 40) < 1e-9, 'on the top edge of the box, near its left end, whatever the map size');
    assert.strictEqual(resolveTarget({ pipelineLabel: 'Nope' }, rich, point), null);
    assert.true(near(resolveTarget({ note: 0 }, rich, point).pos, [85, 90]));
    assert.strictEqual(resolveTarget({ note: 3 }, rich, point), null);
    assert.strictEqual(resolveTarget({ inertia: 'A' }, map, point), null, 'only components that have inertia');
    assert.strictEqual(resolveTarget({ stage: 'nope' }, map, point), null);
  });

  QUnit.test('arrow starts outside the note and ends short of the target', (assert) => {
    const a = arrowGeometry({ cx: 0, cy: 0, w: 100, h: 40 }, [300, 0], { gap: 10, curve: 0 });
    const [, sx] = a.shaft.match(/^M([\d.-]+),/);
    const [, ex] = a.shaft.match(/ ([\d.-]+),[\d.-]+$/);
    assert.true(+sx > 50, 'starts beyond the box edge');
    assert.strictEqual(+ex, 290);
    assert.true(a.head.startsWith('M290.0,0.0'));
  });

  QUnit.test('no arrow when the target is inside or touching the note', (assert) => {
    assert.strictEqual(arrowGeometry({ cx: 0, cy: 0, w: 100, h: 40 }, [10, 5]), null);
    assert.strictEqual(arrowGeometry({ cx: 0, cy: 0, w: 100, h: 40 }, [0, 0]), null);
  });

  QUnit.test('roughRing circles the point and overshoots a full turn', (assert) => {
    const pts = roughRing(50, 50);
    assert.true(pts.length > 12);
    assert.true(pts.every(([x, y]) => Math.abs(x - 50) < 25 && Math.abs(y - 50) < 20));
  });
});
