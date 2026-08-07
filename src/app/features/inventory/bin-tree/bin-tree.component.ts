import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { StorageLocationService } from '../storage-location.service';
import { CreateStorageLocationDto, StorageLocation } from '../storage-location.model';
import { WarehouseService } from '../../settings/warehouse.service';
import { Warehouse, WarehouseAisle, WarehouseRack, WarehouseShelf, WarehouseZone } from '../../settings/warehouse.model';
import { STORAGE_TYPE_OPTIONS } from '../../settings/warehouse-layout.constants';

const WAREHOUSE_STORAGE_KEY = 'wms_selected_warehouse_id';

interface CreateStorageLocationForm extends CreateStorageLocationDto {}

interface LayoutOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-bin-tree',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    ProgressBarModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
    DialogModule,
    DropdownModule,
    InputTextModule,
    InputNumberModule,
  ],
  template: `
    <div class="bin-tree-page animate-fade-in">
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem;">
        <div>
          <h1 class="page-title">Bin Management</h1>
          <p class="page-subtitle">Storage locations with capacity utilization and status controls</p>
        </div>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
          <p-dropdown
            [options]="warehouseOptions()"
            [(ngModel)]="selectedWarehouseId"
            optionLabel="label"
            optionValue="value"
            placeholder="Select warehouse"
            (onChange)="onWarehouseChange()"
            styleClass="warehouse-select"
            id="warehouse-select"
          ></p-dropdown>
          <button pButton icon="pi pi-refresh" class="p-button-outlined p-button-sm" (click)="loadLocations()" [loading]="loading()" label="Refresh"></button>
          <button pButton icon="pi pi-plus" label="Add Bin" class="p-button-sm" id="add-bin-btn" (click)="openCreateDialog()" [disabled]="!selectedWarehouseId"></button>
        </div>
      </div>

      <div class="section-card">
        <div *ngIf="!selectedWarehouseId" class="empty-state">
          <i class="pi pi-building"></i>
          <p>Select a warehouse to view storage locations</p>
        </div>

        <div *ngIf="loading() && selectedWarehouseId" style="padding:2rem;">
          <p-skeleton height="40px" styleClass="mb-2" *ngFor="let i of [1,2,3,4,5]"></p-skeleton>
        </div>

        <p-table
          *ngIf="selectedWarehouseId && !loading()"
          [value]="locations()"
          dataKey="id"
          [expandedRowKeys]="expandedRows"
          styleClass="p-datatable-sm"
          id="bin-tree-table"
        >
          <ng-template pTemplate="caption">
            <div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem;flex-wrap:wrap;">
              <span class="legend-item"><span class="legend-dot" style="background:var(--color-success)"></span>≤60% used</span>
              <span class="legend-item"><span class="legend-dot" style="background:var(--color-warning)"></span>61–80%</span>
              <span class="legend-item"><span class="legend-dot" style="background:var(--color-danger)"></span>&gt;80%</span>
              <span style="margin-left:auto;font-size:0.8rem;color:var(--text-muted);">{{ locations().length }} locations</span>
            </div>
          </ng-template>
          <ng-template pTemplate="header">
            <tr>
              <th style="width:3rem"></th>
              <th>Bin Code</th>
              <th>Storage Type</th>
              <th>Items</th>
              <th>Utilization</th>
              <th>Status</th>
              <th>Last Activity</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-loc let-expanded="expanded">
            <tr class="location-row" (click)="toggleRow(loc)">
              <td (click)="$event.stopPropagation()">
                <button
                  type="button"
                  pButton
                  [pRowToggler]="loc"
                  class="p-button-text p-button-rounded p-button-sm"
                  [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                ></button>
              </td>
              <td>
                <code style="color:var(--brand-accent);font-size:0.82rem;">{{ loc.binCode }}</code>
              </td>
              <td>{{ loc.storageType }}</td>
              <td>{{ loc.currentUtilization.currentItemCount }} / {{ loc.capacity.maxItemCount }}</td>
              <td style="min-width:180px;">
                <div style="display:flex;align-items:center;gap:0.5rem;">
                  <p-progressBar
                    [value]="getUtilizationPercent(loc)"
                    [style]="{'height':'6px','flex':'1'}"
                    [showValue]="false"
                    [styleClass]="getUtilizationClass(getUtilizationPercent(loc))"
                  ></p-progressBar>
                  <span style="font-size:0.75rem;font-weight:600;min-width:35px;text-align:right;"
                    [style.color]="getUtilizationColor(getUtilizationPercent(loc))">
                    {{ getUtilizationPercent(loc) }}%
                  </span>
                </div>
              </td>
              <td>
                <p-tag [value]="loc.status" [severity]="getStatusSeverity(loc.status)"></p-tag>
              </td>
              <td><span style="font-size:0.8rem;color:var(--text-muted);">{{ loc.lastActivityAt | date:'MMM d, yyyy HH:mm' }}</span></td>
              <td (click)="$event.stopPropagation()">
                <div style="display:flex;gap:0.25rem;">
                  <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View details" (click)="viewLocation(loc)" [id]="'view-bin-' + loc.id"></button>
                  <button pButton icon="pi pi-ban" class="p-button-text p-button-warning p-button-sm" pTooltip="Block bin" (click)="openBlockDialog(loc)" *ngIf="canBlock(loc)" [id]="'block-bin-' + loc.id"></button>
                  <button pButton icon="pi pi-check-circle" class="p-button-text p-button-success p-button-sm" pTooltip="Release bin" (click)="releaseLocation(loc)" *ngIf="canRelease(loc)" [loading]="busyLocationId() === loc.id" [id]="'release-bin-' + loc.id"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="rowexpansion" let-loc>
            <tr>
              <td colspan="8">
                <div class="location-details">
                  <div class="detail-grid">
                    <div><span>Zone ID</span><code>{{ loc.zoneId }}</code></div>
                    <div><span>Aisle ID</span><code>{{ loc.aisleId }}</code></div>
                    <div><span>Rack ID</span><code>{{ loc.rackId }}</code></div>
                    <div><span>Shelf ID</span><code>{{ loc.shelfId }}</code></div>
                    <div><span>Weight</span>{{ loc.currentUtilization.usedWeightKg | number:'1.0-2' }} / {{ loc.capacity.maxWeightKg | number:'1.0-2' }} kg</div>
                    <div><span>Volume</span>{{ loc.currentUtilization.usedVolumeM3 | number:'1.0-3' }} / {{ loc.capacity.maxVolumeM3 | number:'1.0-3' }} m³</div>
                    <div><span>Dimensions</span>{{ loc.dimensions.lengthCm | number:'1.0-1' }} × {{ loc.dimensions.widthCm | number:'1.0-1' }} × {{ loc.dimensions.heightCm | number:'1.0-1' }} cm</div>
                    <div><span>Active</span>{{ loc.isActive ? 'Yes' : 'No' }}</div>
                  </div>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-muted);">No storage locations found for this warehouse</td></tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Create Dialog -->
      <p-dialog [(visible)]="showCreateDialog" [modal]="true" [style]="{width:'760px',maxWidth:'95vw'}" header="Create Storage Location" id="create-bin-dialog">
        <div class="dialog-form" *ngIf="showCreateDialog">
          <div class="form-grid">
            <div class="form-field">
              <label>Zone</label>
              <p-dropdown [options]="zoneOptions()" [(ngModel)]="createForm.zoneId" optionLabel="label" optionValue="value" placeholder="Select zone" [loading]="layoutLoading()" (onChange)="onZoneChange()" styleClass="w-full" appendTo="body"></p-dropdown>
            </div>
            <div class="form-field">
              <label>Aisle</label>
              <p-dropdown [options]="aisleOptions()" [(ngModel)]="createForm.aisleId" optionLabel="label" optionValue="value" placeholder="Select aisle" [disabled]="!createForm.zoneId" (onChange)="onAisleChange()" styleClass="w-full" appendTo="body"></p-dropdown>
            </div>
            <div class="form-field">
              <label>Rack</label>
              <p-dropdown [options]="rackOptions()" [(ngModel)]="createForm.rackId" optionLabel="label" optionValue="value" placeholder="Select rack" [disabled]="!createForm.aisleId" (onChange)="onRackChange()" styleClass="w-full" appendTo="body"></p-dropdown>
            </div>
            <div class="form-field">
              <label>Shelf</label>
              <p-dropdown [options]="shelfOptions()" [(ngModel)]="createForm.shelfId" optionLabel="label" optionValue="value" placeholder="Select shelf" [disabled]="!createForm.rackId" styleClass="w-full" appendTo="body"></p-dropdown>
            </div>
            <div class="form-field"><label>Bin Label</label><input pInputText [(ngModel)]="createForm.binLabel" placeholder="e.g. BIN1" /></div>
            <div class="form-field">
              <label>Storage Type</label>
              <p-dropdown [options]="storageTypeOptions" [(ngModel)]="createForm.storageType" optionLabel="label" optionValue="value" styleClass="w-full" appendTo="body"></p-dropdown>
            </div>
            <div class="form-field"><label>Max Weight (kg)</label><p-inputNumber [(ngModel)]="createForm.maxWeightKg" [min]="0" styleClass="w-full"></p-inputNumber></div>
            <div class="form-field"><label>Max Volume (m³)</label><p-inputNumber [(ngModel)]="createForm.maxVolumeM3" [min]="0" [minFractionDigits]="2" styleClass="w-full"></p-inputNumber></div>
            <div class="form-field"><label>Max Item Count</label><p-inputNumber [(ngModel)]="createForm.maxItemCount" [min]="0" styleClass="w-full"></p-inputNumber></div>
            <div class="form-field"><label>Length (cm)</label><p-inputNumber [(ngModel)]="createForm.lengthCm" [min]="0" styleClass="w-full"></p-inputNumber></div>
            <div class="form-field"><label>Width (cm)</label><p-inputNumber [(ngModel)]="createForm.widthCm" [min]="0" styleClass="w-full"></p-inputNumber></div>
            <div class="form-field"><label>Height (cm)</label><p-inputNumber [(ngModel)]="createForm.heightCm" [min]="0" styleClass="w-full"></p-inputNumber></div>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="showCreateDialog = false"></button>
          <button pButton label="Create" icon="pi pi-check" (click)="submitCreate()" [loading]="creating()" [disabled]="!canCreate()"></button>
        </ng-template>
      </p-dialog>

      <!-- Block Dialog -->
      <p-dialog [(visible)]="showBlockDialog" [modal]="true" [style]="{width:'480px',maxWidth:'95vw'}" header="Block Storage Location" id="block-bin-dialog">
        <div class="form-field" *ngIf="blockTarget">
          <p style="margin:0 0 1rem;font-size:0.85rem;color:var(--text-secondary);">
            Block bin <code>{{ blockTarget.binCode }}</code>
          </p>
          <label>Reason</label>
          <textarea pInputText rows="3" [(ngModel)]="blockReason" placeholder="Reason for blocking..." style="width:100%;resize:vertical;"></textarea>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="showBlockDialog = false"></button>
          <button pButton label="Block" icon="pi pi-ban" class="p-button-warning" (click)="submitBlock()" [loading]="blocking()" [disabled]="!blockReason.trim()"></button>
        </ng-template>
      </p-dialog>

      <!-- View Dialog -->
      <p-dialog [(visible)]="showViewDialog" [modal]="true" [style]="{width:'640px',maxWidth:'95vw'}" header="Storage Location Details" id="view-bin-dialog">
        <div *ngIf="viewLocationData()" class="detail-grid">
          <div><span>Bin Code</span><strong>{{ viewLocationData()!.binCode }}</strong></div>
          <div><span>Status</span><p-tag [value]="viewLocationData()!.status" [severity]="getStatusSeverity(viewLocationData()!.status)"></p-tag></div>
          <div><span>Storage Type</span>{{ viewLocationData()!.storageType }}</div>
          <div><span>Items</span>{{ viewLocationData()!.currentUtilization.currentItemCount }} / {{ viewLocationData()!.capacity.maxItemCount }}</div>
          <div><span>Weight Used</span>{{ viewLocationData()!.currentUtilization.usedWeightKg | number:'1.0-2' }} kg</div>
          <div><span>Volume Used</span>{{ viewLocationData()!.currentUtilization.usedVolumeM3 | number:'1.0-3' }} m³</div>
          <div><span>Dimensions</span>{{ viewLocationData()!.dimensions.lengthCm }} × {{ viewLocationData()!.dimensions.widthCm }} × {{ viewLocationData()!.dimensions.heightCm }} cm</div>
          <div><span>Last Activity</span>{{ viewLocationData()!.lastActivityAt | date:'medium' }}</div>
        </div>
        <div *ngIf="viewLoading()" style="padding:1rem;"><p-skeleton height="2rem" styleClass="mb-2" *ngFor="let i of [1,2,3,4]"></p-skeleton></div>
      </p-dialog>
    </div>
  `,
  styles: [`
    .legend-item { display:flex;align-items:center;gap:0.35rem;font-size:0.75rem;color:var(--text-secondary); }
    .legend-dot { width:8px;height:8px;border-radius:50%; }
    .empty-state { text-align:center;padding:3rem 1rem;color:var(--text-muted); }
    .empty-state i { font-size:2rem;margin-bottom:0.75rem;display:block;opacity:0.5; }
    .location-row { cursor:pointer; }
    .location-row:hover { background:var(--surface-hover); }
    .location-details { padding:0.75rem 1rem 1rem 2.5rem;background:var(--surface-overlay);border-radius:var(--radius-md); }
    .detail-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:0.75rem 1rem;font-size:0.82rem; }
    .detail-grid span { display:block;font-size:0.72rem;font-weight:600;color:var(--text-muted);margin-bottom:0.2rem;text-transform:uppercase;letter-spacing:0.03em; }
    .detail-grid code { font-size:0.75rem;word-break:break-all; }
    .form-grid { display:grid;grid-template-columns:1fr 1fr;gap:1rem; }
    .form-field { display:flex;flex-direction:column;gap:0.4rem; }
    .form-field label { font-size:0.8rem;font-weight:600;color:var(--text-secondary); }
    .form-field input, .form-field .p-dropdown, .form-field .p-inputnumber { width:100%; }
    :host ::ng-deep .warehouse-select { min-width:220px; }
  `]
})
export class BinTreeComponent implements OnInit {
  private storageService = inject(StorageLocationService);
  private warehouseService = inject(WarehouseService);
  private messageService = inject(MessageService);

