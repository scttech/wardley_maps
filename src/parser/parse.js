import { createMap, addComponent, addLink, addEvolution, stageByKey, stageToEvolution, evolutionToStage, isHexColor, addInertia, addPipeline, addPipelineChild, setSourcing, addNote, clamp01 } from '../model/wardley.js';

/** Statements that create a component. `component` and `capability` are the same ordinary kind. */
const TYPE_KEYWORDS = 'component|capability|anchor|need|practice|data|knowledge|market|ecosystem';
const COORDS = '\\[\\s*([\\d.]+)\\s*,\\s*([\\d.]+)\\s*\\]';

// ---- positions ----------------------------------------------------------------------------------
// In the text, every position is written [stage][visibility, position]. Both numbers are whole numbers
// from 0 to 100: visibility is how high up the value chain, position is how far through the stage
// (0 = its left edge, 100 = its right edge). Internally the map keeps 0..1 values.

function whole(text, what) {
  const n = Number(text);
  if (!Number.isInteger(n)) throw new Error(`${what} must be a whole number from 0 to 100 (not ${text})`);
  return n;
}

/**
 * Check a position and convert it to the map's 0..1 values. `visibilityText` is undefined for things that
 * only have an evolution (pipeline variants, evolve). Throws if the stage is missing or unknown or a number
 * isn't whole. Numbers above 100 don't throw: they are cut back to 100 and reported in `overflow`, so the
 * item can still be drawn while the error is shown.
 */
function readPosition(stageKey, visibilityText, positionText) {
  if (!stageKey) throw new Error('Put a stage before the numbers, for example [product][50, 50]. The second number is the position within that stage');
  const stage = stageByKey(stageKey);
  if (!stage) throw new Error(`Unknown stage "${stageKey}" (use genesis, custom, product or commodity)`);
  const visibility = visibilityText === undefined ? undefined : whole(visibilityText, 'Visibility');
  const position = whole(positionText, 'Position');
  const tooBig = (visibility ?? 0) > 100 || position > 100;
  return {
    stage,
    visibility: visibility === undefined ? undefined : clamp01(visibility / 100),
    evolution: stageToEvolution(stage, position / 100),
    overflow: tooBig ? 'numbers go up to 100, so the value was cut back to 100' : null,
  };
}

const RULES = [
  // color <stage> #rrggbb  (colour spelling also accepted)
  [/^colou?r\s+([a-z-]+)\s+(\S+)$/i, (m, map) => {
    const stage = stageByKey(m[1]);
    if (!stage) throw new Error(`Unknown stage "${m[1]}" (use genesis, custom, product or commodity)`);
    if (!isHexColor(m[2])) throw new Error(`"${m[2]}" is not an HTML colour code (use #rgb or #rrggbb)`);
    map.colors[stage.key] = m[2].toLowerCase();
  }],
  // build|buy|outsource Name   (lines containing -> or [ are links or components, not sourcing)
  [/^(build|buy|outsource)\s+([^[\]>]+)$/i, (m, map) => setSourcing(map, m[1].toLowerCase(), m[2].trim())],
  // note Some text [stage][visibility, position]
  // It may end with  -> Component  to give the note a speech-bubble pointer to that component.
  // With a pointer the position can be left out: the note is then placed beside that component.
  [new RegExp(`^note\\s+(.+?)\\s*(?:\\[\\s*([a-z-]+)\\s*\\]\\s*)?(?:${COORDS})?(?:\\s*->\\s*(.+))?$`, 'i'), (m, map, n) => {
    const placed = m[3] !== undefined;
    const text = m[1].trim().replace(/^"(.*)"$/, '$1');
    if (!placed && !m[5]) throw new Error(`Note "${text}" needs a position such as [product][50, 50], or "-> Component" to sit beside that component`);
    if (!placed && m[2]) throw new Error(`Note "${text}": the [${m[2]}] tag needs numbers after it, such as [${m[2]}][50, 50]`);
    const position = placed ? readPosition(m[2], m[3], m[4]) : null;
    const note = addNote(map, { text, visibility: position?.visibility ?? 0, evolution: position?.evolution ?? 0, line: n, target: m[5]?.trim() });
    if (!placed) note.near = true; // positioned beside its target once the whole text is read
    if (position?.overflow) throw new Error(`Note "${text}": ${position.overflow}`);
  }],
  [/^inertia\s+(.+)$/i, (m, map) => addInertia(map, m[1].trim())],
  [/^title\s+(.+)$/i, (m, map) => { map.title = m[1].trim(); }],
  [new RegExp(`^(${TYPE_KEYWORDS})\\s+(.+?)\\s*(?:\\[\\s*([a-z-]+)\\s*\\]\\s*)?${COORDS}$`, 'i'), (m, map) => {
    const position = readPosition(m[3], m[4], m[5]);
    const kind = m[1].toLowerCase();
    const c = addComponent(map, { name: m[2].trim(), visibility: position.visibility, evolution: position.evolution, anchor: kind === 'anchor', type: kind === 'component' ? 'capability' : kind });
    if (position.overflow) throw new Error(`"${c.name}": ${position.overflow}`);
  }],
  // A->B  or  A->B "label"
  [/^(.+?)\s*->\s*(.+?)(?:\s+"([^"]*)")?$/, (m, map) => addLink(map, m[1].trim(), m[2].trim(), m[3])],
  // evolve Name [stage] ["label"]  /  evolve Name [stage][position] ["label"]
  [/^evolve\s+(.+?)\s+(?:\[\s*([a-z-]+)\s*\]\s*(?:\[\s*([\d.]+)\s*\])?|([\d.]+))(?:\s+"([^"]*)")?$/i, (m, map) => {
    const name = m[1].trim();
    if (!m[2]) throw new Error(`evolve needs a stage, for example: evolve ${name} [product]`);
    const position = readPosition(m[2], undefined, m[3] ?? '50'); // by default, the middle of the stage
    addEvolution(map, name, position.evolution, m[5]);
    if (position.overflow) throw new Error(`"${name}": ${position.overflow}`);
  }],
];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const percent = (fraction) => Math.round(fraction * 100);

