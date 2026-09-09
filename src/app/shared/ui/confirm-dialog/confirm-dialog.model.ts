export interface ConfirmDialogData {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly destructive?: boolean;
  /** When set, renders a checkbox the user must tick before confirming (Figma `mod-eliminar-producto`). */
  readonly acknowledgeLabel?: string;
}
