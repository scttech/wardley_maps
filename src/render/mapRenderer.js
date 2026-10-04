import { STAGES, clamp01, stageAt, stageColor, pipelineVisibility, evolutionToStage, stageToEvolution } from '../model/wardley.js';

// d3 is loaded as a global from vendor/d3.min.js (no build step).
const d3 = globalThis.d3;

// Component types with their own shape (capabilities and the anchor are plain circles).
const HELP_TYPES = new Set(['need', 'practice', 'data', 'knowledge', 'market', 'ecosystem']);
const REACH = { market: 9, ecosystem: 12 }; // radius of the shape, where it is bigger than a plain dot (6)
const reachOf = (c) => REACH[c.type] ?? 6;

const hexagon = 'M7,0 L3.5,6.1 L-3.5,6.1 L-7,0 L-3.5,-6.1 L3.5,-6.1 Z';
const PATHS = {
  need: 'M-6,-6 H6 V6 H-6 Z', // square
  practice: 'M0,-8 L7.5,5.5 L-7.5,5.5 Z', // triangle
  data: hexagon,
  knowledge: 'M0,-8.5 L8.5,0 L0,8.5 L-8.5,0 Z', // diamond
};

/** Draw a component's shape. Every shape gets the class node-dot, which is what takes the stage colour. */
function drawShape(node, c) {
  if (PATHS[c.type]) {
    node.append('path').attr('class', 'node-dot').attr('d', PATHS[c.type]);
  } else if (c.type === 'market') {
    // A circle holding a small network of three linked dots: many buyers and sellers.
    node.append('circle').attr('class', 'node-dot').attr('r', 9);
    node.append('path').attr('class', 'type-line').attr('d', 'M0,-4.2 L3.6,2.1 L-3.6,2.1 Z');
    [[0, -4.2], [3.6, 2.1], [-3.6, 2.1]].forEach(([x, y]) => node.append('circle').attr('class', 'type-mark').attr('cx', x).attr('cy', y).attr('r', 1.9));
  } else if (c.type === 'ecosystem') {
    // A dashed outer ring with satellites around the core: a community growing around a component.
    node.append('circle').attr('class', 'ecosystem-ring').attr('r', 12);
    node.append('circle').attr('class', 'node-dot').attr('r', 6);
    [[0, -12], [10.4, 6], [-10.4, 6]].forEach(([x, y]) => node.append('circle').attr('class', 'type-mark').attr('cx', x).attr('cy', y).attr('r', 2.2));
  } else {
    node.append('circle').attr('class', 'node-dot').attr('r', 6);
  }
}

const MARGIN = { top: 40, right: 30, bottom: 50, left: 50 };

/**
 * Render a map model into an <svg> element. Safe to call repeatedly.
 * Components and notes can be dragged; `onMove(name, visibility, evolution, component)` and
 * `onMoveNote(note, visibility, evolution)` are called as they move (values rounded to 2 decimals)
 * so the caller can persist them.
 * Returns { point(visibility, evolution) } mapping map coordinates to pixels in the svg.
 */
