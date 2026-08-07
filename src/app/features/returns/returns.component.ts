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
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MessageService } from 'primeng/api';
import { ReturnsService } from './returns.service';
import { Return } from '../../core/models/order.model';

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslateModule,
    TableModule, ButtonModule, TagModule, TabViewModule,
    DialogModule, DropdownModule, InputTextModule, InputTextareaModule,
  ],
  template: `
    <div class="returns-page animate-fade-in">
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem;">
        <div>
          <h1 class="page-title">{{ 'RETURNS.TITLE' | translate }}</h1>
          <p class="page-subtitle">{{ returns().length }} return requests</p>
        </div>
        <button pButton icon="pi pi-plus" [label]="'RETURNS.CREATE_RETURN' | translate" class="p-button-sm" (click)="openCreateDialog()"></button>
      </div>

      <p-tabView>
        <p-tabPanel header="Return Requests">
          <p-table [value]="returns()" [loading]="loading()" styleClass="p-datatable-sm" [paginator]="true" [rows]="10">
            <ng-template pTemplate="header">
              <tr>
                <th>{{ 'RETURNS.RMA_NUMBER' | translate }}</th>
                <th>{{ 'RETURNS.ORDER_NUMBER' | translate }}</th>
                <th>{{ 'RETURNS.CUSTOMER' | translate }}</th>
                <th>{{ 'RETURNS.REASON' | translate }}</th>
                <th>{{ 'RETURNS.STATUS' | translate }}</th>
                <th>Created</th>
                <th>{{ 'COMMON.ACTIONS' | translate }}</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-ret>
              <tr>
                <td><code style="color:var(--brand-accent);font-weight:600;">{{ ret.rmaNumber }}</code></td>
                <td>{{ ret.orderNumber }}</td>
                <td>{{ ret.customerName }}</td>
                <td><span style="font-size:0.82rem;">{{ ret.reasonDescription }}</span></td>
                <td><p-tag [value]="ret.status | titlecase" [severity]="getReturnSeverity(ret.status)"></p-tag></td>
                <td><span style="font-size:0.8rem;color:var(--text-muted);">{{ ret.createdAt | date:'MMM d, yyyy' }}</span></td>
                <td>
                  <div style="display:flex;gap:0.35rem;">
                    <button pButton icon="pi pi-cog" [label]="'RETURNS.DISPOSITION' | translate" class="p-button-sm p-button-outlined"
                      *ngIf="ret.status === 'received' || ret.status === 'inspected'"
                      (click)="openDisposition(ret)"></button>
                    <button pButton icon="pi pi-check" label="Complete" class="p-button-sm"
                      *ngIf="ret.status === 'dispositioned'" (click)="completeReturn(ret)"></button>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-tabPanel>
      </p-tabView>

      <!-- Create Return Dialog -->
      <p-dialog [(visible)]="showCreateDialog" [modal]="true" [style]="{width:'550px'}" [header]="'RETURNS.CREATE_RETURN' | translate">
        <div style="display:flex;flex-direction:column;gap:1rem;padding:0.5rem 0;">
          <div class="form-field"><label>{{ 'RETURNS.ORDER_NUMBER' | translate }}</label><input pInputText [(ngModel)]="newReturn.orderNumber" placeholder="ORD-2024-08001" /></div>
          <div class="form-field"><label>{{ 'RETURNS.CUSTOMER' | translate }}</label><input pInputText [(ngModel)]="newReturn.customerName" /></div>
          <div class="form-field"><label>Reason Code</label>
            <p-dropdown [options]="reasonOptions" [(ngModel)]="newReturn.reasonCode" optionLabel="label" optionValue="value" styleClass="w-full"></p-dropdown>
          </div>
          <div class="form-field"><label>Description</label>
            <textarea pInputTextarea [(ngModel)]="newReturn.reasonDescription" rows="3" style="width:100%;"></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton [label]="'COMMON.CANCEL' | translate" class="p-button-text" (click)="showCreateDialog = false"></button>
          <button pButton [label]="'COMMON.SAVE' | translate" (click)="createReturn()"></button>
        </ng-template>
      </p-dialog>

      <!-- Disposition Dialog -->
      <p-dialog [(visible)]="showDispositionDialog" [modal]="true" [style]="{width:'600px'}" [header]="'RETURNS.DISPOSITION' | translate">
        <div *ngIf="selectedReturn">
          <p style="margin-bottom:1rem;font-size:0.85rem;color:var(--text-secondary);">RMA: <strong>{{ selectedReturn.rmaNumber }}</strong></p>
          <p-table [value]="selectedReturn.items" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr><th>SKU</th><th>Item</th><th>Qty</th><th>Condition</th><th>{{ 'RETURNS.DISPOSITION' | translate }}</th></tr>
            </ng-template>
            <ng-template pTemplate="body" let-item>
              <tr>
                <td>{{ item.sku }}</td>
                <td>{{ item.itemName }}</td>
                <td>{{ item.quantity }}</td>
                <td><p-tag [value]="item.condition | titlecase" [severity]="item.condition === 'good' ? 'success' : 'danger'"></p-tag></td>
                <td>
                  <p-dropdown [options]="dispositionOptions" [(ngModel)]="item.disposition" optionLabel="label" optionValue="value"
                    placeholder="Select" [style]="{ minWidth: '140px' }" (onChange)="setDisposition(item.id, item.disposition)"></p-dropdown>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </p-dialog>
    </div>
  `,
  styles: [`.form-field { display:flex;flex-direction:column;gap:0.4rem; } .form-field label { font-size:0.8rem;font-weight:600;color:var(--text-secondary); }`]
})
export class ReturnsComponent implements OnInit {
  private returnsService = inject(ReturnsService);
  private messageService = inject(MessageService);

