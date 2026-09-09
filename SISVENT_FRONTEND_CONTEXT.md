# SISVENT Frontend Context

> Archivo de contexto permanente para desarrollo asistido por agentes (Codex/Claude/etc.).
> Debe leerse antes de proponer o ejecutar cambios relevantes en `SISVENT-FRONT`.
> Debe mantenerse actualizado cuando cambien decisiones de arquitectura, autenticación, permisos, contratos API, tema visual, testing o despliegue.

## 1. Propósito

SISVENT es una plataforma web multiempresa (SaaS) para ventas e inventario.

Este repositorio contiene únicamente el frontend.

Stack objetivo:

- Angular 20
- TypeScript
- Angular Material
- SCSS
- Angular Router
- Reactive Forms
- HttpClient
- RxJS cuando sea apropiado
- Signals para estado local/simple cuando aporten claridad
- Vercel como plataforma objetivo de despliegue
- GitHub Actions en una etapa posterior

El frontend es responsable de:

- presentar pantallas;
- navegación;
- experiencia por rol;
- formularios y validaciones de interfaz;
- consumo de la API .NET;
- filtros, tablas y visualización;
- carga, errores y notificaciones;
- tema visual por empresa;
- impresión/vistas imprimibles cuando corresponda;
- experiencia de Punto de Venta.

El frontend NO es responsable de:

- autorizar definitivamente una operación;
- confiar en `CompanyId` o `BranchId` como autorización;
- recalcular valores definitivos de negocio;
- decidir precios válidos;
- decidir stock válido;
- validar pertenencia definitiva entre entidades;
- garantizar aislamiento de datos por sí solo.

Toda regla sensible será validada nuevamente por el backend.

---

## 2. Principios de arquitectura

La arquitectura debe ser:

- feature-first;
- standalone-first;
- modular;
- reutilizable;
- lazy-loadable;
- escalable;
- fácil de mantener;
- configurable;
- consistente;
- sin duplicación innecesaria;
- sin estado global excesivo;
- sin componentes gigantes;
- sin lógica de negocio sensible en templates o navegador.

No agregar librerías externas si Angular/Material/RxJS ya resuelven correctamente la necesidad.

No agregar NgRx, Akita, Transloco, Tailwind, Bootstrap, PrimeNG u otras librerías sin una necesidad explícita.

Si en el futuro una dependencia nueva se justifica, documentar primero qué problema resuelve y por qué las capacidades actuales no son suficientes.

---

## 3. Estructura objetivo

```text
SISVENT-FRONT/
├── public/
├── src/
│   ├── app/
│   │   ├── core/
│   │   ├── shared/
│   │   ├── layouts/
│   │   ├── features/
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── environments/
│   ├── styles/
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── angular.json
├── package.json
├── tsconfig.json
├── .gitignore
└── SISVENT_FRONTEND_CONTEXT.md
```

No crear carpetas solo por estética si no existe una responsabilidad clara.

Usar `.gitkeep` únicamente para carpetas vacías que realmente deban quedar versionadas.

---

## 4. Core

`core/` contiene infraestructura transversal y servicios singleton.

Estructura objetivo:

```text
core/
├── auth/
│   ├── guards/
│   ├── interceptors/
│   ├── models/
│   ├── services/
│   └── constants/
├── http/
│   ├── interceptors/
│   ├── models/
│   └── services/
├── config/
├── context/
│   ├── company-context/
│   └── user-context/
├── theme/
├── notifications/
├── loading/
├── storage/
└── constants/
```

Regla:

- `core` no debe convertirse en una carpeta para todo.
- Un servicio específico de Productos pertenece a `features/products`.
- Un servicio específico de Ventas pertenece a `features/sales`.
- Solo infraestructura verdaderamente transversal vive en `core`.

Ejemplos apropiados en `core`:

- autenticación;
- interceptores HTTP;
- manejo global de errores;
- loading global;
- notificaciones;
- configuración del API;
- contexto de usuario;
- contexto de empresa visible;
- aplicación del tema;
- almacenamiento abstraído cuando se defina;
- constantes globales reales.

---

## 5. Shared

