import { SupplierListItem } from '../models/supplier.model';

/** Placeholder data — no backend endpoint for suppliers yet. */
export const SUPPLIER_MOCK: readonly SupplierListItem[] = [
  { id: '1', taxId: '20456789012', legalName: 'Distribuidora Tech SAC', commercialName: 'DisTech', sector: 'Tecnología', contactName: 'Juan Perez', phone: '01-234-5678', totalPurchases: 45200, lastPurchase: '28/08/2026', status: 'ACTIVE' },
  { id: '2', taxId: '20567890123', legalName: 'Importaciones Globales SA', commercialName: 'ImpGlobal', sector: 'Electrónica', contactName: 'María Lopez', phone: '01-345-6789', totalPurchases: 38900, lastPurchase: '25/08/2026', status: 'ACTIVE' },
  { id: '3', taxId: '20678901234', legalName: 'Accesorios Plus EIRL', commercialName: 'AccPlus', sector: 'Accesorios', contactName: 'Carlos Ruiz', phone: '01-456-7890', totalPurchases: 22100, lastPurchase: '20/08/2026', status: 'ACTIVE' },
  { id: '4', taxId: '20789012345', legalName: 'Gaming World SAC', commercialName: 'GamWorld', sector: 'Gaming', contactName: 'Ana Torres', phone: '01-567-8901', totalPurchases: 18500, lastPurchase: '15/08/2026', status: 'ACTIVE' },
  { id: '5', taxId: '20890123456', legalName: 'Red Solutions SA', commercialName: 'RedSol', sector: 'Redes', contactName: 'Pedro Gomez', phone: '01-678-9012', totalPurchases: 12300, lastPurchase: '01/07/2026', status: 'INACTIVE' },
];
