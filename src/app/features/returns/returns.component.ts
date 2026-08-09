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
  templateUrl: './returns.component.html',
  styleUrl: './returns.component.scss',})
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
