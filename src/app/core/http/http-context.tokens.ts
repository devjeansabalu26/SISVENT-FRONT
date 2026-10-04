import { HttpContext, HttpContextToken } from '@angular/common/http';

export const HANDLE_FORBIDDEN_INLINE = new HttpContextToken<boolean>(() => false);

export const handleForbiddenInline = (): HttpContext => new HttpContext().set(HANDLE_FORBIDDEN_INLINE, true);
