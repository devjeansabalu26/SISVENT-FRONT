import { TestBed } from '@angular/core/testing';
import { CompanyContextService } from '../../context/company-context/company-context.service';
import { UserContextService } from '../../context/user-context/user-context.service';
import { APP_PERMISSIONS } from '../constants/app-permission.constant';
import { AppRole } from '../constants/app-role.constant';
import { ROLE_PERMISSIONS } from '../constants/role-permissions.constant';
import { AccessControlService } from './access-control.service';

describe('AccessControlService (plan features)', () => {
  let access: AccessControlService;

  function login(role: AppRole, features: readonly string[] | null): void {
    TestBed.inject(UserContextService).set({ userId: 'u1', displayName: 'Usuario', role, permissions: ROLE_PERMISSIONS[role] });
    const companies = TestBed.inject(CompanyContextService);
    if (features) companies.set({ companyId: 'c1', commercialName: 'JEAN SAC', plan: 'ESSENTIAL', features });
    else companies.clear();
  }

  beforeEach(() => (access = TestBed.inject(AccessControlService)));

  it('SUPERADMIN never depends on a plan', () => {
    login('SUPERADMIN', null);
    expect(access.hasFeature('AUDIT')).toBeTrue();
    expect(access.isLockedByPlan({ permissions: [APP_PERMISSIONS.auditView], feature: 'AUDIT' })).toBeFalse();
  });

  it('ADMIN on a plan without AUDIT sees Auditoría locked, not hidden', () => {
    login('ADMIN', ['SALES', 'PRODUCTS']);
    expect(access.hasFeature('AUDIT')).toBeFalse();
    expect(access.isLockedByPlan({ permissions: [APP_PERMISSIONS.auditView], feature: 'AUDIT' })).toBeTrue();
    expect(access.canAccess({ features: ['AUDIT'] })).toBeFalse();
    expect(access.canAccess({ features: ['SALES'] })).toBeTrue();
  });

  it('ADMIN on a plan with AUDIT is not locked', () => {
    login('ADMIN', ['AUDIT']);
    expect(access.isLockedByPlan({ permissions: [APP_PERMISSIONS.auditView], feature: 'AUDIT' })).toBeFalse();
  });

  it('items the role cannot see are hidden, not locked', () => {
    login('VENDEDOR', ['SALES']);
    // Reportes es solo ADMIN: para el vendedor no aparece (ni con candado).
    expect(access.isLockedByPlan({ roles: ['ADMIN'], permissions: [APP_PERMISSIONS.reportsView], feature: 'REPORTS' })).toBeFalse();
  });
});
