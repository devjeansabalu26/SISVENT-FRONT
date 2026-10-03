/** Mirrors CategoryResponse from /api/v1/categories. */
export interface Category {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly isActive: boolean;
  readonly version: number;
  /** Categoría principal; null = es principal (un solo nivel de subcategorías). */
  readonly parentId?: string | null;
  readonly parentName?: string | null;
  /** Productos asignados directamente a esta categoría. */
  readonly productCount?: number;
}

/** Datos del formulario: la categoría a editar y las principales disponibles como padre. */
export interface CategoryFormData {
  readonly category: Category | null;
  readonly parents: readonly Category[];
  /** Si ya tiene subcategorías no puede volverse subcategoría. */
  readonly hasChildren: boolean;
}

export interface CategoryPage {
  readonly items: readonly Category[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
}

export interface CategoryFormValue {
  readonly name: string;
  readonly description: string;
  readonly isActive: boolean;
  readonly parentId: string | null;
}
