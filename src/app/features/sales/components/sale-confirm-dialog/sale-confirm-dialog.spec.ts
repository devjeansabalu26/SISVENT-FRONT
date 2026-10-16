import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AttendancePerson } from '../../../attendance/models/attendance.model';
import { SaleConfirmData, SaleConfirmDialog } from './sale-confirm-dialog';

describe('SaleConfirmDialog', () => {
  const person = (profileId: string, fullName: string): AttendancePerson => ({
    recordId: `r-${profileId}`, profileId, fullName, role: 'VENDEDOR', userCode: '12345', email: null, checkInAt: '2026-10-15T14:00:00Z',
  });

  function create(present: readonly AttendancePerson[], defaultProfileId: string | null, enabled = true) {
    const close = jasmine.createSpy('close');
    const data: SaleConfirmData = {
      customer: 'Cliente general',
      lines: [{ name: 'Polo', quantity: 1, unitPrice: 10 }],
      discount: 0,
      paymentMethod: 'Efectivo',
      seller: { attendanceEnabled: enabled, present, defaultProfileId, loggedUserName: 'Jean', loggedUserRole: 'VENDEDOR' },
    };
    TestBed.configureTestingModule({
      imports: [SaleConfirmDialog],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: data }, { provide: MatDialogRef, useValue: { close } }],
    });
    const component = TestBed.createComponent(SaleConfirmDialog).componentInstance;
    return { component, close };
  }

  it('muestra por defecto a la persona de la sesión y cambia a la otra en turno', () => {
    const { component, close } = create([person('a', 'Ana'), person('b', 'Beto')], 'b');
    expect(component.responsibleName()).toBe('Beto');
    component.change();
    expect(component.responsibleName()).toBe('Ana');
    component.confirm(new Event('submit'));
    expect(close).toHaveBeenCalledWith({ sellerProfileId: 'a' });
  });

  it('con más de dos personas muestra la lista para elegir', () => {
    const { component } = create([person('a', 'Ana'), person('b', 'Beto'), person('c', 'Cira')], 'a');
    component.change();
    expect(component.choosing()).toBeTrue();
    component.choose('c');
    expect(component.responsibleName()).toBe('Cira');
    expect(component.choosing()).toBeFalse();
  });

  it('sin asistencia activa la venta queda a nombre de la sesión', () => {
    const { component, close } = create([], null, false);
    expect(component.responsibleName()).toBe('Jean');
    component.confirm(new Event('submit'));
    expect(close).toHaveBeenCalledWith({ sellerProfileId: null });
  });
});
