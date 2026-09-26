export interface DataTableColumn<T> { readonly key: string; readonly label: string; readonly value: (row: T) => string | number; readonly type?: 'text' | 'status'; }

/** An entry in a row's "⋮ Más opciones" overflow menu. `id` is echoed back through the `menuAction` output. */
export interface DataTableMenuAction { readonly id: string; readonly label: string; readonly icon?: string; readonly danger?: boolean; }
