import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { OrdersService } from './orders.service';
import { Order, PickTask, Wave } from '../../core/models/order.model';
import { PageShellComponent, PageHeaderComponent } from '../../shared/ui';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslateModule,
    TableModule, ButtonModule, TagModule, TabViewModule,
    DropdownModule, InputTextModule, DialogModule,
    ProgressBarModule, TooltipModule,
    PageShellComponent, PageHeaderComponent,
  ],
  template: `
    <app-page-shell>
      <app-page-header [title]="'ORDERS.TITLE' | translate" [subtitle]="totalOrders() + ' orders in system'">
        <div actions>
          <button pButton icon="pi pi-plus" [label]="'ORDERS.CREATE_WAVE' | translate" class="p-button-sm" (click)="showWaveDialog = true"></button>
        </div>
      </app-page-header>

      <p-tabView styleClass="settings-tabs">
        <!-- Orders List -->
        <p-tabPanel [header]="'ORDERS.ORDERS_LIST' | translate">
          <div class="filters-bar" style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:1rem;padding:1rem;background:var(--surface-card);border-radius:var(--radius-md);border:1px solid var(--surface-border);">
            <span class="p-input-icon-left" style="flex:1;min-width:200px;">
              <i class="pi pi-search"></i>
              <input pInputText [(ngModel)]="searchQuery" (input)="loadOrders()" [placeholder]="'COMMON.SEARCH' | translate" style="width:100%;" />
            </span>
            <p-dropdown [options]="statusOptions" [(ngModel)]="statusFilter" (onChange)="loadOrders()" [showClear]="true" placeholder="Status" optionLabel="label" optionValue="value" [style]="{ minWidth: '150px' }"></p-dropdown>
            <p-dropdown [options]="channelOptions" [(ngModel)]="channelFilter" (onChange)="loadOrders()" [showClear]="true" placeholder="Channel" optionLabel="label" optionValue="value" [style]="{ minWidth: '150px' }"></p-dropdown>
            <p-dropdown [options]="priorityOptions" [(ngModel)]="priorityFilter" (onChange)="loadOrders()" [showClear]="true" placeholder="Priority" optionLabel="label" optionValue="value" [style]="{ minWidth: '130px' }"></p-dropdown>
          </div>
          <p-table [value]="orders()" [loading]="loading()" styleClass="p-datatable-sm" [paginator]="true" [rows]="15">
            <ng-template pTemplate="header">
              <tr>
                <th>{{ 'ORDERS.ORDER_NUMBER' | translate }}</th>
                <th>{{ 'ORDERS.CUSTOMER' | translate }}</th>
                <th>{{ 'ORDERS.CHANNEL' | translate }}</th>
                <th>{{ 'ORDERS.PRIORITY' | translate }}</th>
                <th>{{ 'ORDERS.STATUS' | translate }}</th>
                <th>{{ 'ORDERS.CREATED' | translate }}</th>
                <th>{{ 'ORDERS.REQUIRED_DATE' | translate }}</th>
                <th>{{ 'COMMON.ACTIONS' | translate }}</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-order>
              <tr>
                <td><code style="color:var(--brand-accent);font-size:0.82rem;">{{ order.orderNumber }}</code></td>
                <td><span style="font-weight:500;">{{ order.customerName }}</span></td>
                <td><p-tag [value]="order.channel | uppercase" severity="info"></p-tag></td>
                <td><p-tag [value]="order.priority | titlecase" [severity]="getPrioritySeverity(order.priority)"></p-tag></td>
                <td><p-tag [value]="formatStatus(order.status)" [severity]="getStatusSeverity(order.status)"></p-tag></td>
                <td><span style="font-size:0.8rem;color:var(--text-muted);">{{ order.createdAt | date:'MMM d, HH:mm' }}</span></td>
                <td><span style="font-size:0.8rem;">{{ order.requiredDate | date:'MMM d, yyyy' }}</span></td>
                <td>
                  <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" (click)="viewOrder(order)" pTooltip="View"></button>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-tabPanel>

        <!-- Pick Tasks -->
        <p-tabPanel [header]="'ORDERS.PICK_TASKS' | translate">
          <p-table [value]="pickTasks()" [loading]="pickLoading()" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Task ID</th>
                <th>{{ 'ORDERS.ORDER_NUMBER' | translate }}</th>
                <th>Picker</th>
                <th>{{ 'ORDERS.PRIORITY' | translate }}</th>
                <th>Progress</th>
                <th>{{ 'ORDERS.STATUS' | translate }}</th>
                <th>Bins</th>
                <th>{{ 'COMMON.ACTIONS' | translate }}</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-task>
              <tr>
                <td><code style="font-size:0.78rem;">{{ task.id }}</code></td>
                <td><span style="font-weight:500;">{{ task.orderNumber }}</span></td>
                <td>{{ task.assignedToName }}</td>
                <td><p-tag [value]="task.priority | titlecase" [severity]="getPrioritySeverity(task.priority)"></p-tag></td>
                <td style="min-width:160px;">
                  <div style="display:flex;align-items:center;gap:0.5rem;">
                    <p-progressBar [value]="pickProgress(task)" [style]="{'height':'6px','flex':'1'}" [showValue]="false"></p-progressBar>
                    <span style="font-size:0.75rem;">{{ task.itemsPicked }}/{{ task.itemsTotal }}</span>
                  </div>
                </td>
                <td><p-tag [value]="task.status | titlecase" [severity]="task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'info' : 'warning'"></p-tag></td>
                <td><span style="font-size:0.75rem;color:var(--text-muted);">{{ task.bins.join(', ') }}</span></td>
                <td>
                  <button pButton icon="pi pi-check" label="Complete" class="p-button-sm" *ngIf="task.status !== 'completed'" (click)="completePick(task)"></button>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-tabPanel>

        <!-- Waves -->
        <p-tabPanel [header]="'ORDERS.WAVES' | translate">
          <p-table [value]="waves()" [loading]="waveLoading()" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Wave #</th>
                <th>{{ 'ORDERS.STATUS' | translate }}</th>
                <th>Orders</th>
                <th>Operators</th>
                <th>Created</th>
                <th>{{ 'COMMON.ACTIONS' | translate }}</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-wave>
              <tr>
                <td><code style="color:var(--brand-accent);font-weight:600;">{{ wave.waveNumber }}</code></td>
                <td><p-tag [value]="wave.status | titlecase" [severity]="wave.status === 'completed' ? 'success' : wave.status === 'released' ? 'info' : 'warning'"></p-tag></td>
                <td>{{ wave.orderCount }}</td>
                <td>{{ wave.assignedOperators.length }} assigned</td>
                <td><span style="font-size:0.8rem;color:var(--text-muted);">{{ wave.createdAt | date:'MMM d, HH:mm' }}</span></td>
                <td>
                  <button pButton icon="pi pi-play" label="Release" class="p-button-sm p-button-outlined" *ngIf="wave.status === 'draft'" (click)="releaseWave(wave)"></button>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-tabPanel>
      </p-tabView>

      <!-- Order Detail Dialog -->
      <p-dialog [(visible)]="showOrderDetail" [modal]="true" [style]="{width:'600px',maxWidth:'95vw'}" [header]="selectedOrder?.orderNumber ?? ''">
        <div *ngIf="selectedOrder" style="display:flex;flex-direction:column;gap:0.75rem;">
          <div class="confirm-row"><span>Customer</span><strong>{{ selectedOrder.customerName }}</strong></div>
          <div class="confirm-row"><span>Status</span><p-tag [value]="formatStatus(selectedOrder.status)" [severity]="getStatusSeverity(selectedOrder.status)"></p-tag></div>
          <div class="confirm-row"><span>Channel</span><strong>{{ selectedOrder.channel | uppercase }}</strong></div>
          <div class="confirm-row"><span>Total Items</span><strong>{{ selectedOrder.totalItems }}</strong></div>
          <h4 style="margin-top:0.5rem;">Order Lines</h4>
          <p-table [value]="selectedOrder.lines" styleClass="p-datatable-sm">
            <ng-template pTemplate="header"><tr><th>SKU</th><th>Item</th><th>Qty</th><th>Status</th></tr></ng-template>
            <ng-template pTemplate="body" let-line>
              <tr>
                <td>{{ line.sku }}</td>
                <td>{{ line.itemName }}</td>
                <td>{{ line.quantity }} {{ line.uom }}</td>
                <td><p-tag [value]="line.status | titlecase" severity="info"></p-tag></td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </p-dialog>

      <!-- Create Wave Dialog -->
      <p-dialog [(visible)]="showWaveDialog" [modal]="true" [style]="{width:'450px'}" [header]="'ORDERS.CREATE_WAVE' | translate">
        <div style="display:flex;flex-direction:column;gap:1rem;padding:0.5rem 0;">
          <div class="form-field"><label>Order Count</label><input pInputText type="number" [(ngModel)]="newWaveOrderCount" /></div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton [label]="'COMMON.CANCEL' | translate" class="p-button-text" (click)="showWaveDialog = false"></button>
          <button pButton [label]="'COMMON.SAVE' | translate" (click)="createWave()"></button>
        </ng-template>
      </p-dialog>
    </app-page-shell>
  `,
  styles: [`
    .confirm-row { display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0;border-bottom:1px solid var(--surface-border);font-size:0.85rem; }
    .confirm-row span { color:var(--text-secondary); }
    .form-field { display:flex;flex-direction:column;gap:0.4rem; }
    .form-field label { font-size:0.8rem;font-weight:600;color:var(--text-secondary); }
  `]
})
export class OrdersComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private messageService = inject(MessageService);

  orders = signal<Order[]>([]);
  pickTasks = signal<PickTask[]>([]);
  waves = signal<Wave[]>([]);
  loading = signal(true);
  pickLoading = signal(true);
  waveLoading = signal(true);
  totalOrders = signal(0);

  searchQuery = '';
  statusFilter = '';
  channelFilter = '';
  priorityFilter = '';

  showOrderDetail = false;
  showWaveDialog = false;
  selectedOrder: Order | null = null;
  newWaveOrderCount = 5;

  statusOptions = [
    { label: 'New', value: 'new' }, { label: 'Allocated', value: 'allocated' },
    { label: 'Picking', value: 'picking' }, { label: 'Packed', value: 'packed' },
    { label: 'Ready to Ship', value: 'ready_to_ship' }, { label: 'Shipped', value: 'shipped' },
  ];
  channelOptions = [
    { label: 'ERP', value: 'erp' }, { label: 'E-Commerce', value: 'ecommerce' }, { label: 'Manual', value: 'manual' },
  ];
  priorityOptions = [
    { label: 'High', value: 'high' }, { label: 'Medium', value: 'medium' }, { label: 'Low', value: 'low' },
  ];

  ngOnInit(): void {
    this.loadOrders();
    this.ordersService.getPickTasks().subscribe(t => { this.pickTasks.set(t); this.pickLoading.set(false); });
    this.ordersService.getWaves().subscribe(w => { this.waves.set(w); this.waveLoading.set(false); });
  }

  loadOrders(): void {
    this.loading.set(true);
    this.ordersService.getOrders({
      search: this.searchQuery || undefined,
      status: this.statusFilter || undefined,
      channel: this.channelFilter || undefined,
      priority: this.priorityFilter || undefined,
      limit: 30,
    }).subscribe(res => {
      this.orders.set(res.data);
      this.totalOrders.set(res.total);
      this.loading.set(false);
    });
  }

  viewOrder(order: Order): void {
    this.selectedOrder = order;
    this.showOrderDetail = true;
  }

  completePick(task: PickTask): void {
    this.ordersService.completePickTask(task.id).subscribe(() => {
      this.ordersService.getPickTasks().subscribe(t => this.pickTasks.set(t));
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Pick task completed.' });
    });
  }

  releaseWave(wave: Wave): void {
    this.ordersService.releaseWave(wave.id).subscribe(() => {
      this.ordersService.getWaves().subscribe(w => this.waves.set(w));
      this.messageService.add({ severity: 'success', summary: 'Success', detail: `Wave ${wave.waveNumber} released.` });
    });
  }

  createWave(): void {
    this.ordersService.createWave({ orderCount: this.newWaveOrderCount }).subscribe(() => {
      this.ordersService.getWaves().subscribe(w => this.waves.set(w));
      this.showWaveDialog = false;
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Wave created.' });
    });
  }

  pickProgress(task: PickTask): number {
    return task.itemsTotal > 0 ? Math.round((task.itemsPicked / task.itemsTotal) * 100) : 0;
  }

  formatStatus(s: string): string {
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getStatusSeverity(s: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
      new: 'info', allocated: 'info', picking: 'warning', packed: 'warning',
      ready_to_ship: 'success', shipped: 'success', delivered: 'success',
    };
    return map[s] ?? 'secondary';
  }

  getPrioritySeverity(p: string): 'success' | 'info' | 'warning' | 'danger' {
    return p === 'high' ? 'danger' : p === 'medium' ? 'warning' : 'info';
  }
}
