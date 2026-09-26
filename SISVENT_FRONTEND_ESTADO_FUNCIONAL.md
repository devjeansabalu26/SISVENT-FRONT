# SISVENT Frontend — Estado funcional (2026-09-09, actualizado)

> Documentación funcional y resumida de lo que el frontend hace HOY. No reemplaza
> `SISVENT_FRONTEND_CONTEXT.md` (reglas de arquitectura, permanece vigente).
>
> **Aviso de control de versiones:** `SISVENT-FRONT` tiene un único commit en git; todo
> lo descrito aquí está en el árbol de trabajo **sin commit ni push**.
>
> **Nivel de verificación de esta actualización:** cada módulo se conectó a los
> contratos reales del backend (`Sisvent.Application/*/`*Contracts.cs`, leídos
> directamente del código) y el proyecto **compila limpio** (`ng build` de desarrollo y
> de producción, 0 errores) después de cada cambio. **No se hizo una prueba end-to-end
> en navegador contra el backend corriendo con datos reales** en esta sesión — eso
> sigue pendiente antes de darlo por "probado en vivo".

## 1. Qué es hoy SISVENT-FRONT

Angular 20.3 + Angular Material 20.2, con sesión y autenticación reales contra el
backend. Todas las features operativas principales (catálogo, comercial, inventario,
ventas, plataforma) ya consumen la API real; solo quedan mockeadas las que el backend
mismo no expone todavía.

## 2. Autenticación

Sin cambios respecto a la entrega anterior: login real, token en `sessionStorage`,
bootstrap de sesión vía `GET /auth/me`, guards registrados, `apiBaseUrl` de desarrollo
apuntando a `http://localhost:5234`.

## 3. Features con integración real vs. mock (actualizado)

| Estado | Features |
|---|---|
| **Real** (consumen la API real) | `auth`, `categories`, `settings`, `brands`, `products`, `customers` (clients), `suppliers`, `inventory`, `sales` + `pos` (incluye comprobante y resumen de caja calculado en vivo), `dashboard` (ADMIN/VENDEDOR/SUPERADMIN), `reports`, `audit`, `goods-receipts`, `locales` (stores), `users` (CRUD completo para ADMIN; solo lectura cross-empresa para SUPERADMIN), `companies` (alta/edición/suspensión/cambio de plan/reset de acceso admin), `plans` (CRUD + matriz de funcionalidades) |
| **Mock, sin backend disponible** | `notifications` (no existe el módulo en el backend), `replenishment` (ABC, quiebre de stock, stock estancado — no existe endpoint), `company-plan` (sin controlador dedicado; el ADMIN ve su plan a través de `/me` y `settings`, no hay pantalla propia todavía) |

### Alcance parcial a documentar honestamente

- **Users (SUPERADMIN):** puede ver usuarios de cualquier empresa (`GET /platform/users`),
  pero crear un usuario en otra empresa se hace desde **Companies**, no desde esta
  pantalla (el alta exige elegir la empresa, que es el contexto natural de Companies).
- **Products (creación):** el formulario de alta no incluye stock inicial ni local
  (`InitialStoreId`/`InitialStock`/`MinStock` del backend) — el stock se carga después
  vía Inventario o Ingreso de mercadería. Fue una simplificación deliberada, no un
  backend inexistente.
- **Customers (detalle):** ya no muestra un historial de ventas inventado; se reemplazó
  por los agregados reales (`purchaseCount`, `totalAmount`, `averageTicket`,
  `lastPurchaseAt`) que sí expone `GET /clients/{id}`. Un listado detallado de ventas
  por cliente se puede agregar reutilizando `sale-api.service.ts` con el filtro
  `clientId` cuando se priorice.
- **Cierre de caja:** el diálogo ya no usa cifras fijas; calcula el efectivo/otros
  medios de pago esperados a partir de las ventas confirmadas del día
  (`GET /sales?from=&to=`). El backend **no tiene** un módulo de cierre de caja
  persistente — el resumen se recalcula cada vez que se abre el diálogo, no se guarda.

### Identidad visual de "Crear empresa" (2026-09-09)

Sección 4 del formulario `company-form-page` rehecha (solo alta; edición sin cambios):

- **Esquemas predefinidos:** constante `features/companies/constants/company-theme-presets.constant.ts`
  con 6 plantillas (Default, Purple Trend, Ocean Blue, Emerald Mint, Warm Sunset,
  Carbon Noir). Cards seleccionables con 3 swatches y check; una sola activa. Al
  elegir una se cargan sus 4 colores en el mismo `FormGroup`. "Default" queda
  seleccionada al abrir. Son las **únicas** constantes de color en el front.
- **Personalización manual:** 3 campos (`primaryColor`, `secondaryColor` =
  "Secondary / Accent", `backgroundColor` = "App Background"), cada uno con
  `<input type="color">` + input de texto hex. Validador `shared/forms/hex-color.ts`
  (`/^#[0-9A-Fa-f]{6}$/`, fuerza `#`, máx. 7, mayúsculas); si un color es inválido
  la empresa no se puede crear (`form.invalid`). Editar un color a mano quita el
  resaltado de la plantilla salvo que coincida exactamente con otra.
- **Preview en vivo:** mockup (sidebar + KPIs + búsqueda) que refleja los colores
  en tiempo real vía signal `themePreview`. **No** toca el tema global; los colores
  solo se aplican al preview hasta guardar. Responsive (3→2→1 columnas, sidebar
  apilado en móvil, sin scroll horizontal).
- **Guardado:** `CreateCompanyValue` y el body de `POST /api/v1/companies` ahora
  incluyen `secondaryColor` y `backgroundColor` además de `primaryColor` /
  `accentColor` (este último lo fija la plantilla, sin picker propio).
- **Backend (cambio aditivo):** `CreateCompanyRequest` gana `SecondaryColor` /
  `BackgroundColor` opcionales; `CompanyStore.CreateAsync` inserta las 4 columnas
  de `company_themes` con `COALESCE` a los mismos defaults de `bd.sql`. Callers y
  tests que los omiten quedan idénticos. Compila limpio (0/0); `dotnet test`
  completo y verificación en vivo **pendientes** (proceso `Sisvent.Api` bloquea el
  build de la solución).
- **Verificación:** `ng build` dev y prod **0 errores / 0 advertencias**;
  `ng test` **2/2**. Sin prueba de navegador.

### Editar empresa = formulario de alta reutilizado (2026-09-09)

`company-form-page` ahora renderiza las **4 secciones en modo edición** (antes solo
la sección 1). Es el mismo componente, `FormGroup`, validadores y plantilla; cambia
solo la precarga y el verbo HTTP.

- **Precarga (`patchFromCompany`):** datos de empresa, administrador (nombres,
  apellidos, teléfono, documento), plan vigente (`planId`, precio, fechas), local
  principal y los 4 colores del tema, todo desde `GET /api/v1/companies/{id}`.
- **Inmutables en edición:** RUC, correo y contraseña del administrador (el correo
  se muestra `readonly`; la contraseña se gestiona con "Restablecer acceso admin").
  El estado de la empresa se sigue gestionando con Suspender / Reactivar.
- **Guardar (`PUT /api/v1/companies/{id}`):** el body de `UpdateCompanyValue` pasó
  de 7 campos a incluir administrador, plan, local y tema. El backend actualiza
  **en el sitio** las filas existentes (`companies`, `user_profiles` del admin,
  período `company_plan_periods` ACTIVO, `stores` LOC-001, `company_themes`) —
  ningún `INSERT`, no se crea empresa/admin/plan/local/tema nuevo.
- **Editar el plan aquí** sobrescribe el período vigente sin generar historial;
  "Cambiar plan" (diálogo con motivo) sigue disponible para una migración auditada.
- **Verificación:** `ng build` dev y prod **0/0**; `ng test` **2/2**. Backend:
  `dotnet test` **140/140** (6 Postgres omitidas). Sin prueba de navegador;
  `dotnet test` completo contra Postgres real y recuento de filas post-edición
  siguen pendientes (proceso `Sisvent.Api` bloquea el build de la solución).

## 4. Pendiente / decisiones abiertas

- Prueba end-to-end en navegador contra el backend con datos reales (no realizada en
  esta sesión).
- Política de refresh token y duración de sesión (depende de la decisión de backend).
- URL de producción (`environment.production.ts`) — depende de que exista el deploy en Render.
- Notifications, Replenishment y Company-plan siguen sin backend que consumir.
- Contrato `/me` ampliado (nombre/plan real de empresa) — sigue usando un valor de UI fijo.

## 5. Para más detalle técnico

- Inventario completo de pantallas: `../INVENTARIO_PANTALLAS_Y_GRAFICOS.md`.
- Reglas de arquitectura permanentes: `SISVENT_FRONTEND_CONTEXT.md`.
- Contratos exactos de cada endpoint: `SISVENT-BACK/src/Sisvent.Application/*/*Contracts.cs`.
