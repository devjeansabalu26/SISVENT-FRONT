Quiero continuar con el módulo ADMIN de SISVENT.

Ahora necesito terminar y rediseñar el DASHBOARD DEL ADMIN tomando como referencia la primera imagen proporcionada.

Actualmente tengo el dashboard funcionando parcialmente, como en la segunda imagen, pero necesito:

1. Que visualmente quede como la primera referencia.
2. Que todos los indicadores funcionen con datos reales.
3. Agregar filtros superiores.
4. Completar gráficos y secciones.
5. Corregir definitivamente el theme de la empresa.
6. El NAVBAR/SIDEBAR también debe tomar los colores configurados para la empresa.
7. Mantener menú dinámico según Plan + Features + Permisos.
8. Todo debe funcionar con Angular + .NET 8 + PostgreSQL.

IMPORTANTE:

- NO usar datos mock.
- NO hardcodear valores.
- NO hardcodear colores.
- NO mostrar módulos que el plan no tenga habilitados.
- NO modificar innecesariamente las pantallas de SUPERADMIN.
- Mantener aislamiento multiempresa mediante companyId/tenant.
- Todo el dashboard debe mostrar exclusivamente información de la empresa del ADMIN autenticado.

==================================================
1. DISEÑO GENERAL
==================================================

Quiero que:

/app/dashboard

cuando el usuario sea ADMIN tenga el diseño de la primera referencia.

Encabezado:

Dashboard

Subtítulo dinámico:

Vista general de {NombreEmpresa}

Ejemplo:

Dashboard
Vista general de JEAN SAC

NO hardcodear TechStore Peru ni JEAN SAC.

Usar el nombre de la empresa autenticada.

A la derecha agregar:

[ Sincronizar ]

Este botón debe volver a consultar los datos del dashboard.

No debe recargar completamente el navegador.

Debe mostrar estado loading mientras sincroniza.

==================================================
2. FILTROS SUPERIORES
==================================================

Agregar una barra de filtros debajo del título.

Quiero:

Fecha: [Hoy]
Local: [Todos los Locales]
Vendedor: [Todos los Vendedores]

FECHA

Permitir como mínimo:

- Hoy
- Ayer
- Últimos 7 días
- Este mes
- Mes anterior
- Rango personalizado si ya existe componente reutilizable.

LOCAL

Debe cargar solamente:

stores

de la empresa autenticada.

Primera opción:

Todos los Locales

VENDEDOR

Debe cargar únicamente vendedores de la empresa.

Primera opción:

Todos los Vendedores

Si se selecciona un local, preferentemente filtrar los vendedores asociados a ese local.

==================================================
3. FILTROS + DASHBOARD
==================================================

Todos los indicadores inferiores deben reaccionar a estos filtros cuando corresponda.

Por ejemplo:

Fecha = Hoy
Local = Local Principal
Vendedor = Juan

debe afectar:

- Ventas del período
- Operaciones
- Ventas recientes
- Evolución ventas
- Ventas por categoría
- Top productos

No debe necesariamente afectar:

- Productos totales
- Clientes totales
- Locales activos

si estos indicadores representan el estado actual general.

Define correctamente qué KPI depende del período y cuáles son métricas generales.

==================================================
4. CARDS KPI
==================================================

Quiero 7 cards como la referencia:

VENTAS DEL DÍA

S/ 4,580

Mostrar además variación porcentual si existen datos suficientes:

↑ +12%

Comparar preferentemente contra el día anterior equivalente.

Si no existen datos suficientes:
no inventar porcentaje.


VENTAS DEL PERÍODO

S/ 32,450

Depende del filtro de fecha seleccionado.


OPERACIONES

47

Debe representar número real de ventas/operaciones válidas del período.


PRODUCTOS

284

Cantidad real de productos de la empresa.


CLIENTES

156

Cantidad real de clientes de la empresa.


STOCK BAJO

8

Productos actualmente en condición de stock bajo.

Debe calcularse utilizando la regla real:

currentStock <= minStock

según stock_by_store.

Si stock bajo > 0:
mostrar visualmente estado de alerta.


LOCALES ACTIVOS

3

Cantidad real de locales activos de la empresa.

==================================================
5. VENTAS DEL DÍA
==================================================

