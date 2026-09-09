export type MovementType = 'Entrada' | 'Salida' | 'Ajuste' | 'Transferencia';

export interface InventoryMovement {
  readonly id: string;
  readonly code: string;
  readonly dateTime: string;
  readonly type: MovementType;
  readonly productName: string;
  readonly sku: string;
  readonly quantity: number;
  readonly previousStock: number;
  readonly newStock: number;
  readonly reference: string;
  readonly user: string;
}
