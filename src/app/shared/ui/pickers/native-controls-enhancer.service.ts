import { ComponentType, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import { ComponentRef, Injectable, NgZone, inject } from '@angular/core';
import { DatePanel } from './date-panel';
import { SelectPanel, SelectPanelOption } from './select-panel';

type DateInput = HTMLInputElement & { type: 'date' };

/**
 * Reemplaza los paneles nativos (lista del <select> y calendario del <input type="date">) por los
 * componentes propios SelectPanel y DatePanel, en toda la app y sin tocar las plantillas.
 *
 * El control nativo sigue siendo la fuente del valor: al elegir se actualiza su value y se emiten los
 * eventos `input` y `change`, así ngModel, formControlName y los (change) existentes funcionan igual.
 * Para dejar un control con su panel nativo, añadirle el atributo `data-native-picker`.
 */
@Injectable({ providedIn: 'root' })
export class NativeControlsEnhancer {
  private readonly document = inject(DOCUMENT);
  private readonly overlay = inject(Overlay);
  private readonly zone = inject(NgZone);

  private overlayRef: OverlayRef | null = null;
  private owner: HTMLElement | null = null;
  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;
    // Fase de captura: se adelanta al panel nativo y a los handlers de cada pantalla.
    this.document.addEventListener('mousedown', (event) => this.onPointer(event), true);
    this.document.addEventListener('click', (event) => this.onDateClick(event), true);
    this.document.addEventListener('keydown', (event) => this.onKeydown(event), true);
  }

  private onPointer(event: MouseEvent): void {
    if (event.button !== 0) return;
    const select = this.enhancedSelect(event.target);
    if (!select) return;
    event.preventDefault();
    select.focus();
    if (this.owner === select) this.close();
    else this.zone.run(() => this.openSelect(select));
  }

  private onDateClick(event: MouseEvent): void {
    const input = this.enhancedDate(event.target);
    if (!input || this.owner === input) return;
    event.preventDefault(); // Firefox abriría además su calendario nativo.
    this.zone.run(() => this.openDate(input));
  }

  private onKeydown(event: KeyboardEvent): void {
    const opens = event.key === 'Enter' || event.key === ' ' || event.key === 'F4' || (event.altKey && event.key === 'ArrowDown');
    if (!opens || this.owner === event.target) return;
    const select = this.enhancedSelect(event.target);
    if (select) {
      event.preventDefault();
      this.zone.run(() => this.openSelect(select));
      return;
    }
    // En fechas, Espacio/Enter siguen sirviendo para escribir; el calendario se abre con Alt+↓ o F4.
    const input = this.enhancedDate(event.target);
    if (input && (event.key === 'F4' || event.altKey)) {
      event.preventDefault();
      this.zone.run(() => this.openDate(input));
    }
  }

  private enhancedSelect(target: EventTarget | null): HTMLSelectElement | null {
    if (!(target instanceof HTMLSelectElement)) return null;
    if (target.multiple || target.size > 1 || target.disabled || target.hasAttribute('data-native-picker')) return null;
    return target;
  }

  private enhancedDate(target: EventTarget | null): DateInput | null {
    if (!(target instanceof HTMLInputElement) || target.type !== 'date') return null;
    if (target.disabled || target.readOnly || target.hasAttribute('data-native-picker')) return null;
    return target as DateInput;
  }

  private openSelect(select: HTMLSelectElement): void {
    const options: SelectPanelOption[] = Array.from(select.options).map((option, index) => ({
      index,
      label: option.label || option.text,
      disabled: option.disabled || (option.parentElement instanceof HTMLOptGroupElement && option.parentElement.disabled),
    }));
    // Mismo ancho que el <select> (mínimo 180px para selects muy angostos).
    const ref = this.open(select, SelectPanel, Math.max(select.getBoundingClientRect().width, 180));
    if (!ref) return;
    ref.setInput('options', options);
    ref.setInput('selected', select.selectedIndex);
    ref.setInput('label', select.getAttribute('aria-label') ?? 'Opciones');
    ref.instance.pick.subscribe((index) => {
      if (index !== select.selectedIndex) {
        select.selectedIndex = index;
        this.emitChange(select);
      }
      this.close(true);
    });
    ref.instance.dismiss.subscribe(() => this.close(true));
  }

  private openDate(input: DateInput): void {
    const ref = this.open(input, DatePanel);
    if (!ref) return;
    ref.setInput('value', input.value);
    ref.setInput('min', input.min);
    ref.setInput('max', input.max);
    ref.instance.pick.subscribe((value) => {
      if (value !== input.value) {
        input.value = value;
        this.emitChange(input);
      }
      this.close(true);
    });
    ref.instance.dismiss.subscribe(() => this.close(true));
  }

  private open<T>(anchor: HTMLElement, component: ComponentType<T>, width?: number): ComponentRef<T> | null {
    this.close();
    const position = this.overlay
      .position()
      .flexibleConnectedTo(anchor)
      .withPush(true)
      .withViewportMargin(8)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
        { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
        { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 },
      ]);
    const overlayRef = this.overlay.create({
      positionStrategy: position,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width,
      panelClass: 'app-picker-overlay',
    });
    overlayRef.backdropClick().subscribe(() => this.close());
    this.overlayRef = overlayRef;
    this.owner = anchor;
    anchor.setAttribute('aria-expanded', 'true');
    return overlayRef.attach(new ComponentPortal(component));
  }

  private close(restoreFocus = false): void {
    const owner = this.owner;
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.owner = null;
    if (owner) {
      owner.setAttribute('aria-expanded', 'false');
      if (restoreFocus) owner.focus();
    }
  }

  private emitChange(element: HTMLElement): void {
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
