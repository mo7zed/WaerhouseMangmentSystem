import { Injectable, inject, signal, computed } from '@angular/core';
import { interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { KpiCard, ChartData, Alert, ActivityLog } from '../../core/models/shared.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  getKpis(): KpiCard[] {
    return [
      { id: 'stock_value', title: 'DASHBOARD.TOTAL_STOCK_VALUE', value: 'SAR 4.2M', subtitle: '+12.5% this month', icon: 'pi-dollar', trend: 12.5, trendLabel: 'vs last month', color: 'primary' },
      { id: 'open_orders', title: 'DASHBOARD.OPEN_ORDERS', value: 247, subtitle: '18 high priority', icon: 'pi-shopping-cart', trend: -5.2, trendLabel: 'vs last week', color: 'info' },
      { id: 'active_pickings', title: 'DASHBOARD.ACTIVE_PICKINGS', value: 34, subtitle: '8 operators active', icon: 'pi-map-marker', trend: 8.1, trendLabel: 'vs yesterday', color: 'success' },
      { id: 'pending_shipments', title: 'DASHBOARD.PENDING_SHIPMENTS', value: 62, subtitle: '12 due today', icon: 'pi-send', trend: 3.4, trendLabel: 'vs yesterday', color: 'warning' },
      { id: 'returns_today', title: 'DASHBOARD.RETURNS_TODAY', value: 11, subtitle: '3 need disposition', icon: 'pi-replay', trend: -2.1, trendLabel: 'vs yesterday', color: 'danger' },
      { id: 'low_stock', title: 'DASHBOARD.LOW_STOCK_ALERTS', value: 19, subtitle: '5 critical', icon: 'pi-exclamation-triangle', trend: 15.0, trendLabel: 'vs last week', color: 'danger' },
    ];
  }

  getInboundOutboundChart(range: '7d' | '30d' = '7d'): ChartData {
    const labels7 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const labels30 = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    return {
      labels: range === '7d' ? labels7 : labels30,
      datasets: [
        {
          label: 'Inbound',
          data: range === '7d' ? [120, 95, 145, 88, 167, 110, 134] : [520, 680, 590, 720],
          backgroundColor: 'rgba(0, 180, 216, 0.3)',
          borderColor: '#00B4D8',
        },
        {
          label: 'Outbound',
          data: range === '7d' ? [98, 112, 128, 95, 148, 102, 120] : [480, 610, 540, 695],
          backgroundColor: 'rgba(30, 58, 95, 0.5)',
          borderColor: '#2A4F7F',
        },
      ],
    };
  }

  getFulfillmentChart(): ChartData {
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Fulfillment Rate %',
        data: [96.2, 94.8, 97.5, 95.1, 98.2, 93.7, 96.9],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      }],
    };
  }

  getInventoryByCategory(): ChartData {
    return {
      labels: ['Electronics', 'FMCG', 'Apparel', 'Machinery', 'Food & Bev', 'Other'],
      datasets: [{
        data: [28, 22, 18, 14, 11, 7],
        backgroundColor: [
          '#00B4D8', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#6b7280'
        ],
      }],
    };
  }

  getAlerts(): Alert[] {
    return [
      { id: '1', type: 'warning', title: 'Low Stock Alert', message: 'SKU-0042 (Laptop Stand Pro) is below minimum threshold (5 units left)', timestamp: new Date(), read: false },
      { id: '2', type: 'error', title: 'Expiry Warning', message: '3 lots of SKU-0187 expire within 7 days — action required', timestamp: new Date(Date.now() - 1800000), read: false },
      { id: '3', type: 'info', title: 'TMS Sync Complete', message: 'All shipment records synced with Aramex TMS at 13:00', timestamp: new Date(Date.now() - 3600000), read: true },
      { id: '4', type: 'warning', title: 'Cycle Count Due', message: 'Zone B cycle count is 3 days overdue — assign to operator', timestamp: new Date(Date.now() - 7200000), read: false },
    ];
  }

  getRecentActivity(): ActivityLog[] {
    return [
      { id: '1', user: 'Mohammed Al-Otaibi', action: 'Received ASN #ASN-2024-0512', module: 'Receiving', timestamp: new Date(Date.now() - 600000) },
      { id: '2', user: 'Fatima Al-Zahrani', action: 'Completed Pick Task #PKT-8821', module: 'Orders', timestamp: new Date(Date.now() - 1800000) },
      { id: '3', user: 'Ahmed Al-Rashid', action: 'Created Shipment #SHP-4401', module: 'Shipping', timestamp: new Date(Date.now() - 3600000) },
      { id: '4', user: 'Sara Al-Ghamdi', action: 'Processed Return RMA-0233', module: 'Returns', timestamp: new Date(Date.now() - 5400000) },
      { id: '5', user: 'Khalid Al-Harbi', action: 'Stock transfer: Zone A → Zone C', module: 'Inventory', timestamp: new Date(Date.now() - 7200000) },
      { id: '6', user: 'System', action: 'Replenishment alert triggered for 5 SKUs', module: 'Inventory', timestamp: new Date(Date.now() - 10800000) },
    ];
  }
}