Actualmente aparece:

S/ 0.00

Debe continuar mostrando 0 correctamente cuando realmente no existan ventas.

NO colocar números de ejemplo.

Debe consultar datos reales de:

sales

considerando:

company
store
seller
date
status

No incluir:

DRAFT
CANCELLED

si las reglas actuales indican que no representan ventas efectivas.

Revisar los estados existentes antes de calcular.

==================================================
6. VENTAS RECIENTES
==================================================

Crear una card grande:

Ventas Recientes

con tabla:

NRO
FECHA
CLIENTE
TOTAL
ESTADO

Ejemplo visual:

V0047 | Hoy, 10:42 AM | Juan Perez | S/ 299.80 | Completada

Todo debe ser real.

Mostrar las últimas 5 ventas según los filtros actuales.

Agregar:

Ver todas

que lleve a la bandeja/historial de ventas existente.

No crear otra pantalla duplicada.

==================================================
7. EVOLUCIÓN DE VENTAS
==================================================

Agregar card:

Evolución de Ventas

como la gráfica de líneas de la referencia.

Debe consumir datos reales.

Ejemplo:

Lun
Mar
Mié
Jue
Vie
Sáb
Dom

Cuando Fecha = Hoy o últimos días:
adaptar agrupación correctamente.

Por ejemplo:

Últimos 7 días:
ventas por día.

Este mes:
ventas por día o agrupación adecuada.

No hardcodear puntos del gráfico.

Reutilizar la librería gráfica existente si el proyecto ya utiliza una.

No instalar otra librería innecesariamente.

==================================================
8. VENTAS POR CATEGORÍA
==================================================

Agregar card:

Ventas por Categoría

como en la referencia.

Ejemplo visual:

Tecnología          S/ 15,240
████████████████

Accesorios          S/ 8,450
██████████

Audio               S/ 5,120
██████

Debe calcularse con datos reales mediante:

sales
sale_items
products
categories

Filtrado por:

companyId
fecha
local
vendedor

cuando corresponda.

Ordenar de mayor a menor.

Mostrar máximo las categorías principales para evitar una card demasiado grande.

==================================================
9. TOP PRODUCTOS
==================================================

Agregar:

Top Productos

Mostrar aproximadamente los 3-5 productos más vendidos del período.

Ejemplo:

Audífonos Bluetooth Pro
42 u. vendidos                   S/ 3,775.80

Mouse Inalámbrico
28 u. vendidos                   S/ 1,260.00

Debe salir de:

sale_items
+
sales
+
products

No hardcodear.

Ordenar por cantidad vendida o ingreso, definiendo claramente la regla.

Preferencia:

cantidad vendida DESC.

Mostrar también el monto generado.

==================================================
10. ALERTAS DE STOCK BAJO
==================================================

Debajo de Top Productos agregar:

Alertas de Stock Bajo

Mostrar productos con:

currentStock <= minStock

Ejemplo:

Adaptador HDMI a VGA
Local Miraflores                    2 unidades

Cargador Rápido 20W
Local San Isidro                    3 unidades

Debe indicar el local porque el stock pertenece a:

stock_by_store

No sumar stocks para determinar una alerta por local.

Un producto puede tener:

Local A → stock normal
Local B → stock bajo

Por tanto la alerta debe identificar el local afectado.

Mostrar solamente las primeras alertas y, si existen muchas, agregar:

Ver inventario

==================================================
11. LAYOUT FINAL
==================================================

Quiero aproximadamente:

Dashboard                            [Sincronizar]
Vista general de JEAN SAC


[Fecha] [Local] [Vendedor]


[Venta día]
[Venta período]
[Operaciones]
[Productos]
[Clientes]
[Stock bajo]
[Locales]


┌───────────────────────────────────┐ ┌──────────────────────┐
│ Ventas Recientes                  │ │ Evolución Ventas     │
│                                   │ │                      │
│ tabla                             │ │ gráfico              │
└───────────────────────────────────┘ └──────────────────────┘


┌───────────────────────────────────┐ ┌──────────────────────┐
│ Ventas por Categoría              │ │ Top Productos        │
│                                   │ │                      │
│ barras                            │ │ productos            │
│                                   │ │                      │
│                                   │ │ Alertas Stock Bajo   │
└───────────────────────────────────┘ └──────────────────────┘