/**
 * Rewrite the position on one component's line, leaving every other line untouched.
 * `format(stage, position)` gives the new text for the bracketed part: the stage, and the position
 * within it as a whole number from 0 to 100.
 */
function rewriteCoords(source, name, evolution, format) {
  const re = new RegExp(`^(\\s*(?:${TYPE_KEYWORDS})\\s+${escapeRe(name)}\\s*)(\\[[a-z-]+\\]\\s*)?\\[[^\\]]*\\]`, 'im');
  const { stage, relative } = evolutionToStage(evolution);
  return source.replace(re, (_, head) => `${head}${format(stage, percent(relative))}`);
}

/**
 * Rewrite the [stage][visibility, position] of one component in the source text, leaving every other
 * line (comments, order, spacing) untouched. `visibility` and `evolution` are the map's 0..1 values.
 * Returns the source unchanged if the component isn't found.
 */
export function setComponentPosition(source, name, visibility, evolution) {
  return rewriteCoords(source, name, evolution, (stage, position) => `[${stage.key}][${percent(visibility)}, ${position}]`);
}

/** Same as setComponentPosition for a variant inside a pipeline, whose line has only a position within its stage. */
export function setPipelineChildPosition(source, name, evolution) {
  return rewriteCoords(source, name, evolution, (stage, position) => `[${stage.key}][${position}]`);
}

/**
 * Rewrite the position of the note defined on `line` (1-based; notes are found by line because
 * their text isn't unique). A note that was placed by its pointer gets its position written in.
 */
export function setNotePosition(source, line, visibility, evolution) {
  const lines = source.split('\n');
  // "note", "note [stage][v, p]", each optionally followed by "-> Component": a multiline note
  const opener = /^(\s*note\s*)(\[[a-z-]+\]\s*)?(\[[^\]]*\])?(\s*->.*)?$/i;
  const inline = /^(\s*note\s+.+?\s*)(\[[a-z-]+\]\s*)?\[[^\]]*\]/i;
  const pointerOnly = /^(\s*note\s+.+?)\s*(->\s*.+)$/i; // a single-line note with no position yet: "note Text -> Component"
  const { stage, relative } = evolutionToStage(evolution);
  const coords = `[${stage.key}][${percent(visibility)}, ${percent(relative)}]`;
  const text = lines[line - 1];
  if (text !== undefined) {
    lines[line - 1] = opener.test(text)
      ? text.replace(opener, (_, head, tag, pos, pointer) => `${head.trimEnd()} ${coords}${pointer ? ` ${pointer.trim()}` : ''}`)
      : inline.test(text)
        ? text.replace(inline, (_, head) => `${head}${coords}`)
        : text.replace(pointerOnly, (_, head, pointer) => `${head} ${coords} ${pointer}`);
  }
  return lines.join('\n');
}

// Opens a multiline note: "note" or "note [stage][v, p]"; its text follows until "end note".
const NOTE_OPEN = new RegExp(`^note(?:\\s*(?:\\[\\s*([a-z-]+)\\s*\\]\\s*)?${COORDS})?(?:\\s*->\\s*(.+))?$`, 'i');
/** Vertical distance (in visibility) between a component and a note that is placed beside it by default. */
const NEAR_GAP = 0.15;
const END_NOTE = /^\s*end\s+note\s*$/i;

// Inside a pipeline's braces: component Name [stage][position]
const CHILD = /^component\s+(.+?)\s*(?:\[\s*([a-z-]+)\s*\]\s*)?\[\s*([\d.]+)\s*\]$/i;

function parseChild(m, map, pipeline) {
  const position = readPosition(m[2], undefined, m[3]);
  const c = addPipelineChild(map, pipeline, { name: m[1].trim(), evolution: position.evolution });
  if (position.overflow) throw new Error(`"${c.name}": ${position.overflow}`);
}