  returns = signal<Return[]>([]);
  loading = signal(true);
  showCreateDialog = false;
  showDispositionDialog = false;
  selectedReturn: Return | null = null;

  newReturn = { orderNumber: '', customerName: '', reasonCode: 'DEFECTIVE', reasonDescription: '' };

  reasonOptions = [
    { label: 'Defective', value: 'DEFECTIVE' }, { label: 'Wrong Item', value: 'WRONG_ITEM' },
    { label: 'Damaged', value: 'DAMAGED' }, { label: 'No Longer Needed', value: 'NO_LONGER_NEEDED' },
  ];

  dispositionOptions = [
    { label: 'Restock', value: 'restock' }, { label: 'Refurbish', value: 'refurbish' },
    { label: 'Discard', value: 'discard' }, { label: 'Quarantine', value: 'quarantine' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.returnsService.getReturns().subscribe(r => {
      this.returns.set(r);
      this.loading.set(false);
    });
  }

  openCreateDialog(): void {
    this.newReturn = { orderNumber: '', customerName: '', reasonCode: 'DEFECTIVE', reasonDescription: '' };
    this.showCreateDialog = true;
  }

  createReturn(): void {
    this.returnsService.createReturn({
      orderNumber: this.newReturn.orderNumber,
      orderId: 'ord-new',
      customerId: 'cust-new',
      customerName: this.newReturn.customerName,
      reasonCode: this.newReturn.reasonCode,
      reasonDescription: this.newReturn.reasonDescription,
      items: [{ id: 'ri-new', returnId: '', itemId: 'item-1', sku: 'SKU-0001', itemName: 'Returned Item', quantity: 1, uom: 'PCS', condition: 'good' }],
    }).subscribe(() => {
      this.showCreateDialog = false;
      this.load();
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Return request created.' });
    });
  }

  openDisposition(ret: Return): void {
    this.selectedReturn = { ...ret, items: ret.items.map(i => ({ ...i })) };
    this.showDispositionDialog = true;
  }

  setDisposition(itemId: string, disposition: Return['items'][0]['disposition']): void {
    if (!this.selectedReturn || !disposition) return;
    this.returnsService.updateDisposition(this.selectedReturn.id, itemId, disposition).subscribe(updated => {
      this.selectedReturn = updated;
      this.load();
      this.messageService.add({ severity: 'info', summary: 'Updated', detail: 'Disposition saved.' });
    });
  }

  completeReturn(ret: Return): void {
    this.returnsService.completeReturn(ret.id).subscribe(() => {
      this.load();
      this.messageService.add({ severity: 'success', summary: 'Complete', detail: `${ret.rmaNumber} completed.` });
    });
  }

  getReturnSeverity(s: string): 'success' | 'info' | 'warning' | 'danger' {
    const map: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
      requested: 'info', received: 'warning', inspected: 'warning', dispositioned: 'info', completed: 'success',
    };
    return map[s] ?? 'info';
  }
}
