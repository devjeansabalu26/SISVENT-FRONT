import { Category } from '../models/category.model';
import { withParentLabel } from './category-label';

const category = (id: string, name: string, parentName: string | null = null): Category => ({
  id, name, description: null, isActive: true, version: 1, parentId: parentName ? 'p' : null, parentName,
});

describe('withParentLabel', () => {
  it('prefixes subcategories with their parent and keeps them under it', () => {
    const labels = withParentLabel([
      category('1', 'Hogar'),
      category('2', 'Celulares', 'Electrónica'),
      category('3', 'Electrónica'),
    ]).map((item) => item.name);
    expect(labels).toEqual(['Electrónica', 'Electrónica › Celulares', 'Hogar']);
  });
});
