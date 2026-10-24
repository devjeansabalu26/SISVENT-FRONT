const ACTION_WORDS =
  /^(\+\s*)?(nuev[oa]|crear|guardar|editar|eliminar|borrar|desactivar|activar|reactivar|suspender|anular|registrar|abrir caja|cerrar caja|confirmar|habilitar|deshabilitar|desbloquear|restablecer|ajustar|corregir|marcar|quitar|cobrar|recibir|agregar|asignar|cambiar|subir|cargar|importar|transferir|devolver|enviar|generar|aplicar cambios)\b/;

const ACTION_ICONS = new Set([
  'add', 'add_circle', 'edit', 'delete', 'delete_outline', 'block', 'person_add', 'lock_open', 'more_time',
  'save', 'upload', 'key', 'point_of_sale', 'shopping_cart_checkout', 'swap_horiz', 'remove_circle',
]);

const CANDIDATES = 'button, a, [mat-menu-item], [role="menuitem"]';

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function isDemoAction(element: Element): boolean {
  const icons = [...element.querySelectorAll('.material-icons, mat-icon')];
  const iconText = icons.map((icon) => icon.textContent?.trim() ?? '');
  const text = icons.reduce((value, icon) => value.replace(icon.textContent ?? '', ' '), element.textContent ?? '');
  const labels = [text, element.getAttribute('title') ?? '', element.getAttribute('aria-label') ?? ''].map(normalize);
  if (labels.some((label) => ACTION_WORDS.test(label))) return true;
  return labels.every((label) => !label) && iconText.some((icon) => ACTION_ICONS.has(icon));
}

export function demoLockTarget(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null;
  const candidate = target.closest(CANDIDATES);
  if (!candidate || !candidate.closest('main, .cdk-overlay-container')) return null;
  return isDemoAction(candidate) ? candidate : null;
}

export function markDemoActions(root: ParentNode): void {
  root.querySelectorAll(CANDIDATES).forEach((element) => {
    if (!element.closest('main, .cdk-overlay-container')) return;
    const locked = isDemoAction(element);
    if (locked === element.classList.contains('demo-locked')) return;
    element.classList.toggle('demo-locked', locked);
    if (locked) element.setAttribute('aria-disabled', 'true');
    else element.removeAttribute('aria-disabled');
  });
}

export function clearDemoActions(root: ParentNode): void {
  root.querySelectorAll('.demo-locked').forEach((element) => {
    element.classList.remove('demo-locked');
    element.removeAttribute('aria-disabled');
  });
}
