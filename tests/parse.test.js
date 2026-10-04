import { parse, setComponentPosition, setPipelineChildPosition, setNotePosition } from '../src/parser/parse.js';
import { STAGES, stageColor } from '../src/model/wardley.js';

// Stage ranges, for working out expected values: genesis 0-0.17, custom 0.17-0.4, product 0.4-0.7, commodity 0.7-1.

QUnit.module('parse', () => {
  QUnit.test('parses title, components, links and evolution', (assert) => {
    const { map, errors } = parse(`title T
component A [custom][90, 50]
anchor U [product][100, 50]
U->A
evolve A [product]`);
    assert.deepEqual(errors, []);
    assert.strictEqual(map.title, 'T');
    assert.strictEqual(map.components.length, 2);
    assert.deepEqual([map.components[0].visibility, map.components[0].evolution], [0.9, 0.285]);
    assert.true(map.components[1].anchor);
    assert.deepEqual(map.links, [{ from: 'U', to: 'A' }]);
    assert.deepEqual(map.evolutions, [{ name: 'A', from: 0.285, to: 0.55 }]);
  });

  QUnit.test('collects errors with line numbers instead of throwing', (assert) => {
    const { errors } = parse('component A [product][50, 50]\nbogus\nA->Missing');
    assert.deepEqual(errors.map((e) => e.line), [2, 3]);
  });

  QUnit.test('ignores comments and blank lines', (assert) => {
    const { map, errors } = parse('// hi\n\ncomponent A [product][50, 50] // trailing');
    assert.deepEqual(errors, []);
    assert.strictEqual(map.components.length, 1);
  });
});

QUnit.module('positions', () => {
  QUnit.test('[stage][visibility, position] uses whole numbers from 0 to 100, measured within the stage', (assert) => {
    const { map, errors } = parse(`component Cup of Tea [product][79, 50]
component K [custom-built][40, 0]
component T [commodity][20, 100]`);
    assert.deepEqual(errors, []);
    assert.deepEqual(map.components.map((c) => [c.visibility, c.evolution]), [[0.79, 0.55], [0.4, 0.17], [0.2, 1]]);
  });

  QUnit.test('a stage is required: a bare [visibility, position] is an error and nothing is drawn', (assert) => {
    const { map, errors } = parse('component A [43, 78]');
    assert.strictEqual(errors.length, 1);
    assert.match(errors[0].message, /Put a stage before the numbers/);
    assert.strictEqual(map.components.length, 0);
  });

  QUnit.test('decimals are rejected with a pointer to whole numbers', (assert) => {
    const { map, errors } = parse('component A [custom][0.43, 0.78]\ncomponent B [custom][43, 7.5]');
    assert.deepEqual(errors.map((e) => e.line), [1, 2]);
    assert.match(errors[0].message, /whole number from 0 to 100/);
    assert.strictEqual(map.components.length, 0);
  });

  QUnit.test('an unknown stage is an error', (assert) => {
    const { map, errors } = parse('component A [nope][50, 50]');
    assert.match(errors[0].message, /Unknown stage/);
    assert.strictEqual(map.components.length, 0);
  });

  QUnit.test('numbers above 100 are errors but the component is kept, cut back to the edge', (assert) => {
    const { map, errors } = parse('component A [genesis][50, 150]\ncomponent B [genesis][150, 50]');
    assert.deepEqual(errors.map((e) => e.line), [1, 2]);
    assert.deepEqual([map.components[0].visibility, map.components[0].evolution], [0.5, 0.17]);
    assert.deepEqual([map.components[1].visibility, map.components[1].evolution], [1, 0.085]);
  });
});

QUnit.module('evolve', () => {
  QUnit.test('evolve [stage] targets the middle of the stage, from the component\'s own position', (assert) => {
    const { map, errors } = parse('component K [custom][40, 50]\nevolve K [product]');
    assert.deepEqual(errors, []);
    assert.deepEqual(map.evolutions, [{ name: 'K', from: 0.285, to: 0.55 }]);
  });

  QUnit.test('evolve [stage][position] is a position within the stage', (assert) => {
    const { map, errors } = parse('component K [genesis][40, 20]\nevolve K [commodity][50]\nevolve K [custom][100]');
    assert.deepEqual(errors, []);
    assert.deepEqual(map.evolutions.map((e) => e.to), [0.85, 0.4]);
  });

  QUnit.test('evolve needs a stage; unknown stages, unknown components and numbers above 100 are errors', (assert) => {
    const { map, errors } = parse('component K [genesis][40, 20]\nevolve K 80\nevolve K [nope]\nevolve K [product][200]\nevolve Nope [product]');
    assert.deepEqual(errors.map((e) => e.line), [2, 3, 4, 5]);
    assert.match(errors[0].message, /evolve needs a stage/);
    assert.deepEqual(map.evolutions.map((e) => e.to), [0.7], 'the over-100 arrow is still drawn, at the edge');
  });

  QUnit.test('a quoted label on an evolve line is kept; without one there is no label property', (assert) => {
    const { map, errors } = parse(`component K [custom][40, 50]
evolve K [product] "getting standard"
evolve K [commodity][50]`);
    assert.deepEqual(errors, []);
    assert.deepEqual(map.evolutions, [
      { name: 'K', from: 0.285, to: 0.55, label: 'getting standard' },
      { name: 'K', from: 0.285, to: 0.85 },
    ]);
  });
});

