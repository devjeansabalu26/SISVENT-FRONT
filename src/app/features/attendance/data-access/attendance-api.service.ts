import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { handleForbiddenInline } from '../../../core/http/http-context.tokens';
import {
  AttendanceAutoResult,
  AttendanceMarkResult,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceStoreOption,
  AttendanceWorker,
  SaveAttendanceBody,
} from '../models/attendance.model';

export function attendanceErrorMessage(cause: unknown, fallback: string): string {
  const body = cause instanceof AppHttpError
    ? (cause.originalError as { error?: { title?: unknown; errors?: unknown } } | undefined)?.error
    : undefined;
  return typeof body?.title === 'string' && !body.errors ? body.title : fallback;
}

@Injectable({ providedIn: 'root' })
export class AttendanceApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/attendance`;
  private readonly context = handleForbiddenInline();

  status(storeId: string | null): Observable<AttendanceStatus> {
    const params = storeId ? new HttpParams().set('storeId', storeId) : undefined;
    return this.http.get<AttendanceStatus>(`${this.baseUrl}/status`, { params, context: this.context });
  }

  autoCheckIn(storeId: string | null): Observable<AttendanceAutoResult> {
    const params = storeId ? new HttpParams().set('storeId', storeId) : undefined;
    return this.http.post<AttendanceAutoResult>(`${this.baseUrl}/auto-check-in`, {}, { params, context: this.context });
  }

  stores(): Observable<readonly AttendanceStoreOption[]> {
    return this.http.get<readonly AttendanceStoreOption[]>(`${this.baseUrl}/stores`, { context: this.context });
  }

  checkIn(code: string, storeId: string | null): Observable<AttendanceMarkResult> {
    return this.http.post<AttendanceMarkResult>(`${this.baseUrl}/check-in`, { code, storeId }, { context: this.context });
  }

  checkOut(code: string, storeId: string | null): Observable<AttendanceMarkResult> {
    return this.http.post<AttendanceMarkResult>(`${this.baseUrl}/check-out`, { code, storeId }, { context: this.context });
  }

  records(filters: { storeId?: string; profileId?: string; from?: string; to?: string } = {}): Observable<readonly AttendanceRecord[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) if (value) params = params.set(key, value);
    return this.http.get<readonly AttendanceRecord[]>(`${this.baseUrl}/records`, { params, context: this.context });
  }

  workers(storeId: string | null): Observable<readonly AttendanceWorker[]> {
    const params = storeId ? new HttpParams().set('storeId', storeId) : undefined;
    return this.http.get<readonly AttendanceWorker[]>(`${this.baseUrl}/workers`, { params, context: this.context });
  }

  create(body: SaveAttendanceBody): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(`${this.baseUrl}/records`, body, { context: this.context });
  }

  update(id: string, body: SaveAttendanceBody): Observable<AttendanceRecord> {
    return this.http.put<AttendanceRecord>(`${this.baseUrl}/records/${id}`, body, { context: this.context });
  }

  close(id: string): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(`${this.baseUrl}/records/${id}/check-out`, {}, { context: this.context });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/records/${id}`, { context: this.context });
  }
}