  locations = signal<StorageLocation[]>([]);
  warehouseOptions = signal<{ label: string; value: string }[]>([]);
  zoneOptions = signal<LayoutOption[]>([]);
  aisleOptions = signal<LayoutOption[]>([]);
  rackOptions = signal<LayoutOption[]>([]);
  shelfOptions = signal<LayoutOption[]>([]);
  viewLocationData = signal<StorageLocation | null>(null);
  loading = signal(false);
  viewLoading = signal(false);
  creating = signal(false);
  blocking = signal(false);
  layoutLoading = signal(false);
  busyLocationId = signal<string | null>(null);

  selectedWarehouseId = '';
  expandedRows: Record<string, boolean> = {};
  showCreateDialog = false;
  showBlockDialog = false;
  showViewDialog = false;
  blockTarget: StorageLocation | null = null;
  blockReason = '';

  storageTypeOptions = [...STORAGE_TYPE_OPTIONS];
  createForm = this.emptyCreateForm();
  private layoutZones: WarehouseZone[] = [];

  ngOnInit(): void {
    this.loadWarehouses();
  }

  loadWarehouses(): void {
    this.warehouseService.getWarehouses().subscribe({
      next: warehouses => {
        this.warehouseOptions.set(warehouses.map(w => ({
          label: this.getWarehouseLabel(w),
          value: w.id,
        })));

        const savedId = typeof localStorage !== 'undefined'
          ? localStorage.getItem(WAREHOUSE_STORAGE_KEY)
          : null;
        const defaultId = savedId && warehouses.some(w => w.id === savedId)
          ? savedId
          : warehouses[0]?.id ?? '';

        this.selectedWarehouseId = defaultId;
        if (defaultId) {
          this.loadLocations();
        }
      },
    });
  }

