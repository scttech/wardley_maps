import { setRichText } from './richText.js';

/**
 * Run a tutorial: walks through `tutorial.steps`, driving the page through `host`.
 *
 * host.show(step)         – display the step's map and notes
 * host.finish(keepSource) – tutorial over; keepSource is the final map text if the user chose Finish, else null
 * card: { root, progress, title, body, back, next, exit } elements
 */
export function startTutorial(tutorial, host, card, startAt = 0) {
  const { steps } = tutorial;
  let index = Math.min(Math.max(startAt, 0), steps.length - 1);

  function render() {
    const step = steps[index];
    host.show(step);
    card.progress.textContent = `Step ${index + 1} of ${steps.length}`;
    card.title.textContent = step.title;
    card.body.replaceChildren(...step.body.map((text) => {
      const p = document.createElement('p');
      setRichText(p, text);
      return p;
    }));
    card.back.disabled = index === 0;
    card.next.textContent = index === steps.length - 1 ? 'Finish' : 'Next →';
    card.root.scrollTop = 0;
  }

  const go = (delta) => {
    const target = index + delta;
    if (target >= steps.length) return stop(true);
    if (target >= 0) { index = target; render(); }
  };

  function onKey(e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Escape') stop(false);
  }
  const onBack = () => go(-1);
  const onNext = () => go(1);
  const onExit = () => stop(false);

  function stop(keep) {
    document.removeEventListener('keydown', onKey);
    card.back.removeEventListener('click', onBack);
    card.next.removeEventListener('click', onNext);
    card.exit.removeEventListener('click', onExit);
    host.finish(keep ? steps[steps.length - 1].source : null);
  }

  document.addEventListener('keydown', onKey);
  card.back.addEventListener('click', onBack);
  card.next.addEventListener('click', onNext);
  card.exit.addEventListener('click', onExit);
  render();
  return { stop: () => stop(false) };
}
