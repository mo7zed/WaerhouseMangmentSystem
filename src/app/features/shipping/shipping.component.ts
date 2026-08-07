import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ShippingService } from './shipping.service';
import { Shipment } from '../../core/models/order.model';

@Component({
  selector: 'app-shipping',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslateModule,
    TableModule, ButtonModule, TagModule, TabViewModule,
    DialogModule, DropdownModule, InputTextModule, CardModule,
  ],
  template: `
    <div class="shipping-page animate-fade-in">
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem;">
        <div>
          <h1 class="page-title">{{ 'SHIPPING.TITLE' | translate }}</h1>
          <p class="page-subtitle">{{ shipments().length }} outbound shipments</p>
        </div>
        <button pButton icon="pi pi-plus" [label]="'SHIPPING.CREATE_SHIPMENT' | translate" class="p-button-sm" (click)="openCreateDialog()"></button>
      </div>

      <p-tabView styleClass="settings-tabs">
        <p-tabPanel header="Shipments">
          <p-table [value]="shipments()" [loading]="loading()" styleClass="p-datatable-sm" [paginator]="true" [rows]="10">
            <ng-template pTemplate="header">
              <tr>
                <th>{{ 'SHIPPING.SHIPMENT_NUMBER' | translate }}</th>
                <th>{{ 'ORDERS.ORDER_NUMBER' | translate }}</th>
                <th>{{ 'SHIPPING.CARRIER' | translate }}</th>
                <th>{{ 'SHIPPING.TRACKING' | translate }}</th>
                <th>{{ 'SHIPPING.STATUS' | translate }}</th>
                <th>{{ 'SHIPPING.TMS_SYNC' | translate }}</th>
                <th>{{ 'COMMON.ACTIONS' | translate }}</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-shipment>
              <tr>
                <td><code style="color:var(--brand-accent);font-weight:600;">{{ shipment.shipmentNumber }}</code></td>
                <td>{{ shipment.orderNumber }}</td>
                <td>{{ shipment.carrier }}</td>
                <td><span style="font-size:0.8rem;">{{ shipment.trackingNumber ?? '—' }}</span></td>
                <td><p-tag [value]="shipment.status | titlecase" [severity]="getShipmentSeverity(shipment.status)"></p-tag></td>
                <td><p-tag [value]="shipment.tmsSyncStatus | titlecase" [severity]="shipment.tmsSyncStatus === 'synced' ? 'success' : shipment.tmsSyncStatus === 'error' ? 'danger' : 'warning'"></p-tag></td>
                <td>
                  <div style="display:flex;gap:0.35rem;">
                    <button pButton icon="pi pi-send" [label]="'SHIPPING.DISPATCH' | translate" class="p-button-sm" *ngIf="shipment.status === 'pending'" (click)="dispatch(shipment)"></button>
                    <button pButton icon="pi pi-file" class="p-button-outlined p-button-sm" pTooltip="Label" (click)="previewLabel(shipment)"></button>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-tabPanel>

        <p-tabPanel [header]="'SHIPPING.TMS_SYNC' | translate">
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem;">
            <div class="kpi-card success">
              <div class="kpi-value">{{ tmsStatus()?.synced ?? 0 }}</div>
              <div class="kpi-label">Synced</div>
            </div>
            <div class="kpi-card warning">
              <div class="kpi-value">{{ tmsStatus()?.errors ?? 0 }}</div>
              <div class="kpi-label">Errors</div>
            </div>
            <div class="kpi-card info">
              <div class="kpi-value">{{ tmsStatus()?.status ?? '—' | uppercase }}</div>
              <div class="kpi-label">Status</div>
            </div>
          </div>
          <p-card>
            <p style="font-size:0.85rem;color:var(--text-secondary);">
              Last sync: {{ tmsStatus()?.lastSync | date:'MMM d, yyyy HH:mm' }}
            </p>
            <button pButton icon="pi pi-refresh" label="Sync Now" class="p-button-outlined p-button-sm" style="margin-top:1rem;" (click)="loadTmsStatus()"></button>
          </p-card>
        </p-tabPanel>
      </p-tabView>

      <!-- Create Shipment -->
      <p-dialog [(visible)]="showCreateDialog" [modal]="true" [style]="{width:'500px'}" [header]="'SHIPPING.CREATE_SHIPMENT' | translate">
        <div style="display:flex;flex-direction:column;gap:1rem;padding:0.5rem 0;">
          <div class="form-field"><label>Order Number</label><input pInputText [(ngModel)]="newShipment.orderNumber" placeholder="ORD-2024-08001" /></div>
          <div class="form-field"><label>{{ 'SHIPPING.CARRIER' | translate }}</label>
            <p-dropdown [options]="carrierOptions" [(ngModel)]="newShipment.carrier" optionLabel="label" optionValue="value" placeholder="Select carrier" styleClass="w-full"></p-dropdown>
          </div>
          <div class="form-field"><label>Weight (kg)</label><input pInputText type="number" [(ngModel)]="newShipment.weight" /></div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton [label]="'COMMON.CANCEL' | translate" class="p-button-text" (click)="showCreateDialog = false"></button>
          <button pButton [label]="'COMMON.SAVE' | translate" (click)="createShipment()"></button>
        </ng-template>
      </p-dialog>

      <!-- Label Preview -->
      <p-dialog [(visible)]="showLabelDialog" [modal]="true" [style]="{width:'450px'}" [header]="'SHIPPING.LABEL_PREVIEW' | translate">
        <div *ngIf="labelShipment" style="text-align:center;padding:1.5rem;background:var(--surface-overlay);border-radius:var(--radius-md);border:2px dashed var(--surface-border);">
          <i class="pi pi-file-pdf" style="font-size:3rem;color:var(--color-danger);margin-bottom:1rem;display:block;"></i>
          <p style="font-weight:600;margin-bottom:0.5rem;">{{ labelShipment.shipmentNumber }}</p>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1rem;">{{ labelShipment.carrier }} · {{ labelShipment.orderNumber }}</p>
          <p style="font-size:0.75rem;color:var(--text-secondary);">{{ labelShipment.labelUrl ?? 'Generating label...' }}</p>
          <button pButton icon="pi pi-download" label="Download Label" class="p-button-sm" style="margin-top:1rem;" *ngIf="labelShipment.labelUrl"></button>
        </div>
      </p-dialog>
    </div>
  `,
  styles: [`.form-field { display:flex;flex-direction:column;gap:0.4rem; } .form-field label { font-size:0.8rem;font-weight:600;color:var(--text-secondary); }`]
})
export class ShippingComponent implements OnInit {
  private shippingService = inject(ShippingService);
  private messageService = inject(MessageService);

