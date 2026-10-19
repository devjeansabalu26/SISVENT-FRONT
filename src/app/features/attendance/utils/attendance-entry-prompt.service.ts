import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { APP_PERMISSIONS } from '../../../core/auth/constants/app-permission.constant';
import { AccessControlService } from '../../../core/auth/services/access-control.service';
import { StoreContextService } from '../../../core/context/store-context/store-context.service';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { AttendanceMarkDialog, AttendanceMarkDialogData } from '../components/attendance-mark-dialog/attendance-mark-dialog';
import { AttendanceApiService } from '../data-access/attendance-api.service';
import { AttendanceStatus, hourOf } from '../models/attendance.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { companyToday } from '../../../core/regional/regional-format';

@Injectable({ providedIn: 'root' })
export class AttendanceEntryPromptService {
  private readonly api = inject(AttendanceApiService);
  private readonly dialog = inject(MatDialog);
  private readonly access = inject(AccessControlService);
  private readonly users = inject(UserContextService);
  private readonly storeContext = inject(StoreContextService);
  private readonly notifications = inject(NotificationService);
  private checkedFor: string | null = null;
  private loginPending = false;

  markOnNextEntry(): void {
    this.loginPending = true;
    this.checkedFor = null;
  }

  checkOnEntry(): void {
    const user = this.users.user();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'VENDEDOR')) return;
    if (this.checkedFor === user.userId) return;
    if (!this.access.canAccess({ permissions: [APP_PERMISSIONS.attendanceView] })) return;
    this.checkedFor = user.userId;
    const manages = this.access.canAccess({ permissions: [APP_PERMISSIONS.attendanceManage] });
    const storeId = user.role === 'VENDEDOR' ? (user.branchId ?? null) : (this.storeContext.selectedStoreId() ?? user.branchId ?? null);
    const today = companyToday();
    const autoKey = `sisvent.attendance.auto.${user.userId}`;
    const shouldAuto = user.role === 'VENDEDOR' && (this.loginPending || this.readAutoDate(autoKey) !== today);
    this.loginPending = false;

    if (!shouldAuto) {
      if (!manages) this.api.status(storeId).subscribe({ next: (status) => this.promptIfNobodyPresent(status), error: () => undefined });
      return;
    }
    this.api.autoCheckIn(storeId).subscribe({
      next: (result) => {
        this.writeAutoDate(autoKey, today);
        if (result.marked && result.record) {
          this.notifications.show(`Entrada registrada automáticamente a las ${hourOf(result.record.checkInAt)}: ${result.record.fullName}.`, 'success');
          return;
        }
        if (!manages) this.promptIfNobodyPresent(result.status);
      },
      error: () => undefined,
    });
  }

  private readAutoDate(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeAutoDate(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      return;
    }
  }

  private promptIfNobodyPresent(status: AttendanceStatus): void {
    if (!status.enabled || status.present.length || this.dialog.openDialogs.length) return;
    this.dialog.open<AttendanceMarkDialog, AttendanceMarkDialogData, boolean>(AttendanceMarkDialog, {
      data: { storeId: status.storeId, storeName: status.storeName, present: [] },
    });
  }
}
