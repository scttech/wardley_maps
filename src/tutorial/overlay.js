import { resolveTarget, arrowGeometry, roughRing } from './geometry.js';
import { setRichText } from './richText.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const d3 = globalThis.d3;
const ringLine = () => d3.line().curve(d3.curveCatmullRom.alpha(0.5));

function inkPath(svg, d, delay, animate) {
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', d);
  p.setAttribute('pathLength', '1');
  p.setAttribute('class', animate ? 'ink draw' : 'ink');
  p.style.setProperty('--delay', `${delay}s`);
  svg.append(p);
}

/**
 * Draw handwritten notes with arrows over the map.
 * overlay: the element stacked on the map; layout: renderMap's return value.
 * notes: [{ text, at: [visibility, evolution], target, width?, curve? }]
 */
export function drawAnnotations(overlay, layout, map, notes, { animate = false } = {}) {
  let svg = overlay.querySelector('svg.arrows');
  if (!svg) {
    svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'arrows');
    svg.setAttribute('aria-hidden', 'true');
    overlay.prepend(svg);
  }
  svg.replaceChildren();
  overlay.querySelectorAll('.note').forEach((n) => n.remove());

  const W = overlay.clientWidth;
  const H = overlay.clientHeight;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  notes.forEach((note, i) => {
    const el = document.createElement('div');
    el.className = animate ? 'note fade' : 'note';
    el.style.width = `${note.width ?? 150}px`;
    el.style.setProperty('--delay', `${i * 0.35}s`);
    setRichText(el, note.text);
    overlay.append(el);

    // Keep the whole note on screen even when the map is small.
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const [ax, ay] = layout.point(...note.at);
    const cx = Math.min(Math.max(ax, w / 2 + 4), W - w / 2 - 4);
    const cy = Math.min(Math.max(ay, h / 2 + 4), H - h / 2 - 4);
    el.style.left = `${cx}px`;
    el.style.top = `${cy}px`;

    const t = note.target && resolveTarget(note.target, map, layout.point);
    if (!t) return;
    const delay = i * 0.35 + 0.25;
    if (t.ring) inkPath(svg, ringLine()(roughRing(...t.pos)), delay, animate);
    const arrow = arrowGeometry({ cx, cy, w, h }, t.pos, { gap: note.gap ?? t.gap, curve: note.curve ?? 0.25 });
    if (arrow) {
      inkPath(svg, arrow.shaft, delay + 0.15, animate);
      inkPath(svg, arrow.head, delay + 0.65, animate);
    }
  });
}