  shipments = signal<Shipment[]>([]);
  tmsStatus = signal<any>(null);
  loading = signal(true);
  showCreateDialog = false;
  showLabelDialog = false;
  labelShipment: Shipment | null = null;

  newShipment = { orderNumber: '', carrier: 'Aramex', weight: 1 };

  carrierOptions = [
    { label: 'Aramex', value: 'Aramex' }, { label: 'DHL', value: 'DHL' },
    { label: 'SMSA Express', value: 'SMSA Express' }, { label: 'FedEx', value: 'FedEx' },
  ];

  ngOnInit(): void {
    this.loadShipments();
    this.loadTmsStatus();
  }

  loadShipments(): void {
    this.loading.set(true);
    this.shippingService.getShipments().subscribe(s => {
      this.shipments.set(s);
      this.loading.set(false);
    });
  }

  loadTmsStatus(): void {
    this.shippingService.getTMSSyncStatus().subscribe(s => this.tmsStatus.set(s));
  }

  openCreateDialog(): void {
    this.newShipment = { orderNumber: '', carrier: 'Aramex', weight: 1 };
    this.showCreateDialog = true;
  }

  createShipment(): void {
    this.shippingService.createShipment({
      shipmentNumber: `SHP-${Date.now().toString().slice(-6)}`,
      orderId: 'ord-new',
      orderNumber: this.newShipment.orderNumber,
      carrier: this.newShipment.carrier,
      weight: this.newShipment.weight,
    }).subscribe(() => {
      this.showCreateDialog = false;
      this.loadShipments();
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Shipment created.' });
    });
  }

  dispatch(shipment: Shipment): void {
    this.shippingService.dispatch(shipment.id).subscribe(() => {
      this.loadShipments();
      this.messageService.add({ severity: 'success', summary: 'Dispatched', detail: `${shipment.shipmentNumber} dispatched.` });
    });
  }

  previewLabel(shipment: Shipment): void {
    this.shippingService.generateLabel(shipment.id).subscribe(s => {
      this.labelShipment = s;
      this.showLabelDialog = true;
    });
  }

  getShipmentSeverity(s: string): 'success' | 'info' | 'warning' | 'danger' {
    const map: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
      pending: 'warning', dispatched: 'info', in_transit: 'info', delivered: 'success', failed: 'danger',
    };
    return map[s] ?? 'info';
  }
}