QUnit.module('setComponentPosition', () => {
  const src = 'title T\ncomponent Cup of Tea [product][50, 50] // keep\nanchor Cup [custom][100, 100]\nCup->Cup of Tea';

  QUnit.test('rewrites only the named component, with a stage and whole numbers, and keeps comments', (assert) => {
    assert.strictEqual(
      setComponentPosition(src, 'Cup of Tea', 0.123, 0.8),
      'title T\ncomponent Cup of Tea [commodity][12, 33] // keep\nanchor Cup [custom][100, 100]\nCup->Cup of Tea',
    );
  });

  QUnit.test('does not match a component whose name is a prefix', (assert) => {
    const result = setComponentPosition(src, 'Cup', 0, 0.2);
    assert.true(result.includes('anchor Cup [custom][0, 13]'));
    assert.true(result.includes('Cup of Tea [product][50, 50]'));
  });

  QUnit.test('returns source unchanged for unknown names', (assert) => {
    assert.strictEqual(setComponentPosition(src, 'Nope', 0, 0), src);
  });

  QUnit.test('moving across a stage boundary changes the stage key', (assert) => {
    const tagged = 'component Cup of Tea [product][79, 70]';
    assert.strictEqual(setComponentPosition(tagged, 'Cup of Tea', 0.5, 0.8), 'component Cup of Tea [commodity][50, 33]');
    assert.strictEqual(setComponentPosition(tagged, 'Cup of Tea', 0.5, 0.65), 'component Cup of Tea [product][50, 83]');
  });

  QUnit.test('a line from the old format gets a stage the first time it is moved', (assert) => {
    assert.strictEqual(setComponentPosition('component Cup of Tea [0.5, 0.5]', 'Cup of Tea', 0.5, 0.55), 'component Cup of Tea [product][50, 50]');
  });
});

QUnit.module('stage colours', () => {
  QUnit.test('color <stage> #hex overrides the default, case-insensitively', (assert) => {
    const { map, errors } = parse('color product #FF8800\nColour custom #abc');
    assert.deepEqual(errors, []);
    assert.deepEqual(map.colors, { product: '#ff8800', custom: '#abc' });
    assert.strictEqual(stageColor(map, STAGES[2]), '#ff8800');
    assert.strictEqual(stageColor(map, STAGES[0]), STAGES[0].color, 'others keep their default');
  });

  QUnit.test('rejects unknown stages and non-hex colours', (assert) => {
    const { map, errors } = parse('color nope #fff\ncolor product red\ncolor product #12\ncolor product #12345g');
    assert.deepEqual(errors.map((e) => e.line), [1, 2, 3, 4]);
    assert.deepEqual(map.colors, {});
  });

  QUnit.test('every stage has a different default colour', (assert) => {
    assert.strictEqual(new Set(STAGES.map((s) => s.color)).size, STAGES.length);
  });
});

