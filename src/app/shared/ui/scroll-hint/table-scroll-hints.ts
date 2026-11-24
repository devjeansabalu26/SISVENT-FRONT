import { HoldScroll, HoldScrollTarget } from './hold-scroll';

const MOBILE_QUERY = '(max-width: 900px)';
const EDGE_PX = 8;
const MIN_OVERFLOW_PX = 16;
const HINT_SIZE = 32;
const SIDE_GAP = 6;
const STEP_RATIO = 0.15;
const SHADE_WIDTH = 44;

interface TrackedContainer {
  readonly back: HTMLButtonElement;
  readonly forward: HTMLButtonElement;
  readonly backShade: HTMLSpanElement;
  readonly forwardShade: HTMLSpanElement;
  readonly onScroll: () => void;
}

export class TableScrollHints {
  private readonly tracked = new Map<HTMLElement, TrackedContainer>();
  private readonly mobile = window.matchMedia(MOBILE_QUERY);
  private readonly resizeObserver = new ResizeObserver(() => this.schedule());
  private readonly mutationObserver = new MutationObserver((records) => {
    if (records.some((record) => !this.isOwnHint(record))) this.scheduleScan();
  });
  private readonly hold = new HoldScroll();
  private frame = 0;
  private scanFrame = 0;
  private readonly onWindowChange = () => this.schedule();
  private readonly onMediaChange = () => this.scheduleScan();

  start(): void {
    this.mutationObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', this.onWindowChange, { passive: true });
    window.addEventListener('resize', this.onWindowChange, { passive: true });
    this.mobile.addEventListener('change', this.onMediaChange);
    this.scheduleScan();
  }

  stop(): void {
    this.hold.stop();
    cancelAnimationFrame(this.frame);
    cancelAnimationFrame(this.scanFrame);
    this.mutationObserver.disconnect();
    this.resizeObserver.disconnect();
    window.removeEventListener('scroll', this.onWindowChange);
    window.removeEventListener('resize', this.onWindowChange);
    this.mobile.removeEventListener('change', this.onMediaChange);
    for (const container of [...this.tracked.keys()]) this.untrack(container);
  }

  private isOwnHint(record: MutationRecord): boolean {
    const nodes = [...Array.from(record.addedNodes), ...Array.from(record.removedNodes)];
    return nodes.length > 0 && nodes.every((node) => node instanceof HTMLElement && (node.classList.contains('table-scroll-hint') || node.classList.contains('table-scroll-shade')));
  }

  private scheduleScan(): void {
    cancelAnimationFrame(this.scanFrame);
    this.scanFrame = requestAnimationFrame(() => this.scan());
  }

