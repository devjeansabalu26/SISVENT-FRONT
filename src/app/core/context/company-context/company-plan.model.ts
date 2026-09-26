// Los códigos de plan son arbitrarios (SUPERADMIN crea planes con cualquier código en Planes y precios;
// ver `plans.code` en PostgreSQL) — no una lista fija. `plans: [...]` en rutas/navegación sigue
// funcionando con los códigos reales configurados (p.ej. 'ESSENTIAL' | 'BUSINESS' | 'PROFESSIONAL' en el
// seed actual), pero el tipo ya no limita a 3 valores fijos que podían no coincidir con la BD real.
export type CompanyPlan = string;
