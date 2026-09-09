import { BrandListItem } from '../models/brand.model';

/** Placeholder data — no backend endpoint for brands yet. Replace with an API service when available. */
export const BRAND_MOCK: readonly BrandListItem[] = [
  { id: '1', name: 'Logitech', description: 'Periféricos y accesorios gaming', categories: ['Tecnología', 'Gaming'], productCount: 45, status: 'ACTIVE' },
  { id: '2', name: 'Samsung', description: 'Electrónica y tecnología', categories: ['Tecnología', 'Audio'], productCount: 38, status: 'ACTIVE' },
  { id: '3', name: 'HP', description: 'Computadoras e impresoras', categories: ['Tecnología'], productCount: 32, status: 'ACTIVE' },
  { id: '4', name: 'Razer', description: 'Gaming y periféricos', categories: ['Gaming'], productCount: 28, status: 'ACTIVE' },
  { id: '5', name: 'Sony', description: 'Audio y electrónica', categories: ['Audio', 'Tecnología'], productCount: 22, status: 'ACTIVE' },
  { id: '6', name: 'TP-Link', description: 'Equipos de red', categories: ['Redes'], productCount: 15, status: 'INACTIVE' },
];
