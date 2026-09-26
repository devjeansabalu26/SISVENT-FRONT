import { ParetoPoint } from '../components/pareto-chart/pareto-chart';
import {
  AbcClassSummary,
  AbcProduct,
  CriticalProduct,
  PurchaseSuggestion,
  StagnantKpi,
  StagnantProduct,
} from '../models/replenishment.model';

/** Placeholder data — no backend endpoint for the replenishment module yet. */
export const CRITICAL_PRODUCT_MOCK: readonly CriticalProduct[] = [
  { id: '1', sku: 'PROD-291', name: 'Azúcar Refinada 1kg', stock: 45, avgSales: '15 uds/día', coverageDays: 3, risk: 'Crítico' },
  { id: '2', sku: 'PROD-102', name: 'Café Molido Blend 250g', stock: 12, avgSales: '5 uds/día', coverageDays: 2.4, risk: 'Crítico' },
  { id: '3', sku: 'PROD-998', name: 'Aceite de Girasol 1.5L', stock: 15, avgSales: '4.5 uds/día', coverageDays: 3.3, risk: 'Crítico' },
  { id: '4', sku: 'PROD-448', name: 'Pasta Penne Rigate 500g', stock: 90, avgSales: '22 uds/día', coverageDays: 4, risk: 'Moderado' },
  { id: '5', sku: 'PROD-312', name: 'Detergente Líquido 3L', stock: 8, avgSales: '2 uds/día', coverageDays: 4, risk: 'Moderado' },
  { id: '6', sku: 'PROD-876', name: 'Papel Higiénico 12 rollos', stock: 15, avgSales: '3 uds/día', coverageDays: 5, risk: 'Moderado' },
];

export const PURCHASE_SUGGESTION_MOCK: readonly PurchaseSuggestion[] = [
  { id: '1', product: 'Harina de Trigo Integral 1kg', supplier: 'Distribuidora Central', quantity: '500 uds', priority: 'Crítica' },
  { id: '2', product: 'Aceite de Oliva Extra Virgen 500ml', supplier: 'Olivares del Sur', quantity: '200 uds', priority: 'Alta' },
  { id: '3', product: 'Arroz Grano Largo 5kg', supplier: 'Arrocera Nacional', quantity: '1,200 uds', priority: 'Media' },
  { id: '4', product: 'Leche Entera 1L Box', supplier: 'Lácteos del Norte', quantity: '800 uds', priority: 'Media' },
];

export const ABC_PRODUCT_MOCK: readonly AbcProduct[] = [
  { id: '1', name: 'Smartphone Galaxy S23 Ultra', sku: 'SKU-9022', abcClass: 'Clase A', monthlySales: '140 un', rotation: 'Alta', margin: '24.5%', revenue: 'S/ 385,000' },
  { id: '2', name: 'Laptop ASUS Zenbook 14', sku: 'SKU-4832', abcClass: 'Clase A', monthlySales: '95 un', rotation: 'Alta', margin: '18.2%', revenue: 'S/ 247,000' },
  { id: '3', name: 'Teclado Mecánico Logitech MX', sku: 'SKU-3321', abcClass: 'Clase B', monthlySales: '48 un', rotation: 'Media', margin: '32.0%', revenue: 'S/ 19,200' },
  { id: '4', name: 'Monitor Gamer 27" Curvo LG', sku: 'SKU-7740', abcClass: 'Clase B', monthlySales: '32 un', rotation: 'Media', margin: '15.8%', revenue: 'S/ 48,000' },
  { id: '5', name: 'Cable HDMI 4K v2.1 2mts', sku: 'SKU-1082', abcClass: 'Clase C', monthlySales: '12 un', rotation: 'Baja', margin: '45.0%', revenue: 'S/ 720' },
];

export const STAGNANT_PRODUCT_MOCK: readonly StagnantProduct[] = [
  { id: '1', name: 'Cargador Inalámbrico Fast Qi', sku: 'SKU-8822', stock: 85, daysWithoutSale: 120, value: 'S/ 1,700', lastMovement: '15/01/2024', cause: 'Cambio de diseño', suggestedAction: 'Promoción outlet' },
  { id: '2', name: 'Auriculares Bluetooth Sport Lite', sku: 'SKU-5441', stock: 120, daysWithoutSale: 95, value: 'S/ 1,500', lastMovement: '10/02/2024', cause: 'Sobreestimación vta', suggestedAction: 'Promoción pack' },
  { id: '3', name: 'Caja de Herramientas Premium', sku: 'SKU-3129', stock: 4, daysWithoutSale: 180, value: 'S/ 800', lastMovement: '12/10/2023', cause: 'Obsolescencia técnica', suggestedAction: 'Dar de baja' },
  { id: '4', name: 'Funda Protectora Silicona iPhone 13', sku: 'SKU-9902', stock: 50, daysWithoutSale: 110, value: 'S/ 1,250', lastMovement: '05/02/2024', cause: 'Exceso de stock', suggestedAction: 'Transferir a tienda B' },
  { id: '5', name: 'Cable Auxiliar Jack 3.5mm 1mt', sku: 'SKU-4410', stock: 180, daysWithoutSale: 150, value: 'S/ 1,800', lastMovement: '24/11/2023', cause: 'Baja demanda', suggestedAction: 'Promoción 2x1' },
];

export const ABC_CLASS_MOCK: readonly AbcClassSummary[] = [
  { name: 'Clase A', label: 'Alta rotación', description: 'Productos críticos de alta prioridad. Generan la mayor parte de los ingresos.', valueShare: 80.2, items: 128 },
  { name: 'Clase B', label: 'Mediana rotación', description: 'Rotación moderada. Requieren control e inventarios preventivos.', valueShare: 14.5, items: 340 },
  { name: 'Clase C', label: 'Baja rotación', description: 'Rotación muy lenta. Evitar sobrealmacenamiento por costo de tenencia.', valueShare: 5.3, items: 1204 },
];

/** Curva acumulada coherente con ABC_CLASS_MOCK: 128/1672 ≈ 7.7% de ítems → 80.2% del valor. */
export const PARETO_CURVE_MOCK: readonly ParetoPoint[] = [
  { products: 0, value: 0 },
  { products: 2, value: 38 },
  { products: 5, value: 66 },
  { products: 8, value: 80.2 },
  { products: 15, value: 88 },
  { products: 28, value: 94.7 },
  { products: 50, value: 97.6 },
  { products: 75, value: 99.2 },
  { products: 100, value: 100 },
];

export const STAGNANT_KPI_MOCK: readonly StagnantKpi[] = [
  { label: 'Capital inmovilizado', value: 'S/ 42,800', hint: 'Costo total de stock sin rotar', icon: 'savings', tone: 'danger' },
  { label: 'Productos inactivos', value: '85 ítems', hint: 'Sin ventas en los últimos 90 días', icon: 'inventory_2', tone: 'warning' },
  { label: 'Días promedio sin venta', value: '112 días', hint: 'Tiempo promedio de inactividad', icon: 'event_busy', tone: 'info' },
  { label: 'Exceso de stock est.', value: '320 uds', hint: 'Sobre el stock máximo', icon: 'stacked_bar_chart', tone: 'warning' },
];
