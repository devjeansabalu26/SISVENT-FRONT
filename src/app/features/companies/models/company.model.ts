export type CompanyStatus = 'ACTIVA' | 'POR VENCER' | 'VENCIDA' | 'SUSPENDIDA' | 'PENDIENTE';

export interface CompanyListItem {
  readonly id: string;
  readonly commercialName: string;
  readonly legalName: string;
  readonly taxId: string;
  readonly administrator: string;
  readonly email: string;
  readonly startDate: string;
  readonly expiration: string;
  readonly status: CompanyStatus;
  readonly branches: number;
  readonly users: number;
}
