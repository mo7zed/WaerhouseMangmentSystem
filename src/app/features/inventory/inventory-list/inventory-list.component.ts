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
  template: `
    <app-page-shell>
      <app-page-header
        [title]="'INVENTORY.TITLE' | translate"
        [subtitle]="totalRecords() + ' items across all warehouses'"
      >
        <div actions style="display:flex; gap:0.75rem; flex-wrap:wrap;">
          <button
            pButton
            icon="pi pi-upload"
            label="Import CSV"
            class="p-button-outlined p-button-sm"
            style="width:150px;"
            id="import-csv-btn"
          ></button>

          <button
            pButton
            icon="pi pi-download"
            [label]="'INVENTORY.EXPORT' | translate"
            class="p-button-outlined p-button-sm"
            style="width:150px;"
            (click)="exportCsv()"
            id="export-btn"
          ></button>

          <button
            pButton
            icon="pi pi-plus"
            [label]="'INVENTORY.ADD_ITEM' | translate"
            class="p-button-sm"
            style="width:150px;"
            (click)="openItemForm()"
            id="add-item-btn"
          ></button>
        </div>
      </app-page-header>

      <app-filters-bar>
        <span class="p-input-icon-left search-field">
          <i class="pi pi-search"></i>
          <input
            pInputText
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
            [placeholder]="'INVENTORY.SEARCH' | translate"
            id="inventory-search"
            style="width:100%;"
          />
        </span>
        <p-dropdown
          [options]="categoryOptions"
          [(ngModel)]="selectedCategory"
          [showClear]="true"
          (onChange)="loadItems()"
          optionLabel="label"
          optionValue="value"
          placeholder="All Categories"
          [style]="{ minWidth: '160px' }"
        ></p-dropdown>
        <p-dropdown
          [options]="statusOptions"
          [(ngModel)]="selectedStatus"
          [showClear]="true"
          (onChange)="loadItems()"
          optionLabel="label"
          optionValue="value"
          placeholder="All Statuses"
          [style]="{ minWidth: '150px' }"
        ></p-dropdown>
        <p-dropdown
          [options]="strategyOptions"
          [(ngModel)]="selectedStrategy"
          [showClear]="true"
          optionLabel="label"
          optionValue="value"
          placeholder="Strategy"
          [style]="{ minWidth: '130px' }"
        ></p-dropdown>
        <button
          pButton
          icon="pi pi-filter-slash"
          class="p-button-text p-button-sm"
          (click)="clearFilters()"
          label="Clear"
          id="clear-filters-btn"
        ></button>
      </app-filters-bar>

      <app-section-card [tableBody]="true">
        <p-table
          [value]="items()"
          [loading]="loading()"
          [paginator]="true"
          [rows]="15"
          [totalRecords]="totalRecords()"
          [lazy]="true"
          (onLazyLoad)="onLazyLoad($event)"
          [rowsPerPageOptions]="[10, 15, 25, 50]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} items"
          [sortMode]="'single'"
          styleClass="p-datatable-sm"
          id="inventory-table"
          [scrollable]="true"
          scrollHeight="calc(100vh - 420px)"
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="sku" style="min-width:110px;">
                {{ 'INVENTORY.SKU' | translate }}
                <p-sortIcon field="sku"></p-sortIcon>
              </th>
              <th pSortableColumn="name" style="min-width:180px;">
                {{ 'INVENTORY.ITEM_NAME' | translate }}
                <p-sortIcon field="name"></p-sortIcon>
              </th>
              <th style="min-width:120px;">
                {{ 'INVENTORY.CATEGORY' | translate }}
              </th>
              <th style="min-width:140px;">
                {{ 'INVENTORY.ZONE' | translate }} /
                {{ 'INVENTORY.BIN' | translate }}
              </th>
              <th
                pSortableColumn="quantity"
                style="min-width:100px; text-align:right;"
              >
                {{ 'INVENTORY.QUANTITY' | translate }}
                <p-sortIcon field="quantity"></p-sortIcon>
              </th>
              <th style="min-width:90px; text-align:center;">
                {{ 'INVENTORY.UOM' | translate }}
              </th>
              <th style="min-width:100px; text-align:center;">
                {{ 'INVENTORY.STRATEGY' | translate }}
              </th>
              <th style="min-width:110px; text-align:center;">
                {{ 'INVENTORY.STATUS' | translate }}
              </th>
              <th style="min-width:120px;">
                {{ 'INVENTORY.LAST_UPDATED' | translate }}
              </th>
              <th style="min-width:120px; text-align:center;">
                {{ 'COMMON.ACTIONS' | translate }}
              </th>
            </tr>
          </ng-template>

          <ng-template pTemplate="loadingbody">
            <tr *ngFor="let i of [1, 2, 3, 4, 5, 6, 7, 8]">
              <td *ngFor="let j of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]">
                <p-skeleton></p-skeleton>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-item>
            <tr>
              <td>
                <code class="sku-code">{{ item.sku }}</code>
              </td>
              <td>
                <div class="item-name-cell">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-barcode" *ngIf="item.barcode">{{
                    item.barcode
                  }}</span>
                </div>
              </td>
              <td>
                <span class="category-tag">{{ item.category }}</span>
              </td>
              <td>
                <div class="bin-cell">
                  <span class="zone-label">{{ item.zoneName }}</span>
                  <span class="bin-code">{{ item.binCode }}</span>
                </div>
              </td>
              <td style="text-align:right;">
                <div class="qty-cell">
                  <span
                    class="qty-value"
                    [class.low]="item.status === 'low_stock'"
                    [class.out]="item.status === 'out_of_stock'"
                  >
                    {{ item.quantity | number }}
                  </span>
                  <span class="qty-reserved" *ngIf="item.reservedQty > 0"
                    >{{ item.reservedQty }} rsv</span
                  >
                </div>
              </td>
              <td style="text-align:center;">{{ item.uom }}</td>
              <td style="text-align:center;">
                <span
                  class="strategy-badge"
                  [class]="item.strategy.toLowerCase()"
                  >{{ item.strategy }}</span
                >
              </td>
              <td style="text-align:center;">
                <p-tag
                  [value]="item.status | titlecase"
                  [severity]="getStatusSeverity(item.status)"
                ></p-tag>
              </td>
              <td>
                <span class="date-text">{{
                  item.lastUpdated | date: 'MMM d, HH:mm'
                }}</span>
              </td>
              <td style="text-align:center;">
                <div style="display:flex; gap:0.35rem; justify-content:center;">
                  <button
                    pButton
                    icon="pi pi-eye"
                    class="p-button-text p-button-sm"
                    pTooltip="View"
                    tooltipPosition="top"
                    (click)="viewItem(item)"
                    [id]="'view-item-' + item.id"
                  ></button>
                  <button
                    pButton
                    icon="pi pi-pencil"
                    class="p-button-text p-button-sm"
                    pTooltip="Edit"
                    tooltipPosition="top"
                    (click)="editItem(item)"
                    [id]="'edit-item-' + item.id"
                  ></button>
                  <button
                    pButton
                    icon="pi pi-arrow-right-arrow-left"
                    class="p-button-text p-button-sm"
                    pTooltip="Transfer"
                    tooltipPosition="top"
                    (click)="openTransfer(item)"
                    [id]="'transfer-item-' + item.id"
                  ></button>
                  <button
                    pButton
                    icon="pi pi-trash"
                    class="p-button-text p-button-sm p-button-danger"
                    pTooltip="Delete"
                    tooltipPosition="top"
                    (click)="confirmDelete(item)"
                    [id]="'delete-item-' + item.id"
                  ></button>
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td
                colspan="10"
                style="text-align:center; padding:3rem; color:var(--text-muted);"
              >
                <i
                  class="pi pi-box"
                  style="font-size:2rem; display:block; margin-bottom:0.5rem;"
                ></i>
                {{ 'INVENTORY.NO_ITEMS' | translate }}
              </td>
            </tr>
          </ng-template>
        </p-table>
      </app-section-card>

      <!-- Add/Edit Item Dialog -->
      <p-dialog
        [(visible)]="showItemForm"
        [modal]="true"
        [style]="{ width: '650px', maxWidth: '95vw' }"
        [header]="
          editingItem
            ? ('INVENTORY.EDIT_ITEM' | translate)
            : ('INVENTORY.ADD_ITEM' | translate)
        "
        id="item-form-dialog"
      >
        <div
          *ngIf="showItemForm"
          style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; padding:0.5rem 0;"
        >
          <div class="form-field">
            <label>SKU *</label>
            <input
              pInputText
              [(ngModel)]="formData.sku"
              placeholder="SKU-0000"
            />
          </div>
          <div class="form-field">
            <label>Item Name *</label>
            <input
              pInputText
              [(ngModel)]="formData.name"
              placeholder="Item name"
            />
          </div>
          <div class="form-field">
            <label>Category</label>
            <p-dropdown
              [options]="categoryOptions"
              [(ngModel)]="formData.category"
              optionLabel="label"
              optionValue="value"
              placeholder="Select category"
              styleClass="w-full"
            ></p-dropdown>
          </div>
          <div class="form-field">
            <label>UOM</label>
            <p-dropdown
              [options]="uomOptions"
              [(ngModel)]="formData.uom"
              optionLabel="label"
              optionValue="value"
              placeholder="Select UOM"
              styleClass="w-full"
            ></p-dropdown>
          </div>
          <div class="form-field">
            <label>Strategy</label>
            <p-dropdown
              [options]="strategyOptions"
              [(ngModel)]="formData.strategy"
              optionLabel="label"
              optionValue="value"
              placeholder="FIFO / FEFO / LIFO"
              styleClass="w-full"
            ></p-dropdown>
          </div>
          <div class="form-field">
            <label>Barcode</label>
            <input
              pInputText
              [(ngModel)]="formData.barcode"
              placeholder="Barcode"
            />
          </div>
          <div class="form-field">
            <label>Cost Price (SAR)</label>
            <input
              pInputText
              type="number"
              [(ngModel)]="formData.costPrice"
              placeholder="0.00"
            />
          </div>
          <div class="form-field">
            <label>Selling Price (SAR)</label>
            <input
              pInputText
              type="number"
              [(ngModel)]="formData.sellingPrice"
              placeholder="0.00"
            />
          </div>
          <div class="form-field">
            <label>Min Threshold</label>
            <input
              pInputText
              type="number"
              [(ngModel)]="formData.minThreshold"
              placeholder="20"
            />
          </div>
          <div class="form-field">
            <label>Reorder Point</label>
            <input
              pInputText
              type="number"
              [(ngModel)]="formData.reorderPoint"
              placeholder="50"
            />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button
            pButton
            label="{{ 'COMMON.CANCEL' | translate }}"
            class="p-button-text"
            (click)="showItemForm = false"
            id="item-form-cancel"
          ></button>
          <button
            pButton
            label="{{ 'COMMON.SAVE' | translate }}"
            (click)="saveItem()"
            [loading]="saving()"
            id="item-form-save"
          ></button>
        </ng-template>
      </p-dialog>

      <!-- Transfer Dialog -->
      <p-dialog
        [(visible)]="showTransferForm"
        [modal]="true"
        [style]="{ width: '500px', maxWidth: '95vw' }"
        header="{{ 'INVENTORY.TRANSFER_STOCK' | translate }}"
        id="transfer-dialog"
      >
        <div
          *ngIf="showTransferForm"
          style="display:flex; flex-direction:column; gap:1rem; padding:0.5rem 0;"
        >
          <div class="form-field">
            <label>{{ 'INVENTORY.SOURCE_BIN' | translate }}</label>
            <input pInputText [value]="transferItem?.binCode" readonly />
          </div>
          <div class="form-field">
            <label>{{ 'INVENTORY.DESTINATION_BIN' | translate }} *</label>
            <input
              pInputText
              [(ngModel)]="transferData.destinationBinId"
              placeholder="e.g. B-02-03"
            />
          </div>
          <div class="form-field">
            <label>{{ 'INVENTORY.TRANSFER_QTY' | translate }} *</label>
            <input
              pInputText
              type="number"
              [(ngModel)]="transferData.quantity"
              [max]="transferItem?.quantity ?? 0"
              placeholder="Quantity"
            />
          </div>
          <div class="form-field">
            <label>{{ 'INVENTORY.TRANSFER_REASON' | translate }}</label>
            <input
              pInputText
              [(ngModel)]="transferData.reason"
              placeholder="Reason for transfer"
            />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button
            pButton
            label="{{ 'COMMON.CANCEL' | translate }}"
            class="p-button-text"
            (click)="showTransferForm = false"
            id="transfer-cancel"
          ></button>
          <button
            pButton
            label="{{ 'INVENTORY.CONFIRM_TRANSFER' | translate }}"
            (click)="submitTransfer()"
            [loading]="saving()"
            id="transfer-confirm"
          ></button>
        </ng-template>
      </p-dialog>

      <p-confirmDialog></p-confirmDialog>
    </app-page-shell>
  `,
  styles: [
    `
      .sku-code {
        font-family: ui-monospace, monospace;
        font-size: 0.78rem;
        color: var(--brand-accent-dark);
        background: var(--color-info-bg);
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
      }
      .item-name-cell {
        display: flex;
        flex-direction: column;
      }
      .item-name {
        font-weight: 500;
        font-size: 0.85rem;
      }
      .item-barcode {
        font-size: 0.7rem;
        color: var(--text-muted);
      }

      .category-tag {
        background: var(--surface-overlay);
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .bin-cell {
        display: flex;
        flex-direction: column;
      }
      .zone-label {
        font-size: 0.7rem;
        color: var(--text-muted);
      }
      .bin-code {
        font-size: 0.82rem;
        font-weight: 500;
        color: var(--text-secondary);
      }

      .qty-cell {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      .qty-value {
        font-weight: 700;
        font-size: 0.9rem;
      }
      .qty-value.low {
        color: var(--color-warning);
      }
      .qty-value.out {
        color: var(--color-danger);
      }
      .qty-reserved {
        font-size: 0.68rem;
        color: var(--text-muted);
      }

      .strategy-badge {
        font-size: 0.68rem;
        font-weight: 700;
        padding: 0.15rem 0.5rem;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .strategy-badge.fifo {
        background: var(--color-info-bg);
        color: var(--color-info);
      }
      .strategy-badge.fefo {
        background: var(--color-success-bg);
        color: var(--color-success);
      }
      .strategy-badge.lifo {
        background: var(--color-warning-bg);
        color: var(--color-warning);
      }

      .date-text {
        font-size: 0.78rem;
        color: var(--text-muted);
      }

      .filters-bar {
        overflow: visible;
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }
      .form-field label {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-secondary);
      }
      .form-field input,
      .form-field .p-dropdown {
        width: 100%;
      }
    `,
  ],
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
