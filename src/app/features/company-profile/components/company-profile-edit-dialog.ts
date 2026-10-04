import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { hexColorValidator, isHexColor, normalizeHexInput } from '../../../shared/forms/hex-color';
import { ensureContrast } from '../../../shared/utils/contrast-color';
import { CompanyProfileApiService } from '../data-access/company-profile-api.service';
import { CompanyProfile } from '../models/company-profile.model';

type ColorKey = 'primaryColor' | 'secondaryColor' | 'accentColor' | 'backgroundColor';

@Component({
  selector: 'app-company-profile-edit-dialog',
  imports: [MatDialogModule, ReactiveFormsModule],
  template: `
    <form class="dialog" [formGroup]="form" (ngSubmit)="save()">
      <header>
        <span class="material-icons">edit</span>
        <div>
          <h2>Editar mi empresa</h2>
          <p>Nombre comercial, razón social y RUC los gestiona el equipo de SAVIX.</p>
        </div>
      </header>

      <fieldset>
        <legend>Contacto</legend>
        <div class="grid">
          <label>Rubro comercial <input formControlName="businessType" maxlength="120" placeholder="Ej. Distribución y retail" /></label>
          <label>Teléfono <input formControlName="phone" maxlength="30" placeholder="+51 987 654 321" /></label>
          <label class="wide">Correo de contacto *
            <input type="email" formControlName="email" maxlength="180" />
            @if (form.controls.email.touched && form.controls.email.invalid) { <small class="error">Ingresa un correo válido.</small> }
          </label>
          <label class="wide">Dirección fiscal / principal *
            <input formControlName="address" maxlength="350" />
            @if (form.controls.address.touched && form.controls.address.invalid) { <small class="error">La dirección es obligatoria.</small> }
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Identidad visual</legend>
        <div class="grid">
          @for (color of colors; track color.key) {
            <label>{{ color.label }}
              <span class="color">
                <input type="color" [value]="value(color.key)" (input)="setColor(color.key, $any($event.target).value)" [attr.aria-label]="color.label" />
                <input [formControlName]="color.key" maxlength="7" (input)="normalize(color.key)" />
              </span>
              <small class="hint">{{ color.hint }}</small>
            </label>
          }
        </div>

        <div class="preview" [style.background]="value('backgroundColor')" aria-label="Vista previa">
          <aside [style.background]="value('secondaryColor')">
            <span class="mark" [style.background]="value('primaryColor')"></span>
            <span class="item" [style.box-shadow]="'inset 3px 0 0 ' + previewAccent()" [style.color]="previewAccent()">Dashboard</span>
            <span class="item muted-item">Ventas</span>
          </aside>
          <div class="content">
            <span class="btn" [style.background]="value('primaryColor')">Botón principal</span>
            <span class="chip" [style.color]="value('accentColor')" [style.border-color]="value('accentColor')">Acento</span>
          </div>
        </div>
      </fieldset>

      @if (error()) { <p class="error" role="alert">{{ error() }}</p> }

      <footer>
        <button type="button" (click)="close()" [disabled]="saving()">Cancelar</button>
        <button type="submit" class="primary" [disabled]="saving()">{{ saving() ? 'Guardando…' : 'Guardar cambios' }}</button>
      </footer>
    </form>
  `,
  styles: `
    .dialog { display: grid; gap: 16px; width: min(640px, calc(100vw - 40px)); padding: 24px; box-sizing: border-box; }
    header { display: flex; align-items: center; gap: 12px; }
    header > span { padding: 10px; border-radius: var(--radius-md); color: var(--color-primary); background: var(--color-primary-soft); }
    h2, p { margin: 0; }
    header p { margin-top: 4px; color: var(--color-text-muted); font-size: var(--font-size-sm); }
    fieldset { display: grid; gap: 12px; margin: 0; padding: 14px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); min-width: 0; }
    legend { padding: 0 6px; font-weight: 700; color: var(--color-text-secondary); }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .wide { grid-column: 1 / -1; }
    label { display: grid; gap: 6px; color: var(--color-text-secondary); font-size: var(--font-size-sm); font-weight: 600; }
    input { padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font: inherit; min-width: 0; }
    input:focus { border-color: var(--color-primary); outline: 2px solid var(--color-primary-soft); }
    .color { display: flex; gap: 8px; }
    .color input[type='color'] { width: 44px; height: 40px; padding: 2px; cursor: pointer; }
    .hint { color: var(--color-text-muted); font-weight: 400; }
    .error { margin: 0; color: var(--color-danger); font-weight: 400; }
    .preview { display: grid; grid-template-columns: 120px 1fr; min-height: 110px; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
    .preview aside { display: grid; align-content: start; gap: 6px; padding: 10px; }
    .mark { width: 22px; height: 22px; border-radius: 6px; }
    .item { padding: 5px 8px; border-radius: 6px; font-size: 12px; background: rgba(255, 255, 255, 0.08); }
    .muted-item { color: #94a3b8; box-shadow: none; background: transparent; }
    .content { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 12px; }
    .btn { padding: 7px 12px; border-radius: 6px; color: white; font-size: 12px; font-weight: 600; }
    .chip { padding: 4px 10px; border: 1px solid; border-radius: 999px; font-size: 12px; font-weight: 600; background: white; }
    footer { display: flex; justify-content: flex-end; gap: 10px; }
    button { padding: 10px 16px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); font-weight: 600; cursor: pointer; }
    .primary { border-color: var(--color-primary); color: white; background: var(--color-primary); }
    @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyProfileEditDialog {
  private readonly profile = inject<CompanyProfile>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CompanyProfileEditDialog, CompanyProfile>);
  private readonly api = inject(CompanyProfileApiService);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly colors: readonly { readonly key: ColorKey; readonly label: string; readonly hint: string }[] = [
    { key: 'primaryColor', label: 'Color primario', hint: 'Botones, ítem activo y logo' },
    { key: 'secondaryColor', label: 'Color secundario', hint: 'Fondo del menú lateral' },
    { key: 'accentColor', label: 'Color de acento', hint: 'Estados y resaltados' },
    { key: 'backgroundColor', label: 'Color de fondo', hint: 'Fondo del área principal' },
  ];

  readonly form = new FormGroup({
    businessType: new FormControl(this.profile.businessType ?? '', { nonNullable: true, validators: [Validators.maxLength(120)] }),
    phone: new FormControl(this.profile.phone ?? '', { nonNullable: true, validators: [Validators.maxLength(30)] }),
    email: new FormControl(this.profile.email ?? '', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    address: new FormControl(this.profile.address ?? '', { nonNullable: true, validators: [Validators.required, Validators.maxLength(350)] }),
    primaryColor: new FormControl(this.profile.theme.primaryColor, { nonNullable: true, validators: [hexColorValidator] }),
    secondaryColor: new FormControl(this.profile.theme.secondaryColor, { nonNullable: true, validators: [hexColorValidator] }),
    accentColor: new FormControl(this.profile.theme.accentColor, { nonNullable: true, validators: [hexColorValidator] }),
    backgroundColor: new FormControl(this.profile.theme.backgroundColor, { nonNullable: true, validators: [hexColorValidator] }),
  });

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly previewAccent = computed(() => {
    const value = this.formValue();
    const primary = value.primaryColor ?? '';
    const secondary = value.secondaryColor ?? '';
    return isHexColor(primary) && isHexColor(secondary) ? (ensureContrast(primary, secondary) ?? primary) : primary;
  });

  value(key: ColorKey): string {
    const color = this.formValue()[key] ?? '';
    return isHexColor(color) ? color : '#FFFFFF';
  }

  setColor(key: ColorKey, color: string): void {
    this.form.controls[key].setValue(color.toUpperCase());
  }

  normalize(key: ColorKey): void {
    const control = this.form.controls[key];
    const normalized = normalizeHexInput(control.value);
    if (normalized !== control.value) control.setValue(normalized);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Revisa los campos marcados.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.api.update(this.form.getRawValue()).subscribe({
      next: (profile) => this.dialogRef.close(profile),
      error: (cause: unknown) => {
        this.saving.set(false);
        const body = cause instanceof AppHttpError
          ? (cause.originalError as { error?: { title?: unknown; errors?: unknown } } | undefined)?.error
          : undefined;
        this.error.set(typeof body?.title === 'string' && !body.errors ? body.title : 'No se pudieron guardar los cambios.');
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
