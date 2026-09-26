import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface SendReceiptData {
  readonly saleNumber: string;
  readonly clientName: string | null;
  /** Correo del cliente de la venta (destinatario por defecto). */
  readonly clientEmail: string | null;
}

/** Confirma el destinatario del comprobante; se cierra con el correo o `undefined` si se cancela. */
@Component({
  selector: 'app-send-receipt-dialog',
  imports: [MatDialogModule, ReactiveFormsModule],
  template: `
    <section class="dialog">
      <header>
        <span class="material-icons">mail</span>
        <div>
          <h2>Enviar comprobante</h2>
          <p>{{ data.saleNumber }} · Se adjunta el comprobante en PDF.</p>
        </div>
      </header>

      <label>
        Correo del destinatario
        <input type="email" [formControl]="email" placeholder="cliente@correo.com" (keyup.enter)="send()" />
        @if (email.touched && email.invalid) {
          <small class="error">Ingresa un correo válido.</small>
        } @else if (data.clientEmail) {
          <small class="hint">Correo registrado de {{ data.clientName ?? 'el cliente' }}. Puedes cambiarlo.</small>
        } @else {
          <small class="hint">{{ data.clientName ? 'El cliente no tiene correo registrado.' : 'Venta a cliente general.' }} Escribe el correo.</small>
        }
      </label>

      <footer>
        <button type="button" (click)="close()">Cancelar</button>
        <button type="button" class="primary" (click)="send()">Enviar</button>
      </footer>
    </section>
  `,
  styles: `
    .dialog { display: grid; gap: 18px; width: min(460px, calc(100vw - 40px)); padding: 24px; box-sizing: border-box; }
    header { display: flex; align-items: center; gap: 12px; }
    header > span { padding: 10px; border-radius: var(--radius-md); color: var(--color-primary); background: var(--color-primary-soft); }
    h2, p { margin: 0; }
    header p { margin-top: 4px; color: var(--color-text-muted); font-size: var(--font-size-sm); }
    label { display: grid; gap: 7px; color: var(--color-text-secondary); font-size: var(--font-size-sm); font-weight: 600; }
    input { padding: 11px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font: inherit; }
    input:focus { border-color: var(--color-primary); outline: 2px solid var(--color-primary-soft); }
    .hint { color: var(--color-text-muted); font-weight: 400; }
    .error { color: var(--color-danger); font-weight: 400; }
    footer { display: flex; justify-content: flex-end; gap: 10px; }
    button { padding: 10px 16px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); font-weight: 600; cursor: pointer; }
    .primary { border-color: var(--color-primary); color: white; background: var(--color-primary); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendReceiptDialog {
  readonly data = inject<SendReceiptData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SendReceiptDialog, string>);

  readonly email = new FormControl(this.data.clientEmail ?? '', {
    nonNullable: true,
    validators: [Validators.required, Validators.email, Validators.maxLength(180)],
  });

  send(): void {
    if (this.email.invalid) {
      this.email.markAsTouched();
      return;
    }
    this.dialogRef.close(this.email.value.trim());
  }

  close(): void {
    this.dialogRef.close();
  }
}
