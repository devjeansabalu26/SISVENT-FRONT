import { InventoryMovement } from '../models/inventory-movement.model';

/** Placeholder data — kárdex feed, no backend endpoint yet. */
export const INVENTORY_MOVEMENT_MOCK: readonly InventoryMovement[] = [
  { id: '1', code: 'MOV-4521', dateTime: '01/09 14:32', type: 'Salida', productName: 'Mouse Gamer RGB', sku: 'PROD-0285', quantity: -2, previousStock: 47, newStock: 45, reference: 'Venta V-2026-0892', user: 'María Torres' },
  { id: '2', code: 'MOV-4520', dateTime: '01/09 14:30', type: 'Salida', productName: 'Teclado K70', sku: 'PROD-0102', quantity: -1, previousStock: 28, newStock: 27, reference: 'Venta V-2026-0892', user: 'María Torres' },
  { id: '3', code: 'MOV-4519', dateTime: '01/09 11:00', type: 'Entrada', productName: 'Mouse Gamer RGB', sku: 'PROD-0285', quantity: 20, previousStock: 27, newStock: 47, reference: 'Ingreso ING-0045', user: 'Carlos Rodriguez' },
  { id: '4', code: 'MOV-4518', dateTime: '01/09 11:00', type: 'Entrada', productName: 'Webcam HD Pro', sku: 'PROD-0290', quantity: 15, previousStock: 8, newStock: 23, reference: 'Ingreso ING-0045', user: 'Carlos Rodriguez' },
  { id: '5', code: 'MOV-4517', dateTime: '01/09 10:30', type: 'Ajuste', productName: 'Cable HDMI 2m', sku: 'PROD-0156', quantity: -3, previousStock: 50, newStock: 47, reference: 'Merma identificada', user: 'Carlos Rodriguez' },
  { id: '6', code: 'MOV-4516', dateTime: '31/08 18:45', type: 'Salida', productName: 'Parlante BT', sku: 'PROD-0201', quantity: -1, previousStock: 15, newStock: 14, reference: 'Venta V-2026-0891', user: 'Luis Ramírez' },
  { id: '7', code: 'MOV-4515', dateTime: '31/08 16:00', type: 'Transferencia', productName: 'Monitor 24"', sku: 'PROD-0078', quantity: -2, previousStock: 6, newStock: 4, reference: 'Transfer a Local Norte', user: 'Carlos Rodriguez' },
  { id: '8', code: 'MOV-4514', dateTime: '31/08 09:00', type: 'Entrada', productName: 'Mousepad XL', sku: 'PROD-0310', quantity: 30, previousStock: 12, newStock: 42, reference: 'Ingreso ING-0044', user: 'Carlos Rodriguez' },
];
