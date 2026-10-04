import { DiffRow } from '../../utils/diff-rows';

export type ReviewTone = 'info' | 'warning' | 'danger' | 'success';

export interface ReviewMeta {
  readonly label: string;
  readonly value: string;
}

export interface ReviewTransition {
  readonly fromLabel: string;
  readonly from: string;
  readonly toLabel: string;
  readonly to: string;
}

export interface ReviewKpi {
  readonly label: string;
  readonly value: string;
}

export interface ReviewChipGroup {
  readonly label: string;
  readonly items: readonly string[];
  readonly empty?: string;
  readonly tone?: ReviewTone;
}

export interface ReviewDialogData {
  readonly title: string;
  readonly code?: string;
  readonly icon: string;
  readonly intro?: string;
  readonly meta?: readonly ReviewMeta[];
  readonly transition?: ReviewTransition;
  readonly kpis?: readonly ReviewKpi[];
  readonly diff?: {
    readonly headers?: readonly [string, string, string];
    readonly rows: readonly DiffRow[];
  };
  readonly chipGroups?: readonly ReviewChipGroup[];
  readonly banner?: { readonly tone: ReviewTone; readonly text: string };
  readonly note?: string;
  readonly reason?: {
    readonly label: string;
    readonly placeholder?: string;
    readonly minLength?: number;
  };
  readonly confirmLabel: string;
  readonly cancelLabel?: string | null;
  readonly destructive?: boolean;
}
