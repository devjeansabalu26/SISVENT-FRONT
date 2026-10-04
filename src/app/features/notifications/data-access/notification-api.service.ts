import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { NotificationList } from '../models/notification-item.model';

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/notifications`;

  list(limit = 100): Observable<NotificationList> {
    return this.http.get<NotificationList>(this.baseUrl, { params: new HttpParams().set('limit', limit) });
  }

  unreadCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/unread-count`);
  }

  markRead(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/read`, null);
  }

  markAllRead(): Observable<{ readonly updated: number }> {
    return this.http.post<{ readonly updated: number }>(`${this.baseUrl}/read-all`, null);
  }
}
