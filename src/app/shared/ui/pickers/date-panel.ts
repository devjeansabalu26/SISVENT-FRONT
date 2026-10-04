import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { localIsoDate } from '../../utils/date-format';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const WEEKDAYS = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'];

interface DayCell {
  readonly iso: string;
  readonly day: number;
  readonly inMonth: boolean;
  readonly disabled: boolean;
}

function parseIso(value: string | null | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(iso: string, days: number): string {
  const date = parseIso(iso)!;
  date.setDate(date.getDate() + days);
  return localIsoDate(date);
}

@Component({
  selector: 'app-date-panel',
  template: `
    <div class="cal" (keydown)="onKeydown($event)">
      <header>
        <button type="button" class="nav" (click)="shift(-1)" [attr.aria-label]="mode() === 'days' ? 'Mes anterior' : 'Año anterior'">
          <span class="material-icons">chevron_left</span>
        </button>
        <button type="button" class="title" (click)="toggleMode()" [attr.aria-label]="mode() === 'days' ? 'Elegir mes y año' : 'Volver a los días'">
          @if (mode() === 'days') { {{ monthName() }} <strong>{{ viewYear() }}</strong> } @else { <strong>{{ viewYear() }}</strong> }
          <span class="material-icons">{{ mode() === 'days' ? 'expand_more' : 'expand_less' }}</span>
        </button>
        <button type="button" class="nav" (click)="shift(1)" [attr.aria-label]="mode() === 'days' ? 'Mes siguiente' : 'Año siguiente'">
          <span class="material-icons">chevron_right</span>
        </button>
      </header>

      @if (mode() === 'days') {
        <div class="weekdays" aria-hidden="true">
          @for (day of weekdays; track day) { <span>{{ day }}</span> }
        </div>
        <div class="days" role="grid" [attr.aria-label]="monthName() + ' ' + viewYear()">
          @for (cell of cells(); track cell.iso) {
            <button type="button" role="gridcell" [attr.data-iso]="cell.iso" [tabindex]="cell.iso === focused() ? 0 : -1"
              [class.out]="!cell.inMonth" [class.today]="cell.iso === today" [class.selected]="cell.iso === value()"
              [disabled]="cell.disabled" [attr.aria-selected]="cell.iso === value()" (click)="choose(cell.iso)"
              [attr.aria-label]="cell.day + ' de ' + monthOf(cell.iso)">{{ cell.day }}</button>
          }
        </div>
      } @else {
        <div class="months">
          @for (name of months; track name; let i = $index) {
            <button type="button" [class.selected]="i === viewMonth()" [class.current]="isCurrentMonth(i)" (click)="pickMonth(i)">{{ name.slice(0, 3) }}</button>
          }
        </div>
      }

      <footer>
        <button type="button" class="clear" (click)="clear()">Limpiar</button>
        <button type="button" class="today-btn" (click)="choose(today)" [disabled]="isDisabled(today)">Hoy</button>
      </footer>
    </div>
  `,
  styleUrl: './date-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatePanel implements AfterViewInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly value = input<string>('');
  readonly min = input<string>('');
  readonly max = input<string>('');
  readonly pick = output<string>();
  readonly dismiss = output<void>();

  readonly today = localIsoDate();
  readonly weekdays = WEEKDAYS;
  readonly months = MONTHS;

  readonly mode = signal<'days' | 'months'>('days');
  readonly focused = signal(this.today);
  readonly viewYear = signal(new Date().getFullYear());
  readonly viewMonth = signal(new Date().getMonth());

  readonly monthName = computed(() => MONTHS[this.viewMonth()]);
  readonly cells = computed<readonly DayCell[]>(() => {
    const first = new Date(this.viewYear(), this.viewMonth(), 1);
    const offset = (first.getDay() + 6) % 7; // lunes = 0
    const start = new Date(first);
    start.setDate(1 - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const iso = localIsoDate(date);
      return { iso, day: date.getDate(), inMonth: date.getMonth() === this.viewMonth(), disabled: this.isDisabled(iso) };
    });
  });

  ngAfterViewInit(): void {
    const initial = parseIso(this.value()) ? this.value() : this.today;
    this.goTo(initial);
    this.focusCell();
  }

  monthOf(iso: string): string {
    const date = parseIso(iso)!;
    return `${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
  }

  isDisabled(iso: string): boolean {
    return (!!this.min() && iso < this.min()) || (!!this.max() && iso > this.max());
  }

  isCurrentMonth(month: number): boolean {
    const now = new Date();
    return now.getFullYear() === this.viewYear() && now.getMonth() === month;
  }

  choose(iso: string): void {
    if (!this.isDisabled(iso)) this.pick.emit(iso);
  }

  clear(): void {
    this.pick.emit('');
  }

  toggleMode(): void {
    this.mode.set(this.mode() === 'days' ? 'months' : 'days');
    if (this.mode() === 'days') this.focusCell();
  }

  pickMonth(month: number): void {
    this.viewMonth.set(month);
    this.mode.set('days');
    const day = Math.min(parseIso(this.focused())!.getDate(), new Date(this.viewYear(), month + 1, 0).getDate());
    this.focused.set(localIsoDate(new Date(this.viewYear(), month, day)));
    this.focusCell();
  }

  shift(step: number): void {
    if (this.mode() === 'months') {
      this.viewYear.update((year) => year + step);
      return;
    }
    const month = this.viewMonth() + step;
    this.viewYear.update((year) => year + Math.floor(month / 12));
    this.viewMonth.set(((month % 12) + 12) % 12);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.dismiss.emit();
      return;
    }
    if (this.mode() !== 'days') return;
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in moves) {
      event.preventDefault();
      this.goTo(addDays(this.focused(), moves[event.key]));
      this.focusCell();
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
      const date = parseIso(this.focused())!;
      date.setMonth(date.getMonth() + (event.key === 'PageUp' ? -1 : 1));
      this.goTo(localIsoDate(date));
      this.focusCell();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const date = parseIso(this.focused())!;
      const offset = (date.getDay() + 6) % 7;
      this.goTo(addDays(this.focused(), event.key === 'Home' ? -offset : 6 - offset));
      this.focusCell();
    }
  }

  private goTo(iso: string): void {
    const date = parseIso(iso)!;
    this.focused.set(iso);
    this.viewYear.set(date.getFullYear());
    this.viewMonth.set(date.getMonth());
  }

  private focusCell(): void {
    setTimeout(() => {
      const root = this.host.nativeElement;
      const cell = root.querySelector<HTMLButtonElement>(`button[data-iso="${this.focused()}"]`);
      (cell && !cell.disabled ? cell : root.querySelector<HTMLButtonElement>('.title'))?.focus();
    });
  }
}
