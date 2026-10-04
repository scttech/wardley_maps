import { STAGES } from '../model/wardley.js';

const BOX_PAD = 6;

/**
 * Turn a note target into a pixel position (plus whether to circle it).
 * Targets: { component }, { inertia } (the bar), { evolve } (tip of that component's evolution arrow),
 * { link: ['From', 'To'] } (the middle of that link, wherever its two components are),
 * { pipeline: 'Owner' } (the middle of its box), { pipelineLabel: 'Owner' } (the label on its top edge), { note: index } (the nth note on the map),
 * { point: [visibility, evolution] }, or { stage } (the stage's axis label).
 * `point(visibility, evolution)` maps map coordinates to pixels.
 */
export function resolveTarget(target, map, point) {
  if (target.component) {
    const c = map.components.find((x) => x.name === target.component);
    return c ? { pos: point(c.visibility, c.evolution), ring: true, gap: 16 } : null;
  }
  if (target.evolve) {
    const c = map.components.find((x) => x.name === target.evolve);
    const e = map.evolutions.find((x) => x.name === target.evolve);
    return c && e ? { pos: point(c.visibility, e.to), ring: false, gap: 10 } : null;
  }
  if (target.inertia) {
    const c = map.components.find((x) => x.name === target.inertia);
    if (!c || !c.inertia) return null;
    const [px, py] = point(c.visibility, c.evolution);
    return { pos: [px + 15, py], ring: false, gap: 10 };
  }
  if (target.link) {
    const [a, b] = target.link.map((name) => map.components.find((c) => c.name === name));
    if (!a || !b) return null;
    return { pos: point((a.visibility + b.visibility) / 2, (a.evolution + b.evolution) / 2), ring: false, gap: 8 };
  }
  if (target.pipeline) {
    const p = map.pipelines.find((x) => x.parent === target.pipeline);
    const kids = (p?.children ?? []).map((n) => map.components.find((c) => c.name === n)).filter(Boolean);
    if (!kids.length) return null;
    const evolutions = kids.map((k) => k.evolution);
    return { pos: point(kids[0].visibility, (Math.min(...evolutions) + Math.max(...evolutions)) / 2), ring: false, gap: 30 };
  }
  if (target.pipelineLabel) {
    // The box is a fixed number of pixels tall, so aim in pixels rather than in map units.
    const p = map.pipelines.find((x) => x.parent === target.pipelineLabel);
    const kids = (p?.children ?? []).map((n) => map.components.find((c) => c.name === n)).filter(Boolean);
    if (!kids.length) return null;
    const [px, py] = point(kids[0].visibility, Math.min(...kids.map((k) => k.evolution)));
    return { pos: [px + 30, py - 17], ring: false, gap: 6 }; // box left edge is px - 20; the label starts 15px in
  }
  if (target.note !== undefined) {
    const n = map.notes[target.note];
    return n ? { pos: point(n.visibility, n.evolution), ring: false, gap: 26 } : null;
  }
  if (target.stage) {
    const s = STAGES.find((x) => x.key === target.stage);
    if (!s) return null;
    const [px, py] = point(0, s.from);
    return { pos: [px + 44, py + 10], ring: false, gap: 4 };
  }
  if (target.point) return { pos: point(...target.point), ring: false, gap: 8 };
  return null;
}

/**
 * Hand-drawn style arrow from a note box to a target: a curved shaft that
 * starts on the box edge and an open "V" head. Returns null when the target
 * is inside (or too close to) the note.
 * box: { cx, cy, w, h }; curve: bend as a fraction of the length (sign picks the side).
 */
export function arrowGeometry(box, [tx, ty], { gap = 12, curve = 0.25 } = {}) {
  const dx = tx - box.cx;
  const dy = ty - box.cy;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return null;
  const ux = dx / dist;
  const uy = dy / dist;
  const toEdge = Math.min((box.w / 2 + BOX_PAD) / (Math.abs(ux) || 1e-9), (box.h / 2 + BOX_PAD) / (Math.abs(uy) || 1e-9));
  if (toEdge >= dist - gap - 12) return null;

  const sx = box.cx + ux * toEdge;
  const sy = box.cy + uy * toEdge;
  const ex = tx - ux * gap;
  const ey = ty - uy * gap;
  const len = Math.hypot(ex - sx, ey - sy);
  const qx = (sx + ex) / 2 - uy * curve * len;
  const qy = (sy + ey) / 2 + ux * curve * len;

  // Head follows the curve's tangent at the tip.
  const angle = Math.atan2(ey - qy, ex - qx);
  const wing = (a) => `L${(ex - 11 * Math.cos(angle + a)).toFixed(1)},${(ey - 11 * Math.sin(angle + a)).toFixed(1)}`;
  return {
    shaft: `M${sx.toFixed(1)},${sy.toFixed(1)} Q${qx.toFixed(1)},${qy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`,
    head: `M${ex.toFixed(1)},${ey.toFixed(1)} ${wing(0.5)} M${ex.toFixed(1)},${ey.toFixed(1)} ${wing(-0.5)}`,
  };
}

/** Points for a loose, slightly overshooting hand-drawn circle around (cx, cy). */
export function roughRing(cx, cy, rx = 19, ry = 15, steps = 24) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = -0.5 + t * Math.PI * 2.15;
    const wobble = 1 + 0.035 * Math.sin(i * 1.7) + 0.1 * t; // drifts outward so the ends don't meet
    pts.push([cx + Math.cos(a) * rx * wobble, cy + Math.sin(a) * ry * wobble]);
  }
  return pts;
}
