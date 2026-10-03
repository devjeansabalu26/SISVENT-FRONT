import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { APP_PERMISSIONS } from '../../core/auth/constants/app-permission.constant';
import { AccessControlService } from '../../core/auth/services/access-control.service';
import { UserContextService } from '../../core/context/user-context/user-context.service';

/**
 * Caja (turnos): el ADMIN con Ventas en nivel Gestionar; el VENDEDOR con el Punto de venta, porque quien vende
 * abre y cierra su caja. Debe llamarse en un contexto de inyección. El backend vuelve a validarlo.
 */
export function canUseCash(): boolean {
  const role = inject(UserContextService).user()?.role;
  const access = inject(AccessControlService);
  if (role === 'ADMIN') return access.canAccess({ permissions: [APP_PERMISSIONS.salesManage] });
  if (role === 'VENDEDOR') return access.canAccess({ permissions: [APP_PERMISSIONS.salesCreate] });
  return false;
}

export const cashAccessGuard: CanActivateFn = () => canUseCash() || inject(Router).createUrlTree(['/403']);