  onWarehouseChange(): void {
    if (typeof localStorage !== 'undefined' && this.selectedWarehouseId) {
      localStorage.setItem(WAREHOUSE_STORAGE_KEY, this.selectedWarehouseId);
    }
    this.expandedRows = {};
    this.loadLocations();
  }

  loadLocations(): void {
    if (!this.selectedWarehouseId) {
      this.locations.set([]);
      return;
    }

    this.loading.set(true);
    this.storageService.getStorageLocations(this.selectedWarehouseId).subscribe({
      next: list => {
        this.locations.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.locations.set([]);
        this.loading.set(false);
      },
    });
  }

  toggleRow(loc: StorageLocation): void {
    if (this.expandedRows[loc.id]) {
      delete this.expandedRows[loc.id];
    } else {
      this.expandedRows[loc.id] = true;
    }
    this.expandedRows = { ...this.expandedRows };
  }

  viewLocation(loc: StorageLocation): void {
    this.showViewDialog = true;
    this.viewLocationData.set(null);
    this.viewLoading.set(true);
    this.storageService.getStorageLocationById(loc.id).subscribe({
      next: data => {
        this.viewLocationData.set(data);
        this.viewLoading.set(false);
      },
      error: () => {
        this.viewLocationData.set(loc);
        this.viewLoading.set(false);
      },
    });
  }

