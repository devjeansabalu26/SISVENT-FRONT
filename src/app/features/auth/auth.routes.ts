import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../layouts/auth-layout/auth-layout').then((component) => component.AuthLayout),
    children: [{ path:'', loadComponent:()=>import('./pages/login-page/login-page').then((component)=>component.LoginPage) }],
  },
];