`shared/` contiene piezas reutilizables y sin dependencia de un feature concreto.

Estructura objetivo:

```text
shared/
├── ui/
│   ├── page-header/
│   ├── data-table/
│   ├── filter-panel/
│   ├── confirm-dialog/
│   ├── status-chip/
│   ├── empty-state/
│   ├── loading/
│   └── notification/
├── forms/
│   ├── form-field/
│   ├── input/
│   ├── select/
│   └── date-range/
├── directives/
├── pipes/
├── models/
├── utils/
└── constants/
```

No convertir `shared` en un depósito de código.

Una pieza debe ir a `shared` solo si:

- es realmente reutilizable en más de un dominio;
- no depende de reglas específicas de un feature;
- su API puede mantenerse genérica y clara.

No crear componentes wrapper de Angular Material si no agregan comportamiento/consistencia real.

---

## 6. Componentes globales previstos

Los siguientes patrones son candidatos reales a reutilización:

- App/Main Layout
- Sidebar/Menu por rol
- Page Header
- Data Table
- Filter Panel
- Confirm Dialog
- Message/Notification
- Form Field wrappers cuando aporten consistencia
- Status Chip
- Empty State
- Loading/Skeleton
- Theme Service
- Company Context

No implementar todos de forma vacía únicamente para llenar carpetas.

Construirlos cuando exista una primera necesidad real y diseñarlos para reutilización desde ese momento.

---

## 7. Layouts

Evitar tres layouts casi idénticos para Superadmin, Admin y Vendedor.

Estructura recomendada:

```text
layouts/
├── auth-layout/
└── main-layout/
    ├── header/
    ├── sidebar/
    ├── user-menu/
    └── navigation/
```

`MainLayout` debe reutilizarse y adaptar navegación/acciones al rol y permisos.

La diferencia entre roles debe resolverse principalmente mediante:

- configuración de navegación;
- guards;
- permisos/claims;
- visibilidad de acciones;
- datos de contexto.

Solo crear layouts separados si las experiencias terminan siendo estructuralmente diferentes.

---

## 8. Features

Estructura funcional prevista:

```text
features/
├── auth/
├── dashboard/
├── companies/
├── company-profile/
├── branches/
├── users/
├── categories/
├── brands/
├── products/
├── inventory/
├── customers/
├── sales/
├── reports/
├── audit/
└── settings/
```

No implementar módulos completos durante la fase de arquitectura base.

Cada feature debe organizarse por responsabilidad.

Ejemplo:

```text
features/products/
├── pages/
│   ├── product-list/
│   ├── product-create/
│   ├── product-edit/
│   └── product-detail/
├── components/
│   ├── product-form/
│   ├── product-filters/
│   └── product-stock/
├── data-access/
│   ├── product-api.service.ts
│   └── product.store.ts       # solo si realmente se necesita
├── models/
│   ├── product.model.ts
│   ├── create-product.request.ts
│   └── update-product.request.ts
└── products.routes.ts
```

Reglas:

- `pages` son componentes asociados a rutas.
- `components` son piezas internas del dominio.
- `data-access` encapsula acceso HTTP/estado propio del feature.
- `models` contiene contratos/modelos propios del feature.
- `*.routes.ts` contiene rutas del feature cuando corresponda.

Evitar archivos `index.ts`/barrels masivos que generen dependencias circulares u oculten demasiado el origen de los símbolos.

---

## 9. Angular 20

Usar Angular moderno.

Preferencias base:

- standalone components;
- standalone routes;
- lazy loading por feature;
- `inject()` cuando mejore claridad;
- Reactive Forms para formularios de negocio;
- `@if`, `@for`, `@switch` en templates;
- `track` apropiado en `@for`;
- signals para estado local/simple;
- RxJS para flujos asíncronos, HTTP y composición donde sea natural;
- evitar suscripciones manuales innecesarias;
- `async` pipe cuando corresponda;
- `takeUntilDestroyed()` cuando exista suscripción imperativa necesaria.

No migrar a patrones complejos de estado global sin evidencia de necesidad.

No usar `any` salvo interoperabilidad excepcional y documentada.

Preferir tipos explícitos.

---

## 10. Routing

