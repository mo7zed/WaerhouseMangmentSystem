import { Routes } from '@angular/router';
import { SettingsComponent } from './settings.component';

export const settingsRoutes: Routes = [
  {
    path: '',
    component: SettingsComponent,
    title: 'Settings — Tachyon WMS',
  },
];
