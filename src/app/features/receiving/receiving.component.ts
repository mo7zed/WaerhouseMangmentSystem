import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { StepsModule } from 'primeng/steps';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { FileUploadModule } from 'primeng/fileupload';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';
import { MessageService, MenuItem } from 'primeng/api';
import { ReceivingService } from './receiving.service';
import { ASN, PutawayTask } from '../../core/models/order.model';
import { CreateAsnDto, CreateAsnLineDto } from './asn.model';
import { WarehouseService } from '../settings/warehouse.service';
import { Warehouse } from '../settings/warehouse.model';

const WAREHOUSE_STORAGE_KEY = 'wms_selected_warehouse_id';

interface CreateAsnLineFormLine {
  itemId: string;
  sku: string;
  itemName: string;
  expectedQuantity: number;
  uomCode: string;
  uomName: string;
  lotNumber: string;
  expirationDate: Date | null;
}

interface CreateAsnForm {
  supplierId: string;
  supplierName: string;
  expectedArrivalDate: Date | null;
  notes: string;
  lines: CreateAsnLineFormLine[];
}

@Component({
  selector: 'app-receiving',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslateModule,
    TableModule, ButtonModule, TagModule, StepsModule,
    DialogModule, InputTextModule, InputNumberModule, FileUploadModule,
    SkeletonModule, TooltipModule, DropdownModule, CalendarModule,
  ],
  template: `
    <div class="receiving-page animate-fade-in">
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem;">
        <div>
          <h1 class="page-title">{{ 'RECEIVING.TITLE' | translate }}</h1>
          <p class="page-subtitle">Manage incoming shipments and putaway operations</p>
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
          <button pButton icon="pi pi-plus" label="New ASN" class="p-button-outlined p-button-sm" id="new-asn-btn" (click)="openCreateAsnDialog()" [disabled]="!selectedWarehouseId"></button>
          <button pButton icon="pi pi-download" label="{{ 'RECEIVING.RECEIVE_SHIPMENT' | translate }}" class="p-button-sm" id="receive-shipment-btn" (click)="openReceiveWizard()"></button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tab-bar" style="margin-bottom:1.25rem;">
        <button class="tab-btn" [class.active]="activeTab() === 'asn'" (click)="activeTab.set('asn')" id="tab-asn">ASN List</button>
        <button class="tab-btn" [class.active]="activeTab() === 'putaway'" (click)="activeTab.set('putaway')" id="tab-putaway">Putaway Tasks</button>
      </div>

      <!-- ASN List Tab -->
      <div *ngIf="activeTab() === 'asn'" class="section-card">
        <div class="section-card-header">
          <h3>Advanced Shipment Notifications</h3>
          <div style="display:flex;gap:0.5rem;align-items:center;">
            <button pButton icon="pi pi-refresh" class="p-button-text p-button-sm" (click)="loadASNs()" [loading]="loading()" pTooltip="Refresh" tooltipPosition="top"></button>
            <span *ngFor="let s of statusFilters"
              class="status-filter-chip"
              [class.active]="asnStatusFilter() === s.value"
              (click)="setStatusFilter(s.value)"
            >{{ s.label }}</span>
          </div>
        </div>

        <div *ngIf="!selectedWarehouseId" class="empty-state">
          <i class="pi pi-building"></i>
          <p>Select a warehouse to load pending ASNs</p>
        </div>

        <p-table
          *ngIf="selectedWarehouseId"
          [value]="filteredAsns()"
          [loading]="loading()"
          dataKey="id"
          [expandedRowKeys]="expandedRows"
          styleClass="p-datatable-sm asn-table"
          id="asn-table"
        >
          <ng-template pTemplate="header">
            <tr>
              <th style="width:3rem"></th>
              <th>ASN #</th>
              <th>Supplier</th>
              <th>Expected Date</th>
              <th>Items</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-asn let-expanded="expanded">
            <tr [class.asn-row-expanded]="expanded" class="asn-row" (click)="toggleAsnRow(asn)">
              <td (click)="$event.stopPropagation()">
                <button
                  type="button"
                  pButton
                  [pRowToggler]="asn"
                  class="p-button-text p-button-rounded p-button-sm"
                  [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                  [id]="'expand-asn-' + asn.id"
                ></button>
              </td>
              <td><code style="color:var(--brand-accent);font-size:0.82rem;">{{ asn.asnNumber }}</code></td>
              <td><span style="font-weight:500;">{{ asn.supplierName }}</span></td>
              <td><span style="font-size:0.8rem;color:var(--text-muted);">{{ asn.expectedDate | date:'MMM d, yyyy' }}</span></td>
              <td><span style="font-size:0.82rem;">{{ asn.items.length }} lines</span></td>
              <td>
                <p-tag
                  [value]="getASNStatusLabel(asn.status)"
                  [severity]="getASNSeverity(asn.status)"
                ></p-tag>
              </td>
              <td (click)="$event.stopPropagation()">
                <div style="display:flex;gap:0.35rem;">
                  <button pButton icon="pi pi-check" class="p-button-sm"
                    *ngIf="asn.status !== 'complete' && asn.status !== 'cancelled'"
                    (click)="openReceiveWizard(asn)"
                    [id]="'receive-asn-' + asn.id"
                    pTooltip="Start receiving" tooltipPosition="top">
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="rowexpansion" let-asn>
            <tr class="asn-lines-row">
              <td colspan="7">
                <div class="asn-lines-panel">
                  <h4>ASN Line Items</h4>
                  <p-table [value]="asn.items" styleClass="p-datatable-sm p-datatable-gridlines">
                    <ng-template pTemplate="header">
                      <tr>
                        <th>SKU</th>
                        <th>Item</th>
                        <th>Expected Qty</th>
                        <th>Received Qty</th>
                        <th>UOM</th>
                        <th>Lot #</th>
                        <th>Expiry</th>
                        <th>Status</th>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-line>
                      <tr>
                        <td><code style="color:var(--brand-accent);font-size:0.78rem;">{{ line.sku }}</code></td>
                        <td>{{ line.itemName }}</td>
                        <td>{{ line.expectedQty | number:'1.0-2' }}</td>
                        <td>{{ line.receivedQty | number:'1.0-2' }}</td>
                        <td>{{ line.uomName || line.uom }}</td>
                        <td>{{ line.lotNumber || '—' }}</td>
                        <td>{{ line.expirationDate ? (line.expirationDate | date:'MMM d, yyyy') : '—' }}</td>
                        <td>
                          <p-tag
                            [value]="line.isFullyReceived ? 'Received' : 'Pending'"
                            [severity]="line.isFullyReceived ? 'success' : 'warning'"
                          ></p-tag>
                        </td>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                      <tr><td colspan="8" style="text-align:center;color:var(--text-muted);">No line items</td></tr>
                    </ng-template>
                  </p-table>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted);">
                No pending ASNs for this warehouse
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Putaway Tasks Tab -->
      <div *ngIf="activeTab() === 'putaway'" class="section-card">
        <div class="section-card-header">
          <h3>Putaway Tasks</h3>
          <span class="status-badge warning">{{ pendingPutaway() }} pending</span>
        </div>
        <p-table [value]="putawayTasks()" styleClass="p-datatable-sm" id="putaway-table">
          <ng-template pTemplate="header">
            <tr>
              <th>SKU</th>
              <th>Item</th>
              <th>Quantity</th>
              <th>Suggested Bin</th>
              <th>Confirmed Bin</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-task>
            <tr>
              <td><code style="color:var(--brand-accent);font-size:0.78rem;">{{ task.sku }}</code></td>
              <td><span style="font-weight:500;">{{ task.itemName }}</span></td>
              <td><span style="font-weight:700;">{{ task.quantity }} {{ task.uom }}</span></td>
              <td>
                <span class="suggested-bin">
                  <i class="pi pi-map-marker" style="color:var(--brand-accent);margin-right:0.25rem;"></i>
                  {{ task.suggestedBin }}
                </span>
              </td>
              <td>
                <span *ngIf="task.confirmedBin" style="color:var(--color-success);font-weight:500;">{{ task.confirmedBin }}</span>
                <span *ngIf="!task.confirmedBin" style="color:var(--text-muted);">—</span>
              </td>
              <td>
                <p-tag [value]="task.status | titlecase" [severity]="task.status === 'completed' ? 'success' : 'warning'"></p-tag>
              </td>
              <td>
                <button pButton icon="pi pi-check" label="Confirm" class="p-button-sm"
                  *ngIf="task.status === 'pending'"
                  (click)="confirmPutaway(task)"
                  [id]="'confirm-putaway-' + task.id">
                </button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Create ASN Dialog -->
      <p-dialog
        [(visible)]="showCreateAsn"
        [modal]="true"
        [style]="{width:'820px',maxWidth:'95vw'}"
        header="Create ASN"
        id="create-asn-dialog"
      >
        <div class="create-asn-form" *ngIf="showCreateAsn">
          <div class="form-grid">
            <div class="form-field">
              <label>Supplier ID</label>
              <input pInputText [(ngModel)]="createForm.supplierId" placeholder="Supplier UUID" id="create-supplier-id" />
            </div>
            <div class="form-field">
              <label>Supplier Name</label>
              <input pInputText [(ngModel)]="createForm.supplierName" placeholder="Supplier name" id="create-supplier-name" />
            </div>
            <div class="form-field">
              <label>Expected Arrival Date</label>
              <p-calendar [(ngModel)]="createForm.expectedArrivalDate" [showTime]="true" [showIcon]="true" dateFormat="yy-mm-dd" styleClass="w-full" id="create-expected-date"></p-calendar>
            </div>
            <div class="form-field form-field--full">
              <label>Notes</label>
              <textarea pInputText rows="2" [(ngModel)]="createForm.notes" placeholder="Optional notes" style="width:100%;resize:vertical;" id="create-notes"></textarea>
            </div>
          </div>

          <div class="lines-section">
            <div class="lines-header">
              <h4>Line Items</h4>
              <button pButton icon="pi pi-plus" label="Add Line" class="p-button-outlined p-button-sm" (click)="addCreateLine()" id="add-asn-line-btn"></button>
            </div>
            <div class="line-card" *ngFor="let line of createForm.lines; let i = index">
              <div class="line-card-header">
                <span>Line {{ i + 1 }}</span>
                <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="removeCreateLine(i)" *ngIf="createForm.lines.length > 1" [id]="'remove-line-' + i"></button>
              </div>
              <div class="form-grid form-grid--lines">
                <div class="form-field"><label>Item ID</label><input pInputText [(ngModel)]="line.itemId" placeholder="Item UUID" /></div>
                <div class="form-field"><label>SKU</label><input pInputText [(ngModel)]="line.sku" placeholder="SKU" /></div>
                <div class="form-field"><label>Item Name</label><input pInputText [(ngModel)]="line.itemName" placeholder="Item name" /></div>
                <div class="form-field"><label>Expected Qty</label><p-inputNumber [(ngModel)]="line.expectedQuantity" [min]="0" styleClass="w-full"></p-inputNumber></div>
                <div class="form-field"><label>UOM Code</label><input pInputText [(ngModel)]="line.uomCode" placeholder="e.g. KG" /></div>
                <div class="form-field"><label>UOM Name</label><input pInputText [(ngModel)]="line.uomName" placeholder="e.g. Kilogram" /></div>
                <div class="form-field"><label>Lot Number</label><input pInputText [(ngModel)]="line.lotNumber" placeholder="Lot #" /></div>
                <div class="form-field"><label>Expiration Date</label><p-calendar [(ngModel)]="line.expirationDate" [showIcon]="true" dateFormat="yy-mm-dd" styleClass="w-full"></p-calendar></div>
              </div>
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="showCreateAsn = false" id="create-asn-cancel-btn"></button>
          <button pButton label="Create ASN" icon="pi pi-check" (click)="submitCreateAsn()" [loading]="creatingAsn()" [disabled]="!canCreateAsn()" id="create-asn-submit-btn"></button>
        </ng-template>
      </p-dialog>

      <!-- Receive Wizard Dialog -->
      <p-dialog
        [(visible)]="showWizard"
        [modal]="true"
        [style]="{width:'700px',maxWidth:'95vw'}"
        header="Receive Shipment"
        id="receive-wizard-dialog"
      >
        <div *ngIf="showWizard" style="padding:0.5rem 0;">
          <p-steps [model]="wizardSteps" [activeIndex]="wizardStep()" [readonly]="true" styleClass="mb-4"></p-steps>

          <div *ngIf="wizardStep() === 0" class="wizard-step">
            <h3 class="wizard-step-title">Select ASN or Create Manual Receipt</h3>
            <p-dropdown [options]="filteredAsns()" optionLabel="asnNumber" optionValue="id" [(ngModel)]="selectedASNId" placeholder="Select an ASN" styleClass="w-full" id="asn-select-dropdown"></p-dropdown>
          </div>

          <div *ngIf="wizardStep() === 1" class="wizard-step">
            <h3 class="wizard-step-title">Scan / Enter Items</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.75rem;margin-bottom:1rem;">
              <div class="form-field"><label>Barcode / SKU</label><input pInputText placeholder="Scan or type SKU" id="scan-sku-input"/></div>
              <div class="form-field"><label>Quantity Received</label><input pInputText type="number" placeholder="0" id="scan-qty-input"/></div>
              <div class="form-field"><label>Condition</label>
                <p-dropdown [options]="conditionOptions" optionLabel="label" optionValue="value" placeholder="Condition" id="condition-dropdown"></p-dropdown>
              </div>
            </div>
            <button pButton icon="pi pi-plus" label="Add Line" class="p-button-outlined p-button-sm" id="add-scan-line-btn"></button>
          </div>

          <div *ngIf="wizardStep() === 2" class="wizard-step">
            <h3 class="wizard-step-title">Discrepancy & Damage Capture</h3>
            <p-fileUpload mode="basic" chooseLabel="Upload Damage Photos" accept="image/*" [multiple]="true" id="damage-photo-upload" styleClass="mb-3"></p-fileUpload>
            <textarea pInputText rows="3" placeholder="Describe discrepancies..." style="width:100%;resize:vertical;background:var(--surface-overlay);border:1px solid var(--surface-border);border-radius:var(--radius-md);padding:0.75rem;color:var(--text-primary);" id="discrepancy-notes"></textarea>
          </div>

          <div *ngIf="wizardStep() === 3" class="wizard-step">
            <h3 class="wizard-step-title">Quality Inspection Checklist</h3>
            <div class="qc-checklist">
              <label class="qc-item" *ngFor="let item of qcChecklist; let i = index">
                <input type="checkbox" [(ngModel)]="item.checked" [id]="'qc-' + i" />
                <span>{{ item.label }}</span>
              </label>
            </div>
          </div>

          <div *ngIf="wizardStep() === 4" class="wizard-step">
            <h3 class="wizard-step-title">Confirm Receipt</h3>
            <div class="confirm-summary">
              <div class="confirm-row"><span>ASN Number</span><strong>{{ selectedASNId || 'Manual Receipt' }}</strong></div>
              <div class="confirm-row"><span>Items Scanned</span><strong>—</strong></div>
              <div class="confirm-row"><span>Discrepancies</span><strong style="color:var(--color-warning);">0</strong></div>
              <div class="confirm-row"><span>QC Status</span><strong style="color:var(--color-success);">Passed</strong></div>
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <button pButton label="Back" class="p-button-text" (click)="prevStep()" *ngIf="wizardStep() > 0" id="wizard-back-btn"></button>
          <button pButton label="Cancel" class="p-button-text" (click)="showWizard = false" id="wizard-cancel-btn"></button>
          <button pButton
            [label]="wizardStep() === 4 ? 'Confirm Receipt' : 'Next'"
            [icon]="wizardStep() === 4 ? 'pi pi-check' : 'pi pi-arrow-right'"
            [iconPos]="'right'"
            (click)="nextStep()"
            id="wizard-next-btn"
          ></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .tab-bar { display:flex; gap:0.25rem; background:var(--surface-overlay); padding:0.25rem; border-radius:var(--radius-md); width:fit-content; }
    .tab-btn { padding:0.5rem 1.25rem; border:none; border-radius:var(--radius-sm); background:transparent; color:var(--text-muted); font-size:0.85rem; font-weight:500; cursor:pointer; transition:all var(--transition-fast); }
    .tab-btn.active { background:var(--surface-card); color:var(--brand-accent); box-shadow:var(--shadow-sm); }
    .status-filter-chip { padding:0.25rem 0.7rem; border-radius:20px; font-size:0.75rem; font-weight:600; cursor:pointer; background:var(--surface-overlay); color:var(--text-muted); transition:all var(--transition-fast); }
    .status-filter-chip.active { background:rgba(0,180,216,0.15); color:var(--brand-accent); }
    .suggested-bin { font-size:0.82rem; color:var(--text-secondary); display:flex;align-items:center; }
    .wizard-step-title { font-size:1rem; font-weight:600; color:var(--text-primary); margin-bottom:1.25rem; }
    .wizard-step { min-height:200px; }
    .form-field { display:flex;flex-direction:column;gap:0.4rem; }
    .form-field label { font-size:0.8rem;font-weight:600;color:var(--text-secondary); }
    .form-field input, .form-field .p-dropdown, .form-field .p-inputnumber, .form-field .p-calendar { width:100%; }
    .form-field--full { grid-column: 1 / -1; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.25rem; }
    .form-grid--lines { grid-template-columns: repeat(4, 1fr); }
    .qc-checklist { display:flex;flex-direction:column;gap:0.75rem; }
    .qc-item { display:flex;align-items:center;gap:0.75rem;font-size:0.85rem;color:var(--text-primary);cursor:pointer; }
    .confirm-summary { background:var(--surface-overlay);border-radius:var(--radius-md);overflow:hidden; }
    .confirm-row { display:flex;justify-content:space-between;padding:0.75rem 1rem;border-bottom:1px solid var(--surface-border);font-size:0.85rem; }
    .confirm-row:last-child { border-bottom:none; }
    .confirm-row span { color:var(--text-secondary); }
    .asn-row { cursor:pointer; }
    .asn-row:hover { background:var(--surface-hover); }
    .asn-lines-panel { padding:0.75rem 1rem 1rem 2.5rem; background:var(--surface-overlay); border-radius:var(--radius-md); }
    .asn-lines-panel h4 { margin:0 0 0.75rem; font-size:0.85rem; color:var(--text-secondary); font-weight:600; }
    .empty-state { text-align:center; padding:3rem 1rem; color:var(--text-muted); }
    .empty-state i { font-size:2rem; margin-bottom:0.75rem; display:block; opacity:0.5; }
    .lines-section { margin-top:0.5rem; }
    .lines-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem; }
    .lines-header h4 { margin:0; font-size:0.9rem; }
    .line-card { background:var(--surface-overlay); border:1px solid var(--surface-border); border-radius:var(--radius-md); padding:0.75rem; margin-bottom:0.75rem; }
    .line-card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem; font-size:0.8rem; font-weight:600; color:var(--text-secondary); }
    :host ::ng-deep .warehouse-select { min-width:220px; }
  `]
})
export class ReceivingComponent implements OnInit {
  private receivingService = inject(ReceivingService);
  private warehouseService = inject(WarehouseService);
  private messageService = inject(MessageService);

