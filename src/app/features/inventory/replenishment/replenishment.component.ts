import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { InventoryService } from '../inventory.service';
import { ReplenishmentAlert } from '../../../core/models/inventory.model';

@Component({
  selector: 'app-replenishment',
  standalone: true,
  imports: [CommonModule, TranslateModule, TableModule, ButtonModule, TagModule, ProgressBarModule, SkeletonModule, TooltipModule],
  template: `
    <div class="replenishment-page animate-fade-in">
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem;">
        <div>
          <h1 class="page-title">Replenishment Alerts</h1>
          <p class="page-subtitle">Items below minimum threshold requiring immediate action</p>
        </div>
        <div style="display:flex;gap:0.75rem;">
          <button pButton icon="pi pi-bell" label="Configure Alerts" class="p-button-outlined p-button-sm" id="configure-alerts-btn"></button>
          <button pButton icon="pi pi-refresh" class="p-button-text p-button-sm" (click)="load()" id="refresh-replenishment-btn"></button>
        </div>
      </div>

      <div class="section-card">
        <p-table
          [value]="alerts()"
          [loading]="loading()"
          [sortField]="'priority'"
          [sortOrder]="-1"
          styleClass="p-datatable-sm"
          id="replenishment-table"
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="priority">Priority <p-sortIcon field="priority"></p-sortIcon></th>
              <th>SKU</th>
              <th>Item</th>
              <th>Warehouse</th>
              <th pSortableColumn="currentQty" style="text-align:right;">Current Qty <p-sortIcon field="currentQty"></p-sortIcon></th>
              <th style="text-align:right;">Min Threshold</th>
              <th style="text-align:right;">Suggested Order</th>
              <th style="min-width:160px;">Stock Level</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="loadingbody">
            <tr *ngFor="let i of [1,2,3,4,5]">
              <td *ngFor="let j of [1,2,3,4,5,6,7,8,9]"><p-skeleton></p-skeleton></td>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-alert>
            <tr>
              <td>
                <p-tag
                  [value]="alert.priority | titlecase"
                  [severity]="alert.priority === 'high' ? 'danger' : alert.priority === 'medium' ? 'warning' : 'info'"
                ></p-tag>
              </td>
              <td><code class="sku-code" style="color:var(--brand-accent);background:var(--surface-overlay);padding:0.15rem 0.4rem;border-radius:4px;font-size:0.78rem;">{{ alert.sku }}</code></td>
              <td><span style="font-weight:500;font-size:0.85rem;">{{ alert.itemName }}</span></td>
              <td><span style="font-size:0.82rem;color:var(--text-secondary);">{{ alert.warehouseName }}</span></td>
              <td style="text-align:right;">
                <span style="font-weight:700;" [style.color]="alert.currentQty === 0 ? 'var(--color-danger)' : 'var(--color-warning)'">
                  {{ alert.currentQty }}
                </span>
              </td>
              <td style="text-align:right;color:var(--text-secondary);">{{ alert.minThreshold }}</td>
              <td style="text-align:right;color:var(--brand-accent);font-weight:600;">{{ alert.suggestedQty }}</td>
              <td>
                <div style="display:flex;align-items:center;gap:0.5rem;">
                  <p-progressBar
                    [value]="getStockLevel(alert)"
                    [style]="{'height':'6px','flex':'1'}"
                    [showValue]="false"
                    [styleClass]="alert.currentQty === 0 ? 'util-high' : 'util-mid'"
                  ></p-progressBar>
                  <span style="font-size:0.72rem;color:var(--text-muted);min-width:35px;">{{ getStockLevel(alert) }}%</span>
                </div>
              </td>
              <td>
                <div style="display:flex;gap:0.35rem;">
                  <button pButton icon="pi pi-shopping-cart" class="p-button-sm" label="Order" pTooltip="Create PO" tooltipPosition="top" [id]="'order-' + alert.id" (click)="createOrder(alert)"></button>
                  <button pButton icon="pi pi-arrow-right-arrow-left" class="p-button-outlined p-button-sm" pTooltip="Transfer" tooltipPosition="top" [id]="'transfer-repl-' + alert.id" (click)="createTransfer(alert)"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="9" style="text-align:center;padding:3rem;color:var(--text-muted);">
                <i class="pi pi-check-circle" style="font-size:2rem;display:block;margin-bottom:0.5rem;color:var(--color-success);"></i>
                All items are above minimum threshold — no replenishment needed!
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
})
export class ReplenishmentComponent implements OnInit {
  private invService = inject(InventoryService);
  private messageService = inject(MessageService);
  alerts = signal<ReplenishmentAlert[]>([]);
  loading = signal(true);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.invService.getReplenishmentAlerts().subscribe(a => {
      this.alerts.set(a);
      this.loading.set(false);
    });
  }

  getStockLevel(alert: ReplenishmentAlert): number {
    return Math.min(100, Math.round((alert.currentQty / alert.minThreshold) * 100));
  }

  createOrder(alert: ReplenishmentAlert): void {
    this.messageService.add({ severity: 'success', summary: 'PO Created', detail: `Purchase order for ${alert.suggestedQty} units of ${alert.sku}.` });
  }

  createTransfer(alert: ReplenishmentAlert): void {
    this.messageService.add({ severity: 'info', summary: 'Transfer', detail: `Stock transfer initiated for ${alert.sku}.` });
  }
}
