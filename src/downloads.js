import { releases } from './releases.js';

const svgNS = 'http://www.w3.org/2000/svg';
const colors = { host: '#b3df93', client: '#c0b5ff', dashboard: '#ff7768' };

function fileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function nearestEdge(point, rect) {
  const x = Math.max(rect.left, Math.min(point.x, rect.right));
  const y = Math.max(rect.top, Math.min(point.y, rect.bottom));
  if (x !== point.x || y !== point.y) return { x, y };
  const edges = [
    { x: rect.left, y, distance: x - rect.left },
    { x: rect.right, y, distance: rect.right - x },
    { x, y: rect.top, distance: y - rect.top },
    { x, y: rect.bottom, distance: rect.bottom - y },
  ];
  return edges.reduce((nearest, edge) => edge.distance < nearest.distance ? edge : nearest);
}

export function createDownloadSection({ section, leaders, textMotion }) {
  const compact = window.matchMedia('(max-width:800px) and (min-height:451px)');
  const guide = document.querySelector('#component-guide');
  const storyPane = document.querySelector('#story-scroll') || document.querySelector('.story-scroll');
  let active = false;
  let layoutDirty = true;
  let positions = null;
  let viewport = { width: 0, height: 0 };
  let viewBox = '';
  let readingTop = 0;
  let headerBottom = 70;
  section.dataset.active = 'false';
  leaders.setAttribute('aria-hidden', 'true');

  const slots = releases.map(release => {
    const card = section.querySelector(`.download-card[data-package="${release.id}"]`);
    if (!card) return null;
    const link = card.querySelector('.download-link');
    const pending = card.querySelector('.download-pending');
    const status = card.querySelector('.download-file-status');
    const available = typeof release.url === 'string' && Boolean(release.url.trim());
    link.hidden = !available;
    pending.hidden = available;
    pending.disabled = true;
    link.setAttribute('aria-label', `Download ${release.title.toLowerCase()}`);
    pending.setAttribute('aria-label', `${release.title} — release coming soon`);
    card.dataset.fileReady = String(available);
    if (available) {
      link.href = release.url;
      link.download = release.filename;
      const type = release.filename.toLowerCase().endsWith('.exe') ? 'Windows launcher · EXE' : 'Windows installer · BAT';
      const size = fileSize(release.bytes);
      status.textContent = `${type}${size ? ` · ${size}` : ''}`;
    } else {
      link.removeAttribute('href');
      status.textContent = 'Release coming soon';
    }
    // Keep the status readable while the existing story observer animates the copy.
    textMotion?.refresh(status);

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('class', `download-leader download-leader-${release.id}`);
    path.style.stroke = colors[release.id];
    const dot = document.createElementNS(svgNS, 'circle');
    dot.setAttribute('class', 'download-endpoint');
    dot.setAttribute('r', '3');
    dot.style.fill = colors[release.id];
    leaders.append(path, dot);
    path.style.display = 'none';
    dot.style.display = 'none';
    return { id: release.id, card, button: available ? link : pending, path, dot, rect: null, shown: false };
  }).filter(Boolean);

  function show(slot, visible) {
    if (slot.shown === visible) return;
    slot.shown = visible;
    slot.path.style.display = visible ? '' : 'none';
    slot.dot.style.display = visible ? '' : 'none';
  }

  function invalidate() {
    layoutDirty = true;
  }

  function layout() {
    const obscured = document.body.classList.contains('is-model-view') ||
      (compact.matches && guide?.classList.contains('is-inspecting'));
    if (!active || !positions || obscured) {
      slots.forEach(slot => show(slot, false));
      return;
    }
    const nextViewBox = `0 0 ${viewport.width} ${viewport.height}`;
    if (viewBox !== nextViewBox) {
      leaders.setAttribute('viewBox', nextViewBox);
      viewBox = nextViewBox;
    }
    if (layoutDirty) {
      readingTop = compact.matches && storyPane ? storyPane.getBoundingClientRect().top : 0;
      headerBottom = Math.max(70, document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0);
      slots.forEach(slot => { slot.rect = slot.button.getBoundingClientRect(); });
      layoutDirty = false;
    }
    const minimumY = Math.max(headerBottom + 4, readingTop + 4);
    slots.forEach(slot => {
      const point = positions[`download-${slot.id}`];
      const rect = slot.rect;
      const visible = Boolean(point?.visible && point.inFrame && rect?.width && rect.height &&
        rect.top >= minimumY && rect.bottom <= viewport.height - 4 &&
        rect.left >= 0 && rect.right <= viewport.width);
      show(slot, visible);
      if (!visible) return;
      if (compact.matches && (slot.id === 'host' || slot.id === 'client')) {
        const host = slot.id === 'host';
        const gutterX = host ? 12 : viewport.width - 12;
        const endpoint = { x: host ? rect.left : rect.right, y: rect.top + rect.height / 2 };
        slot.path.setAttribute('d', `M ${point.x} ${point.y} L ${gutterX} ${point.y} L ${gutterX} ${endpoint.y} L ${endpoint.x} ${endpoint.y} M ${endpoint.x} ${endpoint.y - 5} L ${endpoint.x} ${endpoint.y + 5}`);
      } else {
        const endpoint = nearestEdge(point, rect);
        const horizontal = endpoint.x === rect.left || endpoint.x === rect.right;
        const elbow = horizontal ? { x: endpoint.x + (point.x < endpoint.x ? -18 : 18), y: point.y } :
          { x: point.x, y: endpoint.y + (point.y < endpoint.y ? -18 : 18) };
        const tick = horizontal ? `M ${endpoint.x} ${endpoint.y - 5} L ${endpoint.x} ${endpoint.y + 5}` :
          `M ${endpoint.x - 5} ${endpoint.y} L ${endpoint.x + 5} ${endpoint.y}`;
        slot.path.setAttribute('d', `M ${point.x} ${point.y} L ${elbow.x} ${elbow.y} L ${endpoint.x} ${endpoint.y} ${tick}`);
      }
      slot.dot.setAttribute('cx', point.x);
      slot.dot.setAttribute('cy', point.y);
    });
  }

  const sizes = new WeakMap();
  const observer = new ResizeObserver(entries => {
    for (const entry of entries) {
      const previous = sizes.get(entry.target);
      const { width, height } = entry.contentRect;
      sizes.set(entry.target, { width, height });
      if (!previous || Math.abs(previous.width - width) > .25 || Math.abs(previous.height - height) > .25) invalidate();
    }
  });
  observer.observe(section);
  slots.forEach(slot => { observer.observe(slot.card); observer.observe(slot.button); });
  window.addEventListener('resize', invalidate, { passive: true });
  window.addEventListener('scroll', invalidate, { capture: true, passive: true });
  window.visualViewport?.addEventListener('resize', invalidate, { passive: true });
  window.visualViewport?.addEventListener('scroll', invalidate, { passive: true });

  return {
    setActive(value) {
      if (active === Boolean(value)) return;
      active = Boolean(value);
      section.dataset.active = String(active);
      invalidate();
      layout();
    },
    update({ points, width, height }) {
      if (width !== viewport.width || height !== viewport.height) invalidate();
      positions = points;
      viewport = { width, height };
      layout();
    },
    dispose() {
      observer.disconnect();
      window.removeEventListener('resize', invalidate);
      window.removeEventListener('scroll', invalidate, true);
      window.visualViewport?.removeEventListener('resize', invalidate);
      window.visualViewport?.removeEventListener('scroll', invalidate);
      slots.forEach(slot => { slot.path.remove(); slot.dot.remove(); });
    },
  };
}
