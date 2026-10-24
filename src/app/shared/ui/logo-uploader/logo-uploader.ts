import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function logoFileError(file: File): string | null {
  if (!LOGO_TYPES.includes(file.type)) return 'El logo debe ser una imagen PNG, JPG o WebP.';
  if (file.size > LOGO_MAX_BYTES) return 'El logo debe pesar como máximo 2 MB.';
  return null;
}

@Component({
  selector: 'app-logo-uploader',
  template: `
    <div class="logo-uploader">
      <div class="logo-uploader__preview">
        @if (logoUrl(); as logo) {
          <img [src]="logo" [alt]="'Logo de ' + companyName()" />
        } @else {
          <span class="material-icons" aria-hidden="true">image</span>
        }
      </div>
      <div class="logo-uploader__body">
        <strong>Logo de la empresa</strong>
        <small>PNG, JPG o WebP de hasta 2 MB, idealmente cuadrado. Llena el recuadro del menú lateral (si no es cuadrado se recorta al centro); al cambiarlo se reemplaza el anterior.</small>
        <div class="logo-uploader__actions">
          <button type="button" class="ghost" [disabled]="busy()" (click)="picker.click()">
            <span class="material-icons" aria-hidden="true">upload</span>{{ logoUrl() ? 'Cambiar logo' : 'Subir logo' }}
          </button>
          @if (logoUrl()) {
            <button type="button" class="ghost danger" [disabled]="busy()" (click)="remove.emit()">
              <span class="material-icons" aria-hidden="true">delete</span>Quitar logo
            </button>
          }
        </div>
        @if (busy()) {
          <p class="logo-uploader__status">Guardando logo…</p>
        } @else if (error()) {
          <p class="logo-uploader__error" role="alert">{{ error() }}</p>
        }
      </div>
      <input #picker type="file" accept="image/png,image/jpeg,image/webp" hidden (change)="pick(picker)" />
    </div>
  `,
  styles: `
    .logo-uploader { display: flex; gap: 16px; align-items: center; margin-bottom: 16px; }
    .logo-uploader__preview {
      display: grid; flex-shrink: 0; width: 88px; height: 88px; place-items: center; overflow: hidden;
      border: 1px dashed var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-secondary);
    }
    .logo-uploader__preview:has(img) { border-style: solid; }
    .logo-uploader__preview img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center; }
    .logo-uploader__preview .material-icons { font-size: 32px; color: var(--color-text-muted); }
    .logo-uploader__body { display: grid; gap: 6px; min-width: 0; }
    .logo-uploader__body small { color: var(--color-text-muted); }
    .logo-uploader__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
    .logo-uploader__status { margin: 0; color: var(--color-text-muted); font-size: 13px; }
    .logo-uploader__error { margin: 0; color: var(--color-error-text); font-size: 13px; }
    @media (max-width: 520px) { .logo-uploader { align-items: flex-start; } .logo-uploader__preview { width: 64px; height: 64px; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoUploader {
  readonly logoUrl = input<string | null>(null);
  readonly companyName = input('');
  readonly busy = input(false);
  readonly selected = output<File>();
  readonly remove = output<void>();
  readonly error = signal<string | null>(null);

  pick(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const problem = logoFileError(file);
    this.error.set(problem);
    if (!problem) this.selected.emit(file);
  }

  showError(message: string): void {
    this.error.set(message);
  }
}