  openCreateDialog(): void {
    this.createForm = this.emptyCreateForm();
    this.showCreateDialog = true;
    this.loadWarehouseLayout();
  }

  onZoneChange(): void {
    this.createForm.aisleId = '';
    this.createForm.rackId = '';
    this.createForm.shelfId = '';
    const zone = this.layoutZones.find(item => item.id === this.createForm.zoneId);
    this.aisleOptions.set(this.toOptions(zone?.aisles ?? []));
    this.rackOptions.set([]);
    this.shelfOptions.set([]);
  }

  onAisleChange(): void {
    this.createForm.rackId = '';
    this.createForm.shelfId = '';
    const aisle = this.getSelectedAisle();
    this.rackOptions.set(this.toOptions(aisle?.racks ?? []));
    this.shelfOptions.set([]);
  }

  onRackChange(): void {
    this.createForm.shelfId = '';
    const rack = this.getSelectedRack();
    this.shelfOptions.set(this.toOptions(rack?.shelves ?? []));
  }

  canCreate(): boolean {
    return !!(
      this.selectedWarehouseId &&
      this.createForm.zoneId.trim() &&
      this.createForm.aisleId.trim() &&
      this.createForm.rackId.trim() &&
      this.createForm.shelfId.trim() &&
      this.createForm.binLabel.trim() &&
      this.createForm.storageType
    );
  }

