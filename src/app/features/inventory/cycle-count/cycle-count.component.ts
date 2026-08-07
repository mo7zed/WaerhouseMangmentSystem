import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import { MessageService } from 'primeng/api';
import { InventoryService } from '../inventory.service';
import { CycleCount } from '../../../core/models/inventory.model';

@Component({
  selector: 'app-cycle-count',
  standalone: true,
  imports: [CommonModule, TranslateModule, TableModule, ButtonModule, TagModule, ProgressBarModule, SkeletonModule, AvatarModule],
  template: `
    <div class="cycle-count-page animate-fade-in">
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem;">
        <div>
          <h1 class="page-title">Cycle Counting</h1>
          <p class="page-subtitle">Manage and track warehouse cycle counts</p>
        </div>
        <button pButton icon="pi pi-plus" label="New Count" class="p-button-sm" id="new-cycle-count-btn" (click)="startNewCount()"></button>
      </div>

      <!-- Summary Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem;margin-bottom:1.5rem;" class="stagger-children">
        <div class="kpi-card info animate-fade-in-up" *ngFor="let s of summaryCards">
          <div class="kpi-icon"><i class="pi" [class]="s.icon"></i></div>
          <div class="kpi-value">{{ s.value }}</div>
          <div class="kpi-label">{{ s.label }}</div>
        </div>
      </div>

      <div class="section-card">
        <p-table [value]="counts()" [loading]="loading()" styleClass="p-datatable-sm" id="cycle-count-table">
          <ng-template pTemplate="header">
            <tr>
              <th>Assigned To</th>
              <th>Zone</th>
              <th>Scheduled</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Discrepancies</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-count>
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:0.5rem;">
                  <p-avatar [label]="count.assignedToName.charAt(0)" shape="circle" size="normal" styleClass="operator-avatar"></p-avatar>
                  <span style="font-size:0.85rem;">{{ count.assignedToName }}</span>
                </div>
              </td>
              <td><span style="font-weight:500;">{{ count.zoneId }}</span></td>
              <td><span style="font-size:0.8rem;color:var(--text-muted);">{{ count.scheduledDate | date:'MMM d, yyyy' }}</span></td>
              <td style="min-width:180px;">
                <div style="display:flex;align-items:center;gap:0.5rem;">
                  <p-progressBar [value]="getProgress(count)" [style]="{'height':'6px','flex':'1'}" [showValue]="false"></p-progressBar>
                  <span style="font-size:0.75rem;min-width:50px;">{{ count.itemsCounted }}/{{ count.itemsTotal }}</span>
                </div>
              </td>
              <td>
                <p-tag [value]="count.status | titlecase"
                  [severity]="count.status === 'completed' ? 'success' : count.status === 'in_progress' ? 'info' : count.status === 'discrepancy' ? 'danger' : 'warning'">
                </p-tag>
              </td>
              <td>
                <span *ngIf="count.discrepancies > 0" style="color:var(--color-danger);font-weight:700;">{{ count.discrepancies }}</span>
                <span *ngIf="count.discrepancies === 0" style="color:var(--color-success);">✓ None</span>
              </td>
              <td>
                <div style="display:flex;gap:0.35rem;">
                  <button pButton icon="pi pi-play" class="p-button-text p-button-sm" *ngIf="count.status === 'pending'" label="Start" (click)="startCount(count)"></button>
                  <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" label="View" (click)="viewCount(count)"></button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`:host ::ng-deep .operator-avatar { background: linear-gradient(135deg, var(--brand-primary-light), var(--brand-accent)); color: #fff; font-weight: 700; }`]
})
export class CycleCountComponent implements OnInit {
  private invService = inject(InventoryService);
  private messageService = inject(MessageService);
  counts = signal<CycleCount[]>([]);
  loading = signal(true);

  summaryCards = [
    { label: 'Total Counts', value: 3, icon: 'pi-list' },
    { label: 'In Progress', value: 1, icon: 'pi-spin pi-spinner' },
    { label: 'Completed', value: 1, icon: 'pi-check-circle' },
    { label: 'Discrepancies', value: 4, icon: 'pi-exclamation-triangle' },
  ];

  ngOnInit(): void {
    this.invService.getCycleCounts().subscribe(c => {
      this.counts.set(c);
      this.loading.set(false);
    });
  }

  getProgress(count: CycleCount): number {
    return count.itemsTotal > 0 ? Math.round((count.itemsCounted / count.itemsTotal) * 100) : 0;
  }

  startNewCount(): void {
    this.messageService.add({ severity: 'info', summary: 'Cycle Count', detail: 'New count assigned to Zone A.' });
  }

  startCount(count: CycleCount): void {
    count.status = 'in_progress';
    this.counts.update(list => [...list]);
    this.messageService.add({ severity: 'success', summary: 'Started', detail: `Cycle count for ${count.zoneId} started.` });
  }

  viewCount(count: CycleCount): void {
    this.messageService.add({ severity: 'info', summary: count.zoneId, detail: `${count.itemsCounted}/${count.itemsTotal} items counted, ${count.discrepancies} discrepancies.` });
  }
}
