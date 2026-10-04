import { parse, setComponentPosition, setPipelineChildPosition, setNotePosition } from './parser/parse.js';
import { renderMap } from './render/mapRenderer.js';
import { SAMPLES, BLANK } from './samples.js';
import { encodeSource, decodeSource, fileStem } from './share.js';
import { serializeSvg, svgToPngBlob, downloadBlob } from './export.js';
import { TUTORIALS } from './tutorial/tutorials.js';
import { startTutorial } from './tutorial/tutorial.js';
import { drawAnnotations } from './tutorial/overlay.js';
import { initHelpPopover } from './ui/helpPopover.js';
import { initHelpDialog } from './help/helpDialog.js';

const STORAGE_KEY = 'wardley-maps:source';
const COLLAPSED_KEY = 'wardley-maps:editor-collapsed';

const $ = (sel) => document.querySelector(sel);
const source = $('#source');
const errors = $('#errors');
const svg = $('#map');
const status = $('#status');
const layout = $('#layout');
const collapseBtn = $('#collapse');

let currentMap = null;
const helpPopover = initHelpPopover({ svg, container: $('.map-wrap'), getMap: () => currentMap });
let tutorial = null; // { run, savedSource, notes, animate } while a tutorial is active

// localStorage can be unavailable (private windows, blocked site data), so never let it break the app.
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};

function say(message) {
  status.textContent = message;
  clearTimeout(say.timer);
  say.timer = setTimeout(() => { status.textContent = ''; }, 3000);
}

function update() {
  const { map, errors: errs } = parse(source.value);
  currentMap = map;
  helpPopover.hide(); // the labels are about to be re-created
  errors.replaceChildren(...errs.map((e) => {
    const li = document.createElement('li');
    li.textContent = `Line ${e.line}: ${e.message}`;
    return li;
  }));
  const mapLayout = renderMap(svg, map, {
    draggable: !tutorial,
    // Dragging mutates the rendered model in place; only the text needs to follow.
    onMove: (name, visibility, evolution, component) => {
      source.value = component.pipelineOf
        ? setPipelineChildPosition(source.value, name, evolution)
        : setComponentPosition(source.value, name, visibility, evolution);
      store.set(STORAGE_KEY, source.value);
    },
    onMoveNote: (note, visibility, evolution) => {
      source.value = setNotePosition(source.value, note.line, visibility, evolution);
      store.set(STORAGE_KEY, source.value);
    },
  });
  drawAnnotations($('#overlay'), mapLayout, map, tutorial?.notes ?? [], { animate: !!tutorial?.animate });
  if (tutorial) tutorial.animate = false; // only animate when a step changes, not on resize
}

// ---- tutorials ----
const card = {
  root: $('#tutorial-card'), progress: $('#tut-progress'), title: $('#tut-title'), body: $('#tut-body'),
  back: $('#tut-back'), next: $('#tut-next'), exit: $('#tut-exit'),
};

function beginTutorial(def, startAt = 0) {
  endTutorial();
  tutorial = { savedSource: source.value, notes: [], animate: true };
  source.readOnly = true;
  layout.classList.add('tutorial');
  tutorial.run = startTutorial(def, {
    show(step) {
      source.value = step.source;
      tutorial.notes = step.notes;
      tutorial.animate = true;
      update();
    },
    finish(keepSource) {
      const saved = tutorial.savedSource;
      tutorial = null;
      source.readOnly = false;
      layout.classList.remove('tutorial');
      setSource(keepSource ?? saved);
    },
  }, card, startAt);
}

// Leaves any running tutorial, restoring the user's own map.
function endTutorial() { tutorial?.run.stop(); }

function setSource(text) {
  source.value = text;
  store.set(STORAGE_KEY, text);
  update();
}

function confirmReplace() {
  const untouched = SAMPLES.some((s) => s.source === source.value) || source.value === BLANK;
  return untouched || confirm('Replace the current map? Unsaved changes will be lost.');
}

// ---- file menu actions ----
const baseName = () => fileStem(currentMap?.title);

