import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ReviewDialog } from '../../../shared/ui/review-dialog/review-dialog';
import { ReviewDialogData } from '../../../shared/ui/review-dialog/review-dialog.model';
import { formatSoles } from '../../../shared/utils/diff-rows';
import { CompanyPlanApiService } from '../data-access/company-plan-api.service';
import { AvailablePlan, MyPlan, MyPlanUsage } from '../models/company-plan.model';

const STATUS_LABELS: Readonly<Record<string, string>> = {
  ACTIVE: 'Activo',
  PENDING: 'Pendiente',
  EXPIRED: 'Vencido',
  SUSPENDED: 'Suspendido',
  INACTIVE: 'Inactivo',
  CANCELLED: 'Cerrado',
};

function formatDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-');
  return day && month && year ? `${day}/${month}/${year}` : value;
}

@Component({
  selector: 'app-company-plan-page',
  imports: [PageHeader],
  templateUrl: './company-plan-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss', './company-plan-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyPlanPage implements OnInit {
  private readonly api = inject(CompanyPlanApiService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly sending = signal(false);
  readonly data = signal<MyPlan | null>(null);

  readonly current = computed(() => this.data()?.current ?? null);
  readonly pending = computed(() => this.data()?.pendingRequest ?? null);
  readonly expiringSoon = computed(() => {
    const current = this.current();
    return !!current && current.status === 'ACTIVE' && current.daysRemaining <= 30;
  });

  readonly formatDate = formatDate;
  readonly formatSoles = formatSoles;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.api.get().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  usageDetail(usage: MyPlanUsage): string {
    return usage.limit === null ? `${usage.used} / ilimitado` : `${usage.used} / ${usage.limit}`;
  }

  usagePercent(usage: MyPlanUsage): number {
    if (usage.limit === null || usage.limit === 0) return usage.limit === 0 && usage.used > 0 ? 100 : 0;
    return Math.min(100, Math.round((usage.used / usage.limit) * 100));
  }

  usageFull(usage: MyPlanUsage): boolean {
    return usage.limit !== null && usage.used >= usage.limit;
  }

  planPrice(plan: AvailablePlan): string {
    return plan.price === null ? 'Precio a consultar' : `${formatSoles(plan.price)} / mes`;
  }

  planLimits(plan: AvailablePlan): readonly string[] {
    const limit = (value: number | null, singular: string, plural: string) =>
      value === null ? `${plural} ilimitados` : `${value} ${value === 1 ? singular : plural}`;
    return [
      limit(plan.maxSellers, 'vendedor', 'vendedores'),
      limit(plan.maxStores, 'local', 'locales'),
      plan.maxProducts === null ? 'Productos ilimitados' : `Hasta ${plan.maxProducts} productos`,
    ];
  }

  ctaLabel(plan: AvailablePlan): string {
    if (plan.isCurrent) return 'Plan actual';
    if (this.pending()?.planId === plan.id) return 'Solicitud enviada';
    return 'Solicitar cambio';
  }

  requestChange(plan: AvailablePlan): void {
    if (plan.isCurrent || this.pending()?.planId === plan.id || this.sending()) return;
    const current = this.current();
    this.dialog
      .open<ReviewDialog, ReviewDialogData, string | boolean>(ReviewDialog, {
        data: {
          title: 'Solicitar cambio de plan',
          icon: 'swap_horiz',
          intro: 'El equipo de SAVIX recibirá tu solicitud y aplicará el cambio de plan y su vigencia.',
          transition: current
            ? { fromLabel: 'Plan actual', from: current.name, toLabel: 'Plan solicitado', to: plan.name }
            : undefined,
          meta: [{ label: 'Precio del plan solicitado', value: this.planPrice(plan) }],
          reason: { label: 'Motivo del cambio', placeholder: 'Ej. Abriremos un segundo local y necesitamos más vendedores.' },
          banner: { tone: 'info', text: 'Tu plan actual sigue vigente hasta que el cambio se aplique.' },
          confirmLabel: 'Enviar solicitud',
        },
      })
      .afterClosed()
      .pipe(filter((result): result is string => typeof result === 'string'))
      .subscribe((message) => this.send(plan, message));
  }

  private send(plan: AvailablePlan, message: string): void {
    this.sending.set(true);
    this.api.requestChange(plan.id, message).subscribe({
      next: () => {
        this.sending.set(false);
        this.notifications.show(`Solicitud de cambio al plan ${plan.name} enviada. Te contactaremos pronto.`, 'success');
        this.load();
      },
      error: (cause: unknown) => {
        this.sending.set(false);
        this.notifications.show(this.messageFor(cause), 'error');
        if (cause instanceof AppHttpError && cause.status === 409) this.load();
      },
    });
  }

  private messageFor(cause: unknown): string {
    if (cause instanceof AppHttpError) {
      const title = (cause.originalError as { error?: { title?: unknown } } | undefined)?.error?.title;
      if ((cause.status === 409 || cause.status === 400 || cause.status === 404) && typeof title === 'string') return title;
      if (cause.status === 403) return 'No tienes permiso para solicitar cambios de plan.';
    }
    return 'No se pudo enviar la solicitud. Inténtalo nuevamente.';
  }
}
