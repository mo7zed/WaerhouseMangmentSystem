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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',})
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