Decisión vigente:

```text
/login       -> área pública de autenticación
/app/...     -> área autenticada servida por MainLayout
/403         -> acceso denegado
/**          -> página no encontrada
```

`MainLayout` contiene el `RouterOutlet` para los features. Los guards de autenticación y rol
quedan preparados, pero no se registran en `/app` hasta que exista inicialización real de sesión.

`app.routes.ts` debe permanecer pequeño.

Las funcionalidades deben cargarse de forma lazy.

Conceptualmente:

```text
/login
/app/...
```

o equivalente según la estructura final.

No hardcodear decenas de rutas de features directamente en el root si pueden delegarse.

Preparar:

- rutas públicas;
- rutas autenticadas;
- rutas por rol/permisos;
- página 403;
- página 404.

Los guards mejoran navegación/UX, pero no reemplazan autorización del backend.

---

## 11. Roles y permisos

Roles iniciales:

- `SUPERADMIN`
- `ADMIN`
- `VENDEDOR`

Alcance funcional:

### SUPERADMIN

- dashboard de plataforma;
- empresas/cuentas;
- vigencia;
- estado;
- identidad/paleta;
- auditoría de plataforma.

### ADMIN

Solo su empresa:

- dashboard de empresa;
- perfil de empresa;
- locales;
- vendedores;
- categorías;
- marcas;
- productos;
- inventario;
- clientes;
- ventas;
- reportes;
- configuración;
- auditoría de su empresa.

### VENDEDOR

Según permisos y local:

- información básica de empresa/local;
- productos y stock permitido;
- clientes;
- historial autorizado;
- ventas;
- sus operaciones;
- reimpresión autorizada.

Restricciones del Vendedor:

- no modificar perfil de empresa;
- no modificar paleta/vigencia/configuración general;
- no crear locales/categorías/marcas/usuarios;
- no consultar otras empresas;
- no cambiar su tenant;
- no cambiar su local por sí mismo;
- no alterar precios del servidor;
- no forzar stock negativo.

Los roles pueden modelarse como un tipo cerrado/constante porque el conjunto inicial es parte de la seguridad funcional.

No usar strings mágicos repetidos por componentes.

---

## 12. Defensa en profundidad

Regla:

```text
Frontend -> oculta/deshabilita acciones no permitidas
Backend  -> autoriza y valida pertenencia
Database -> mantiene integridad
```

El frontend NO es una frontera de seguridad.

Nunca asumir que una acción está protegida solo porque:

- el botón está oculto;
- la ruta tiene guard;
- el menú no aparece;
- un campo está disabled.

El usuario puede manipular el navegador y requests.

Por eso:

- los guards son UX/navegación;
- la API decide autorización real;
- los IDs enviados por el navegador no conceden pertenencia.

---

## 13. Company Context / multiempresa

El frontend debe mostrar el contexto de empresa proveniente de la sesión/API.

No permitir que Admin o Vendedor cambien arbitrariamente de tenant.

`CompanyContext` puede contener información útil para UI como:

```text
CompanyId
CommercialName
LogoUrl
Theme
ExpirationInfo
```

pero su `CompanyId` NO debe usarse como prueba de autorización.

Para Vendedor también puede existir contexto visible del local asignado.

No agregar selectores de empresa/local si la regla funcional no los permite.

El Superadmin podrá operar sobre empresas desde funcionalidades explícitas de plataforma; eso no convierte el tenant activo normal en un selector libre global.

---

## 14. Autenticación

La estrategia de almacenamiento JWT continúa pendiente. El interceptor Bearer usa un contrato
inyectable opcional y no presupone memoria, `localStorage`, `sessionStorage` ni cookies.

El backend será responsable de Identity/JWT.

El frontend debe quedar preparado para:

- login;
- sesión autenticada;
- lectura de contexto;
- interceptor Bearer;
- expiración de sesión;
- logout;
- guards;
- manejo de 401/403.

No implementar todavía una estrategia definitiva de almacenamiento del token sin definir el contrato de autenticación del backend.

Opciones como:

- memoria;
- sessionStorage;
- localStorage;
- cookie HttpOnly

tienen implicancias distintas.