QUnit.module('pipelines', () => {
  const base = `component Kettle [product][58, 50]
component Power [commodity][20, 50]
`;

  QUnit.test('braces group variants, which take only a position and sit just below their owner', (assert) => {
    const { map, errors } = parse(`${base}pipeline Kettle {
  component Stove [custom][50]
  component Electric [product][50]
  component Legacy [commodity][50]
}
Kettle->Power`);
    assert.deepEqual(errors, []);
    assert.deepEqual(map.pipelines, [{ parent: 'Kettle', label: 'Kettle pipeline', children: ['Stove', 'Electric', 'Legacy'] }]);
    const kids = map.components.filter((c) => c.pipelineOf);
    assert.deepEqual(kids.map((c) => c.evolution), [0.285, 0.55, 0.85]);
    assert.true(kids.every((c) => c.visibility === 0.51 && c.pipelineOf === 'Kettle'));
    assert.strictEqual(map.links.length, 1, 'lines after the block still parse');
  });

  QUnit.test('the opening brace may be on the next line', (assert) => {
    const { map, errors } = parse(`${base}pipeline Kettle
{
  component Stove [custom][50]
}`);
    assert.deepEqual(errors, []);
    assert.deepEqual(map.pipelines[0].children, ['Stove']);
  });

  QUnit.test('reports a missing closing brace, a missing opening brace and an unknown owner', (assert) => {
    assert.deepEqual(parse(`${base}pipeline Kettle {\n  component A [custom][50]`).errors.map((e) => e.line), [3]);
    assert.deepEqual(parse(`${base}pipeline Kettle\ncomponent A [product][50, 50]`).errors.map((e) => e.line), [3]);
    const unknown = parse('pipeline Nope {\n  component A [custom][50]\n}');
    assert.deepEqual(unknown.errors.map((e) => e.line), [1], 'one error, the block contents do not cascade');
    assert.strictEqual(unknown.map.components.length, 0);
  });

  QUnit.test('rejects the wrong kind of line inside a pipeline', (assert) => {
    const { errors } = parse(`${base}pipeline Kettle {\n  component A [product][50, 50]\n  Kettle->Power\n}`);
    assert.deepEqual(errors.map((e) => e.line), [4, 5]);
  });

  QUnit.test('a variant needs a stage, whole numbers, and at most 100', (assert) => {
    const { map, errors } = parse(`${base}pipeline Kettle {\n  component A [50]\n  component B [custom][0.5]\n  component C [custom][150]\n}`);
    assert.deepEqual(errors.map((e) => e.line), [4, 5, 6]);
    assert.deepEqual(map.components.filter((c) => c.pipelineOf).map((c) => [c.name, c.evolution]), [['C', 0.4]], 'only the over-100 variant is kept, at the edge');
  });

  QUnit.test('the pipeline label defaults to "<name> pipeline" and can be overridden or removed', (assert) => {
    const labels = (text) => parse(`${base}${text}`).map.pipelines.map((p) => p.label);
    assert.deepEqual(labels(`pipeline Kettle {\n component A [custom][50]\n}`), ['Kettle pipeline']);
    assert.deepEqual(labels(`pipeline Kettle "Kettle variants" {\n component A [custom][50]\n}`), ['Kettle variants']);
    assert.deepEqual(labels(`pipeline Kettle ""\n{\n component A [custom][50]\n}`), ['']);
    assert.deepEqual(parse(`${base}pipeline Kettle "Spaced out label" {\n component A [custom][50]\n}`).errors, []);
  });

  QUnit.test('setPipelineChildPosition writes a stage and one position, and keeps the line otherwise', (assert) => {
    const text = 'pipeline Kettle {\n  component Stove [custom][50]\n  component Old [commodity][20]\n}';
    assert.strictEqual(setPipelineChildPosition(text, 'Stove', 0.8), 'pipeline Kettle {\n  component Stove [commodity][33]\n  component Old [commodity][20]\n}');
    assert.strictEqual(setPipelineChildPosition(text, 'Old', 0.456), 'pipeline Kettle {\n  component Stove [custom][50]\n  component Old [product][19]\n}');
  });
});

QUnit.module('component types', () => {
  QUnit.test('each statement creates its own type; component and capability are the same', (assert) => {
    const { map, errors } = parse(`component A [product][90, 50]
capability B [product][80, 50]
anchor C [product][70, 50]
need D [product][60, 50]
Practice E [product][50, 50]
data F [product][40, 50]
knowledge G [product][30, 50]
market H [product][20, 50]
ecosystem I [product][10, 50]`);
    assert.deepEqual(errors, []);
    assert.deepEqual(map.components.map((c) => c.type), ['capability', 'capability', 'anchor', 'need', 'practice', 'data', 'knowledge', 'market', 'ecosystem']);
    assert.true(map.components[2].anchor);
    assert.false(map.components[3].anchor);
  });

  QUnit.test('typed components can be linked, evolved and dragged like any other', (assert) => {
    const { map, errors } = parse(`need Want [product][90, 50]
market Pool [product][50, 50]
Want->Pool
evolve Pool [commodity]
inertia Pool
build Pool`);
    assert.deepEqual(errors, []);
    assert.strictEqual(map.links.length, 1);
    assert.strictEqual(map.components[1].inertia, true);
    assert.strictEqual(setComponentPosition('market Pool [product][50, 50]', 'Pool', 0.4, 0.8), 'market Pool [commodity][40, 33]');
    assert.strictEqual(setComponentPosition('knowledge Brewing know-how [custom][50, 50]', 'Brewing know-how', 0.3, 0.2), 'knowledge Brewing know-how [custom][30, 13]');
  });

  QUnit.test('links and notes that start with a type word are still links and notes', (assert) => {
    const { map, errors } = parse(`component Data Lake [product][50, 50]
component Need To Know [product][40, 50]
Data Lake->Need To Know
note Data matters [product][10, 10]`);
    assert.deepEqual(errors, []);
    assert.strictEqual(map.links.length, 1);
    assert.strictEqual(map.notes.length, 1);
  });
});

