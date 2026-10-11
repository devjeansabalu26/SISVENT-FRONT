import { TimeoutError } from 'rxjs';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { PosSaleRequest } from '../data-access/pos-api.service';

export const SALE_CONFIRM_TIMEOUT_MS = 45_000;

export interface PendingSale {
  readonly key: string;
  readonly fingerprint: string;
}

export function saleFingerprint(body: PosSaleRequest): string {
  return JSON.stringify({ ...body, sellerCode: undefined });
}

export function pendingSaleFor(previous: PendingSale | null, body: PosSaleRequest, newKey: () => string): PendingSale {
  const fingerprint = saleFingerprint(body);
  return previous?.fingerprint === fingerprint ? previous : { key: newKey(), fingerprint };
}

export function isUncertainSaleFailure(cause: unknown): boolean {
  if (cause instanceof TimeoutError) return true;
  return cause instanceof AppHttpError && (cause.status === 0 || cause.status >= 500);
}
