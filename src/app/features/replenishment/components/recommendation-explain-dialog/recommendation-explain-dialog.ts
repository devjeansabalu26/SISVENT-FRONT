import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ReplenishmentInput, computeSuggestedQuantity } from '../../utils/suggested-quantity';

export interface RecommendationExplainData {
  readonly product: string;
  readonly method: string;
  readonly input: ReplenishmentInput;
}

/** Días de cobertura por debajo de los cuales el producto se marca como crítico (misma regla que la cobertura "< 7 días"). */
const CRITICAL_COVERAGE_DAYS = 7;

/** Figma `mod-explicacion-recomendacion` (MOD-PR-03): desglose de la fórmula de compra sugerida. */
@Component({
  selector: 'app-recommendation-explain-dialog',
  imports: [MatDialogModule],
  template: `
    <section class="dialog review">
      <header>
        <span class="material-icons">lightbulb</span>
        <div class="review__title">
          <h2>Explicación de recomendación</h2>
          <p>{{ data.product }} · Cálculo automatizado de reabastecimiento (SAVIX Smart Stock)</p>
        </div>
        <small class="review__code">MOD-PR-03</small>
      </header>

      <dl class="review__meta">
        <div><dt>Stock actual</dt><dd>{{ data.input.currentStock }} unidades</dd></div>
        <div><dt>Venta promedio</dt><dd>{{ data.input.averageDailySales }} unidades / día</dd></div>
        <div>
          <dt>Cobertura inventario</dt>
          <dd [class.critical]="critical">
            @if (result.coverageDays !== null) { {{ result.coverageDays }} días @if (critical) { (Crítico) } } @else { Sin ventas }
          </dd>
        </div>
        <div><dt>Stock de seguridad</dt><dd>{{ data.input.safetyStock }} unidades</dd></div>
        <div><dt>Tiempo de reposición</dt><dd>{{ data.input.leadTimeDays }} días hábiles</dd></div>
        <div><dt>Método de cálculo</dt><dd>{{ data.method }}</dd></div>
      </dl>

      <div class="formula">
        <small>Fórmula aplicada</small>
        <code>Sugerido = (Venta Promedio × Tiempo Reposición) + Stock Seguridad − Stock Actual</code>
        <code>
          Sugerido = ({{ data.input.averageDailySales }} × {{ data.input.leadTimeDays }}) + {{ data.input.safetyStock }} −
          {{ data.input.currentStock }} = {{ result.raw }} unidades
        </code>
      </div>

      <p class="review__banner" data-tone="success">
        <span class="material-icons">shopping_bag</span>
        <span>
          Cantidad recomendada a comprar: <strong>{{ result.rounded }} unidades sugeridas</strong>
          @if (result.rounded !== result.raw && result.raw > 0) { (ajustado al entero superior) }
        </span>
      </p>

      <footer>
        <button type="button" class="primary" (click)="close()">Entendido</button>
      </footer>
    </section>
  `,
  styleUrls: ['../../../../shared/forms/dialog-form.scss', '../../../../shared/ui/review-dialog/review-dialog.scss'],
  styles: `
    .critical { color: var(--color-error); }
    .formula {
      display: grid;
      gap: 6px;
      padding: 12px 14px;
      border: 1px dashed var(--color-border-strong);
      border-radius: var(--radius-md);
    }
    .formula small {
      color: var(--color-text-muted);
      font-size: var(--font-size-xs);
      font-weight: 600;
      text-transform: uppercase;
    }
    .formula code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: var(--font-size-sm);
      overflow-wrap: anywhere;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecommendationExplainDialog {
  readonly data = inject<RecommendationExplainData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<RecommendationExplainDialog, void>);
  readonly result = computeSuggestedQuantity(this.data.input);
  readonly critical = this.result.coverageDays !== null && this.result.coverageDays < CRITICAL_COVERAGE_DAYS;

  close(): void {
    this.dialogRef.close();
  }
}
