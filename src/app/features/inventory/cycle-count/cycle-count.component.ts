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
  templateUrl: './cycle-count.component.html',
  styleUrl: './cycle-count.component.scss',})
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
