export interface DataTableColumn<T> { readonly key: string; readonly label: string; readonly value: (row: T) => string | number; readonly type?: 'text' | 'status'; }
