import { APP_PERMISSIONS } from './app-permission.constant';
import { permissionsFromModules } from './module-permissions.constant';

describe('permissionsFromModules', () => {
  it('VIEW solo da los permisos de consulta', () => {
    const permissions = permissionsFromModules([{ code: 'PRODUCTS', level: 'VIEW' }]);
    expect(permissions).toContain(APP_PERMISSIONS.productsView);
    expect(permissions).not.toContain(APP_PERMISSIONS.productsManage);
  });

  it('MANAGE suma los permisos de gestión', () => {
    const permissions = permissionsFromModules([{ code: 'INVENTORY', level: 'MANAGE' }, { code: 'SALES', level: 'MANAGE' }]);
    expect(permissions).toEqual(jasmine.arrayContaining([
      APP_PERMISSIONS.inventoryView, APP_PERMISSIONS.inventoryAdjust, APP_PERMISSIONS.salesView, APP_PERMISSIONS.salesManage,
    ]));
  });

  it('ignora menús desconocidos y no repite permisos', () => {
    const permissions = permissionsFromModules([
      { code: 'NOPE', level: 'MANAGE' },
      { code: 'USERS', level: 'VIEW' },
      { code: 'USERS', level: 'MANAGE' },
    ]);
    expect(permissions.length).toBe(3);
    expect(permissions).toContain(APP_PERMISSIONS.usersCreate);
  });

  it('sin menús no hay permisos', () => {
    expect(permissionsFromModules([])).toEqual([]);
  });
});
