import { Category } from '../models/category.model';

/** Para selects de productos: "Electrónica › Celulares", ordenado para que cada subcategoría quede bajo su principal. */
export function withParentLabel(categories: readonly Category[]): Category[] {
  return categories
    .map((category) => (category.parentName ? { ...category, name: `${category.parentName} › ${category.name}` } : category))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
