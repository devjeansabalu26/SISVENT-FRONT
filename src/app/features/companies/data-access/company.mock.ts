import { CompanyListItem } from '../models/company.model';

export const COMPANY_MOCK: readonly CompanyListItem[] = [
  { id: '1', commercialName: 'TechStore Peru', legalName: 'Importaciones Tech S.A.C.', taxId: '20512345678', administrator: 'Carlos Mendoza', email: 'cmendoza@techstore.pe', startDate: '15/01/2023', expiration: '31/12/2024', status: 'ACTIVA', branches: 4, users: 12 },
  { id: '2', commercialName: 'Moda Express', legalName: 'Confecciones Express S.R.L.', taxId: '20601234567', administrator: 'Sofía Peralta', email: 'srodriguez@modaexpress.pe', startDate: '10/06/2023', expiration: '31/12/2024', status: 'ACTIVA', branches: 2, users: 6 },
  { id: '3', commercialName: 'Ferretería Central', legalName: 'Central de Fierros S.A.C.', taxId: '20455667788', administrator: 'Jorge Valdivia', email: 'jvaldivia@ferreteriacentral.pe', startDate: '20/09/2022', expiration: '30/09/2024', status: 'POR VENCER', branches: 1, users: 3 },
  { id: '4', commercialName: 'Cosmética Luna', legalName: 'Luna Bella Distribuidora S.A.C.', taxId: '20123456789', administrator: 'Andrea Miranda', email: 'amiranda@cosmeticaluna.pe', startDate: '18/11/2021', expiration: '30/11/2023', status: 'VENCIDA', branches: 3, users: 8 },
  { id: '5', commercialName: 'Deportes Max', legalName: 'Maximus Retail S.R.L.', taxId: '20556677889', administrator: 'Rodrigo Alva', email: 'ralva@deportesmax.pe', startDate: '02/02/2023', expiration: '28/02/2024', status: 'SUSPENDIDA', branches: 5, users: 15 },
  { id: '6', commercialName: 'Alimentos Del Sur', legalName: 'Corporación Alimentaria Sur S.A.', taxId: '20334455667', administrator: 'Elena Bastidas', email: 'ebastidas@alimentosdelsur.pe', startDate: '05/04/2024', expiration: '30/04/2025', status: 'PENDIENTE', branches: 2, users: 4 },
];
