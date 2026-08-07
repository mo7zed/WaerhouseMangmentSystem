import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { MessagesModule } from 'primeng/messages';
import { BadgeModule } from 'primeng/badge';
import { Subscription, interval } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { KpiCard, Alert, ActivityLog } from '../../core/models/shared.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, TranslateModule,
    CardModule, ChartModule, TableModule, TagModule,
    ButtonModule, SelectButtonModule, SkeletonModule,
    MessagesModule, BadgeModule
  ],
  template: `
    <div class="dashboard-page animate-fade-in">

      <!-- Page Header -->
      <div class="page-header" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 class="page-title">{{ 'DASHBOARD.TITLE' | translate }}</h1>
          <p class="page-subtitle">{{ 'DASHBOARD.SUBTITLE' | translate }}</p>
        </div>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span class="live-badge">
            <span class="live-dot"></span>
            Live
          </span>
          <button pButton icon="pi pi-refresh" class="p-button-outlined p-button-sm" (click)="refresh()" id="refresh-dashboard-btn" label="Refresh"></button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid stagger-children">
        <ng-container *ngIf="loading()">
          <div *ngFor="let i of [1,2,3,4,5,6]" class="kpi-card primary">
            <p-skeleton width="40px" height="40px" borderRadius="10px"></p-skeleton>
            <p-skeleton width="60%" height="1.75rem"></p-skeleton>
            <p-skeleton width="80%" height="0.75rem"></p-skeleton>
          </div>
        </ng-container>

        <ng-container *ngIf="!loading()">
          <div
            *ngFor="let kpi of kpis(); let i = index"
            class="kpi-card animate-fade-in-up"
            [class]="kpi.color"
            [style.animation-delay]="(i * 60) + 'ms'"
          >
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <div class="kpi-icon">
                <i class="pi" [class]="kpi.icon"></i>
              </div>
              <div class="kpi-trend" [class.up]="(kpi.trend ?? 0) > 0" [class.down]="(kpi.trend ?? 0) < 0">
                <i class="pi" [class.pi-arrow-up]="(kpi.trend ?? 0) > 0" [class.pi-arrow-down]="(kpi.trend ?? 0) < 0"></i>
                {{ kpi.trend !== undefined ? (kpi.trend | number:'1.1-1') + '%' : '' }}
              </div>
            </div>
            <div class="kpi-value">{{ kpi.value }}</div>
            <div class="kpi-label">{{ kpi.title | translate }}</div>
            <div class="kpi-sub" *ngIf="kpi.subtitle">{{ kpi.subtitle }}</div>
          </div>
        </ng-container>
      </div>

      <!-- Quick Actions -->
      <div class="section-card" style="margin-bottom:1.5rem;">
        <div class="section-card-header">
          <h3>{{ 'DASHBOARD.QUICK_ACTIONS' | translate }}</h3>
        </div>
        <div class="section-card-body" style="padding: 1rem 1.5rem;">
          <div class="quick-actions">
            <a routerLink="/receiving" class="quick-action-tile" id="qa-receiving">
              <i class="pi pi-download tile-icon"></i>
              <span class="tile-label">{{ 'DASHBOARD.START_RECEIVING' | translate }}</span>
            </a>
            <a routerLink="/orders" class="quick-action-tile" id="qa-orders">
              <i class="pi pi-shopping-cart tile-icon"></i>
              <span class="tile-label">{{ 'DASHBOARD.CREATE_ORDER' | translate }}</span>
            </a>
            <a routerLink="/returns" class="quick-action-tile" id="qa-returns">
              <i class="pi pi-replay tile-icon"></i>
              <span class="tile-label">{{ 'DASHBOARD.INITIATE_RETURN' | translate }}</span>
            </a>
            <a routerLink="/inventory/cycle-counts" class="quick-action-tile" id="qa-cycle">
              <i class="pi pi-sync tile-icon"></i>
              <span class="tile-label">{{ 'DASHBOARD.CYCLE_COUNT' | translate }}</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid" style="gap:1rem; display:grid; grid-template-columns: 2fr 1fr; margin-bottom:1.5rem;">

        <!-- Inbound vs Outbound -->
        <div class="chart-card">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem;">
            <h3 class="chart-title" style="margin:0;">{{ 'DASHBOARD.INBOUND_OUTBOUND' | translate }}</h3>
            <div style="display:flex; gap:0.4rem;">
              <button
                class="range-btn"
                [class.active]="chartRange() === '7d'"
                (click)="setRange('7d')"
                id="chart-7d-btn"
              >7D</button>
              <button
                class="range-btn"
                [class.active]="chartRange() === '30d'"
                (click)="setRange('30d')"
                id="chart-30d-btn"
              >30D</button>
            </div>
          </div>
          <p-chart
            type="bar"
            [data]="barChartData()"
            [options]="barChartOptions"
            height="240"
          ></p-chart>
        </div>

        <!-- Inventory by Category (Doughnut) -->
        <div class="chart-card">
          <h3 class="chart-title">{{ 'DASHBOARD.INVENTORY_BY_CATEGORY' | translate }}</h3>
          <p-chart
            type="doughnut"
            [data]="doughnutData()"
            [options]="doughnutOptions"
            height="240"
          ></p-chart>
        </div>
      </div>

      <!-- Fulfillment Rate Chart -->
      <div class="chart-card" style="margin-bottom:1.5rem;">
        <h3 class="chart-title">{{ 'DASHBOARD.FULFILLMENT_RATE' | translate }}</h3>
        <p-chart
          type="line"
          [data]="lineChartData()"
          [options]="lineChartOptions"
          height="200"
        ></p-chart>
      </div>

      <!-- Bottom Row -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">

        <!-- Alerts -->
        <div class="section-card">
          <div class="section-card-header">
            <h3>{{ 'DASHBOARD.ALERTS' | translate }}</h3>
            <span class="status-badge danger">{{ unreadAlertCount() }} unread</span>
          </div>
          <div class="alert-list">
            <div
              *ngFor="let alert of alerts()"
              class="alert-item"
              [class.unread]="!alert.read"
            >
              <div class="alert-icon" [class]="alert.type">
                <i class="pi"
                  [class.pi-exclamation-triangle]="alert.type === 'warning'"
                  [class.pi-times-circle]="alert.type === 'error'"
                  [class.pi-info-circle]="alert.type === 'info'"
                  [class.pi-check-circle]="alert.type === 'success'"
                ></i>
              </div>
              <div class="alert-content">
                <p class="alert-title">{{ alert.title }}</p>
                <p class="alert-msg">{{ alert.message }}</p>
                <span class="alert-time">{{ alert.timestamp | date:'MMM d, HH:mm' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="section-card">
          <div class="section-card-header">
            <h3>{{ 'DASHBOARD.RECENT_ACTIVITY' | translate }}</h3>
          </div>
          <div class="activity-list">
            <div *ngFor="let log of activity()" class="activity-item">
              <div class="activity-avatar">
                {{ getUserInitials(log.user) }}
              </div>
              <div class="activity-content">
                <p class="activity-action">{{ log.action }}</p>
                <div class="activity-meta">
                  <span class="activity-user">{{ log.user }}</span>
                  <span class="activity-sep">·</span>
                  <span class="status-badge info" style="padding:0.1rem 0.4rem; font-size:0.65rem;">{{ log.module }}</span>
                  <span class="activity-sep">·</span>
                  <span class="activity-time">{{ log.timestamp | date:'HH:mm' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .live-badge {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: rgba(16,185,129,0.1); color: var(--color-success);
      border: 1px solid rgba(16,185,129,0.2);
      padding: 0.3rem 0.7rem; border-radius: 20px;
      font-size: 0.75rem; font-weight: 600;
    }
    .live-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--color-success);
      animation: pulse 1.5s ease-in-out infinite;
    }
    .kpi-sub { font-size: 0.72rem; color: var(--text-muted); }

    .range-btn {
      padding: 0.25rem 0.6rem; border: 1px solid var(--surface-border);
      border-radius: var(--radius-sm); background: transparent;
      color: var(--text-muted); font-size: 0.75rem; font-weight: 600; cursor: pointer;
      transition: all var(--transition-fast);
    }
    .range-btn.active, .range-btn:hover {
      background: var(--brand-accent); border-color: var(--brand-accent); color: #fff;
    }

    .alert-list, .activity-list { padding: 0.5rem 0; }

    .alert-item {
      display: flex; gap: 0.75rem; padding: 0.75rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);
      transition: background var(--transition-fast);
    }
    .alert-item:last-child { border-bottom: none; }
    .alert-item.unread { background: rgba(0,180,216,0.03); }
    .alert-item:hover { background: var(--surface-hover); }

    .alert-icon {
      width: 32px; height: 32px; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.875rem; flex-shrink: 0;
    }
    .alert-icon.warning { background: var(--color-warning-bg); color: var(--color-warning); }
    .alert-icon.error   { background: var(--color-danger-bg);  color: var(--color-danger); }
    .alert-icon.info    { background: var(--color-info-bg);    color: var(--color-info); }
    .alert-icon.success { background: var(--color-success-bg); color: var(--color-success); }

    .alert-content { flex: 1; }
    .alert-title { font-size: 0.8rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.2rem; }
    .alert-msg   { font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; line-height: 1.4; }
    .alert-time  { font-size: 0.7rem; color: var(--text-muted); }

    .activity-item {
      display: flex; gap: 0.75rem; padding: 0.7rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);
      transition: background var(--transition-fast);
    }
    .activity-item:last-child { border-bottom: none; }
    .activity-item:hover { background: var(--surface-hover); }

    .activity-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, var(--brand-primary-light), var(--brand-accent));
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 0.65rem; font-weight: 700; flex-shrink: 0;
    }
    .activity-content { flex: 1; }
    .activity-action { font-size: 0.8rem; color: var(--text-primary); margin-bottom: 0.2rem; }
    .activity-meta { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
    .activity-user { font-size: 0.72rem; color: var(--text-secondary); font-weight: 500; }
    .activity-sep  { color: var(--text-muted); font-size: 0.7rem; }
    .activity-time { font-size: 0.7rem; color: var(--text-muted); }

    @media (max-width: 1024px) {
      .grid { grid-template-columns: 1fr !important; }
      div[style*="grid-template-columns:1fr 1fr"] { grid-template-columns: 1fr !important; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private dashService = inject(DashboardService);

  loading = signal(true);
  kpis = signal<KpiCard[]>([]);
  alerts = signal<Alert[]>([]);
  activity = signal<ActivityLog[]>([]);
  chartRange = signal<'7d' | '30d'>('7d');
  barChartData = signal<any>({});
  lineChartData = signal<any>({});
  doughnutData = signal<any>({});

  private refreshSub?: Subscription;

  barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#64748b', font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: '#64748b' }, grid: { color: '#e2e8f0' } },
      y: { ticks: { color: '#64748b' }, grid: { color: '#e2e8f0' } },
    },
  };

  lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#64748b', font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: '#64748b' }, grid: { color: '#e2e8f0' } },
      y: { ticks: { color: '#64748b' }, grid: { color: '#e2e8f0' }, min: 90, max: 100 },
    },
  };

  doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#64748b', font: { size: 10 }, padding: 12, boxWidth: 10 } }
    },
    cutout: '65%',
  };

  ngOnInit(): void {
    this.loadData();
    // Auto-refresh every 30 seconds
    this.refreshSub = interval(30000).subscribe(() => this.loadData());
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  loadData(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.kpis.set(this.dashService.getKpis());
      this.alerts.set(this.dashService.getAlerts());
      this.activity.set(this.dashService.getRecentActivity());
      this.updateCharts();
      this.loading.set(false);
    }, 600);
  }

  refresh(): void {
    this.loadData();
  }

  setRange(range: '7d' | '30d'): void {
    this.chartRange.set(range);
    this.barChartData.set(this.dashService.getInboundOutboundChart(range));
  }

  unreadAlertCount(): number {
    return this.alerts().filter(a => !a.read).length;
  }

  getUserInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  }

  private updateCharts(): void {
    this.barChartData.set(this.dashService.getInboundOutboundChart(this.chartRange()));
    this.lineChartData.set(this.dashService.getFulfillmentChart());
    this.doughnutData.set(this.dashService.getInventoryByCategory());
  }
}