  submitCreate(): void {
    if (!this.canCreate()) return;

    this.creating.set(true);
    this.storageService.createStorageLocation(this.selectedWarehouseId, {
      ...this.createForm,
      zoneId: this.createForm.zoneId.trim(),
      aisleId: this.createForm.aisleId.trim(),
      rackId: this.createForm.rackId.trim(),
      shelfId: this.createForm.shelfId.trim(),
      binLabel: this.createForm.binLabel.trim(),
    }).subscribe({
      next: () => {
        this.creating.set(false);
        this.showCreateDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Bin Created', detail: 'Storage location was created successfully.', life: 4000 });
        this.loadLocations();
      },
      error: () => this.creating.set(false),
    });
  }

  openBlockDialog(loc: StorageLocation): void {
    this.blockTarget = loc;
    this.blockReason = '';
    this.showBlockDialog = true;
  }

  submitBlock(): void {
    if (!this.blockTarget || !this.blockReason.trim()) return;

    this.blocking.set(true);
    this.storageService.blockStorageLocation(this.blockTarget.id, this.blockReason.trim()).subscribe({
      next: () => {
        this.blocking.set(false);
        this.showBlockDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Bin Blocked', detail: `${this.blockTarget!.binCode} has been blocked.`, life: 4000 });
        this.loadLocations();
      },
      error: () => this.blocking.set(false),
    });
  }

