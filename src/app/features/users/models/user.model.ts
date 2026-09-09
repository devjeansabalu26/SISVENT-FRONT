import { AppRole } from '../../../core/auth/constants/app-role.constant';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface UserListItem {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly document: string;
  readonly role: AppRole;
  readonly branch: string;
  readonly status: UserStatus;
}

export interface UserFormValue {
  readonly fullName: string;
  readonly email: string;
  readonly document: string;
  readonly role: AppRole;
  readonly branch: string;
  readonly status: UserStatus;
}
