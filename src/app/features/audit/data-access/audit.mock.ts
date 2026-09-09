import { AuditEvent } from '../models/audit-event.model';
export const AUDIT_MOCK:readonly AuditEvent[]=[
 {id:'A-1052',date:'04/09/2026 16:42',user:'María Torres',role:'ADMIN',action:'Actualizó producto',module:'Productos',company:'Comercial Demo',ip:'192.168.1.24',result:'SUCCESS',detail:'Modificó precio y stock mínimo del producto SKU-001.'},
 {id:'A-1051',date:'04/09/2026 16:15',user:'Carlos Mendoza',role:'VENDEDOR',action:'Registró venta',module:'Ventas',company:'Comercial Demo',ip:'192.168.1.31',result:'SUCCESS',detail:'Registró la venta V-0047 mediante pago en efectivo.'},
 {id:'A-1050',date:'04/09/2026 15:58',user:'Ana Rodríguez',role:'VENDEDOR',action:'Intento de acceso',module:'Configuración',company:'Comercial Demo',ip:'192.168.1.18',result:'WARNING',detail:'Intentó ingresar a una ruta sin el permiso settings.manage.'},
 {id:'A-1049',date:'04/09/2026 14:21',user:'Sistema',role:'SYSTEM',action:'Error de sincronización',module:'Inventario',company:'Comercial Demo',ip:'10.0.0.5',result:'ERROR',detail:'La sincronización temporal de stock agotó el tiempo de espera.'}
];
