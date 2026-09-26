import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Opt-in: la petición muestra su propio estado ante un 403 (p. ej. "disponible en el plan Profesional")
 * en lugar de que `errorInterceptor` navegue a /403. Por defecto es `false` y el comportamiento no cambia.
 */
export const HANDLE_FORBIDDEN_INLINE = new HttpContextToken<boolean>(() => false);

export const handleForbiddenInline = (): HttpContext => new HttpContext().set(HANDLE_FORBIDDEN_INLINE, true);