  asns = signal<ASN[]>([]);
  putawayTasks = signal<PutawayTask[]>([]);
  loading = signal(false);
  creatingAsn = signal(false);
  activeTab = signal<'asn' | 'putaway'>('asn');
  asnStatusFilter = signal<string>('');
  warehouseOptions = signal<{ label: string; value: string }[]>([]);
  selectedWarehouseId = '';
  expandedRows: Record<string, boolean> = {};
  showWizard = false;
  showCreateAsn = false;
  wizardStep = signal(0);
  selectedASNId = '';

  createForm = this.emptyCreateForm();

  wizardSteps: MenuItem[] = [
    { label: 'Select ASN' }, { label: 'Scan Items' }, { label: 'Discrepancies' }, { label: 'QC Check' }, { label: 'Confirm' }
  ];

  statusFilters = [
    { label: 'All', value: '' },
    { label: 'Expected', value: 'expected' },
    { label: 'Partial', value: 'partially_received' },
    { label: 'Complete', value: 'complete' },
  ];

  conditionOptions = [
    { label: 'Good', value: 'good' }, { label: 'Damaged', value: 'damaged' }, { label: 'Partial', value: 'partial' }
  ];

  qcChecklist = [
    { label: 'All items match ASN quantities', checked: false },
    { label: 'No visible damage on packaging', checked: false },
    { label: 'Barcodes / labels are legible', checked: false },
    { label: 'Temperature-sensitive items checked', checked: false },
    { label: 'Expiry dates verified (if applicable)', checked: false },
  ];