==================================================
12. RESPONSIVE
==================================================

Desktop:
usar distribución muy similar a la referencia.

Tablet:
cards KPI repartidas correctamente.

Mobile:
apilar las cards.

Los gráficos deben ser responsive.

No generar overflow horizontal general.

==================================================
13. BACKEND DEL DASHBOARD
==================================================

NO quiero que Angular haga 20 consultas separadas si puede evitarse.

Revisar primero la API existente.

Preferentemente crear/reutilizar un endpoint agregado del dashboard.

Conceptualmente:

GET /api/dashboard

con parámetros:

dateFrom
dateTo
storeId
sellerId

Puede devolver algo similar a:

{
  summary: {
    salesToday,
    salesPeriod,
    operations,
    products,
    clients,
    lowStock,
    activeStores,
    salesVariation
  },

  recentSales: [...],

  salesEvolution: [...],

  salesByCategory: [...],

  topProducts: [...],

  lowStockAlerts: [...]
}

NO utilizar necesariamente estos nombres.

Adaptarlo a DTOs y arquitectura actual.

==================================================
14. CONSULTAS EF CORE
==================================================

Optimizar las consultas.

Usar:

AsNoTracking()

para consultas de lectura cuando corresponda.

Usar:

CountAsync
SumAsync
GroupBy
Select

desde PostgreSQL.

NO hacer:

ToListAsync()

de cientos/miles de registros para calcular:

SUM
COUNT
GROUP BY

en memoria innecesariamente.

Evitar N+1.

==================================================
15. TENANT
==================================================

MUY IMPORTANTE:

Dashboard ADMIN debe estar siempre filtrado por:

companyId del usuario autenticado.

ADMIN Empresa A:

NO puede visualizar:

ventas Empresa B
productos Empresa B
clientes Empresa B
stock Empresa B
locales Empresa B
vendedores Empresa B

El companyId no debe confiarse únicamente al frontend.

Backend debe resolver/validar tenant.

==================================================
16. SIDEBAR / NAVBAR
==================================================

Revisar nuevamente el sidebar actual.

Visualmente quiero que se parezca al sidebar de la primera referencia y mantenga el mismo lenguaje visual del sistema.

Parte superior:

[Logo/Inicial empresa]
Nombre Empresa
Administrador

Ejemplo:

T
JEAN SAC
Administrador

Pero usar información real.

==================================================
17. MENÚ SEGÚN PLAN
==================================================

Mantener el menú dinámico que venimos trabajando.

El ADMIN debe visualizar únicamente módulos permitidos mediante:

ROL
+
PLAN ACTIVO
+
PLAN_FEATURES
+
FEATURES
+
PERMISOS

Por ejemplo, si tiene acceso:

Dashboard
Mi Empresa
Locales
Vendedores
Categorías
Marcas
Productos
Inventario
Clientes
Punto de Venta
Historial Ventas
Reportes
Auditoría
Configuración

mostrar esos.

Pero si su plan no incluye:

Reportes

NO mostrar Reportes.

Si no incluye:

Proveedores

NO mostrar Proveedores.

NO hardcodear un menú distinto para cada plan.

==================================================
18. CORREGIR COLOR DEL NAVBAR/SIDEBAR
==================================================

ESTO SIGUE ESTANDO MAL Y QUIERO QUE LO REVISES.

Actualmente los colores guardados para la empresa están aplicándose parcialmente o no se aplican al NAV/SIDEBAR.

Cuando el Superadmin creó/configuró la empresa se guardaron:

primaryColor
secondaryColor
accentColor
backgroundColor

en:

company_themes

Quiero que revises TODO el flujo porque actualmente el sidebar sigue viéndose con un azul oscuro fijo.

NO debe existir un color fijo tipo:

#0F172A
#111827
#0B172A

en el sidebar si ese color debería venir del theme.

==================================================
19. REGLAS DEL THEME
==================================================

Usar conceptualmente:

secondaryColor
→ fondo principal del sidebar.

primaryColor
→ elemento activo / botones principales / elementos destacados.

accentColor
→ estados secundarios / indicadores / detalles.