El agente NO debe decidir por su cuenta la estrategia persistente definitiva.

Cuando exista contrato backend, documentar la decisión aquí.

Nunca:

- guardar contraseñas;
- loguear tokens completos;
- incluir secretos del backend;
- considerar claims decodificados en frontend como autorización definitiva.

---

## 15. Interceptores HTTP

Preparar de forma desacoplada:

- auth/token interceptor;
- error interceptor o estrategia global equivalente;
- loading interceptor si aporta valor;
- correlation id propagation si el contrato backend lo requiere.

No crear un interceptor gigante que haga todo.

No mostrar múltiples notificaciones duplicadas para el mismo error.

Los errores deben normalizarse y presentarse de manera consistente.

Manejar adecuadamente:

- 400 validación;
- 401 sesión no válida/expirada;
- 403 sin permiso;
- 404 recurso no encontrado;
- 409 conflicto;
- 422 si la API lo utiliza;
- 500 error inesperado;
- fallo de red.

No exponer mensajes técnicos crudos directamente al usuario.

---

## 16. API y servicios HTTP

Centralizar `API_BASE_URL` por ambiente.

Nunca hardcodear:

```text
http://localhost:xxxx
```

en servicios de features.

Cada dominio tendrá su data-access.

Ejemplo:

```text
features/products/data-access/product-api.service.ts
features/customers/data-access/customer-api.service.ts
features/sales/data-access/sale-api.service.ts
```

No crear un único `ApiService` con todos los endpoints de SISVENT.

Puede existir una abstracción HTTP base pequeña solo si aporta valor real.

Contratos TypeScript deben mantenerse alineados con Swagger/API:

- nombres;
- tipos;
- nullability;
- paginación;
- errores;
- fechas.

No duplicar interfaces iguales en múltiples features si representan un contrato transversal real.

---

## 17. Modelos, DTOs y tipos

Separar cuando sea útil:

```text
Product
CreateProductRequest
UpdateProductRequest
ProductListItem
ProductDetail
```

No usar una única interfaz gigante para crear, editar, listar y mostrar detalle si los contratos son diferentes.

Evitar `any`.

Preferir:

- interfaces/types claros;
- unions cuando correspondan;
- enums/constantes solo para conjuntos realmente cerrados.

No convertir a enum catálogos que en el futuro pueden configurarse por empresa.

Ejemplo:

- rol: cerrado inicialmente;
- estado técnico estable: puede ser enum;
- método de pago: potencialmente configurable, no asumir enum permanente.

---

## 18. Formularios

Usar Reactive Forms para formularios funcionales.

Objetivos:

- validaciones junto al campo;
- mensajes claros;
- componentes consistentes;
- estados loading/submitting;
- evitar doble submit;
- campos disabled controlados de forma coherente;
- formularios tipados;
- validación del backend representada correctamente.

Las validaciones del frontend son UX.

El backend vuelve a validar.

No duplicar lógica compleja de negocio en validadores Angular.

---

## 19. Tema visual multiempresa

Roboto y Material Icons continúan cargándose temporalmente desde Google Fonts. Antes de producción
se revisarán CSP, privacidad y disponibilidad; no cambiar la estrategia de fuentes por anticipación.

La paleta de empresa será configurable desde la plataforma.

El frontend debe soportar variables visuales dinámicas.

Usar CSS Custom Properties para valores dinámicos por tenant.

Ejemplo conceptual:

```css
:root {
  --color-primary: ...;
  --color-secondary: ...;
  --color-accent: ...;
  --color-background: ...;
  --color-surface: ...;
  --color-text-primary: ...;
  --color-text-secondary: ...;
}
```

Estructura SCSS sugerida:

```text
src/styles/
├── _variables.scss
├── _mixins.scss
├── _typography.scss
├── _utilities.scss
├── _theme.scss
└── _material-overrides.scss
```

`styles.scss` actúa como entrada global.

Diferenciar:

- design tokens estáticos;
- CSS variables dinámicas de empresa;
- overrides de Angular Material.

No dispersar colores hexadecimales por componentes.

No usar `!important` como solución habitual.

