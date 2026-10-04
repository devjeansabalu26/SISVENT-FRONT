import { CredentialDialogData } from '../credential-dialog/credential-dialog';
import { ReviewDialogData } from './review-dialog.model';

export function productStatusReview(
  product: { readonly name: string; readonly sku: string; readonly totalStock: number },
  deactivate: boolean,
): ReviewDialogData {
  return {
    title: deactivate ? 'Desactivar producto' : 'Activar producto',
    code: 'MOD-AD-12',
    icon: 'inventory_2',
    meta: [
      { label: 'Producto', value: `${product.name} · ${product.sku}` },
      { label: 'Stock actual', value: `${product.totalStock} und` },
    ],
    transition: {
      fromLabel: 'Estado',
      from: deactivate ? 'Activo' : 'Inactivo',
      toLabel: 'Nuevo estado',
      to: deactivate ? 'Inactivo' : 'Activo',
    },
    banner: deactivate
      ? { tone: 'warning', text: 'El producto no estará disponible para ventas en ningún local. El historial se conserva.' }
      : { tone: 'info', text: 'El producto volverá a estar disponible para la venta.' },
    confirmLabel: deactivate ? 'Desactivar' : 'Activar',
    destructive: deactivate,
  };
}

export function userStatusReview(user: { readonly fullName: string; readonly role: string }, deactivate: boolean): ReviewDialogData {
  const label = user.role === 'VENDEDOR' ? 'vendedor' : 'usuario';
  return {
    title: `${deactivate ? 'Desactivar' : 'Activar'} ${label}`,
    code: 'MOD-AD-05',
    icon: 'person_off',
    meta: [{ label: label.charAt(0).toUpperCase() + label.slice(1), value: user.fullName }],
    transition: {
      fromLabel: 'Estado',
      from: deactivate ? 'Activo' : 'Inactivo',
      toLabel: 'Nuevo estado',
      to: deactivate ? 'Inactivo' : 'Activo',
    },
    banner: deactivate
      ? { tone: 'warning', text: `El ${label} no podrá acceder al sistema de inmediato.` }
      : { tone: 'info', text: `El ${label} podrá iniciar sesión nuevamente.` },
    confirmLabel: deactivate ? 'Desactivar' : 'Activar',
    destructive: deactivate,
  };
}

export function resetPasswordReview(fullName: string): ReviewDialogData {
  return {
    title: 'Restablecer acceso',
    icon: 'key',
    meta: [{ label: 'Usuario', value: fullName }],
    banner: {
      tone: 'warning',
      text: 'Se generará una contraseña temporal. La contraseña actual dejará de funcionar y la nueva se mostrará una sola vez.',
    },
    confirmLabel: 'Generar contraseña temporal',
  };
}

export function resetCredential(username: string, password: string): CredentialDialogData {
  return {
    title: 'Contraseña restablecida',
    code: 'MOD-SA-16',
    successMessage: 'Las credenciales de acceso temporal han sido generadas con éxito.',
    username,
    passwordLabel: 'Clave nueva (PIN de 5 dígitos)',
    password,
  };
}
