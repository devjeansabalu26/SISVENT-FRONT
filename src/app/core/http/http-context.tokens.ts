import { HttpContext, HttpContextToken } from '@angular/common/http';
import { SKIP_GLOBAL_LOADING } from '../loading/loading-context.token';

export const HANDLE_FORBIDDEN_INLINE = new HttpContextToken<boolean>(() => false);

export const handleForbiddenInline = (): HttpContext => new HttpContext().set(HANDLE_FORBIDDEN_INLINE, true);
export const backgroundRequest = (context: HttpContext = new HttpContext()): HttpContext => context.set(SKIP_GLOBAL_LOADING, true);
