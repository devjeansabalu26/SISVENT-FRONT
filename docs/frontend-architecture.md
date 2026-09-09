# Arquitectura frontend SISVENT

- Desarrollo local (2026-09-05): `environment.apiBaseUrl` apunta a `http://localhost:5234`. La API permite los orígenes `localhost:4200` y `127.0.0.1:4200`. Los módulos todavía requieren integración real; configurar la URL no sustituye sus mocks.

- Los tokens visuales viven en `src/styles/_theme.scss`; los colores de empresa se aplican en runtime con `ThemeService`.
- `CompanyContextService` y `UserContextService` son las fuentes únicas del contexto visible. La API conserva la autorización definitiva.
- La navegación se declara en `MAIN_NAVIGATION` y `AccessControlService` combina rol, permisos y plan; los templates no comparan roles.
- `MainLayout` es el shell compartido para todos los perfiles y adapta el sidebar en pantallas pequeñas.
- Los listados reutilizan `DataTable<T>`, `PageHeader` y `StatusChip`; sus modelos y datos permanecen dentro de cada feature.
- La autorización de navegación se puede componer con `permissionGuard` y `planGuard`; el backend continúa siendo la autoridad definitiva.
- Las confirmaciones destructivas usan un único `ConfirmDialog` basado en Angular Material.
- `AppSessionService` coordina autenticación, usuario, empresa y tema; persiste solo el contexto temporal en `sessionStorage` y lo elimina completamente al cerrar sesión.

## Autenticación real e integración (2026-09-08)

- **Login real:** `login-page` hace `POST /api/v1/auth/login` (`AuthApiService`), ya no crea una sesión demo. Campo `email`. Errores 401/403/429/red se muestran en línea.
- **Token:** `TokenStorageService` (implementa `AuthTokenProvider`, guarda el JWT y su `expiresAt` en `sessionStorage`, descarta el token vencido al leerlo) provee `AUTH_TOKEN_PROVIDER`.
- **Bootstrap:** `provideAppInitializer` → `AppSessionService.bootstrap()` canjea el token por el perfil vía `GET /auth/me` antes de que el router active ninguna ruta. El token es la única fuente de verdad; el perfil/empresa siempre se re-piden al backend. `restore()` queda como shim síncrono para `authGuard`.
- **Interceptores:** `authInterceptor` solo adjunta `Bearer` a `apiBaseUrl`. `errorInterceptor` no redirige en errores de `/api/v1/auth/*`.
- **Permisos:** `core/auth/constants/role-permissions.constant.ts` proyecta `rol → permisos` **solo para menú y guards de ruta del cliente**; `/login` y `/me` no traen permisos. El backend es la única autoridad por petición.
- **Empresa:** `/me` no trae nombre ni plan; para un usuario de tenant se usa `commercialName: 'Mi empresa'` y `plan: 'BUSINESS'` como marcador de UI (el backend aplica el plan real).
- **Configuración** (`features/settings/`): reemplaza el `FeaturePlaceholder`; formulario reactivo contra `GET`/`PUT /api/v1/settings` con control de versión; solo `ADMIN`.
- **Categorías** (`features/categories/`): ruta `/app/categories` + entrada de menú (roles `ADMIN`/`VENDEDOR`). Listado + búsqueda cliente + diálogo de alta/edición + baja lógica con confirmación contra `/api/v1/categories`. La gestión se oculta para `VENDEDOR`.
- El resto de features sigue con `*.mock.ts` hasta que exista su backend.
