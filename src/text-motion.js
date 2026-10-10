import { animate } from 'animejs';

const INTERACTIVE = 'a, button, input, select, textarea, [contenteditable="true"], [role="button"]';
const EXCLUDED = 'script, style, svg, canvas, code, pre, textarea, input, select, [aria-hidden="true"], [data-no-text-motion], .motion-run, .motion-caption';
const HEADLINE = 'h1, h2, h3, .hero-line';
const GLYPHS = '01/+=<>·—';
const MAX_UNITS = 180;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Finite text choreography. Text is split only on reveal or a control interaction.
 * The original text remains in the accessibility tree; animated copies are hidden.
 * Requires the .motion-* wrapper styles described in the integration contract.
 */
export function createTextMotion({ paused = false } = {}) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const segmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;
  const runs = new Set();
  const captions = new Map();
  const active = new Set();
  const readyRoots = new Set();
  const revealed = new WeakSet();
  const hoverTimes = new WeakMap();
  let requestedPause = Boolean(paused);
  let disposed = false;

  const isStill = () => disposed || requestedPause || media.matches;
  const graphemes = text => segmenter
    ? [...segmenter.segment(text)].map(part => part.segment)
    : Array.from(text);
  const span = (className, text) => {
    const node = document.createElement('span');
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function markReady(element) {
    if (!element.classList.contains('text-motion-ready')) {
      element.classList.add('text-motion-ready');
      readyRoots.add(element);
    }
  }

  function prepare(element, kind) {
    if (!(element instanceof Element) || element.matches(EXCLUDED)) return [];
    markReady(element);
    let count = 0;
    // Walk the existing nodes rather than replacing innerHTML: accents, breaks,
    // icons, event listeners and the native links/buttons keep their identity.
    function visit(parent) {
      if (parent !== element && parent.matches(EXCLUDED)) return;
      for (const child of [...parent.childNodes]) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          visit(child);
          continue;
        }
        if (child.nodeType !== Node.TEXT_NODE || !child.data.trim()) continue;
        if (count >= MAX_UNITS || child.data.length > 1200) continue;
        // A composite card/action group can reveal its leaf labels, but its own
        // text is never split while it contains interactive descendants.
        if (parent.querySelector(INTERACTIVE) || parent.matches(EXCLUDED)) continue;
        const original = child.data;
        const run = span('motion-run');
        const accessible = span('motion-sr-only', original);
        const visual = span('motion-visual');
        visual.setAttribute('aria-hidden', 'true');
        const heading = kind === 'headline' || (kind !== 'body' && parent.closest(HEADLINE));
        for (const token of original.split(/(\s+)/u)) {
          if (!token) continue;
          if (/^\s+$/u.test(token)) {
            visual.append(document.createTextNode(token));
            continue;
          }
          const word = span('motion-word');
          if (heading && count < MAX_UNITS) {
            for (const letter of graphemes(token)) {
              word.append(span('motion-char', letter));
              count++;
            }
          } else {
            word.textContent = token;
            count++;
          }
          visual.append(word);
        }
        run.append(accessible, visual);
        parent.replaceChild(run, child);
        runs.add({ wrapper: run, original: child, host: element });
      }
    }
    visit(element);
    const characters = [...element.querySelectorAll('.motion-char')];
    const words = [...element.querySelectorAll('.motion-word')]
      .filter(word => !word.querySelector('.motion-char'));
    return { characters: characters.slice(0, MAX_UNITS), words: words.slice(0, MAX_UNITS) };
  }

  function stopFor(element) {
    for (const effect of [...active]) {
      if (effect.element === element || element.contains(effect.element) || effect.element.contains(element)) {
        effect.finish();
      }
    }
  }

  // Resolve our own promises on cancellation too: Anime's then() only completes
  // naturally. No animation can leave a word invisible after pause or disposal.
  function runAnimation(element, targets, parameters, finalize = () => {}) {
    if (!targets.length || isStill()) {
      finalize();
      return Promise.resolve();
    }
    const snapshots = targets.filter(target => target instanceof Element).map(target => ({
      target,
      properties: ['transform', 'opacity', 'filter'].map(name => ({
        name, value: target.style.getPropertyValue(name), priority: target.style.getPropertyPriority(name),
      })),
    }));
    return new Promise(resolve => {
      let done = false;
      const effect = { element, animation: null, finish: null };
      function settle() {
        if (done) return;
        done = true;
        for (const { target, properties } of snapshots) {
          for (const { name, value, priority } of properties) {
            if (value) target.style.setProperty(name, value, priority);
            else target.style.removeProperty(name);
          }
        }
        finalize();
        active.delete(effect);
        resolve();
      }
      effect.finish = () => {
        if (done) return;
        effect.animation?.complete(true);
        settle();
      };
      active.add(effect);
      try {
        effect.animation = animate(targets, { ...parameters, onComplete: settle });
      } catch (error) {
        effect.animation?.cancel();
        settle();
        console.warn('Text motion unavailable:', error.message);
      }
    });
  }

  /** Reveal an element once; { force:true } explicitly replays its finite entrance. */
  function reveal(element, options = {}) {
    if (disposed || !(element instanceof Element)) return Promise.resolve();
    if (revealed.has(element) && !options.force) return Promise.resolve();
    stopFor(element);
    revealed.add(element);
    if (isStill()) return Promise.resolve();
    const units = prepare(element, options.kind);
    if (!units.characters) return Promise.resolve();
    const delay = clamp(Number(options.delay) || 0, 0, 500);
    const jobs = [];
    if (units.characters.length) {
      jobs.push(runAnimation(element, units.characters, {
        translateY: ['0.58em', '0em'],
        rotateX: [58, 0],
        opacity: [0, 1],
        filter: ['blur(6px)', 'blur(0px)'],
        duration: clamp(Number(options.duration) || 760, 250, 1000),
        delay: (_, index, total) => delay + index * Math.min(16, 220 / Math.max(1, total - 1)),
        ease: 'out(4)',
      }));
    }
    if (units.words.length) {
      jobs.push(runAnimation(element, units.words, {
        translateY: (_, index) => [`${0.12 + Math.sin(index * 0.7) * 0.06}em`, '0em'],
        opacity: [0.15, 1],
        filter: ['blur(1.2px)', 'blur(0px)'],
        duration: clamp(Number(options.duration) || 460, 200, 750),
        delay: (_, index, total) => delay + index * Math.min(28, 160 / Math.max(1, total - 1)),
        ease: 'out(3)',
      }));
    }
    return Promise.all(jobs).then(() => undefined);
  }

  function restoreRun(record) {
    if (record.wrapper.parentNode) record.wrapper.replaceWith(record.original);
    runs.delete(record);
  }

  /** Call after changing a control's label with textContent/innerHTML. No eager split. */
  function refresh(element) {
    if (disposed || !(element instanceof Element)) return;
    stopFor(element);
    const captionRecord = captions.get(element);
    if (captionRecord) {
      if (element.contains(captionRecord.visual)) element.textContent = captionRecord.text;
      captions.delete(element);
    }
    for (const record of [...runs]) {
      if (element.contains(record.wrapper)) restoreRun(record);
      else if (record.host === element) runs.delete(record);
    }
    revealed.delete(element);
    if (readyRoots.delete(element)) element.classList.remove('text-motion-ready');
  }

  /** Plain scene labels only. The accessible final value never contains scramble glyphs. */
  function caption(element, value) {
    if (disposed || !(element instanceof Element)) return Promise.resolve();
    const text = String(value ?? '');
    let record = captions.get(element);
    if (record?.text === text && element.contains(record.visual)) return Promise.resolve();
    stopFor(element);
    if (!record || !element.contains(record.visual)) {
      refresh(element);
      // Nested markup is retained instead of flattening an unexpected rich label.
      if (element.childElementCount) return Promise.resolve();
      markReady(element);
      const accessible = span('motion-sr-only', text);
      const visual = span('motion-caption');
      visual.setAttribute('aria-hidden', 'true');
      element.replaceChildren(accessible, visual);
      record = { accessible, visual, text };
      captions.set(element, record);
    }
    record.text = text;
    record.accessible.textContent = text;
    record.visual.textContent = text;
    if (isStill() || !text || text.length > 120) return Promise.resolve();
    const letters = graphemes(text);
    const clock = { progress: 0 };
    let frame = -1;
    return runAnimation(element, [clock], {
      progress: [0, 1],
      duration: 520,
      ease: 'linear',
      onUpdate: () => {
        const next = Math.floor(clock.progress * 16);
        if (next === frame) return;
        frame = next;
        const settled = Math.ceil(clock.progress * letters.length);
        record.visual.textContent = letters.map((letter, index) => (
          index < settled || /\s/u.test(letter)
            ? letter
            : GLYPHS[(index * 3 + frame) % GLYPHS.length]
        )).join('');
      },
    }, () => { record.visual.textContent = record.text; });
  }

  function sweep(event) {
    if (isStill() || !(event.target instanceof Element)) return;
    const control = event.target.closest('a, button');
    if (!control || control.matches(':disabled, [aria-disabled="true"], .skip-link, [data-no-text-motion]')) return;
    if (event.type === 'pointerover' && control.contains(event.relatedTarget)) return;
    const now = performance.now();
    if (now - (hoverTimes.get(control) ?? -Infinity) < 420) return;
    hoverTimes.set(control, now);
    stopFor(control);
    const units = prepare(control, 'body');
    if (!units.words?.length) return;
    runAnimation(control, units.words, {
      keyframes: [
        { translateY: '-0.12em', opacity: 0.72, duration: 90 },
        { translateY: '0em', opacity: 1, duration: 170 },
      ],
      delay: (_, index, total) => index * Math.min(18, 70 / Math.max(1, total - 1)),
      ease: 'out(3)',
    });
  }

  function finishAll() {
    for (const effect of [...active]) effect.finish();
    for (const record of captions.values()) record.visual.textContent = record.text;
  }

  function setPaused(value) {
    requestedPause = Boolean(value);
    if (isStill()) finishAll();
  }

  const mediaChanged = () => { if (media.matches) finishAll(); };
  media.addEventListener('change', mediaChanged);
  document.addEventListener('pointerover', sweep, { passive: true });
  document.addEventListener('focusin', sweep);

  function dispose() {
    if (disposed) return;
    disposed = true;
    finishAll();
    media.removeEventListener('change', mediaChanged);
    document.removeEventListener('pointerover', sweep);
    document.removeEventListener('focusin', sweep);
    for (const [element, record] of captions) {
      if (element.contains(record.visual)) element.textContent = record.text;
    }
    captions.clear();
    for (const record of [...runs]) restoreRun(record);
    for (const element of readyRoots) element.classList.remove('text-motion-ready');
    readyRoots.clear();
  }

  return { reveal, caption, refresh, setPaused, dispose };
}
