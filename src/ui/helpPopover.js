import { STAGES, stageColor } from '../model/wardley.js';
import { STAGE_INFO, HELP_INFO } from '../model/stageInfo.js';

const TARGETS = '.stage-label, .axis-help, .inertia-mark, .pipeline-box, .sourcing-mark, .component[data-help]';
const AXIS_COLOR = '#111827';

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

/** What to show for a label: { title, tagline, color, definition, traits, facts: [[label, text]], footer? } or null. */
function describe(label, map) {
  if (label.dataset.stage) {
    const stage = STAGES.find((s) => s.key === label.dataset.stage);
    const info = stage && STAGE_INFO[stage.key];
    if (!info) return null;
    return {
      title: stage.name,
      tagline: info.tagline,
      color: stageColor(map, stage),
      definition: info.definition,
      traits: info.traits,
      facts: [['Examples', info.examples], ['Insight', info.insight]],
      footer: `In the text: [${stage.key}][visibility, position]. Position is 0 at the left edge of the stage and 100 at the right edge.`,
    };
  }
  const info = HELP_INFO[label.dataset.help];
  return info && { ...info, color: AXIS_COLOR };
}

function buildContent(d) {
  const head = el('div', 'pop-head');
  const swatch = el('span', 'pop-swatch');
  swatch.style.background = d.color;
  const titles = el('div');
  titles.append(el('h3', '', d.title), el('span', 'pop-tagline', d.tagline));
  head.append(swatch, titles);

  const traits = el('ul');
  d.traits.forEach((t) => traits.append(el('li', '', t)));
  const facts = d.facts.map(([label, text]) => {
    const p = el('p', 'fact');
    p.append(el('strong', '', `${label}: `), document.createTextNode(text));
    return p;
  });
  return [head, el('p', '', d.definition), traits, ...facts, ...(d.footer ? [el('p', 'pop-range', d.footer)] : [])];
}

/**
 * Show a help popover when a stage label, axis title, inertia mark, pipeline box or sourcing ring in the map is hovered, focused or
 * clicked (click pins it, which is how touch users open it). Uses event delegation on the
 * svg, so it keeps working as the map is re-rendered.
 */
export function initHelpPopover({ svg, container, getMap }) {
  const pop = el('div', 'help-popover');
  pop.id = 'help-popover';
  pop.setAttribute('role', 'tooltip');
  pop.hidden = true;
  container.append(pop);

  let current = null; // the label the popover belongs to
  let pinned = false;

  function hide() {
    pop.hidden = true;
    pinned = false;
    current?.removeAttribute('aria-describedby');
    current = null;
  }

  function show(label) {
    if (svg.querySelector('.dragging')) return; // a popover left behind by a moving node would be stale
    const d = describe(label, getMap());
    if (!d) return;
    current?.removeAttribute('aria-describedby');
    current = label;
    label.setAttribute('aria-describedby', pop.id);
    pop.style.setProperty('--accent', d.color);
    pop.replaceChildren(...buildContent(d));
    pop.hidden = false;

    const box = container.getBoundingClientRect();
    const r = label.getBoundingClientRect();
    const w = pop.offsetWidth;
    const h = pop.offsetHeight;
    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));
    let left;
    let top;
    if (label.dataset.placement === 'right') {
      // Left-edge labels: open to the right, vertically centred on the label.
      left = r.right - box.left + 8;
      top = clamp(r.top - box.top + r.height / 2 - h / 2, 4, box.height - h - 4);
    } else {
      left = clamp(r.left + r.width / 2 - box.left - w / 2, 4, box.width - w - 4);
      top = Math.max(4, r.top - box.top - h - 8);
    }
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  }

  const labelOf = (e) => e.target.closest?.(TARGETS);

  svg.addEventListener('pointerdown', () => hide());
  svg.addEventListener('mouseover', (e) => { const l = labelOf(e); if (l && !pinned) show(l); });
  svg.addEventListener('mouseout', (e) => { if (labelOf(e) && !pinned) hide(); });
  svg.addEventListener('focusin', (e) => { const l = labelOf(e); if (l && !pinned) show(l); });
  svg.addEventListener('focusout', (e) => { if (labelOf(e) && !pinned) hide(); });
  svg.addEventListener('click', (e) => {
    const l = labelOf(e);
    if (!l) return;
    if (pinned && current === l) hide();
    else { show(l); pinned = true; }
  });
  svg.addEventListener('keydown', (e) => {
    const l = labelOf(e);
    if (l && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); l.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });
  document.addEventListener('click', (e) => { if (pinned && !labelOf(e) && !pop.contains(e.target)) hide(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) hide(); });

  return { hide };
}
