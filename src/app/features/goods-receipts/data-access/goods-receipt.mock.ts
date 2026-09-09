import { GoodsReceiptDetail, GoodsReceiptListItem } from '../models/goods-receipt.model';

/** Placeholder data — no backend endpoint for goods receipts yet. */
export const GOODS_RECEIPT_MOCK: readonly GoodsReceiptListItem[] = [
  { id: '1', code: 'ING-2026-0045', date: '01/09/2026', supplier: 'Distribuidora Tech SAC', itemCount: 5, totalValue: 4200, status: 'Completado', receivedBy: 'Carlos Rodriguez', notes: '—' },
  { id: '2', code: 'ING-2026-0044', date: '30/08/2026', supplier: 'Importaciones Globales SA', itemCount: 8, totalValue: 6800, status: 'Completado', receivedBy: 'Carlos Rodriguez', notes: 'Entrega parcial' },
  { id: '3', code: 'ING-2026-0043', date: '28/08/2026', supplier: 'Accesorios Plus EIRL', itemCount: 3, totalValue: 1500, status: 'Completado', receivedBy: 'María Torres', notes: '—' },
  { id: '4', code: 'ING-2026-0042', date: '25/08/2026', supplier: 'Gaming World SAC', itemCount: 12, totalValue: 8900, status: 'Pendiente', receivedBy: '—', notes: 'Falta confirmar cantidades' },
  { id: '5', code: 'ING-2026-0041', date: '22/08/2026', supplier: 'Distribuidora Tech SAC', itemCount: 4, totalValue: 3200, status: 'Completado', receivedBy: 'Luis Ramírez', notes: '—' },
  { id: '6', code: 'ING-2026-0040', date: '20/08/2026', supplier: 'Red Solutions SA', itemCount: 6, totalValue: 2850, status: 'Anulado', receivedBy: '—', notes: 'Productos defectuosos' },
];

export const GOODS_RECEIPT_DETAIL_MOCK: GoodsReceiptDetail = {
  id: '1',
  code: 'ING-00156',
  date: '02/09/2026',
  time: '10:34 AM',
  supplier: 'Distribuidora Central S.A.C.',
  supplierTaxId: '20501234567',
  documentType: 'Factura',
  documentNumber: 'F001-00245',
  warehouse: 'Tienda Principal — Almacén de Tecnología',
  receivedBy: 'Carlos Mendoza',
  itemCount: 3,
  totalValue: 3650,
  status: 'Completado',
  notes: 'Recepción de mercadería de tecnología para campaña de setiembre.',
  lines: [
    { productName: 'Mouse Logitech M185', sku: 'SKU-003', quantity: 50, unitCost: 22, previousStock: 45, newStock: 95 },
    { productName: 'Audífonos Bluetooth Pro', sku: 'SKU-001', quantity: 30, unitCost: 45, previousStock: 120, newStock: 150 },
    { productName: 'Cable USB-C 2m', sku: 'SKU-002', quantity: 100, unitCost: 12, previousStock: 80, newStock: 180 },
  ],
};
