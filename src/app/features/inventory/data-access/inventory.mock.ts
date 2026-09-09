import { InventoryItem } from '../models/inventory-item.model';

export const INVENTORY_MOCK: readonly InventoryItem[] = [
  { id: '1', sku: 'SKU-001', productName: 'Audífonos Bluetooth Pro', category: 'Tecnología', warehouse: 'Almacén principal', stock: 45, minimumStock: 10, status: 'AVAILABLE' },
  { id: '2', sku: 'SKU-002', productName: 'Cable USB-C 2m', category: 'Accesorios', warehouse: 'Almacén principal', stock: 120, minimumStock: 25, status: 'AVAILABLE' },
  { id: '3', sku: 'SKU-003', productName: 'Mouse Inalámbrico', category: 'Tecnología', warehouse: 'Tienda centro', stock: 8, minimumStock: 12, status: 'LOW_STOCK' },
  { id: '4', sku: 'SKU-004', productName: 'Teclado Mecánico', category: 'Tecnología', warehouse: 'Tienda centro', stock: 32, minimumStock: 8, status: 'AVAILABLE' },
  { id: '5', sku: 'SKU-005', productName: 'Cargador Rápido 65W', category: 'Accesorios', warehouse: 'Almacén principal', stock: 0, minimumStock: 15, status: 'OUT_OF_STOCK' },
];