/**
 * Parse the text DSL into a map. Positions are written [stage][visibility, position], both numbers whole
 * numbers from 0 to 100. A pipeline groups variants of a component:
 *   pipeline Kettle {
 *     component Electric Kettle [product][50]
 *   }
 * The box is labelled "<name> pipeline"; override it with: pipeline Kettle "Kettle variants" {  ("" for no label).
 * Never throws: problems are collected in `errors` as { line, message }.
 */
export function parse(source) {
  const map = createMap();
  const errors = [];
  const fail = (line, message) => errors.push({ line, message });
  let pending = null; // "pipeline X" seen, waiting for its "{"
  let block = null; // inside braces: { pipeline (null if it failed to open), line }

  function openPipeline(name, label, line) {
    let pipeline = null;
    try {
      pipeline = addPipeline(map, name, label);
    } catch (e) {
      fail(line, e.message); // the block is still consumed so its contents don't cascade into more errors
    }
    return { pipeline, line };
  }

  let noteBlock = null; // inside note ... end note: { line, lines, open (the regex match) }
  let unplaced = 0; // notes without a position or pointer are stacked down the left side

  function finishNote() {
    const { line, lines, open } = noteBlock;
    noteBlock = null;
    while (lines.length && !lines[0]) lines.shift();
    while (lines.length && !lines[lines.length - 1]) lines.pop();
    try {
      let visibility = Math.max(0.1, 0.92 - 0.16 * unplaced);
      let evolution = 0.12;
      let overflow = null;
      const beside = open[2] === undefined && open[4]; // no position but a pointer: sits beside its component
      if (open[2] === undefined && open[1]) throw new Error(`The [${open[1]}] tag needs numbers after it, such as [${open[1]}][50, 50]`);
      if (open[2] === undefined && !beside) unplaced += 1;
      if (open[2] !== undefined) {
        const position = readPosition(open[1], open[2], open[3]);
        ({ visibility, evolution, overflow } = position);
      }
      const note = addNote(map, { text: lines.join('\n'), visibility, evolution, line, target: open[4]?.trim() });
      if (beside) note.near = true;
      if (overflow) throw new Error(`Note: ${overflow}`);
    } catch (e) {
      fail(line, e.message);
    }
  }

  source.split(/\r?\n/).forEach((raw, i) => {
    const n = i + 1;
    // A multiline note's text is taken as written: no comment stripping, blank lines kept.
    if (noteBlock) {
      if (END_NOTE.test(raw)) finishNote();
      else noteBlock.lines.push(raw.trim());
      return;
    }
    const line = raw.replace(/\/\/.*$/, '').trim();
    if (!line) return;

    if (block) {
      if (line === '}') { block = null; return; }
      const m = line.match(CHILD);
      if (!m) { fail(n, `Inside a pipeline use: component Name [stage][position] (got "${line}")`); return; }
      if (!block.pipeline) return;
      try { parseChild(m, map, block.pipeline); } catch (e) { fail(n, e.message); }
      return;
    }
    if (pending) {
      const wasPending = pending;
      pending = null;
      if (line === '{') { block = openPipeline(wasPending.name, wasPending.label, wasPending.line); return; }
      fail(wasPending.line, `Expected "{" after "pipeline ${wasPending.name}"`);
    }
    const noteOpen = line.match(NOTE_OPEN);
    if (noteOpen) { noteBlock = { line: n, lines: [], open: noteOpen }; return; }
    const open = line.match(/^pipeline\s+(.+?)\s*(?:"([^"]*)"\s*)?(\{)?$/i);
    if (open) {
      const name = open[1].trim();
      const label = open[2]; // undefined unless a quoted label override was given
      if (open[3]) block = openPipeline(name, label, n);
      else pending = { name, label, line: n };
      return;
    }

    const rule = RULES.find(([re]) => re.test(line));
    if (!rule) {
      fail(n, `Unrecognised syntax: "${line}"`);
      return;
    }
    try {
      rule[1](line.match(rule[0]), map, n);
    } catch (e) {
      fail(n, e.message);
    }
  });
  if (pending) fail(pending.line, `Expected "{" after "pipeline ${pending.name}"`);
  if (block) fail(block.line, 'Missing "}" to close this pipeline');
  if (noteBlock) fail(noteBlock.line, 'Missing "end note" to close this note');
  // Pointers can name components defined later in the text, so they are checked once everything is read.
  for (const note of map.notes) {
    const target = note.target && map.components.find((c) => c.name === note.target);
    if (note.target && !target) {
      fail(note.line, `Unknown component "${note.target}"`);
      delete note.target;
    }
    if (note.near) {
      // Beside the component: above it (below if there's no room), kept inside the plot sideways.
      delete note.near;
      note.evolution = target ? Math.min(0.88, Math.max(0.12, target.evolution)) : 0.12;
      const above = target ? target.visibility + NEAR_GAP : 0.9;
      note.visibility = target && above > 0.95 ? target.visibility - NEAR_GAP : above;
      note.visibility = Math.round(note.visibility * 1e4) / 1e4; // no floating-point noise in what gets rewritten into the text
    }
  }
  return { map, errors };
}