backgroundColor
→ fondo del área principal.

Ejemplo:

Si la empresa tiene:

primaryColor: #7C3AED
secondaryColor: #24143D
accentColor: #C084FC
backgroundColor: #F3F4F6

quiero ver:

sidebar → #24143D

menú activo → combinaciones basadas en #7C3AED

botones → #7C3AED

acentos → #C084FC

fondo app → #F3F4F6

NO seguir viendo los colores Default.

==================================================
20. REVISAR POR QUÉ NO CAMBIA EL NAV
==================================================

No quiero solamente agregar otro CSS encima.

Investiga la causa real.

Revisar:

- ThemeService
- CompanyContext
- AuthService
- carga inicial del usuario
- company_themes
- CSS variables
- estilos globales
- sidebar component
- !important
- valores SCSS hardcodeados
- orden de carga de estilos
- Angular Material theme si interviene
- estilos inline
- fallback theme

Identificar exactamente qué está sobrescribiendo el color.

==================================================
21. CSS VARIABLES
==================================================

Centralizar colores con variables.

Ejemplo conceptual:

:root {
  --company-primary: ...;
  --company-secondary: ...;
  --company-accent: ...;
  --company-background: ...;
  --company-surface: ...;
}

Sidebar:

background: var(--company-secondary);

Menu activo:

background/color/border utilizando:
var(--company-primary)

Botones:

background:
var(--company-primary)

No poner HEX de empresa directamente dentro de componentes.

==================================================
22. CONTRASTE DEL SIDEBAR
==================================================

IMPORTANTE:

Si el secondaryColor elegido por el cliente es claro, el texto blanco podría dejar de verse.

Crear una utilidad para determinar color de contraste:

texto oscuro
o
texto claro

según luminancia.

Aplicarlo a:

- sidebar;
- botones;
- badges importantes.

No asumir siempre:

color: white.

==================================================
23. REFRESH
==================================================

Prueba:

LOGIN ADMIN
→ carga theme correcto.

Después:

F5

El theme debe mantenerse.

NO debe volver a Default después de refrescar.

El flujo debe ser:

restore auth
→ obtener company context
→ cargar company theme
→ renderizar/apply theme

Evitar flash prolongado del theme incorrecto.

==================================================
24. LOGOUT
==================================================

Al cerrar sesión:

limpiar:

company context
plan context
features
theme

Restaurar Default.

Cuando entre otro ADMIN:

cargar los colores de SU empresa.

No mantener colores de la empresa anterior.

==================================================
25. HEADER TAMBIÉN DEBE RESPETAR THEME
==================================================

Revisar el header/topbar.

No quiero necesariamente pintarlo completamente del primaryColor, pero debe usar correctamente las variables del theme donde corresponda.

Mantener un diseño limpio.

El sidebar sí debe reflejar claramente la identidad visual de la empresa.

==================================================
26. INDICADORES DEL DASHBOARD + THEME
==================================================

Los iconos y elementos seleccionados del dashboard también deben utilizar el theme.

NO hardcodear:

azul
morado

si representan primary/accent.

Pero:

verde de éxito
amarillo warning
rojo error

pueden seguir siendo colores semánticos.

No convertir estados de peligro en color corporativo.

==================================================
27. NO ALTERAR SUPERADMIN
==================================================

SUPERADMIN debe continuar utilizando el theme general/default de SISVENT.

Los colores de una empresa deben aplicarse cuando el contexto tenga:

companyId

ADMIN/VENDEDOR.

No aplicar el theme de JEAN SAC al Superadmin global.

==================================================
28. STOCK BAJO
==================================================

La card:

Stock Bajo

debe destacarse cuando:

lowStock > 0

similar a la referencia.

Puede utilizar warning semántico:

borde naranja
icono alerta

Si:

lowStock = 0

mostrar estado normal.

==================================================
29. EMPTY STATES
==================================================

Actualmente la empresa todavía puede tener:

0 ventas
0 productos
0 clientes

y eso es válido.

No mostrar componentes rotos.

Ventas recientes:

“No hay ventas registradas para el período seleccionado.”

Top productos:

“No hay productos vendidos en este período.”

Ventas por categoría:

“No hay información de ventas disponible.”

