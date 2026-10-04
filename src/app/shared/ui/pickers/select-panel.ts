import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, computed, input, output, signal, viewChild,
} from '@angular/core';

export interface SelectPanelOption {
  readonly index: number;
  readonly label: string;
  readonly disabled: boolean;
}

const SEARCH_THRESHOLD = 8;

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

@Component({
  selector: 'app-select-panel',
  template: `
    <div class="panel" role="presentation" (keydown)="onKeydown($event)">
      @if (searchable()) {
        <label class="search">
          <span class="material-icons" aria-hidden="true">search</span>
          <input #search type="text" [value]="query()" (input)="setQuery($any($event.target).value)"
            placeholder="Buscar…" aria-label="Buscar opción" autocomplete="off" />
        </label>
      }
      <ul #list role="listbox" [attr.aria-label]="label()" tabindex="-1">
        @for (option of visible(); track option.index; let i = $index) {
          <li role="option" [id]="'opt-' + option.index" [attr.aria-selected]="option.index === selected()"
            [attr.aria-disabled]="option.disabled" [class.active]="i === active()" [class.selected]="option.index === selected()"
            [class.disabled]="option.disabled" (mouseenter)="active.set(i)" (mousedown)="$event.preventDefault()" (click)="choose(option)">
            <span class="text">{{ option.label || '—' }}</span>
            @if (option.index === selected()) { <span class="material-icons check" aria-hidden="true">check</span> }
          </li>
        } @empty {
          <li class="empty">Sin coincidencias</li>
        }
      </ul>
    </div>
  `,
  styleUrl: './select-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectPanel implements AfterViewInit {
  readonly options = input.required<readonly SelectPanelOption[]>();
  readonly selected = input<number>(-1);
  readonly label = input<string>('Opciones');
  readonly pick = output<number>();
  readonly dismiss = output<void>();

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('search');
  private readonly list = viewChild.required<ElementRef<HTMLUListElement>>('list');

  readonly query = signal('');
  readonly active = signal(0);
  readonly searchable = computed(() => this.options().length > SEARCH_THRESHOLD);
  readonly visible = computed(() => {
    const term = normalize(this.query().trim());
    return term ? this.options().filter((option) => normalize(option.label).includes(term)) : this.options();
  });

  ngAfterViewInit(): void {
    const start = this.visible().findIndex((option) => option.index === this.selected());
    this.active.set(Math.max(0, start));
    (this.searchInput()?.nativeElement ?? this.list().nativeElement).focus();
    this.scrollActive();
  }

  setQuery(value: string): void {
    this.query.set(value);
    this.active.set(0);
  }

  choose(option: SelectPanelOption): void {
    if (!option.disabled) this.pick.emit(option.index);
  }

  onKeydown(event: KeyboardEvent): void {
    const options = this.visible();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.move(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.active.set(0);
        this.scrollActive();
        break;
      case 'End':
        event.preventDefault();
        this.active.set(options.length - 1);
        this.scrollActive();
        break;
      case 'Enter': {
        event.preventDefault();
        const option = options[this.active()];
        if (option) this.choose(option);
        break;
      }
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        this.dismiss.emit();
        break;
      case 'Tab':
        this.dismiss.emit();
        break;
      default:
        if (!this.searchable() && event.key.length === 1) {
          const letter = normalize(event.key);
          const from = this.active() + 1;
          const found = [...options.slice(from), ...options.slice(0, from)].find((o) => normalize(o.label).startsWith(letter));
          if (found) {
            this.active.set(options.indexOf(found));
            this.scrollActive();
          }
        }
    }
  }

  private move(step: number): void {
    const options = this.visible();
    if (!options.length) return;
    let next = this.active();
    for (let i = 0; i < options.length; i++) {
      next = (next + step + options.length) % options.length;
      if (!options[next].disabled) break;
    }
    this.active.set(next);
    this.scrollActive();
  }

  private scrollActive(): void {
    queueMicrotask(() => this.list().nativeElement.querySelector('li.active')?.scrollIntoView({ block: 'nearest' }));
  }
}