QUnit.module('sourcing', () => {
  QUnit.test('build, buy and outsource set how a component is sourced', (assert) => {
    const { map, errors } = parse(`component A [product][50, 50]
component B [product][40, 50]
component C [product][30, 50]
component D [product][20, 50]
build A
Buy B
outsource C`);
    assert.deepEqual(errors, []);
    assert.deepEqual(map.components.map((c) => c.sourcing), ['build', 'buy', 'outsource', null]);
  });

  QUnit.test('unknown components are errors, and links or components starting with these words still parse', (assert) => {
    const { map, errors } = parse(`component Build Server [product][50, 50]
component Buy Order [product][40, 50]
Build Server->Buy Order
buy Nope`);
    assert.deepEqual(errors.map((e) => e.line), [4]);
    assert.strictEqual(map.components.length, 2);
    assert.strictEqual(map.links.length, 1);
  });
});

QUnit.module('inertia', () => {
  QUnit.test('inertia <name> flags the component', (assert) => {
    const { map, errors } = parse('component A [product][50, 50]\ncomponent B [product][40, 50]\ninertia B');
    assert.deepEqual(errors, []);
    assert.deepEqual(map.components.map((c) => c.inertia), [false, true]);
  });

  QUnit.test('inertia on an unknown component is an error', (assert) => {
    const { errors } = parse('inertia Nope');
    assert.deepEqual(errors.map((e) => e.line), [1]);
  });
});

QUnit.module('notes', () => {
  QUnit.test('note <text> [stage][v, p] adds a note and remembers its line', (assert) => {
    const { map, errors } = parse(`title T
note Hello there [custom][60, 50]
note "Quoted text" [commodity][20, 50]`);
    assert.deepEqual(errors, []);
    assert.deepEqual(map.notes, [
      { text: 'Hello there', visibility: 0.6, evolution: 0.285, line: 2 },
      { text: 'Quoted text', visibility: 0.2, evolution: 0.85, line: 3 },
    ]);
  });

  QUnit.test('a note position needs a stage, whole numbers, an existing stage and at most 100', (assert) => {
    const { map, errors } = parse(`note A [50, 50]
note B [nope][50, 50]
note C [product][50, 200]
note D [product][0.5, 50]`);
    assert.deepEqual(errors.map((e) => e.line), [1, 2, 3, 4]);
    assert.deepEqual(map.notes.map((n) => n.text), ['C'], 'the over-100 note is kept, at the edge');
  });

  QUnit.test('a note needs a position or a pointer, and a stage tag needs numbers', (assert) => {
    const { map, errors } = parse('note just text\nnote Hi [product] -> Kettle\ncomponent Kettle [product][50, 50]');
    assert.deepEqual(errors.map((e) => e.line), [1, 2]);
    assert.strictEqual(map.notes.length, 0);
  });

  QUnit.test('setNotePosition rewrites only that line, by line number, with a stage and whole numbers', (assert) => {
    const text = `note Same [custom][50, 50]
note Same [product][50, 50]
title X`;
    assert.strictEqual(setNotePosition(text, 1, 0.123, 0.8), `note Same [commodity][12, 33]
note Same [product][50, 50]
title X`);
    assert.strictEqual(setNotePosition(text, 2, 0.4, 0.85), `note Same [custom][50, 50]
note Same [commodity][40, 50]
title X`);
    assert.strictEqual(setNotePosition(text, 9, 0.4, 0.85), text, 'unknown line: unchanged');
  });
});