El Theme Service debe aplicar la paleta recibida de forma centralizada.

El Admin y Vendedor visualizan la paleta asignada según permisos.
El Superadmin administra la paleta según el flujo funcional.

Asegurar contraste y legibilidad.

---

## 20. Angular Material

Base instalada verificada: Angular Core `20.3.x` y Angular Material/CDK `20.2.x`. Mantener estas
versiones durante la arquitectura base; actualizar solo ante incompatibilidad, warning de peers,
bug relevante o necesidad explícita.

Angular Material es la librería UI base.

Usarla de forma consistente.

No mezclar múltiples frameworks visuales.

Crear overrides mínimos y centralizados.

Evitar:

- selectores internos frágiles si existe API pública;
- copiar estilos Material por feature;
- redefinir globalmente componentes sin necesidad;
- wrappers que no agregan comportamiento.

No fijar una versión minor manualmente diferente al Angular instalado.
Mantener compatibilidad con Angular 20.

---

## 21. Loading, errores y notificaciones

Experiencia consistente:

```text
Loading global -> operaciones HTTP globales si se define
Loading local  -> componentes/acciones puntuales
Notification   -> éxito/error/advertencia/info
Empty State    -> ausencia de registros
Error State    -> error de consulta
```

No bloquear toda la aplicación por cada llamada secundaria.

Evitar flickering de loaders para requests muy rápidos si se vuelve un problema de UX; optimizar cuando exista evidencia.

No mostrar dos loaders para la misma operación.

---

## 22. Tablas, filtros y paginación

Los listados administrativos deben poder reutilizar patrones de:

- paginación;
- ordenamiento;
- filtros;
- acciones;
- estados;
- loading;
- empty state.

La paginación de listas grandes debe ser server-side cuando corresponda.

No descargar miles de registros solo para paginar en el navegador.

No crear un DataTable genérico excesivamente complejo antes de tener casos reales.

Empezar con una API reusable sencilla y evolucionarla con necesidades concretas.

---

## 23. Inventario

El frontend nunca debe asumir stock global único si existen locales.

Visualmente debe trabajar con:

```text
Product
Branch
ProductStock
InventoryMovement
```

Cuando corresponda debe mostrar stock del local autorizado.

No permitir que una manipulación del formulario fuerce stock negativo.

Aunque la UI limite cantidades, el backend valida nuevamente.

---

## 24. Ventas

El Punto de Venta podrá mostrar cálculos de:

- cantidad;
- precio;
- subtotal;
- descuento permitido;
- total.

Pero estos cálculos son informativos.

Al confirmar:

- el backend vuelve a validar productos;
- pertenencia;
- local;
- precios;
- stock;
- total.

El frontend debe tratar la respuesta del servidor como definitiva.

Componentes de dominio candidatos:

```text
customer-search
product-search
sale-detail
sale-summary
payment-selector
print-view
```

No construirlos todavía si la tarea actual es solo arquitectura base.

---

## 25. Configuración por ambiente

Los environments de desarrollo y producción existen, pero `apiBaseUrl` permanece como cadena
vacía hasta conocer el puerto estable de .NET y la URL definitiva de Render. No inventar URLs.

Preparar al menos:

```text
src/environments/environment.ts
src/environments/environment.production.ts
```

o la estrategia equivalente que ya utilice el proyecto Angular 20.

Configuración mínima:

```text
apiBaseUrl
production
```

No incluir secretos.

El frontend no debe tener:

- claves JWT;
- passwords;
- secretos Supabase privados;
- connection strings;
- secretos Render.

Todo valor enviado al navegador debe considerarse público.

---

## 26. Producción

Entorno local reproducible actual: Node `20.20.2` mediante `.nvmrc`. `package.json` declara
`>=20.19.0 <21`, rango compatible con Angular CLI 20.3.35.

Objetivo actual:

```text
Frontend -> Vercel
Backend  -> Render
Database -> Supabase PostgreSQL
```

Para producción verificar:

- `ng build` correcto;
- API URL de producción correcta;
- rutas SPA;
- guards;
- lazy loading;
- source maps según decisión de entorno;
- CORS backend con URL de Vercel;
- errores globales;
- ausencia de secretos;
- bundle razonable;
- assets optimizados;
- smoke tests.

