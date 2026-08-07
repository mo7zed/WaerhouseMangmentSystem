import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ReportsService, ReportData } from './reports.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslateModule,
    TableModule, ButtonModule, TabViewModule,
    DropdownModule, CalendarModule, CardModule, TagModule,
  ],
  template: `
    <div class="reports-page animate-fade-in">
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem;">
        <div>
          <h1 class="page-title">{{ 'REPORTS.TITLE' | translate }}</h1>
          <p class="page-subtitle">Analytics and exportable reports</p>
        </div>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
          <p-calendar [(ngModel)]="dateRange" selectionMode="range" [readonlyInput]="true" [placeholder]="'REPORTS.DATE_RANGE' | translate" [style]="{ minWidth: '220px' }"></p-calendar>
          <button pButton icon="pi pi-file" [label]="'REPORTS.EXPORT_CSV' | translate" class="p-button-outlined p-button-sm" (click)="exportCsv()"></button>
          <button pButton icon="pi pi-file-excel" [label]="'REPORTS.EXPORT_EXCEL' | translate" class="p-button-outlined p-button-sm" (click)="exportExcel()"></button>
          <button pButton icon="pi pi-print" [label]="'REPORTS.PRINT' | translate" class="p-button-text p-button-sm" (click)="printReport()"></button>
        </div>
      </div>

      <p-tabView (onChange)="onTabChange($event)" styleClass="settings-tabs">
        <p-tabPanel [header]="'REPORTS.INVENTORY_REPORTS' | translate">
          <div style="margin-bottom:1rem;">
            <p-dropdown [options]="inventoryReportTypes" [(ngModel)]="inventoryType" (onChange)="loadInventoryReport()" optionLabel="label" optionValue="value" [style]="{ minWidth: '200px' }"></p-dropdown>
          </div>
          <ng-container *ngTemplateOutlet="reportTemplate; context: { report: currentReport() }"></ng-container>
        </p-tabPanel>
        <p-tabPanel [header]="'REPORTS.ORDER_REPORTS' | translate">
          <ng-container *ngTemplateOutlet="reportTemplate; context: { report: currentReport() }"></ng-container>
        </p-tabPanel>
        <p-tabPanel [header]="'REPORTS.PRODUCTIVITY_REPORTS' | translate">
          <ng-container *ngTemplateOutlet="reportTemplate; context: { report: currentReport() }"></ng-container>
        </p-tabPanel>
        <p-tabPanel [header]="'REPORTS.COMPLIANCE_REPORTS' | translate">
          <ng-container *ngTemplateOutlet="reportTemplate; context: { report: currentReport() }"></ng-container>
        </p-tabPanel>
      </p-tabView>

      <ng-template #reportTemplate let-report="report">
        <div *ngIf="reportLoading()" style="padding:2rem;text-align:center;color:var(--text-muted);">{{ 'COMMON.LOADING' | translate }}</div>
        <div *ngIf="!reportLoading() && report" id="report-content">
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem;margin-bottom:1.5rem;" *ngIf="report.summary">
            <div class="kpi-card primary" *ngFor="let key of summaryKeys(report.summary)">
              <div class="kpi-value" style="font-size:1.25rem;">{{ report.summary[key] }}</div>
              <div class="kpi-label">{{ formatKey(key) }}</div>
            </div>
          </div>
          <div class="section-card">
            <div class="section-card-header"><h3>{{ report.title }}</h3></div>
            <p-table [value]="report.rows" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr><th>Label</th><th>Value</th><th>Trend</th><th>Category</th></tr>
              </ng-template>
              <ng-template pTemplate="body" let-row>
                <tr>
                  <td><span style="font-weight:500;">{{ row.label }}</span></td>
                  <td>{{ row.value }}</td>
                  <td>
                    <p-tag *ngIf="row.trend !== undefined" [value]="(row.trend > 0 ? '+' : '') + row.trend + '%'"
                      [severity]="row.trend > 0 ? 'success' : row.trend < 0 ? 'danger' : 'info'"></p-tag>
                    <span *ngIf="row.trend === undefined">—</span>
                  </td>
                  <td><span style="font-size:0.82rem;color:var(--text-muted);">{{ row.category ?? '—' }}</span></td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </div>
      </ng-template>
    </div>
  `,
})
export class ReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private messageService = inject(MessageService);

  currentReport = signal<ReportData | null>(null);
  reportLoading = signal(true);
  activeTabIndex = 0;
  inventoryType = 'valuation';
  dateRange: Date[] | null = null;

  inventoryReportTypes = [
    { label: 'Stock Valuation', value: 'valuation' },
    { label: 'Inventory Aging', value: 'aging' },
    { label: 'ABC Analysis', value: 'abc' },
  ];

  ngOnInit(): void { this.loadInventoryReport(); }

  onTabChange(event: { index: number }): void {
    this.activeTabIndex = event.index;
    this.reportLoading.set(true);
    const loaders = [
      () => this.reportsService.getInventoryReport(this.inventoryType),
      () => this.reportsService.getOrderReport(),
      () => this.reportsService.getProductivityReport(),
      () => this.reportsService.getComplianceReport(),
    ];
    loaders[event.index]().subscribe(r => {
      this.currentReport.set(r);
      this.reportLoading.set(false);
    });
  }

  loadInventoryReport(): void {
    this.reportLoading.set(true);
    this.reportsService.getInventoryReport(this.inventoryType).subscribe(r => {
      this.currentReport.set(r);
      this.reportLoading.set(false);
    });
  }

  exportCsv(): void {
    const report = this.currentReport();
    if (!report) return;
    this.reportsService.exportCsv(report.rows, report.title.replace(/\s/g, '_').toLowerCase());
    this.messageService.add({ severity: 'success', summary: 'Exported', detail: 'CSV downloaded.' });
  }

  exportExcel(): void {
    const report = this.currentReport();
    if (!report) return;
    this.reportsService.exportExcel(report.rows, report.title.replace(/\s/g, '_').toLowerCase());
    this.messageService.add({ severity: 'success', summary: 'Exported', detail: 'Excel file downloaded.' });
  }

  printReport(): void { window.print(); }

  summaryKeys(summary: Record<string, number | string>): string[] {
    return Object.keys(summary);
  }

  formatKey(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
  }
}
