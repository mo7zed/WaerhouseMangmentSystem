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
  templateUrl: './shipping.component.html',
  styleUrl: './shipping.component.scss',})
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
