import { Routes } from '@angular/router';

export const receivingRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./receiving.component').then(m => m.ReceivingComponent),
    title: 'Receiving & Putaway — Tachyon WMS'
  }
];
