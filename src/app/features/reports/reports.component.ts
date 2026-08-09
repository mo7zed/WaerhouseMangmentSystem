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
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
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