Stock bajo:

“No existen alertas de stock bajo.”

==================================================
30. LOADING
==================================================

Al abrir Dashboard:

mostrar skeletons/loading.

No mostrar momentáneamente todos los KPI en 0 antes de que termine la consulta si esos 0 todavía no son datos reales.

Al pulsar Sincronizar:
refrescar datos sin destruir todo el layout.

==================================================
31. CACHÉ / ESTADO
==================================================

Evitar realizar múltiples llamadas idénticas porque distintos componentes solicitan el mismo dashboard.

Centralizar mediante DashboardService.

Los cambios de filtros sí deben volver a consultar.

==================================================
32. SEGURIDAD
==================================================

El endpoint del Dashboard debe requerir autenticación.

Debe verificar:

tenant
rol
feature/permisos correspondientes.

No aceptar libremente:

companyId=OtraEmpresa

desde query string.

==================================================
33. VALIDACIÓN DEL NAV SEGÚN PLAN
==================================================

Haz una validación real contra:

plans
company_plan_periods
plan_features
features

Comprueba que el menú actual del ADMIN corresponda realmente a su plan.

No quiero únicamente esconder menús manualmente.

Además:

Route Guard frontend
+
Authorization backend

deben seguir funcionando.

==================================================
34. DEFINICIÓN DE TERMINADO
==================================================

No considerar la tarea terminada si únicamente se cambia HTML/SCSS.

Debe quedar funcionando:

DASHBOARD

✓ filtros
✓ ventas día
✓ ventas período
✓ operaciones
✓ productos
✓ clientes
✓ stock bajo
✓ locales activos
✓ ventas recientes
✓ evolución ventas
✓ ventas categoría
✓ top productos
✓ alertas stock


THEME

✓ primary
✓ secondary
✓ accent
✓ background
✓ navbar/sidebar
✓ botones
✓ item activo
✓ refresh
✓ logout
✓ cambio de empresa


NAVBAR

✓ nombre de empresa
✓ rol
✓ módulos por plan
✓ features
✓ permisos
✓ guards


BACKEND

✓ .NET
✓ EF Core
✓ PostgreSQL
✓ tenant isolation
✓ consultas agregadas

==================================================
35. PRUEBAS MANUALES
==================================================

Prueba con el ADMIN actual.

1. Login.

2. Confirmar:
empresa correcta.

3. Confirmar:
theme correcto.

4. Confirmar:
SIDEBAR cambia realmente al secondaryColor de company_themes.

5. Confirmar:
primaryColor aplicado a botones/menu activo.

6. Entrar Dashboard.

7. Cambiar:
Fecha.

8. Cambiar:
Local.

9. Cambiar:
Vendedor.

10. Confirmar que:
KPIs/gráficos cambian correctamente.

11. F5.

12. Confirmar:
theme sigue correcto.

13. Logout.

14. Login con otra empresa.

15. Confirmar:
theme/menu/datos cambian completamente.

==================================================
36. AL FINAL INFORMARME
==================================================

Al terminar dame un reporte con:

1. Archivos frontend modificados.
2. Archivos backend modificados.
3. Endpoint utilizado para dashboard.
4. Qué consulta genera cada KPI.
5. Cómo calculas Ventas del Día.
6. Cómo calculas Ventas del Período.
7. Cómo calculas Operaciones.
8. Cómo calculas Stock Bajo.
9. Cómo calculas Top Productos.
10. Cómo calculas Ventas por Categoría.
11. Cómo generas Evolución de Ventas.
12. Cómo se aplican los filtros.
13. Cómo cargas el plan/features.
14. Cómo construyes el menú.
15. Qué problema impedía cambiar el color del sidebar.
16. Cómo quedó solucionado.
17. Qué CSS variables utiliza el theme.
18. Confirma que no existen colores corporativos hardcodeados en el sidebar.
19. Confirma que no existen datos mock.
20. Confirma aislamiento por companyId.

Finalmente ejecutar:

dotnet build
dotnet test

y:

npm run build

Corregir cualquier error introducido.

NO detenerse hasta dejar integrado:

ANGULAR
+
.NET 8
+
POSTGRESQL
+
TENANT
+
PLAN/FEATURES
+
THEME.