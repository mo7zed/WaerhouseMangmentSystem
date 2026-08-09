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
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',})
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
