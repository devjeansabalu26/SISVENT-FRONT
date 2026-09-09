export interface RecentRow {
  readonly id: string;
  readonly primary: string;
  readonly secondary: string;
  readonly meta: string;
  readonly value: string;
  readonly status: string;
}

export interface ActivityItem {
  readonly text: string;
  readonly by: string;
  readonly when: string;
}

/** Placeholder dashboard data — no aggregated dashboard endpoint yet. */

export const SUPERADMIN_COMPANIES: readonly RecentRow[] = [
  { id: '1', primary: 'Global Trade S.A.', secondary: 'ID: #1000', meta: 'Carlos Mendoza', value: '12 Oct 2023', status: 'ACTIVA' },
  { id: '2', primary: 'Supermercados El Sol', secondary: 'ID: #1001', meta: 'Ana María López', value: '10 Oct 2023', status: 'ACTIVA' },
  { id: '3', primary: 'Ferretería Central', secondary: 'ID: #1002', meta: 'Pedro J. Ramírez', value: '08 Oct 2023', status: 'PENDIENTE' },
  { id: '4', primary: 'Farmacias del Ahorro', secondary: 'ID: #1003', meta: 'Sofía Torres', value: '05 Oct 2023', status: 'ACTIVA' },
  { id: '5', primary: 'Distribuidora del Norte', secondary: 'ID: #1004', meta: 'Manuel Gutiérrez', value: '01 Oct 2023', status: 'SUSPENDIDA' },
];

export const SUPERADMIN_EXPIRING: readonly RecentRow[] = [
  { id: '1', primary: 'TecnoSoluciones S.A.', secondary: 'Plan Corporativo', meta: '', value: 'Expira en 3 días', status: 'POR VENCER' },
  { id: '2', primary: 'Inmobiliaria Oriente', secondary: 'Plan Corporativo', meta: '', value: 'Expira en 6 días', status: 'POR VENCER' },
  { id: '3', primary: 'Clínica San José', secondary: 'Plan Corporativo', meta: '', value: 'Expira en 14 días', status: 'POR VENCER' },
];

export const SUPERADMIN_ACTIVITY: readonly ActivityItem[] = [
  { text: "Nueva empresa 'Ferretería Central' registrada", by: 'Carlos (Superadmin)', when: 'Hace 10 min' },
  { text: "Suscripción extendida para 'Global Trade S.A.' por 12 meses", by: 'Soporte SISVENT', when: 'Hace 1 hora' },
  { text: "Empresa 'Distribuidora del Norte' suspendida por falta de pago", by: 'Soporte SISVENT', when: 'Hace 4 horas' },
  { text: 'Actualización de base de datos del sistema completada', by: 'Sistema', when: 'Hace 1 día' },
];

export const ADMIN_SALES: readonly RecentRow[] = [
  { id: '1', primary: 'Juan Perez', secondary: 'V0047', meta: 'Hoy, 10:42 AM', value: 'S/ 299.80', status: 'COMPLETADA' },
  { id: '2', primary: 'Maria Gomez', secondary: 'V0046', meta: 'Hoy, 09:15 AM', value: 'S/ 150.00', status: 'COMPLETADA' },
  { id: '3', primary: 'Carlos Ruiz', secondary: 'V0045', meta: 'Ayer, 06:30 PM', value: 'S/ 1,200.00', status: 'COMPLETADA' },
  { id: '4', primary: 'Ana Peralta', secondary: 'V0044', meta: 'Ayer, 04:20 PM', value: 'S/ 45.00', status: 'PENDIENTE' },
  { id: '5', primary: 'Luis Mendoza', secondary: 'V0043', meta: 'Ayer, 11:10 AM', value: 'S/ 320.00', status: 'COMPLETADA' },
];

export const ADMIN_TOP_PRODUCTS: readonly RecentRow[] = [
  { id: '1', primary: 'Audífonos Bluetooth Pro', secondary: '42 u. vendidos', meta: '', value: 'S/ 3,775.80', status: '' },
  { id: '2', primary: 'Mouse Inalámbrico', secondary: '28 u. vendidos', meta: '', value: 'S/ 1,260.00', status: '' },
  { id: '3', primary: 'Cable USB-C 2m', secondary: '25 u. vendidos', meta: '', value: 'S/ 625.00', status: '' },
];

export const ADMIN_LOW_STOCK: readonly RecentRow[] = [
  { id: '1', primary: 'Adaptador HDMI a VGA', secondary: 'Local Miraflores', meta: '', value: '2 unidades', status: 'BAJO' },
  { id: '2', primary: 'Cargador Rápido 20W', secondary: 'Local San Isidro', meta: '', value: '3 unidades', status: 'BAJO' },
];

export const VENDOR_SALES: readonly RecentRow[] = [
  { id: '1', primary: 'Juan Perez Guerrero', secondary: 'B001-000845', meta: '14:22', value: 'S/ 450.00', status: 'COMPLETADO' },
  { id: '2', primary: 'Inversiones Lopez S.A.C.', secondary: 'F001-000210', meta: '13:10', value: 'S/ 520.00', status: 'COMPLETADO' },
  { id: '3', primary: 'Maria Alva Rodriguez', secondary: 'B001-000844', meta: '11:45', value: 'S/ 95.00', status: 'COMPLETADO' },
  { id: '4', primary: 'Pedro Castillo Sanchez', secondary: 'B001-000843', meta: '10:15', value: 'S/ 120.00', status: 'ANULADO' },
  { id: '5', primary: 'Ana Lucia Mendoza', secondary: 'B001-000842', meta: '09:30', value: 'S/ 60.00', status: 'COMPLETADO' },
];