  private schedule(): void {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.updateAll());
  }

  private scan(): void {
    const found = new Set<HTMLElement>();
    if (this.mobile.matches) {
      for (const table of Array.from(document.querySelectorAll('table'))) {
        const container = this.scrollContainerOf(table);
        if (container) found.add(container);
      }
    }
    for (const container of [...this.tracked.keys()]) {
      if (!found.has(container) || !container.isConnected) this.untrack(container);
    }
    for (const container of found) {
      if (!this.tracked.has(container)) this.track(container);
    }
    this.updateAll();
  }

  private scrollContainerOf(table: HTMLElement): HTMLElement | null {
    let node = table.parentElement;
    while (node && node !== document.body) {
      const overflow = getComputedStyle(node).overflowX;
      if (overflow === 'auto' || overflow === 'scroll') return node;
      node = node.parentElement;
    }
    return null;
  }

  private track(container: HTMLElement): void {
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    const backShade = this.createShade(container, 'table-scroll-shade--back');
    const forwardShade = this.createShade(container, 'table-scroll-shade--forward');
    const back = this.createHint(container, 'chevron_left', 'table-scroll-hint--back', 'Ver columnas anteriores', -1);
    const forward = this.createHint(container, 'chevron_right', 'table-scroll-hint--forward', 'Ver más columnas', 1);
    const onScroll = () => this.schedule();
    container.addEventListener('scroll', onScroll, { passive: true });
    this.resizeObserver.observe(container);
    const table = container.querySelector('table');
    if (table) this.resizeObserver.observe(table);
    this.tracked.set(container, { back, forward, backShade, forwardShade, onScroll });
  }

  private untrack(container: HTMLElement): void {
    const entry = this.tracked.get(container);
    if (!entry) return;
    container.removeEventListener('scroll', entry.onScroll);
    this.resizeObserver.unobserve(container);
    const table = container.querySelector('table');
    if (table) this.resizeObserver.unobserve(table);
    entry.back.remove();
    entry.forward.remove();
    entry.backShade.remove();
    entry.forwardShade.remove();
    this.tracked.delete(container);
  }

  private createShade(container: HTMLElement, modifier: string): HTMLSpanElement {
    const shade = document.createElement('span');
    shade.className = `table-scroll-shade ${modifier}`;
    shade.setAttribute('aria-hidden', 'true');
    container.appendChild(shade);
    return shade;
  }

  private createHint(container: HTMLElement, iconName: string, modifier: string, label: string, direction: 1 | -1): HTMLButtonElement {
    const hint = document.createElement('button');
    hint.type = 'button';
    hint.className = `table-scroll-hint ${modifier}`;
    hint.setAttribute('aria-label', label);
    hint.title = label;
    const target: HoldScrollTarget = {
      position: () => container.scrollLeft,
      scrollBy: (delta, smooth) => container.scrollBy({ left: delta, behavior: smooth ? 'smooth' : 'instant' }),
      step: () => container.clientWidth * STEP_RATIO,
    };
    hint.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      this.hold.press(target, direction);
    });
    hint.addEventListener('click', (event) => {
      event.stopPropagation();
      if (event.detail === 0) target.scrollBy(direction * target.step(), true);
    });
    hint.addEventListener('contextmenu', (event) => event.preventDefault());
    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = iconName;
    hint.appendChild(icon);
    container.appendChild(hint);
    return hint;
  }

  private updateAll(): void {
    for (const [container, entry] of this.tracked) this.update(container, entry);
  }

  private update(container: HTMLElement, entry: TrackedContainer): void {
    const max = container.scrollWidth - container.clientWidth;
    const rect = container.getBoundingClientRect();
    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, window.innerHeight);
    const visible = max > MIN_OVERFLOW_PX && visibleBottom - visibleTop >= HINT_SIZE;
    const canBack = visible && container.scrollLeft > EDGE_PX;
    const canForward = visible && container.scrollLeft < max - EDGE_PX;
    entry.back.classList.toggle('table-scroll-hint--on', canBack);
    entry.forward.classList.toggle('table-scroll-hint--on', canForward);
    entry.backShade.classList.toggle('table-scroll-shade--on', canBack);
    entry.forwardShade.classList.toggle('table-scroll-shade--on', canForward);
    if (!visible) return;
    const stickyEnd = this.stickyEndWidth(container);
    const shadeTop = `${container.scrollTop}px`;
    const shadeHeight = `${container.clientHeight}px`;
    entry.backShade.style.top = shadeTop;
    entry.backShade.style.height = shadeHeight;
    entry.backShade.style.left = `${container.scrollLeft}px`;
    entry.forwardShade.style.top = shadeTop;
    entry.forwardShade.style.height = shadeHeight;
    entry.forwardShade.style.left = `${container.scrollLeft + container.clientWidth - SHADE_WIDTH - stickyEnd}px`;
    const top = `${(visibleTop + visibleBottom) / 2 - rect.top + container.scrollTop - HINT_SIZE / 2}px`;
    entry.back.style.top = top;
    entry.forward.style.top = top;
    entry.back.style.left = `${container.scrollLeft + SIDE_GAP}px`;
    entry.forward.style.left = `${container.scrollLeft + container.clientWidth - HINT_SIZE - SIDE_GAP - stickyEnd}px`;
  }

  private stickyEndWidth(container: HTMLElement): number {
    const cell = container.querySelector<HTMLElement>('table > tbody > tr > td:last-child')
      ?? container.querySelector<HTMLElement>('table > thead > tr > th:last-child');
    if (!cell) return 0;
    const style = getComputedStyle(cell);
    if (style.position !== 'sticky' || style.right === 'auto') return 0;
    return cell.offsetWidth;
  }
}
