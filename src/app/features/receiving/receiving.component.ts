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
import { CreateAsnDto } from './asn.model';
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
  templateUrl: './receiving.component.html',
  styleUrl: './receiving.component.scss',})
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
