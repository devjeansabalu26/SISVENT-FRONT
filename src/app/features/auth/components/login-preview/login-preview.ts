import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-login-preview',
  templateUrl: './login-preview.html',
  styleUrl: './login-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPreview {}