QUnit.module('multiline notes', () => {
  QUnit.test('note ... end note takes its text from the lines between, comments and blank lines included', (assert) => {
    const { map, errors } = parse(`title T
note [custom][60, 25]
This is a multiline
note // not a comment here

  with a gap
end note
component A [product][50, 50]`);
    assert.deepEqual(errors, []);
    assert.deepEqual(map.notes, [{ text: 'This is a multiline\nnote // not a comment here\n\nwith a gap', visibility: 0.6, evolution: 0.2275, line: 2 }]);
    assert.strictEqual(map.components.length, 1, 'parsing carries on after "end note"');
  });

  QUnit.test('without a position, notes stack down the left side', (assert) => {
    const { map, errors } = parse(`note [commodity][20, 50]
tagged
end note
note
first
end note
note
second
end note`);
    assert.deepEqual(errors, []);
    assert.deepEqual(map.notes.map((n) => [n.visibility, n.evolution]), [[0.2, 0.85], [0.92, 0.12], [0.76, 0.12]]);
  });

  QUnit.test('reports a missing end note, an empty note, an unknown stage and a bare position', (assert) => {
    assert.deepEqual(parse('note [product][50, 50]\nunfinished').errors.map((e) => e.line), [1]);
    assert.deepEqual(parse('note\nend note').errors.map((e) => e.line), [1]);
    assert.deepEqual(parse('note [nope][50, 50]\ntext\nend note').errors.map((e) => e.line), [1]);
    assert.deepEqual(parse('note [50, 50]\ntext\nend note').errors.map((e) => e.line), [1]);
  });

  QUnit.test('setNotePosition writes a position into a multiline note, or updates it', (assert) => {
    assert.strictEqual(setNotePosition('note\nhi\nend note', 1, 0.5, 0.25), 'note [custom][50, 35]\nhi\nend note');
    assert.strictEqual(setNotePosition('note [custom][10, 10]\nhi\nend note', 1, 0.5, 0.25), 'note [custom][50, 35]\nhi\nend note');
    assert.strictEqual(setNotePosition('note [product][10, 10]\nhi\nend note', 1, 0.5, 0.8), 'note [commodity][50, 33]\nhi\nend note');
  });
});

QUnit.module('note pointers', () => {
  QUnit.test('-> Component gives single-line and multiline notes a target, even for components defined later', (assert) => {
    const { map, errors } = parse(`note Look here [custom][60, 25] -> Kettle
note [product][20, 50] -> Cup of Tea
two lines
end note
note plain [product][10, 10]
component Kettle [product][40, 50]
component Cup of Tea [product][80, 50]`);
    assert.deepEqual(errors, []);
    assert.deepEqual(map.notes.map((n) => n.target), ['Kettle', 'Cup of Tea', undefined]);
    assert.strictEqual(map.notes[1].text, 'two lines');
  });

  QUnit.test('an unknown target is reported on the note\'s line and the note keeps no target', (assert) => {
    const { map, errors } = parse('component A [product][50, 50]\nnote Hi [product][10, 10] -> Nope');
    assert.deepEqual(errors.map((e) => e.line), [2]);
    assert.false('target' in map.notes[0]);
  });

  QUnit.test('without a position a pointed-at note sits just above its component, or below at the top, and inside the plot', (assert) => {
    const { map, errors } = parse(`component Mid [product][50, 50]
component Top [commodity][90, 97]
component Left [genesis][30, 0]
note single -> Mid
note -> Top
multi
end note
note edge -> Left`);
    assert.deepEqual(errors, []);
    assert.deepEqual(map.notes.map((n) => [n.visibility, n.evolution]), [[0.65, 0.55], [0.75, 0.88], [0.45, 0.12]]);
    assert.true(map.notes.every((n) => !('near' in n)), 'the placeholder flag is not left on the note');
  });

  QUnit.test('setNotePosition fills in a position for a pointer-only note when it is first dragged', (assert) => {
    assert.strictEqual(setNotePosition('note Hi there -> Kettle', 1, 0.5, 0.25), 'note Hi there [custom][50, 35] -> Kettle');
  });

  QUnit.test('setNotePosition keeps the pointer when the note is moved', (assert) => {
    assert.strictEqual(setNotePosition('note Hi [product][10, 10] -> Kettle', 1, 0.5, 0.25), 'note Hi [custom][50, 35] -> Kettle');
    assert.strictEqual(setNotePosition('note [product][10, 10] -> Kettle\nhi\nend note', 1, 0.5, 0.25), 'note [custom][50, 35] -> Kettle\nhi\nend note');
    assert.strictEqual(setNotePosition('note -> Kettle\nhi\nend note', 1, 0.5, 0.25), 'note [custom][50, 35] -> Kettle\nhi\nend note');
  });
});

QUnit.module('link labels', () => {
  QUnit.test('a quoted label after a link is kept; without one there is no label property', (assert) => {
    const { map, errors } = parse(`component Cup of Tea [product][80, 50]
component Kettle [product][40, 50]
Cup of Tea->Kettle "boils water"
Kettle->Cup of Tea`);
    assert.deepEqual(errors, []);
    assert.deepEqual(map.links, [
      { from: 'Cup of Tea', to: 'Kettle', label: 'boils water' },
      { from: 'Kettle', to: 'Cup of Tea' },
    ]);
  });
});