Vercel debe recibir configuración pública de frontend.
Nunca secretos de backend.

---

## 27. Performance

Aplicar optimizaciones por evidencia, no por anticipación.

Buenas bases:

- lazy loading por feature;
- `track` en `@for`;
- evitar cálculos pesados repetidos en template;
- evitar suscripciones duplicadas;
- cancelar/combinar búsquedas cuando corresponda;
- debounce en filtros/buscadores cuando tenga sentido;
- evitar bundles con librerías grandes innecesarias;
- optimizar imágenes/logos.

No aplicar microoptimizaciones que hagan el código menos legible sin necesidad.

---

## 28. Accesibilidad y responsive

Prioridad funcional: escritorio para administración/ventas, sin impedir uso básico en tablet/móvil.

Mantener:

- labels;
- navegación por teclado;
- focus visible;
- contraste;
- estados disabled comprensibles;
- iconos con significado accesible;
- errores asociados a campos;
- tablas utilizables;
- dialogs accesibles.

No usar solo color para comunicar estados.

---

## 29. Testing

No generar cientos de tests vacíos.

Probar comportamiento útil.

Prioridades:

- servicios HTTP;
- guards;
- interceptores;
- Theme Service;
- Company Context;
- componentes globales críticos;
- formularios críticos;
- flujos de venta relevantes cuando se implementen.

Los tests deben evitar acoplarse innecesariamente a detalles internos.

Build de producción debe formar parte de validaciones antes de despliegue.

---

## 30. Estado

No agregar store global por defecto.

Estrategia:

### Estado local

Usar:

- signals;
- propiedades del componente;
- Reactive Forms.

### Estado asíncrono/simple compartido

Usar:

- servicios;
- signals;
- RxJS.

### Estado global complejo

Evaluar una librería de state management solo si aparecen problemas concretos:

- demasiadas fuentes de verdad;
- sincronización difícil;
- caché global compleja;
- eventos cruzados entre muchos dominios;
- debugging insuficiente.

NgRx NO es requisito inicial.

---

## 31. Configurabilidad futura

SISVENT debe servir para negocios de distintos rubros.

No hardcodear lenguaje/reglas específicos de:

- tecnología;
- ropa;
- ferretería;
- cosmética;
- alimentos;
- un negocio específico.

Cuando una funcionalidad pueda ser configuración de empresa, diseñar el frontend para consumir esa configuración del backend.

Ejemplos:

- métodos de pago;
- parámetros de stock;
- datos de comprobante;
- identidad visual;
- preferencias de operación.

No inventar configuraciones futuras que aún no estén definidas.

---

## 32. Convenciones de código

- TypeScript strict.
- Evitar `any`.
- Componentes standalone.
- Dependencias inyectadas claramente.
- Archivos pequeños y cohesionados.
- Nombres descriptivos.
- Evitar lógica compleja en template.
- Evitar funciones de template que se ejecuten repetidamente si pueden derivarse antes.
- Preferir readonly cuando corresponda.
- No mutar estado compartido de forma impredecible.
- Evitar números/strings mágicos.
- No duplicar URLs.
- No duplicar nombres de roles.
- No crear `helpers.ts` gigantes.
- No crear `utils.ts` como contenedor indefinido.
- Eliminar código muerto.
- No comentar código obvio.
- Documentar decisiones, no sintaxis evidente.

---

## 33. Archivos que no deben versionarse

Revisar `.gitignore`.

Como mínimo:

```text
node_modules/
dist/
.angular/
coverage/
.env
.env.*
```

Evaluar `.vscode`, `.cursor` y `.claude` antes de subirlos:

- configuración personal -> no versionar;
- instrucciones de proyecto útiles para el equipo/agentes -> pueden versionarse si no contienen secretos.

Nunca versionar:

- tokens;
- passwords;
- claves privadas;
- credenciales;
- secretos del backend.

---

## 34. Contexto del repositorio y herramientas de agentes

Este proyecto puede contener carpetas de herramientas como:

```text
.cursor/
.claude/
```

No eliminarlas automáticamente.

