export interface DataTableColumn<T> { readonly key: string; readonly label: string; readonly value: (row: T) => string | number; readonly type?: 'text' | 'status'; }

export interface DataTableMenuAction { readonly id: string; readonly label: string; readonly icon?: string; readonly danger?: boolean; }