  releaseLocation(loc: StorageLocation): void {
    this.busyLocationId.set(loc.id);
    this.storageService.releaseStorageLocation(loc.id).subscribe({
      next: () => {
        this.busyLocationId.set(null);
        this.messageService.add({ severity: 'success', summary: 'Bin Released', detail: `${loc.binCode} is now available.`, life: 4000 });
        this.loadLocations();
      },
      error: () => this.busyLocationId.set(null),
    });
  }

  canBlock(loc: StorageLocation): boolean {
    const status = loc.status.toLowerCase();
    return status === 'available' && loc.isActive;
  }

  canRelease(loc: StorageLocation): boolean {
    const status = loc.status.toLowerCase();
    return status.includes('block') || status.includes('maintenance');
  }

  getUtilizationPercent(loc: StorageLocation): number {
    const max = loc.capacity.maxItemCount;
    if (!max) return 0;
    return Math.round((loc.currentUtilization.currentItemCount / max) * 100);
  }

  getUtilizationClass(val: number): string {
    return val > 80 ? 'util-high' : val > 60 ? 'util-mid' : 'util-low';
  }

  getUtilizationColor(val: number): string {
    return val > 80 ? 'var(--color-danger)' : val > 60 ? 'var(--color-warning)' : 'var(--color-success)';
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' {
    const normalized = status.toLowerCase();
    if (normalized.includes('available')) return 'success';
    if (normalized.includes('block')) return 'danger';
    if (normalized.includes('maintenance')) return 'warning';
    if (normalized.includes('full')) return 'warning';
    return 'info';
  }

  private getWarehouseLabel(warehouse: Warehouse): string {
    const parts = [warehouse.code, warehouse.name].filter(Boolean);
    return parts.length ? parts.join(' - ') : warehouse.id;
  }

  private loadWarehouseLayout(): void {
    if (!this.selectedWarehouseId) return;

    this.layoutLoading.set(true);
    this.layoutZones = [];
    this.zoneOptions.set([]);
    this.aisleOptions.set([]);
    this.rackOptions.set([]);
    this.shelfOptions.set([]);
    this.warehouseService.getWarehouseById(this.selectedWarehouseId).subscribe({
      next: warehouse => {
        this.layoutZones = warehouse.zones ?? [];
        this.zoneOptions.set(this.toOptions(this.layoutZones));
        this.layoutLoading.set(false);
      },
      error: () => this.layoutLoading.set(false),
    });
  }

  private getSelectedAisle(): WarehouseAisle | undefined {
    return this.layoutZones
      .find(zone => zone.id === this.createForm.zoneId)?.aisles
      ?.find(aisle => aisle.id === this.createForm.aisleId);
  }

  private getSelectedRack(): WarehouseRack | undefined {
    return this.getSelectedAisle()?.racks
      ?.find(rack => rack.id === this.createForm.rackId);
  }

  private toOptions(items: Array<WarehouseZone | WarehouseAisle | WarehouseRack | WarehouseShelf>): LayoutOption[] {
    return items.map(item => ({
      label: item.code ? `${item.code} (${item.id})` : item.id,
      value: item.id,
    }));
  }

  private emptyCreateForm(): CreateStorageLocationForm {
    return {
      zoneId: '',
      aisleId: '',
      rackId: '',
      shelfId: '',
      binLabel: '',
      storageType: 'Ambient',
      maxWeightKg: 0,
      maxVolumeM3: 0,
      maxItemCount: 0,
      lengthCm: 0,
      widthCm: 0,
      heightCm: 0,
    };
  }
}