export function renderMap(svgEl, map, { onMove, onMoveNote, draggable = true } = {}) {
  const svg = d3.select(svgEl);
  const { width, height } = svgEl.getBoundingClientRect();
  const w = Math.max(0, width - MARGIN.left - MARGIN.right);
  const h = Math.max(0, height - MARGIN.top - MARGIN.bottom);
  const x = d3.scaleLinear([0, 1], [0, w]);
  const y = d3.scaleLinear([0, 1], [h, 0]);

  svg.selectAll('*').remove();
  const defs = svg.append('defs');
  const addArrow = (id, fill, size, refX) => defs.append('marker')
    .attr('id', id).attr('viewBox', '0 0 10 10').attr('refX', refX).attr('refY', 5)
    .attr('markerWidth', size).attr('markerHeight', size).attr('orient', 'auto')
    .append('path').attr('d', 'M0,0L10,5L0,10z').attr('fill', fill);
  addArrow('arrow', '#dc2626', 6, 9); // evolution arrows
  // Axis arrowheads start where the line ends (refX 0), so the thick line never pokes past the tip.
  addArrow('axis-arrow', '#111827', 4, 0); // size is in multiples of the axis stroke width

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

  g.selectAll('.stage-band').data(STAGES).join('rect')
    .attr('class', 'stage-band').attr('x', (s) => x(s.from)).attr('y', 0).attr('width', (s) => x(s.to) - x(s.from)).attr('height', h)
    .attr('fill', (s) => stageColor(map, s));
  g.selectAll('.stage-line').data(STAGES.slice(1)).join('line')
    .attr('class', 'stage-line').attr('x1', (s) => x(s.from)).attr('x2', (s) => x(s.from)).attr('y1', 0).attr('y2', h);
  // Axes run a little past the plot (the 10px arrowhead adds to that) and end in arrowheads: evolution to the right, visibility up.
  g.append('line').attr('class', 'axis').attr('x1', 0).attr('x2', w + 4).attr('y1', h).attr('y2', h).attr('marker-end', 'url(#axis-arrow)');
  g.append('line').attr('class', 'axis').attr('x1', 0).attr('x2', 0).attr('y1', h).attr('y2', -4).attr('marker-end', 'url(#axis-arrow)');
  // Each label is focusable and has a larger hit area; the page attaches a definition popover to `.stage-label`.
  const labels = g.selectAll('.stage-label').data(STAGES).join('g')
    .attr('class', 'stage-label').attr('data-stage', (s) => s.key).attr('transform', (s) => `translate(${x(s.from)},${h})`)
    .attr('tabindex', 0).attr('role', 'button').attr('aria-label', (s) => `${s.name}: show definition`);
  labels.append('rect').attr('x', 2).attr('y', 2).attr('width', (s) => Math.max(0, x(s.to) - x(s.from) - 4)).attr('height', 24).attr('rx', 4);
  labels.append('text').attr('class', 'axis-label').attr('x', 6).attr('y', 17).text((s) => s.name);
  // Axis titles are help targets too (see ui/stagePopover.js). The y-axis reads bottom to top:
  // "Invisible" at the bottom end, "Value Chain" centred, "Visible" at the top end.
  const axisHelp = [
    { help: 'evolution', text: 'Evolution →', transform: `translate(0,${h + 38})`, anchor: 'start', rect: [-4, -15, 96, 22], placement: 'above' },
    { help: 'visible', text: 'Visible', transform: 'translate(-14,0) rotate(-90)', anchor: 'end', rect: [-62, -16, 66, 22], placement: 'right' },
    { help: 'value-chain', text: 'Value Chain', transform: `translate(-14,${h / 2}) rotate(-90)`, anchor: 'middle', rect: [-42, -16, 84, 22], placement: 'right', bold: true },
    { help: 'invisible', text: 'Invisible', transform: `translate(-14,${h}) rotate(-90)`, anchor: 'start', rect: [-4, -16, 66, 22], placement: 'right' },
  ];
  const helpers = g.selectAll('.axis-help').data(h > 230 ? axisHelp : axisHelp.filter((d) => d.help === 'evolution')).join('g')
    .attr('class', 'axis-help').attr('data-help', (d) => d.help).attr('data-placement', (d) => d.placement)
    .attr('transform', (d) => d.transform).attr('tabindex', 0).attr('role', 'button')
    .attr('aria-label', (d) => `${d.text.replace(' →', '')}: show help`);
  helpers.append('rect').attr('x', (d) => d.rect[0]).attr('y', (d) => d.rect[1]).attr('width', (d) => d.rect[2]).attr('height', (d) => d.rect[3]).attr('rx', 4);
  helpers.append('text').attr('class', (d) => (d.bold ? 'axis-label axis-title' : 'axis-label')).attr('text-anchor', (d) => d.anchor).text((d) => d.text);
  g.append('text').attr('class', 'map-title').attr('x', w / 2).attr('y', -14).attr('text-anchor', 'middle').text(map.title);

  const byName = new Map(map.components.map((c) => [c.name, c]));
  const px = (name) => x(byName.get(name).evolution);
  const py = (name) => y(byName.get(name).visibility);

  // Pipeline boxes sit behind everything else; they are a help target like the axis labels.
  // The outline is broken at the top left to make room for the label (see place()).
  const boxes = g.selectAll('.pipeline-box').data(map.pipelines.filter((p) => p.children.length)).join('g')
    .attr('class', 'pipeline-box').attr('data-help', 'pipeline').attr('tabindex', 0).attr('role', 'button')
    .attr('aria-label', (p) => `Pipeline of ${p.parent}: show help`);
  boxes.append('rect').attr('class', 'pipeline-fill').attr('rx', 4);
  boxes.append('path').attr('class', 'pipeline-outline');
  boxes.append('text').attr('class', 'pipeline-label').attr('dy', '0.35em').text((p) => p.label);
  const labelWidth = new Map();
  boxes.each(function measureLabel(p) { labelWidth.set(p, p.label ? this.querySelector('text').getComputedTextLength() : 0); });
  const links = g.selectAll('.link').data(map.links).join('line').attr('class', 'link');
  const linkLabels = g.selectAll('.link-label').data(map.links.filter((l) => l.label)).join('text')
    .attr('class', 'link-label').attr('text-anchor', 'middle').text((l) => l.label);
  const evolves = g.selectAll('.evolve').data(map.evolutions).join('line').attr('class', 'evolve').attr('marker-end', 'url(#arrow)');
  const evolveLabels = g.selectAll('.evolve-label').data(map.evolutions.filter((e) => e.label)).join('text')
    .attr('class', 'evolve-label').attr('text-anchor', 'middle').text((e) => e.label);
  const nodes = g.selectAll('.component').data(map.components).join('g').attr('class', draggable ? 'component draggable' : 'component');
  // Sourcing (build / buy / outsource) is a ring behind the dot; it is a help target like the axis labels.
  nodes.filter((c) => c.sourcing).each(function addSourcingMark(c) {
    const mark = d3.select(this).insert('g', ':first-child').attr('class', `sourcing-mark sourcing-${c.sourcing}`)
      .attr('data-help', c.sourcing).attr('tabindex', 0).attr('role', 'button').attr('aria-label', `${c.sourcing}: show help`);
    mark.append('circle').attr('class', 'sourcing-hit').attr('r', reachOf(c) + 10);
    mark.append('circle').attr('class', 'sourcing-ring').attr('r', reachOf(c) + 4.5);
  });
  nodes.each(function addShape(c) {
    drawShape(d3.select(this), c);
    // Types with their own look are help targets, so hovering one explains what it means.
    if (HELP_TYPES.has(c.type)) d3.select(this).attr('data-help', c.type).attr('tabindex', 0).attr('aria-label', `${c.name} (${c.type}): show help`);
  });
  // Inertia is a bar in the component's path; it is a help target like the axis labels.
  nodes.filter((c) => c.inertia).each(function addInertiaMark(c) {
    const dx = (c.sourcing ? 6 : 0) + (reachOf(c) - 6); // clear of the sourcing ring and of larger shapes
    const mark = d3.select(this).append('g').attr('class', 'inertia-mark').attr('data-help', 'inertia')
      .attr('tabindex', 0).attr('role', 'button').attr('aria-label', 'Inertia: show help');
    mark.append('rect').attr('x', 8 + dx).attr('y', -14).attr('width', 14).attr('height', 28);
    mark.append('line').attr('x1', 15 + dx).attr('x2', 15 + dx).attr('y1', -11).attr('y2', 11);
  });
  // Pipeline variants are labelled underneath, so the label doesn't cross the box outline.
  nodes.append('text')
    .attr('x', (c) => (c.pipelineOf ? 0 : (c.inertia ? 26 : 10) + (c.sourcing ? (c.inertia ? 6 : 7) : 0) + (reachOf(c) - 6))).attr('y', (c) => (c.pipelineOf ? 30 : -8))
    .attr('text-anchor', (c) => (c.pipelineOf ? 'middle' : 'start')).text((c) => c.name);

  // Notes are sticky labels sized to their text (wrapped near 26 characters; a literal \n forces a break).
  const noteBox = new Map(); // note -> text box edges, relative to the note's position
  const noteNodes = g.selectAll('.note').data(map.notes).join('g').attr('class', draggable ? 'note draggable' : 'note');
  noteNodes.each(function buildNote(n) {
    const lines = wrapText(n.text, 26);
    const text = d3.select(this).append('text').attr('text-anchor', 'middle').attr('y', 4 - (lines.length - 1) * 7.5);
    lines.forEach((line, i) => text.append('tspan').attr('x', 0).attr('dy', i === 0 ? 0 : 15).text(line));
    const bb = text.node().getBBox();
    noteBox.set(n, { left: bb.x - 8, right: bb.x + bb.width + 8, top: bb.y - 5, bottom: bb.y + bb.height + 5 });
    d3.select(this).insert('path', 'text').attr('class', 'note-box'); // outline (with its pointer) is drawn in place()
  });

  // Positions derive from the model, so a drag only has to update the model and call place().
  function place() {
    // Variants always sit just below the component that owns the pipeline, so they follow it when it moves.
    for (const c of map.components) if (c.pipelineOf) c.visibility = pipelineVisibility(byName.get(c.pipelineOf));
    boxes.each(function sizeBox(p) {
      const kids = p.children.map((n) => byName.get(n));
      const xs = kids.map((k) => x(k.evolution));
      const tw = labelWidth.get(p);
      const x0 = Math.min(...xs) - 20;
      const x1 = Math.max(Math.max(...xs) + 20, x0 + tw + 34); // wide enough to hold its label
      const y0 = y(kids[0].visibility) - 17;
      const y1 = y0 + 34;
      const r = 4;
      const gap0 = x0 + 10; // the outline stops here ...
      const gap1 = tw ? gap0 + tw + 10 : x0 + r; // ... and resumes after the label
      const box = d3.select(this);
      box.select('.pipeline-fill').attr('x', x0).attr('y', y0).attr('width', x1 - x0).attr('height', y1 - y0);
      box.select('.pipeline-outline').attr('d',
        `M${gap1},${y0} H${x1 - r} Q${x1},${y0} ${x1},${y0 + r} V${y1 - r} Q${x1},${y1} ${x1 - r},${y1} H${x0 + r} Q${x0},${y1} ${x0},${y1 - r} V${y0 + r} Q${x0},${y0} ${x0 + r},${y0} H${gap0}`);
      box.select('.pipeline-label').attr('x', gap0 + 5).attr('y', y0);
    });
    links.attr('x1', (l) => px(l.from)).attr('y1', (l) => py(l.from)).attr('x2', (l) => px(l.to)).attr('y2', (l) => py(l.to));
    evolves.attr('x1', (e) => px(e.name)).attr('x2', (e) => x(e.to)).attr('y1', (e) => py(e.name)).attr('y2', (e) => py(e.name));
    nodes.attr('transform', (c) => `translate(${x(c.evolution)},${y(c.visibility)})`);
    linkLabels.attr('x', (l) => (px(l.from) + px(l.to)) / 2).attr('y', (l) => (py(l.from) + py(l.to)) / 2 - 5);
    evolveLabels.attr('x', (e) => (px(e.name) + x(e.to)) / 2).attr('y', (e) => py(e.name) + 15); // below the arrow, clear of the component label above it
    noteNodes.attr('transform', (n) => `translate(${x(n.evolution)},${y(n.visibility)})`);
    noteNodes.select('.note-box').attr('d', (n) => {
      const target = n.target && byName.get(n.target);
      const gap = (target?.sourcing ? 17 : 10) + (target ? reachOf(target) - 6 : 0); // stop short of the shape (and its ring)
      return speechBubblePath(noteBox.get(n), target && [x(target.evolution) - x(n.evolution), y(target.visibility) - y(n.visibility)], gap);
    });
    nodes.select('.node-dot').style('fill', (c) => stageColor(map, stageAt(c.evolution)));
  }
  place();

  if (draggable) nodes.call(d3.drag()
    .subject((event, c) => ({ x: x(c.evolution), y: y(c.visibility) }))
    .on('start', function () { d3.select(this).raise().classed('dragging', true); })
    .on('drag', function (event, c) {
      c.evolution = snapEvolution(x.invert(event.x));
      if (!c.pipelineOf) c.visibility = snapVisibility(y.invert(event.y)); // variants only slide along the pipeline
      place();
      onMove?.(c.name, c.visibility, c.evolution, c);
    })
    .on('end', function () { d3.select(this).classed('dragging', false); }));

  if (draggable) noteNodes.call(d3.drag()
    .subject((event, n) => ({ x: x(n.evolution), y: y(n.visibility) }))
    .on('start', function () { d3.select(this).raise().classed('dragging', true); })
    .on('drag', function (event, n) {
      n.evolution = snapEvolution(x.invert(event.x));
      n.visibility = snapVisibility(y.invert(event.y));
      place();
      onMoveNote?.(n, n.visibility, n.evolution);
    })
    .on('end', function () { d3.select(this).classed('dragging', false); }));

  return { point: (visibility, evolution) => [MARGIN.left + x(evolution), MARGIN.top + y(visibility)] };
}

