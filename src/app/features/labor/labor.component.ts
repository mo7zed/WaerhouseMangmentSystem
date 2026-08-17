import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/auth/auth.service';
import { WarehouseService } from '../settings/warehouse.service';
import { AdminService } from '../admin/admin.service';
import { WorkAssignmentService } from './work-assignment.service';
import { CreateWorkAssignmentDto, LaborTaskPriority, WorkAssignment, WorkAssignmentStatus, WorkTaskType } from './work-assignment.model';
import { SelectOption } from '../../core/models/shared.model';

@Component({
  selector: 'app-labor',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, CardModule, TabViewModule, TableModule, ButtonModule, TagModule, DialogModule, InputTextModule, DropdownModule],
  templateUrl: './labor.component.html',
  styleUrl: './labor.component.scss',
})
export class LaborComponent implements OnInit {
  private assignmentsApi = inject(WorkAssignmentService);
  private auth = inject(AuthService);
  private warehouses = inject(WarehouseService);
  private admin = inject(AdminService);
  private messages = inject(MessageService);

  assignments = signal<WorkAssignment[]>([]);
  loading = signal(true);
  creating = signal(false);
  showCreateDialog = signal(false);
  private zoneNames = signal<Record<string, string>>({});
  zoneOptions = signal<SelectOption[]>([]);
  private operatorNames = signal<Record<string, string>>({});
  warehouseId = '';

  readonly taskTypes: WorkTaskType[] = ['Putaway', 'Pick', 'Pack', 'CycleCount', 'Receiving', 'Transfer', 'QualityInspection'];
  readonly priorities: LaborTaskPriority[] = ['Critical', 'High', 'Normal', 'Low'];
  newAssignment = this.emptyAssignment();

  ngOnInit(): void {
    const userWarehouseId = this.auth.getCurrentUser()?.warehouseId;
    if (userWarehouseId) {
      this.warehouseId = userWarehouseId;
      this.loadAssignments();
      return;
    }
    this.warehouses.getWarehouses().subscribe({
      next: warehouses => {
        this.warehouseId = warehouses[0]?.id ?? '';
        this.warehouseId ? this.loadAssignments() : this.noWarehouse();
      },
      error: () => this.noWarehouse(),
    });
  }

  get summary() {
    const assignments = this.assignments();
    return {
      total: assignments.length,
      pending: assignments.filter(a => a.status === 'Pending').length,
      active: assignments.filter(a => ['Assigned', 'Accepted', 'InProgress'].includes(a.status)).length,
      completed: assignments.filter(a => a.status === 'Completed').length,
    };
  }

  openCreate(): void {
    if (!this.warehouseId) return this.noWarehouse();
    this.newAssignment = this.emptyAssignment();
    this.showCreateDialog.set(true);
  }

  createAssignment(): void {
    if (!this.newAssignment.sourceTaskId.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Source task required', detail: 'Enter the task ID that this work assignment represents.' });
      return;
    }
    const body: CreateWorkAssignmentDto = {
      ...this.newAssignment,
      warehouseId: this.warehouseId,
      requiredSkills: this.newAssignment.requiredSkills.split(',').map(skill => skill.trim()).filter(Boolean),
      dueBy: this.newAssignment.dueBy ? new Date(this.newAssignment.dueBy).toISOString() : null,
      zoneId: this.newAssignment.zoneId?.trim() || null,
      notes: this.newAssignment.notes.trim() || null,
    };
    this.creating.set(true);
    this.assignmentsApi.createAssignment(body).subscribe({
      next: () => {
        this.creating.set(false);
        this.showCreateDialog.set(false);
        this.messages.add({ severity: 'success', summary: 'Assignment created', detail: 'The work assignment is ready for labor allocation.' });
        this.loadAssignments();
      },
      error: () => this.creating.set(false),
    });
  }

  runAction(assignment: WorkAssignment, action: 'accept' | 'start' | 'complete' | 'cancel'): void {
    const request = this.assignmentsApi[action](assignment.id);
    request.subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Assignment updated', detail: `Assignment ${action}ed successfully.` });
        this.loadAssignments();
      },
    });
  }

  balanceWorkload(): void {
    this.assignmentsApi.balance({ warehouseId: this.warehouseId }).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Workload balanced', detail: 'The labor assignments were rebalanced.' });
        this.loadAssignments();
      },
    });
  }

  statusSeverity(status: WorkAssignmentStatus): 'success' | 'info' | 'warning' | 'danger' {
    if (status === 'Completed') return 'success';
    if (status === 'Cancelled' || status === 'Failed') return 'danger';
    if (status === 'InProgress' || status === 'Accepted') return 'info';
    return 'warning';
  }

  prioritySeverity(priority: LaborTaskPriority): 'danger' | 'warning' | 'info' | 'success' {
    return priority === 'Critical' ? 'danger' : priority === 'High' ? 'warning' : priority === 'Normal' ? 'info' : 'success';
  }

  zoneName(zoneId?: string | null): string {
    return zoneId ? this.zoneNames()[zoneId] ?? zoneId : '—';
  }

  operatorName(operatorId?: string | null): string {
    return operatorId ? this.operatorNames()[operatorId] ?? operatorId : 'Unassigned';
  }

  private loadAssignments(): void {
    this.loading.set(true);
    this.loadReferenceData();
    this.assignmentsApi.getAssignments(this.warehouseId).subscribe({
      next: assignments => { this.assignments.set(assignments); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private loadReferenceData(): void {
    this.warehouses.getWarehouseById(this.warehouseId).subscribe({
      next: warehouse => {
        const zones = warehouse.zones ?? [];
        this.zoneNames.set(Object.fromEntries(zones.map(zone => [zone.id, zone.name ?? zone.code ?? zone.id])));
        this.zoneOptions.set(zones.map(zone => ({ label: zone.name ?? zone.code ?? zone.id, value: zone.id })));
      },
    });
    this.admin.getUsers().subscribe({
      next: users => this.operatorNames.set(Object.fromEntries(users.map(user => [user.id, user.name]))),
    });
  }

  private noWarehouse(): void {
    this.loading.set(false);
    this.messages.add({ severity: 'warn', summary: 'Warehouse required', detail: 'Select or create a warehouse before managing labor.' });
  }

  private emptyAssignment() {
    return { taskType: 'Pick' as WorkTaskType, sourceTaskId: '', priority: 'Normal' as LaborTaskPriority, requiredSkills: '', zoneId: '', dueBy: '', notes: '' };
  }
}
