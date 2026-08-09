import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CatalogItemsService } from '../catalog-items.service';
import { InventoryService } from '../inventory.service';
import { InventoryItem } from '../../../core/models/inventory.model';
import {
  PageShellComponent,
  PageHeaderComponent,
  FiltersBarComponent,
  SectionCardComponent,
} from '../../../shared/ui';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    TagModule,
    DialogModule,
    ConfirmDialogModule,
    TooltipModule,
    SkeletonModule,
    ProgressBarModule,
    PageShellComponent,
    PageHeaderComponent,
    FiltersBarComponent,
    SectionCardComponent,
  ],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.scss',
})
export class InventoryListComponent implements OnInit {
  private catalogItemsService = inject(CatalogItemsService);
  private invService = inject(InventoryService);
  private confirmService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  items = signal<InventoryItem[]>([]);
  loading = signal(true);
  saving = signal(false);
  totalRecords = signal(0);
  currentPage = signal(1);

  searchQuery = '';
  selectedCategory = '';
  selectedStatus = '';
  selectedStrategy = '';

  showItemForm = false;
  showTransferForm = false;
  editingItem: InventoryItem | null = null;
  transferItem: InventoryItem | null = null;

  formData: Partial<InventoryItem> = {};
  transferData: any = {};

  categoryOptions = [
    'Electronics',
    'FMCG',
    'Apparel',
    'Machinery',
    'Food & Bev',
  ].map((c) => ({ label: c, value: c }));
  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Low Stock', value: 'low_stock' },
    { label: 'Out of Stock', value: 'out_of_stock' },
    { label: 'Inactive', value: 'inactive' },
  ];
  strategyOptions = [
    { label: 'FIFO', value: 'FIFO' },
    { label: 'FEFO', value: 'FEFO' },
    { label: 'LIFO', value: 'LIFO' },
  ];
  uomOptions = ['PCS', 'BOX', 'KG', 'L', 'M'].map((u) => ({
    label: u,
    value: u,
  }));

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(page = 1): void {
    this.loading.set(true);
    this.catalogItemsService
      .getCatalogItems({
        page,
        limit: 15,
        search: this.searchQuery || undefined,
        category: this.selectedCategory || undefined,
        status: this.selectedStatus || undefined,
        strategy: this.selectedStrategy || undefined,
      })
      .subscribe((res) => {
        this.items.set(res.data);
        this.totalRecords.set(res.total);
        this.loading.set(false);
      });
  }

  onLazyLoad(event: any): void {
    const page = Math.floor(event.first / event.rows) + 1;
    this.loadItems(page);
  }

  onSearch(): void {
    clearTimeout((this as any)._searchTimeout);
    (this as any)._searchTimeout = setTimeout(() => this.loadItems(), 400);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.selectedStrategy = '';
    this.loadItems();
  }

  getStatusSeverity(
    status: string,
  ): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<
      string,
      'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast'
    > = {
      active: 'success',
      low_stock: 'warning',
      out_of_stock: 'danger',
      inactive: 'secondary',
    };
    return map[status] ?? 'info';
  }

  openItemForm(): void {
    this.editingItem = null;
    this.formData = { strategy: 'FIFO', uom: 'PCS' };
    this.showItemForm = true;
  }

  editItem(item: InventoryItem): void {
    this.editingItem = item;
    this.formData = { ...item };
    this.showItemForm = true;
  }

  viewItem(item: InventoryItem): void {
    this.editingItem = item;
    this.formData = { ...item };
    this.showItemForm = true;
  }

  saveItem(): void {
    this.saving.set(true);
    const obs = this.editingItem
      ? this.catalogItemsService.update(this.editingItem.id, this.catalogItemsService.toUpdateDto(this.formData))
      : this.catalogItemsService.create(this.catalogItemsService.toCreateDto(this.formData));

    obs.subscribe(() => {
      this.saving.set(false);
      this.showItemForm = false;
      this.loadItems();
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Item saved successfully.',
      });
    });
  }

  openTransfer(item: InventoryItem): void {
    this.transferItem = item;
    this.transferData = {
      itemId: item.id,
      sourceBinId: item.binId,
      destinationBinId: '',
      quantity: 1,
      reason: '',
    };
    this.showTransferForm = true;
  }

  submitTransfer(): void {
    this.saving.set(true);
    this.invService.transferStock(this.transferData).subscribe(() => {
      this.saving.set(false);
      this.showTransferForm = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Stock transferred successfully.',
      });
      this.loadItems();
    });
  }

  confirmDelete(item: InventoryItem): void {
    this.confirmService.confirm({
      message: `Are you sure you want to delete ${item.name} (${item.sku})?`,
      header: 'Confirm Delete',
      icon: 'pi pi-trash',
      accept: () => {
        this.catalogItemsService.deactivate(item.id).subscribe(() => {
          this.loadItems();
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Item deactivated.',
          });
        });
      },
    });
  }

  exportCsv(): void {
    const headers = [
      'SKU',
      'Name',
      'Category',
      'Zone',
      'Bin',
      'Quantity',
      'UOM',
      'Status',
    ];
    const rows = this.items().map((i) => [
      i.sku,
      i.name,
      i.category,
      i.zoneName,
      i.binCode,
      i.quantity,
      i.uom,
      i.status,
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