// The text keeps whole numbers from 0 to 100, so dragging snaps to the positions the text can express:
// a whole-number percentage up the value chain, and a whole-number percentage through the stage.
const snapVisibility = (v) => Math.round(clamp01(v) * 100) / 100;
function snapEvolution(e) {
  const { stage, relative } = evolutionToStage(clamp01(e));
  return stageToEvolution(stage, Math.round(relative * 100) / 100);
}

/**
 * Outline of a note's box as an SVG path. With `to` (the pointed-at position relative to the box's
 * origin) the outline grows a triangular tail towards it, like a speech bubble, stopping `gap` short.
 */
function speechBubblePath({ left, right, top, bottom }, to, gap) {
  const corners = [[left, top], [right, top], [right, bottom], [left, bottom]]; // clockwise
  const edges = corners.map(() => []); // points to insert after each corner (top, right, bottom, left edge)
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const hw = (right - left) / 2;
  const hh = (bottom - top) / 2;
  const half = 8; // half the width of the tail where it joins the box
  if (to) {
    const dx = to[0] - cx;
    const dy = to[1] - cy;
    const dist = Math.hypot(dx, dy);
    const inside = Math.abs(dx) <= hw + gap && Math.abs(dy) <= hh + gap; // pointing at something under the note: no tail
    if (dist > 0 && !inside) {
      const tip = [to[0] - (dx / dist) * gap, to[1] - (dy / dist) * gap];
      const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));
      if (Math.abs(dx) / hw > Math.abs(dy) / hh) {
        const ey = clamp(cy + (dy * hw) / Math.abs(dx), top + half, bottom - half);
        if (dx > 0) edges[1].push([right, ey - half], tip, [right, ey + half]);
        else edges[3].push([left, ey + half], tip, [left, ey - half]);
      } else {
        const ex = clamp(cx + (dx * hh) / Math.abs(dy), left + half, right - half);
        if (dy > 0) edges[2].push([ex + half, bottom], tip, [ex - half, bottom]);
        else edges[0].push([ex - half, top], tip, [ex + half, top]);
      }
    }
  }
  const points = corners.flatMap((corner, i) => [corner, ...edges[i]]);
  return `M${points.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' L')} Z`;
}

/** Break text into lines of at most `max` characters (a word longer than that gets its own line). */
function wrapText(text, max) {
  return text.split(/\r?\n|\x5cn/).flatMap((paragraph) => { // real line breaks, or a literal backslash-n typed on one line
    const lines = [];
    let line = '';
    for (const word of paragraph.split(' ')) {
      if (line && `${line} ${word}`.length > max) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
    }
    lines.push(line || ' '); // a blank line still needs content to take up space
    return lines;
  });
}
