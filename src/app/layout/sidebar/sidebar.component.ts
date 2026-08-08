import { Component, signal, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PanelMenuModule } from 'primeng/panelmenu';
import { TooltipModule } from 'primeng/tooltip';
import { LayoutService } from '../../core/services/layout.service';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: string | number;
  children?: { id: string; label: string; route: string; icon: string }[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule, PanelMenuModule, TooltipModule],
  template: `
    <aside class="wms-sidebar" [class.collapsed]="isCollapsed()" [class.mobile-open]="mobileMenuOpen()">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon">
          <i class="pi pi-box"></i>
        </div>
        <div class="logo-text" *ngIf="!isCollapsed()">
          <span class="logo-title">TACHYON</span>
          <span class="logo-sub">WMS</span>
        </div>
      </div>

      <!-- Toggle Button -->
      <button class="sidebar-toggle" (click)="toggleSidebar()" id="sidebar-toggle-btn">
        <i class="pi" [class.pi-chevron-left]="!isCollapsed()" [class.pi-chevron-right]="isCollapsed()"></i>
      </button>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <div class="nav-section" *ngIf="!isCollapsed()">
          <span class="nav-section-label">{{ 'APP.MAIN_MENU' | translate }}</span>
        </div>

        <ul class="nav-list">
          <li *ngFor="let item of navItems">
            <a
              class="nav-item"
              [routerLink]="item.route"
              routerLinkActive="active"
              [pTooltip]="isCollapsed() ? item.label : ''"
              tooltipPosition="right"
              [id]="'nav-' + item.id"
            >
              <i class="nav-icon pi" [class]="item.icon"></i>
              <span class="nav-label" *ngIf="!isCollapsed()">{{ item.label | translate }}</span>
              <span class="nav-badge" *ngIf="item.badge && !isCollapsed()">{{ item.badge }}</span>
            </a>

            <!-- Sub items -->
            <ul class="nav-sub-list" *ngIf="item.children && !isCollapsed()" [class.expanded]="isItemExpanded(item.id)">
              <li *ngFor="let child of item.children">
                <a
                  class="nav-sub-item"
                  [routerLink]="child.route"
                  routerLinkActive="active"
                  [id]="'nav-' + child.id"
                >
                  <i class="pi pi-minus nav-sub-icon"></i>
                  <span>{{ child.label | translate }}</span>
                </a>
              </li>
            </ul>
          </li>
        </ul>

        <!-- Bottom Nav -->
        <div class="sidebar-footer">
          <a
            class="nav-item"
            routerLink="/settings"
            routerLinkActive="active"
            [pTooltip]="isCollapsed() ? 'Settings' : ''"
            tooltipPosition="right"
            id="nav-settings"
          >
            <i class="nav-icon pi pi-cog"></i>
            <span class="nav-label" *ngIf="!isCollapsed()">{{ 'NAV.SETTINGS' | translate }}</span>
          </a>
          <a
            class="nav-item"
            routerLink="/admin"
            routerLinkActive="active"
            [pTooltip]="isCollapsed() ? 'Admin' : ''"
            tooltipPosition="right"
            id="nav-admin"
          >
            <i class="nav-icon pi pi-shield"></i>
            <span class="nav-label" *ngIf="!isCollapsed()">{{ 'NAV.ADMIN' | translate }}</span>
          </a>
        </div>
      </nav>
    </aside>
  `,
})
export class SidebarComponent implements OnInit {
  private layout = inject(LayoutService);

  isCollapsed = this.layout.sidebarCollapsed;
  mobileMenuOpen = this.layout.mobileMenuOpen;
  private expandedItems = signal<Set<string>>(new Set());

  navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'NAV.DASHBOARD',
      icon: 'pi-th-large',
      route: '/dashboard',
    },
    {
      id: 'inventory',
      label: 'NAV.INVENTORY',
      icon: 'pi-box',
      route: '/inventory',
      children: [
        { id: 'stock', label: 'NAV.STOCK_OVERVIEW', route: '/inventory/stock', icon: '' },
        { id: 'items', label: 'NAV.ITEM_MASTER', route: '/inventory/items', icon: '' },
        { id: 'bins', label: 'NAV.BIN_MANAGEMENT', route: '/inventory/bins', icon: '' },
        { id: 'cycle', label: 'NAV.CYCLE_COUNTING', route: '/inventory/cycle-counts', icon: '' },
        { id: 'repl', label: 'NAV.REPLENISHMENT', route: '/inventory/replenishment', icon: '' },
      ]
    },
    {
      id: 'receiving',
      label: 'NAV.RECEIVING',
      icon: 'pi-download',
      route: '/receiving',
    },
    {
      id: 'orders',
      label: 'NAV.ORDERS',
      icon: 'pi-shopping-cart',
      route: '/orders',
    },
    {
      id: 'shipping',
      label: 'NAV.SHIPPING',
      icon: 'pi-send',
      route: '/shipping',
    },
    {
      id: 'returns',
      label: 'NAV.RETURNS',
      icon: 'pi-replay',
      route: '/returns',
    },
    {
      id: 'reports',
      label: 'NAV.REPORTS',
      icon: 'pi-chart-bar',
      route: '/reports',
    },
    {
      id: 'labor',
      label: 'NAV.LABOR',
      icon: 'pi-users',
      route: '/labor',
    },
  ];

  ngOnInit(): void {
    // Auto-expand active module
    this.expandedItems.update(s => {
      const set = new Set(s);
      set.add('inventory');
      return set;
    });
  }

  toggleSidebar(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      this.layout.closeMobileMenu();
      return;
    }
    this.layout.toggleSidebar();
  }

  isItemExpanded(id: string): boolean {
    return this.expandedItems().has(id);
  }

  toggleItem(id: string): void {
    this.expandedItems.update(s => {
      const set = new Set(s);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return set;
    });
  }
}
