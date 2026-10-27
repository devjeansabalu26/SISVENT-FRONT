import { FormControl, ValidatorFn, Validators } from '@angular/forms';
import { DocumentTypeOption } from './regional.model';

export function documentOptions(types: readonly DocumentTypeOption[], current: string | null): readonly DocumentTypeOption[] {
  const active = types.filter((type) => type.isActive);
  if (!current || active.some((type) => type.code === current)) return active;
  const legacy = types.find((type) => type.code === current);
  return [...active, legacy ?? { code: current, name: current, placeholder: null, pattern: '^.{1,30}$', checkDigit: null, isBusiness: false, isDefault: false, sortOrder: 99, isActive: false }];
}

export function defaultDocumentType(types: readonly DocumentTypeOption[]): string {
  return types.find((type) => type.isDefault && type.isActive)?.code ?? types.find((type) => type.isActive)?.code ?? 'DNI';
}

export function documentNumberValidators(type: DocumentTypeOption | undefined): ValidatorFn[] {
  const validators: ValidatorFn[] = [Validators.required, Validators.maxLength(30)];
  if (type) {
    try {
      validators.push(Validators.pattern(new RegExp(type.pattern, 'i')));
    } catch {
      return validators;
    }
  }
  return validators;
}

export function applyDocumentType(control: FormControl<string>, type: DocumentTypeOption | undefined): void {
  control.setValidators(documentNumberValidators(type));
  control.updateValueAndValidity({ emitEvent: false });
}

export interface DocumentLengthRule {
  readonly min: number;
  readonly max: number;
  readonly digitsOnly: boolean;
}

export function documentLengthRule(type: DocumentTypeOption | undefined): DocumentLengthRule {
  const match = /^\^(\\d|\[[^\]]+\])\{(\d+)(?:,(\d+))?\}\$$/.exec(type?.pattern ?? '');
  if (!match) return { min: 1, max: 30, digitsOnly: false };
  const min = Number(match[2]);
  return { min, max: match[3] ? Number(match[3]) : min, digitsOnly: match[1] === String.raw`\d` };
}

export function documentLengthHint(type: DocumentTypeOption | undefined, value: string): string | null {
  const rule = documentLengthRule(type);
  const length = value.trim().length;
  if (!length) return null;
  const unit = rule.digitsOnly ? 'dígitos' : 'caracteres';
  const expected = rule.min === rule.max ? `${rule.max} ${unit}` : `entre ${rule.min} y ${rule.max} ${unit}`;
  if (length < rule.min) return `${length}/${rule.max}: faltan ${rule.min - length} ${unit} (debe tener ${expected}).`;
  if (length > rule.max) return `Tiene ${length} ${unit}; debe tener ${expected}.`;
  return null;
}