  filteredAsns = signal<ASN[]>([]);

  pendingPutaway(): number {
    return this.putawayTasks().filter(t => t.status === 'pending').length;
  }

  ngOnInit(): void {
    this.loadWarehouses();
    this.loadPutaway();
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
          this.loadASNs();
        }
      },
    });
  }

  onWarehouseChange(): void {
    if (typeof localStorage !== 'undefined' && this.selectedWarehouseId) {
      localStorage.setItem(WAREHOUSE_STORAGE_KEY, this.selectedWarehouseId);
    }
    this.expandedRows = {};
    this.loadASNs();
  }

  setStatusFilter(value: string): void {
    this.asnStatusFilter.set(value);
    this.applyStatusFilter();
  }

  loadASNs(): void {
    if (!this.selectedWarehouseId) {
      this.asns.set([]);
      this.applyStatusFilter();
      return;
    }

    this.loading.set(true);
    this.receivingService.getPendingASNs(this.selectedWarehouseId).subscribe({
      next: list => {
        this.asns.set(list);
        this.applyStatusFilter();
        this.loading.set(false);
      },
      error: () => {
        this.asns.set([]);
        this.applyStatusFilter();
        this.loading.set(false);
      },
    });
  }

  applyStatusFilter(): void {
    const filter = this.asnStatusFilter();
    const list = filter
      ? this.asns().filter(a => a.status === filter)
      : this.asns();
    this.filteredAsns.set(list);
  }

  toggleAsnRow(asn: ASN): void {
    if (this.expandedRows[asn.id]) {
      delete this.expandedRows[asn.id];
    } else {
      this.expandedRows[asn.id] = true;
    }
    this.expandedRows = { ...this.expandedRows };
  }

  loadPutaway(): void {
    this.receivingService.getPutawayTasks().subscribe(t => this.putawayTasks.set(t));
  }

  openReceiveWizard(asn?: ASN): void {
    this.wizardStep.set(0);
    this.selectedASNId = asn?.id ?? '';
    this.showWizard = true;
  }

  openCreateAsnDialog(): void {
    this.createForm = this.emptyCreateForm();
    this.showCreateAsn = true;
  }

  addCreateLine(): void {
    this.createForm.lines.push(this.emptyCreateLine());
  }

  removeCreateLine(index: number): void {
    this.createForm.lines.splice(index, 1);
  }

  canCreateAsn(): boolean {
    return !!(
      this.selectedWarehouseId &&
      this.createForm.supplierId.trim() &&
      this.createForm.supplierName.trim() &&
      this.createForm.expectedArrivalDate &&
      this.createForm.lines.length > 0 &&
      this.createForm.lines.every(line =>
        line.itemId.trim() &&
        line.sku.trim() &&
        line.itemName.trim() &&
        line.expectedQuantity > 0 &&
        line.uomCode.trim() &&
        line.uomName.trim()
      )
    );
  }

  submitCreateAsn(): void {
    if (!this.canCreateAsn()) return;

    const body: CreateAsnDto = {
      warehouseId: this.selectedWarehouseId,
      supplierId: this.createForm.supplierId.trim(),
      supplierName: this.createForm.supplierName.trim(),
      expectedArrivalDate: this.toIsoString(this.createForm.expectedArrivalDate)!,
      notes: this.createForm.notes.trim() || undefined,
      lines: this.createForm.lines.map(line => ({
        itemId: line.itemId.trim(),
        sku: line.sku.trim(),
        itemName: line.itemName.trim(),
        expectedQuantity: line.expectedQuantity,
        uomCode: line.uomCode.trim(),
        uomName: line.uomName.trim(),
        lotNumber: line.lotNumber?.trim() || undefined,
        expirationDate: line.expirationDate ? this.toIsoString(line.expirationDate) : undefined,
      })),
    };

    this.creatingAsn.set(true);
    this.receivingService.createASN(body).subscribe({
      next: () => {
        this.creatingAsn.set(false);
        this.showCreateAsn = false;
        this.messageService.add({ severity: 'success', summary: 'ASN Created', detail: 'The ASN was created successfully.', life: 4000 });
        this.loadASNs();
      },
      error: () => this.creatingAsn.set(false),
    });
  }

  nextStep(): void {
    if (this.wizardStep() < 4) {
      this.wizardStep.update(s => s + 1);
    } else if (this.selectedASNId) {
      this.receivingService.receiveASN(this.selectedASNId, {}).subscribe(() => {
        this.showWizard = false;
        this.loadASNs();
        this.loadPutaway();
      });
    } else {
      this.showWizard = false;
      this.loadASNs();
    }
  }

  prevStep(): void { this.wizardStep.update(s => Math.max(0, s - 1)); }

  confirmPutaway(task: PutawayTask): void {
    this.receivingService.completePutaway(task.id, task.suggestedBin).subscribe(() => this.loadPutaway());
  }

  getASNStatusLabel(status: string): string {
    const map: Record<string, string> = {
      expected: 'Expected',
      partially_received: 'Partial',
      complete: 'Complete',
      cancelled: 'Cancelled',
    };
    return map[status] ?? status;
  }

  getASNSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast'> = {
      expected: 'info',
      partially_received: 'warning',
      complete: 'success',
      cancelled: 'danger',
    };
    return map[status] ?? 'secondary';
  }

  private getWarehouseLabel(warehouse: Warehouse): string {
    const parts = [warehouse.code, warehouse.name].filter(Boolean);
    return parts.length ? parts.join(' - ') : warehouse.id;
  }

  private emptyCreateForm(): CreateAsnForm {
    return {
      supplierId: '',
      supplierName: '',
      expectedArrivalDate: null,
      notes: '',
      lines: [this.emptyCreateLine()],
    };
  }

  private emptyCreateLine(): CreateAsnLineFormLine {
    return {
      itemId: '',
      sku: '',
      itemName: '',
      expectedQuantity: 1,
      uomCode: '',
      uomName: '',
      lotNumber: '',
      expirationDate: null,
    };
  }

  private toIsoString(value: Date | string | null): string | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString();
  }
}
