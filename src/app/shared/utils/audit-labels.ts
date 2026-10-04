const ACTION_LABELS: Record<string, string> = {
  'COMPANY.CREATED': 'Empresa creada',
  'COMPANY.UPDATED': 'Empresa actualizada',
  'COMPANY.SUSPENDED': 'Empresa suspendida',
  'COMPANY.ACTIVATED': 'Empresa reactivada',
  'COMPANY.DEACTIVATED': 'Empresa desactivada',
  'COMPANY.PLAN_CHANGED': 'Plan cambiado',
  'PLAN.CREATED': 'Plan creado',
  'PLAN.UPDATED': 'Plan actualizado',
  'USER.CREATED': 'Usuario creado',
  'USER.UPDATED': 'Usuario actualizado',
  'USER.ACTIVATED': 'Usuario activado',
  'USER.DEACTIVATED': 'Usuario desactivado',
  'USER.ACCESS_RESET': 'Acceso restablecido',
  'STORE.CREATED': 'Local creado',
  'STORE.UPDATED': 'Local actualizado',
  LOGIN_SUCCESS: 'Inicio de sesión exitoso',
  LOGIN_FAILED: 'Inicio de sesión fallido',
};

const ENTITY_LABELS: Record<string, string> = {
  companies: 'Empresa',
  company_plan_periods: 'Plan',
  company_themes: 'Tema',
  plans: 'Plan',
  user_profiles: 'Usuario',
  stores: 'Local',
};

function humanize(code: string): string {
  const words = code.toLowerCase().replace(/\./g, ' ').replace(/_/g, ' ').split(' ').filter(Boolean);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function friendlyAction(code: string): string {
  return ACTION_LABELS[code] ?? humanize(code);
}

export function friendlyEntity(code: string): string {
  return ENTITY_LABELS[code] ?? humanize(code);
}
