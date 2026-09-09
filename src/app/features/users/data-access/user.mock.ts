import { UserListItem } from '../models/user.model';

export const USER_MOCK: readonly UserListItem[] = [
  { id: '1', fullName: 'María Torres', email: 'maria@sisvent.pe', document: '45879612', role: 'ADMIN', branch: 'Principal', status: 'ACTIVE' },
  { id: '2', fullName: 'Carlos Mendoza', email: 'carlos@sisvent.pe', document: '70214589', role: 'VENDEDOR', branch: 'Tienda Centro', status: 'ACTIVE' },
  { id: '3', fullName: 'Ana Rodríguez', email: 'ana@sisvent.pe', document: '63457821', role: 'VENDEDOR', branch: 'Principal', status: 'INACTIVE' },
];
