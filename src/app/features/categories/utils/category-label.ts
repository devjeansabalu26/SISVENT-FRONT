import { Category } from '../models/category.model';

export function withParentLabel(categories: readonly Category[]): Category[] {
  return categories
    .map((category) => (category.parentName ? { ...category, name: `${category.parentName} › ${category.name}` } : category))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
