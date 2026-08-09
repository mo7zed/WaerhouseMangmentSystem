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
  templateUrl: './replenishment.component.html',
  styleUrl: './replenishment.component.scss',
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
