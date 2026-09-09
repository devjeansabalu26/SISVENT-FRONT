import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { StatusChip } from '../status-chip/status-chip';
import { DataTableColumn } from './data-table.model';

@Component({ selector:'app-data-table', imports:[StatusChip], templateUrl:'./data-table.html', styleUrl:'./data-table.scss', changeDetection:ChangeDetectionStrategy.OnPush })
export class DataTable<T extends { readonly id: string }> { readonly columns=input.required<readonly DataTableColumn<T>[]>(); readonly rows=input.required<readonly T[]>(); readonly loading=input(false); readonly emptyMessage=input('No se encontraron registros.'); readonly showEdit=input(true); readonly showRemove=input(true); readonly editLabel=input('Editar'); readonly removeLabel=input('Eliminar'); readonly editIcon=input('edit'); readonly removeIcon=input('delete_outline'); readonly edit=output<T>(); readonly remove=output<T>(); }