const actions = {
  new() { if (confirmReplace()) setSource(BLANK); },
  open() { $('#file-input').click(); },
  'save-text'() {
    downloadBlob(new Blob([source.value], { type: 'text/plain;charset=utf-8' }), `${baseName()}.wardley`);
  },
  'export-svg'() {
    downloadBlob(new Blob([serializeSvg(svg).svg], { type: 'image/svg+xml;charset=utf-8' }), `${baseName()}.svg`);
  },
  async 'export-png'() {
    try {
      downloadBlob(await svgToPngBlob(serializeSvg(svg)), `${baseName()}.png`);
    } catch (e) {
      say(`Could not export PNG: ${e.message}`);
    }
  },
  async share() {
    const url = `${location.origin}${location.pathname}#map=${encodeSource(source.value)}`;
    history.replaceState(null, '', url);
    try {
      await navigator.clipboard.writeText(url);
      say('Share link copied to clipboard');
    } catch {
      say('Share link is now in the address bar');
    }
  },
  async 'copy-text'() {
    try {
      await navigator.clipboard.writeText(source.value);
      say('Definition copied to clipboard');
    } catch {
      say('Could not access the clipboard');
    }
  },
};

for (const menu of document.querySelectorAll('details.menu')) {
  menu.addEventListener('toggle', () => {
    if (menu.open) for (const other of document.querySelectorAll('details.menu')) if (other !== menu) other.open = false;
  });
}
document.addEventListener('click', (e) => {
  for (const menu of document.querySelectorAll('details.menu[open]')) if (!menu.contains(e.target)) menu.open = false;
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') for (const menu of document.querySelectorAll('details.menu[open]')) menu.open = false;
});

$('#file-menu').addEventListener('click', (e) => {
  const action = e.target.closest('button')?.dataset.action;
  if (!action) return;
  $('#file-menu').open = false;
  if (action !== 'share' && action !== 'copy-text' && !action.startsWith('export')) endTutorial();
  actions[action]();
});

$('#samples-list').replaceChildren(...SAMPLES.map((s) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = s.name;
  b.addEventListener('click', () => {
    $('#samples-menu').open = false;
    endTutorial();
    if (confirmReplace()) setSource(s.source);
  });
  return b;
}));

$('#learn-list').replaceChildren(...TUTORIALS.map((t) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = t.name;
  b.addEventListener('click', () => { $('#learn-menu').open = false; beginTutorial(t); });
  return b;
}));

const helpDialog = initHelpDialog({
  dialog: $('#help-dialog'),
  body: $('#help-body'),
  url: 'docs/syntax.md',
  onTry(code) {
    endTutorial();
    if (!confirmReplace()) return;
    setSource(code);
    helpDialog.close();
  },
});

$('#help-menu').addEventListener('click', (e) => {
  const action = e.target.closest('button')?.dataset.helpAction;
  if (!action) return;
  $('#help-menu').open = false;
  if (action === 'syntax') helpDialog.open();
  else beginTutorial(TUTORIALS[0]);
});

$('#file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (file && confirmReplace()) setSource(await file.text());
});

// ---- collapsible definition panel ----
function setCollapsed(collapsed) {
  layout.classList.toggle('collapsed', collapsed);
  collapseBtn.setAttribute('aria-expanded', String(!collapsed));
  collapseBtn.title = collapsed ? 'Expand map definition' : 'Collapse map definition';
  collapseBtn.querySelector('.sr-only').textContent = collapseBtn.title;
  store.set(COLLAPSED_KEY, collapsed ? '1' : '0');
}
collapseBtn.addEventListener('click', () => setCollapsed(!layout.classList.contains('collapsed')));
setCollapsed(store.get(COLLAPSED_KEY) === '1');

// ---- startup: share link > last session > first sample ----
const shared = location.hash.startsWith('#map=') ? decodeSource(location.hash.slice(5)) : null;
source.value = shared ?? store.get(STORAGE_KEY) ?? SAMPLES[0].source;
source.addEventListener('input', () => { store.set(STORAGE_KEY, source.value); update(); });
new ResizeObserver(update).observe(svg);
update();

// Deep link to a tutorial step, e.g. #tutorial=tea-shop/6
const deepLink = location.hash.match(/^#tutorial=([\w-]+)(?:\/(\d+))?$/);
const linked = deepLink && TUTORIALS.find((t) => t.id === deepLink[1]);
if (linked) beginTutorial(linked, Number(deepLink[2] ?? 0));
