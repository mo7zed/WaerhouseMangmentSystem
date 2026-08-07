import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface ReportRow {
  label: string;
  value: number | string;
  trend?: number;
  category?: string;
}

export interface ReportData {
  title: string;
  rows: ReportRow[];
  summary?: Record<string, number | string>;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  getInventoryReport(type: string): Observable<ReportData> {
    const reports: Record<string, ReportData> = {
      valuation: {
        title: 'Stock Valuation',
        summary: { totalValue: 'SAR 4.2M', items: 1247, warehouses: 3 },
        rows: [
          { label: 'Electronics', value: 'SAR 1.8M', trend: 12.5, category: 'Electronics' },
          { label: 'FMCG', value: 'SAR 920K', trend: 5.2, category: 'FMCG' },
          { label: 'Apparel', value: 'SAR 640K', trend: -2.1, category: 'Apparel' },
          { label: 'Machinery', value: 'SAR 520K', trend: 8.4, category: 'Machinery' },
          { label: 'Food & Bev', value: 'SAR 340K', trend: 3.1, category: 'Food & Bev' },
        ],
      },
      aging: {
        title: 'Inventory Aging',
        summary: { avgAge: '45 days', slowMovers: 89 },
        rows: [
          { label: '0-30 days', value: 620, category: 'Fresh' },
          { label: '31-60 days', value: 340, category: 'Normal' },
          { label: '61-90 days', value: 187, category: 'Aging' },
          { label: '90+ days', value: 100, category: 'Slow' },
        ],
      },
      abc: {
        title: 'ABC Analysis',
        summary: { aItems: 124, bItems: 389, cItems: 734 },
        rows: [
          { label: 'Class A (80% value)', value: 124, trend: 10 },
          { label: 'Class B (15% value)', value: 389, trend: 5 },
          { label: 'Class C (5% value)', value: 734, trend: 85 },
        ],
      },
    };
    return of(reports[type] ?? reports['valuation']).pipe(delay(400));
  }

  getOrderReport(from?: string, to?: string): Observable<ReportData> {
    return of({
      title: 'Order Fulfillment Report',
      summary: { fulfillmentRate: '96.4%', avgCycleTime: '4.2 hrs', slaCompliance: '94.1%' },
      rows: [
        { label: 'Orders Received', value: 1240, trend: 8.2 },
        { label: 'Orders Fulfilled', value: 1196, trend: 7.5 },
        { label: 'Pick Accuracy', value: '99.2%', trend: 0.3 },
        { label: 'On-Time Shipment', value: '94.1%', trend: -1.2 },
        { label: 'Returns Rate', value: '2.8%', trend: -0.5 },
      ],
    }).pipe(delay(400));
  }

  getProductivityReport(): Observable<ReportData> {
    return of({
      title: 'Operator Productivity',
      summary: { avgPicksPerHour: 42, avgAccuracy: '98.7%' },
      rows: [
        { label: 'Mohammed Al-Otaibi', value: '48 picks/hr', trend: 12 },
        { label: 'Fatima Al-Zahrani', value: '44 picks/hr', trend: 8 },
        { label: 'Ahmed Al-Rashid', value: '41 picks/hr', trend: 5 },
        { label: 'Sara Al-Ghamdi', value: '38 picks/hr', trend: -2 },
      ],
    }).pipe(delay(400));
  }

  getComplianceReport(): Observable<ReportData> {
    return of({
      title: 'ZATCA Compliance Audit',
      summary: { auditScore: '98.5%', openIssues: 2 },
      rows: [
        { label: 'Invoice Records', value: 'Compliant', category: 'ZATCA' },
        { label: 'Transaction Logs', value: 'Compliant', category: 'Audit' },
        { label: 'Data Retention', value: 'Compliant', category: 'Policy' },
        { label: 'Access Controls', value: 'Review Required', category: 'Security' },
      ],
    }).pipe(delay(400));
  }

  exportCsv(rows: ReportRow[], filename: string): void {
    const headers = ['Label', 'Value', 'Trend', 'Category'];
    const data = rows.map(r => [r.label, r.value, r.trend ?? '', r.category ?? '']);
    const csv = [headers, ...data].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportExcel(rows: ReportRow[], filename: string): void {
    const tsv = rows.map(r => `${r.label}\t${r.value}\t${r.trend ?? ''}\t${r.category ?? ''}`).join('\n');
    const blob = new Blob(['Label\tValue\tTrend\tCategory\n' + tsv], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
