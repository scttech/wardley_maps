/** Evolution stage boundaries on the 0..1 evolution axis, with each stage's default colour. */
export const STAGES = [
  { key: 'genesis', color: '#8b5cf6', name: 'Genesis', from: 0, to: 0.17 },
  { key: 'custom', color: '#3b82f6', name: 'Custom Built', from: 0.17, to: 0.4 },
  { key: 'product', color: '#10b981', name: 'Product (+rental)', from: 0.4, to: 0.7 },
  { key: 'commodity', color: '#f59e0b', name: 'Commodity (+utility)', from: 0.7, to: 1 },
];

export const clamp01 = (n) => Math.min(1, Math.max(0, n));

export function stageAt(evolution) {
  const e = clamp01(evolution);
  return STAGES.find((s) => e < s.to) ?? STAGES[STAGES.length - 1];
}

const round4 = (n) => Math.round(n * 1e4) / 1e4;

/** Convert a position within a stage (0 = its left edge, 1 = its right edge) to absolute evolution. */
export function stageToEvolution(stage, relative) {
  return round4(stage.from + clamp01(relative) * (stage.to - stage.from));
}

/** Convert absolute evolution to { stage, relative }, the inverse of stageToEvolution. */
export function evolutionToStage(evolution) {
  const stage = stageAt(evolution);
  return { stage, relative: round4((clamp01(evolution) - stage.from) / (stage.to - stage.from)) };
}

/** Look up a stage by its DSL key (case-insensitive; "custom-built" is accepted for "custom"). */
export function stageByKey(key) {
  const k = key.toLowerCase().replace(/[^a-z]/g, '');
  return STAGES.find((s) => s.key === (k === 'custombuilt' ? 'custom' : k));
}

/**
 * Create an empty map.
 * visibility: 0 (invisible to user) .. 1 (visible); evolution: 0 (genesis) .. 1 (commodity).
 */
export function createMap(title = '') {
  return { title, components: [], links: [], evolutions: [], pipelines: [], notes: [], colors: {} };
}

/** True for #rgb or #rrggbb. */
export const isHexColor = (s) => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(s);

/** The colour for a stage: the map's override if it has one, otherwise the default. */
export function stageColor(map, stage) {
  return map.colors[stage.key] ?? stage.color;
}

/**
 * The kinds of component, named by the statement that creates them. `component` (also written
 * `capability`) is the ordinary activity; `anchor` is the user at the top of the chain.
 */
export const COMPONENT_TYPES = ['capability', 'anchor', 'need', 'practice', 'data', 'knowledge', 'market', 'ecosystem'];

export function addComponent(map, { name, visibility, evolution, anchor = false, type = anchor ? 'anchor' : 'capability' }) {
  if (!name) throw new Error('Component needs a name');
  if (map.components.some((c) => c.name === name)) throw new Error(`Duplicate component "${name}"`);
  const c = { name, visibility: clamp01(visibility), evolution: clamp01(evolution), anchor, type, inertia: false, pipelineOf: null, sourcing: null };
  map.components.push(c);
  return c;
}

export function addLink(map, from, to, label) {
  for (const n of [from, to]) {
    if (!map.components.some((c) => c.name === n)) throw new Error(`Unknown component "${n}"`);
  }
  map.links.push({ from, to, ...(label ? { label } : {}) });
}

export function addEvolution(map, name, target, label) {
  const c = map.components.find((x) => x.name === name);
  if (!c) throw new Error(`Unknown component "${name}"`);
  map.evolutions.push({ name, from: c.evolution, to: clamp01(target), ...(label ? { label } : {}) });
}

export const SOURCING = ['build', 'buy', 'outsource'];

/** Record how a component is sourced: build it ourselves, buy a product, or outsource it as a service. */
export function setSourcing(map, kind, name) {
  const c = map.components.find((x) => x.name === name);
  if (!c) throw new Error(`Unknown component "${name}"`);
  c.sourcing = kind;
}

/** A free-text note on the map. `line` (1-based) is where it was defined, so it can be rewritten when dragged.
 *  `target` (optional) names the component its speech-bubble pointer points at. */
export function addNote(map, { text, visibility, evolution, line, target }) {
  if (!text) throw new Error('A note needs some text');
  const note = { text, visibility: clamp01(visibility), evolution: clamp01(evolution), line, ...(target ? { target } : {}) };
  map.notes.push(note);
  return note;
}

/** Mark a component as having inertia: resistance to evolving. */
export function addInertia(map, name) {
  const c = map.components.find((x) => x.name === name);
  if (!c) throw new Error(`Unknown component "${name}"`);
  c.inertia = true;
}

/** How far (in visibility) a pipeline's variants sit below the component that owns the pipeline. */
export const PIPELINE_OFFSET = 0.07;
export const pipelineVisibility = (parent) => clamp01(parent.visibility - PIPELINE_OFFSET);

/** Start a pipeline for an existing component; its variants are added with addPipelineChild.
 *  `label` is shown on the box and defaults to "<name> pipeline" ('' means no label). */
export function addPipeline(map, parentName, label) {
  if (!map.components.some((c) => c.name === parentName)) throw new Error(`Unknown component "${parentName}"`);
  if (map.pipelines.some((p) => p.parent === parentName)) throw new Error(`"${parentName}" already has a pipeline`);
  const pipeline = { parent: parentName, label: label ?? `${parentName} pipeline`, children: [] };
  map.pipelines.push(pipeline);
  return pipeline;
}

/** Add a variant to a pipeline. Its visibility is derived from the owner, so only evolution is given. */
export function addPipelineChild(map, pipeline, { name, evolution }) {
  const parent = map.components.find((c) => c.name === pipeline.parent);
  const c = addComponent(map, { name, visibility: pipelineVisibility(parent), evolution });
  c.pipelineOf = parent.name;
  pipeline.children.push(name);
  return c;
}