Primero inspeccionar si contienen:

- reglas de proyecto;
- prompts compartidos;
- configuraciones útiles;
- datos personales o secretos.

No modificar configuraciones de otro agente salvo que sea necesario para la tarea.

---

## 35. Fuera de alcance inicial

No implementar sin requerimiento posterior:

- facturación electrónica SUNAT homologada;
- pasarela de pago real;
- compras a proveedores;
- contabilidad completa;
- logística avanzada.

No crear pantallas vacías para módulos fuera de alcance.

---

## 36. Decisiones pendientes que el agente NO debe inventar

Solicitar confirmación antes de decidir definitivamente:

- estrategia de almacenamiento/persistencia de token;
- política de refresh token;
- duración de sesión;
- estrategia completa de permisos finos más allá de roles;
- librería de gráficos;
- librería de exportación PDF/Excel;
- state manager global;
- internacionalización/i18n;
- PWA/offline;
- SSR;
- estrategia definitiva de caché;
- tracking/analytics;
- proveedor de monitoring frontend;
- estrategia de feature flags.

No instalar librerías para estos puntos sin requerimiento.

---

## 37. Roadmap frontend recomendado

### Fase 0 - Base de arquitectura

- revisar proyecto Angular actual;
- limpiar demo/template;
- estructura `core/shared/layouts/features`;
- estructura de estilos;
- environments;
- Material;
- rutas base;
- error/loading/notification base;
- build estable.

### Fase 1 - Shell

- AuthLayout;
- MainLayout;
- Header;
- Sidebar;
- configuración de menú por rol;
- Theme Service;
- Company Context.

### Fase 2 - Integración/auth

- contratos de login;
- AuthService;
- sesión;
- interceptor Bearer;
- guards;
- 401/403;
- contexto autenticado.

### Fase 3 - Superadmin

- dashboard plataforma;
- empresas;
- vigencia;
- estado;
- tema/paleta.

### Fase 4 - Admin base

- dashboard empresa;
- perfil;
- locales;
- vendedores.

### Fase 5 - Catálogo

- categorías;
- marcas;
- productos.

### Fase 6 - Inventario

- stock por local;
- movimientos;
- alertas de stock.

### Fase 7 - Clientes

- búsqueda;
- registro;
- historial.

### Fase 8 - Ventas

- POS;
- búsqueda cliente/producto;
- detalle;
- totales;
- confirmación;
- impresión.

### Fase 9 - Reportes/configuración

- reportes;
- auditoría;
- configuración de empresa.

### Fase 10 - Producción

- build optimizado;
- CI/CD;
- Vercel;
- variables de ambiente;
- integración con Render;
- smoke tests.

---

## 38. Reglas para agentes de IA

Antes de modificar el frontend:

1. Leer completamente este archivo.
2. Trabajar únicamente en `SISVENT-FRONT`.
3. No tocar `SISVENT-BACK`.
4. Inspeccionar solo las áreas necesarias para la tarea.
5. Respetar Angular 20 y la estructura feature-first.
6. No implementar lógica sensible del backend en Angular.
7. No duplicar componentes/servicios existentes.
8. No crear abstracciones sin necesidad.
9. No agregar dependencias sin justificar.
10. No guardar secretos.
11. Mantener contratos alineados con la API cuando exista.
12. Mantener separación `core/shared/layouts/features`.
13. Mantener estilos globales y variables de tema centralizadas.
14. No dispersar colores hardcodeados.
15. Ejecutar validaciones/build después de cambios estructurales.
16. Ejecutar tests existentes cuando correspondan.
17. Informar archivos creados/modificados/eliminados.
18. Informar paquetes npm agregados y por qué.
19. No hacer commit/push salvo solicitud explícita.
20. Actualizar este archivo cuando cambie una decisión arquitectónica importante.

---

## 39. Regla de oro

> El frontend debe ser reutilizable, configurable y coherente, pero nunca convertirse en la capa que decide seguridad o reglas de negocio sensibles.

Y:

> No crear arquitectura por anticipación. Construir una base sólida y hacer crecer componentes/abstracciones cuando existan casos reales que demuestren su reutilización.
