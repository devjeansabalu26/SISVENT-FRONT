export type AuditResult = 'SUCCESS' | 'WARNING' | 'ERROR';
export interface AuditEvent { readonly id:string; readonly date:string; readonly user:string; readonly role:string; readonly action:string; readonly module:string; readonly company:string; readonly ip:string; readonly result:AuditResult; readonly detail:string; }
