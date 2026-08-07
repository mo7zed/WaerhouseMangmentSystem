import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly sidebarCollapsed = signal(false);

  setSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsed.set(collapsed);
    document.body.classList.toggle('sidebar-collapsed', collapsed);
  }

  toggleSidebar(): void {
    this.setSidebarCollapsed(!this.sidebarCollapsed());
  }
}
