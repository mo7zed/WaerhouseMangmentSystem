import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../core/auth/auth.service';
import { AdminRole, AdminUser, AuditLogEntry, SystemHealth } from '../../core/models/admin.model';
import { SettingsService } from '../settings/settings.service';
import { Warehouse } from '../settings/warehouse.model';
import { AdminService } from './admin.service';

interface UserForm {
  username: string;
  email: string;
  fullName: string;
  password: string;
  initialRoleId: string;
  warehouseScope: string;
  language: string;
}

interface RoleForm {
  userId: string;
  roleId: string;
  warehouseScope: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    TagModule,
    TabViewModule,
    DialogModule,
    DropdownModule,
    InputTextModule,
    TooltipModule,
  ],
  template: `
    <div class="admin-page animate-fade-in">
      <div class="page-header page-header--row">
        <div>
          <h1 class="page-title">{{ 'ADMIN.TITLE' | translate }}</h1>
          <p class="page-subtitle">{{ 'ADMIN.SUBTITLE' | translate }}</p>
        </div>
        <div class="page-header__actions">
          <button
            pButton
            icon="pi pi-refresh"
            class="p-button-outlined p-button-sm"
            label="Refresh"
            [loading]="usersLoading()"
            (click)="loadUsers()"></button>
          <button
            pButton
            icon="pi pi-plus"
            label="Add User"
            class="p-button-sm"
            [disabled]="!canManageUsers()"
            (click)="openUserDialog()"></button>
        </div>
      </div>

      <p-tabView styleClass="settings-tabs">
        <p-tabPanel [header]="'ADMIN.USERS' | translate">
          <p-table
            [value]="users()"
            [loading]="usersLoading()"
            styleClass="p-datatable-sm"
            responsiveLayout="stack"
            breakpoint="960px"
            [paginator]="true"
            [rows]="10">
            <ng-template pTemplate="header">
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>{{ 'COMMON.ACTIONS' | translate }}</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-user>
              <tr>
                <td>
                  <span class="p-column-title">Name</span>
                  <span class="user-name">{{ user.name }}</span>
                </td>
                <td>
                  <span class="p-column-title">Username</span>
                  {{ user.username || '-' }}
                </td>
                <td>
                  <span class="p-column-title">Email</span>
                  {{ user.email }}
                </td>
                <td>
                  <span class="p-column-title">Roles</span>
                  <div class="role-list">
                    @if (user.roles.length) {
                      @for (role of user.roles; track role.id || role.roleId) {
                        <p-tag [value]="role.roleName" severity="info"></p-tag>
                        @if (role.id) {
                          <button
                            pButton
                            icon="pi pi-times"
                            class="p-button-text p-button-sm p-button-danger compact-icon-btn"
                            pTooltip="Remove role"
                            [disabled]="!canManageRoles()"
                            (click)="removeRole(user, role.id)"></button>
                        }
                      }
                    } @else {
                      <span class="muted-text">No role</span>
                    }
                  </div>
                </td>
                <td>
                  <span class="p-column-title">Status</span>
                  <p-tag [value]="user.status | titlecase" [severity]="getStatusSeverity(user.status)"></p-tag>
                </td>
                <td>
                  <span class="p-column-title">Last Login</span>
                  <span class="muted-text">{{ user.lastLogin ? (user.lastLogin | date:'MMM d, HH:mm') : '-' }}</span>
                </td>
                <td>
                  <span class="p-column-title">{{ 'COMMON.ACTIONS' | translate }}</span>
                  <div class="table-actions">
                    <button
                      pButton
                      icon="pi pi-shield"
                      class="p-button-text p-button-sm"
                      pTooltip="Manage access"
                      [disabled]="!canManageRoles()"
                      (click)="openRoleDialog(user)"></button>
                    @if (user.status === 'locked') {
                      <button
                        pButton
                        icon="pi pi-lock-open"
                        class="p-button-text p-button-sm"
                        pTooltip="Unlock"
                        [disabled]="!canManageUsers()"
                        [loading]="busyUserId() === user.id"
                        (click)="unlockUser(user)"></button>
                    } @else {
                      <button
                        pButton
                        icon="pi pi-lock"
                        class="p-button-text p-button-sm"
                        pTooltip="Lock"
                        [disabled]="!canManageUsers()"
                        [loading]="busyUserId() === user.id"
                        (click)="openLockDialog(user)"></button>
                    }
                    @if (user.status !== 'inactive') {
                      <button
                        pButton
                        icon="pi pi-ban"
                        class="p-button-text p-button-sm p-button-danger"
                        pTooltip="Deactivate"
                        [disabled]="!canManageUsers()"
                        [loading]="busyUserId() === user.id"
                        (click)="deactivateUser(user)"></button>
                    }
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="7" class="text-center p-4">No users found.</td>
              </tr>
            </ng-template>
          </p-table>
        </p-tabPanel>

        <p-tabPanel [header]="'ADMIN.ROLES' | translate">
          <p-table [value]="roles()" [loading]="rolesLoading()" styleClass="p-datatable-sm" responsiveLayout="stack" breakpoint="960px">
            <ng-template pTemplate="header">
              <tr><th>Role</th><th>Description</th><th>Permissions</th><th>Users</th></tr>
            </ng-template>
            <ng-template pTemplate="body" let-role>
              <tr>
                <td><span class="p-column-title">Role</span><span class="user-name">{{ role.name }}</span></td>
                <td><span class="p-column-title">Description</span><span class="muted-text">{{ role.description }}</span></td>
                <td><span class="p-column-title">Permissions</span><span class="permissions-text">{{ role.permissions.join(', ') || '-' }}</span></td>
                <td><span class="p-column-title">Users</span><p-tag [value]="getRoleUserCount(role) + ' users'" severity="info"></p-tag></td>
              </tr>
            </ng-template>
          </p-table>
        </p-tabPanel>

        <p-tabPanel [header]="'ADMIN.AUDIT_LOGS' | translate">
          <div class="filters-bar">
            <span class="p-input-icon-left search-field">
              <i class="pi pi-search"></i>
              <input pInputText [(ngModel)]="auditSearch" (input)="onAuditSearch()" placeholder="Search logs..." />
            </span>
            <button pButton icon="pi pi-refresh" class="p-button-text p-button-sm" (click)="reloadAuditLogs()" [loading]="auditLoading()" pTooltip="Refresh" tooltipPosition="top"></button>
          </div>
          <p-table
            [value]="auditLogs()"
            [loading]="auditLoading()"
            [lazy]="true"
            (onLazyLoad)="onAuditLazyLoad($event)"
            [paginator]="true"
            [rows]="auditPageSize"
            [totalRecords]="auditTotalCount()"
            [rowsPerPageOptions]="[10, 20, 50, 100]"
            styleClass="p-datatable-sm"
            id="audit-logs-table">
            <ng-template pTemplate="header">
              <tr><th>Timestamp</th><th>User</th><th>Action</th><th>Module</th><th>Details</th><th>IP</th></tr>
            </ng-template>
            <ng-template pTemplate="body" let-log>
              <tr>
                <td>{{ log.timestamp | date:'MMM d, yyyy HH:mm:ss' }}</td>
                <td>{{ log.userName }}</td>
                <td><p-tag [value]="log.action" [severity]="getAuditActionSeverity(log)"></p-tag></td>
                <td>{{ log.module }}</td>
                <td class="details-cell" [pTooltip]="log.details" tooltipPosition="top">{{ log.details }}</td>
                <td><code>{{ log.ipAddress }}</code></td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr><td colspan="6" class="text-center p-4">No audit logs found.</td></tr>
            </ng-template>
          </p-table>
        </p-tabPanel>

        <p-tabPanel [header]="'ADMIN.HEALTH' | translate">
          <div *ngIf="health()" class="health-stack">
            <div class="kpi-grid">
              <div class="kpi-card" [class.success]="health()!.apiStatus === 'healthy'" [class.danger]="health()!.apiStatus !== 'healthy'">
                <div class="kpi-value">{{ health()!.apiStatus | uppercase }}</div>
                <div class="kpi-label">API Status</div>
              </div>
              <div class="kpi-card info">
                <div class="kpi-value">{{ health()!.uptime }}</div>
                <div class="kpi-label">Uptime</div>
              </div>
            </div>
          </div>
        </p-tabPanel>
      </p-tabView>

      <p-dialog
        [(visible)]="showUserDialog"
        [modal]="true"
        [draggable]="false"
        [style]="{width:'min(560px, 96vw)'}"
        header="Add User">
        <div class="dialog-form">
          <div class="form-row">
            <div class="form-field">
              <label>Username</label>
              <input pInputText [(ngModel)]="userForm.username" autocomplete="username" />
            </div>
            <div class="form-field">
              <label>Full Name</label>
              <input pInputText [(ngModel)]="userForm.fullName" />
            </div>
          </div>
          <div class="form-field">
            <label>Email</label>
            <input pInputText type="email" [(ngModel)]="userForm.email" autocomplete="email" />
          </div>
          <div class="form-field">
            <label>Password</label>
            <input pInputText type="password" [(ngModel)]="userForm.password" autocomplete="new-password" />
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Initial Role</label>
              <p-dropdown
                [options]="roleOptions()"
                [(ngModel)]="userForm.initialRoleId"
                optionLabel="label"
                optionValue="value"
                placeholder="Select role"
                styleClass="w-full"
                appendTo="body"></p-dropdown>
              @if (userForm.initialRoleId) {
                <div class="permission-preview">
                  <span class="preview-title">Role permissions</span>
                  <div class="permission-list">
                    @for (permission of getRolePermissions(userForm.initialRoleId); track permission) {
                      <p-tag [value]="permission" severity="secondary"></p-tag>
                    } @empty {
                      <span class="muted-text">No permissions</span>
                    }
                  </div>
                </div>
              }
            </div>
            <div class="form-field">
              <label>Warehouse Scope</label>
              <p-dropdown
                [options]="warehouseOptions()"
                [(ngModel)]="userForm.warehouseScope"
                optionLabel="label"
                optionValue="value"
                placeholder="Select warehouse"
                styleClass="w-full"
                appendTo="body"></p-dropdown>
            </div>
          </div>
          <div class="form-field">
            <label>Language</label>
            <input pInputText [(ngModel)]="userForm.language" placeholder="English" />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <div class="wms-dialog-footer">
            <button pButton label="Cancel" class="p-button-text" (click)="showUserDialog = false"></button>
            <button pButton label="Create User" icon="pi pi-check" [loading]="saving()" [disabled]="!canCreateUser() || !canManageUsers()" (click)="createUser()"></button>
          </div>
        </ng-template>
      </p-dialog>

      <p-dialog
        [(visible)]="showRoleDialog"
        [modal]="true"
        [draggable]="false"
        [style]="{width:'min(680px, 96vw)'}"
        header="Manage User Access">
        <div class="dialog-form">
          @if (selectedUser) {
            <div class="access-user-summary">
              <div>
                <div class="user-name">{{ selectedUser.name }}</div>
                <div class="muted-text">{{ selectedUser.email }}</div>
              </div>
              <p-tag [value]="selectedUser.status | titlecase" [severity]="getStatusSeverity(selectedUser.status)"></p-tag>
            </div>

            <div class="access-section">
              <div class="preview-title">Assigned roles</div>
              <div class="assigned-role-list">
                @for (role of selectedUser.roles; track role.id || role.roleId) {
                  <div class="assigned-role">
                    <div>
                      <div class="user-name">{{ role.roleName }}</div>
                      @if (role.warehouseScope) {
                        <div class="muted-text">{{ getWarehouseName(role.warehouseScope) }}</div>
                      }
                    </div>
                    @if (role.id) {
                      <button
                        pButton
                        icon="pi pi-trash"
                        class="p-button-text p-button-danger p-button-sm"
                        [disabled]="!canManageRoles() || busyUserId() === selectedUser.id"
                        [loading]="busyUserId() === selectedUser.id"
                        (click)="removeRole(selectedUser, role.id)"></button>
                    }
                  </div>
                } @empty {
                  <span class="muted-text">No roles assigned.</span>
                }
              </div>
            </div>

            <div class="access-section">
              <div class="preview-title">Effective permissions</div>
              <div class="permission-list">
                @for (permission of getUserPermissions(selectedUser); track permission) {
                  <p-tag [value]="permission" severity="secondary"></p-tag>
                } @empty {
                  <span class="muted-text">No permissions from assigned roles.</span>
                }
              </div>
            </div>
          }

          <div class="access-section">
            <div class="preview-title">Assign another role</div>
          </div>
          <div class="form-field">
            <label>Role</label>
            <p-dropdown
              [options]="roleOptions()"
              [(ngModel)]="roleForm.roleId"
              optionLabel="label"
              optionValue="value"
              placeholder="Select role"
              styleClass="w-full"
              appendTo="body"></p-dropdown>
            @if (roleForm.roleId) {
              <div class="permission-preview">
                <span class="preview-title">Selected role permissions</span>
                <div class="permission-list">
                  @for (permission of getRolePermissions(roleForm.roleId); track permission) {
                    <p-tag [value]="permission" severity="secondary"></p-tag>
                  } @empty {
                    <span class="muted-text">No permissions</span>
                  }
                </div>
              </div>
            }
          </div>
          <div class="form-field">
            <label>Warehouse Scope</label>
            <p-dropdown
              [options]="warehouseOptions()"
              [(ngModel)]="roleForm.warehouseScope"
              optionLabel="label"
              optionValue="value"
              placeholder="Select warehouse"
              styleClass="w-full"
              appendTo="body"></p-dropdown>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <div class="wms-dialog-footer">
            <button pButton label="Cancel" class="p-button-text" (click)="showRoleDialog = false"></button>
            <button pButton label="Assign" icon="pi pi-check" [loading]="saving()" [disabled]="!roleForm.userId || !roleForm.roleId || !roleForm.warehouseScope || !canManageRoles()" (click)="assignRole()"></button>
          </div>
        </ng-template>
      </p-dialog>

      <p-dialog
        [(visible)]="showLockDialog"
        [modal]="true"
        [draggable]="false"
        [style]="{width:'min(440px, 96vw)'}"
        header="Lock User">
        <div class="dialog-form">
          <div class="form-field">
            <label>Reason</label>
            <input pInputText [(ngModel)]="lockReason" placeholder="Reason" />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <div class="wms-dialog-footer">
            <button pButton label="Cancel" class="p-button-text" (click)="showLockDialog = false"></button>
            <button pButton label="Lock" icon="pi pi-lock" class="p-button-danger" [loading]="saving()" [disabled]="!selectedUser || !lockReason.trim()" (click)="lockUser()"></button>
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .user-name { font-weight: 600; color: var(--text-primary); }
    .muted-text { color: var(--text-muted); font-size: 0.82rem; }
    .table-actions, .role-list, .permission-list { display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; }
    .permissions-text { color: var(--text-primary); font-size: 0.78rem; }
    .compact-icon-btn { min-width: 2rem; width: 2rem; height: 2rem; }
    .dialog-form { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
    .permission-preview, .access-section { display: flex; flex-direction: column; gap: 0.5rem; }
    .preview-title { color: var(--text-secondary); font-size: 0.78rem; font-weight: 700; text-transform: uppercase; }
    .access-user-summary, .assigned-role {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      padding: 0.75rem; border: 1px solid var(--surface-border); border-radius: var(--radius-md);
      background: var(--surface-overlay);
    }
    .assigned-role-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .health-stack { display: flex; flex-direction: column; gap: 1.5rem; }
    code { font-size: 0.75rem; }
    .details-cell { max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  `],
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
  private settingsService = inject(SettingsService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  users = signal<AdminUser[]>([]);
  roles = signal<AdminRole[]>([]);
  roleOptions = signal<{ label: string; value: string }[]>([]);
  warehouseOptions = signal<{ label: string; value: string }[]>([]);
  private warehouseNameById = new Map<string, string>();
  auditLogs = signal<AuditLogEntry[]>([]);
  auditTotalCount = signal(0);
  auditPageSize = 20;
  auditFirst = 0;
  health = signal<SystemHealth | null>(null);

  usersLoading = signal(true);
  rolesLoading = signal(true);
  auditLoading = signal(true);
  saving = signal(false);
  busyUserId = signal<string | null>(null);

  showUserDialog = false;
  showRoleDialog = false;
  showLockDialog = false;
  selectedUser: AdminUser | null = null;
  auditSearch = '';
  lockReason = '';

  userForm: UserForm = this.emptyUserForm();
  roleForm: RoleForm = this.emptyRoleForm();

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
    this.loadWarehouses();
    this.adminService.getSystemHealth().subscribe(h => this.health.set(h));
  }

  loadUsers(): void {
    this.usersLoading.set(true);
    this.adminService.getUsers().subscribe({
      next: users => {
        this.users.set(users);
        this.usersLoading.set(false);
      },
      error: err => {
        this.usersLoading.set(false);
        this.showError('Failed to load users', err);
      },
    });
  }

  loadRoles(): void {
    this.rolesLoading.set(true);
    this.adminService.getRoles().subscribe({
      next: roles => {
        this.roles.set(roles);
        this.roleOptions.set(roles.map(role => ({ label: role.name, value: role.id })));
        this.rolesLoading.set(false);
      },
      error: () => this.rolesLoading.set(false),
    });
  }

  loadWarehouses(): void {
    this.settingsService.getWarehouses().subscribe({
      next: warehouses => {
        this.warehouseNameById = new Map(warehouses.map(warehouse => [warehouse.id, this.getWarehouseLabel(warehouse)]));
        this.warehouseOptions.set(warehouses.map(warehouse => ({
          label: this.getWarehouseLabel(warehouse),
          value: warehouse.id,
        })));
      },
      error: err => this.showError('Failed to load warehouses', err),
    });
  }

  onAuditLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.auditPageSize;
    const page = Math.floor((event.first ?? 0) / rows) + 1;
    this.auditFirst = event.first ?? 0;
    this.auditPageSize = rows;
    this.loadAuditLogs(page, rows);
  }

  onAuditSearch(): void {
    this.auditFirst = 0;
    this.loadAuditLogs(1, this.auditPageSize);
  }

  reloadAuditLogs(): void {
    const page = Math.floor(this.auditFirst / this.auditPageSize) + 1;
    this.loadAuditLogs(page, this.auditPageSize);
  }

  loadAuditLogs(page = 1, pageSize = this.auditPageSize): void {
    this.auditLoading.set(true);
    this.adminService.getAuditLogs({ page, pageSize }).subscribe({
      next: result => {
        let items = result.items;
        if (this.auditSearch.trim()) {
          const q = this.auditSearch.trim().toLowerCase();
          items = items.filter(log =>
            log.userName.toLowerCase().includes(q) ||
            log.action.toLowerCase().includes(q) ||
            log.module.toLowerCase().includes(q) ||
            log.details.toLowerCase().includes(q) ||
            log.ipAddress.toLowerCase().includes(q)
          );
        }
        this.auditLogs.set(items);
        this.auditTotalCount.set(result.totalCount);
        this.auditLoading.set(false);
      },
      error: () => {
        this.auditLogs.set([]);
        this.auditTotalCount.set(0);
        this.auditLoading.set(false);
      },
    });
  }

  getAuditActionSeverity(log: AuditLogEntry): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const details = log.details.toLowerCase();
    if (details.includes('succeeded: false') || details.includes('error:')) {
      return 'danger';
    }
    if (details.includes('succeeded: true')) {
      return 'success';
    }
    if (log.action.toLowerCase().includes('delete')) {
      return 'danger';
    }
    if (log.action.toLowerCase().includes('create')) {
      return 'success';
    }
    return 'info';
  }

  openUserDialog(): void {
    this.userForm = this.emptyUserForm();
    this.showUserDialog = true;
  }

  createUser(): void {
    if (!this.canCreateUser()) {
      return;
    }

    this.saving.set(true);
    this.adminService.createUser(this.userForm).subscribe({
      next: () => {
        this.saving.set(false);
        this.showUserDialog = false;
        this.loadUsers();
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'User created successfully.' });
      },
      error: err => {
        this.saving.set(false);
        this.showError('Failed to create user', err);
      },
    });
  }

  openRoleDialog(user: AdminUser): void {
    this.selectedUser = user;
    this.roleForm = { ...this.emptyRoleForm(), userId: user.id, warehouseScope: user.warehouseId ?? '' };
    this.showRoleDialog = true;
  }

  assignRole(): void {
    if (!this.roleForm.userId || !this.roleForm.roleId) {
      return;
    }

    this.saving.set(true);
    this.adminService.assignRole(this.roleForm.userId, {
      roleId: this.roleForm.roleId,
      warehouseScope: this.roleForm.warehouseScope,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showRoleDialog = false;
        this.loadUsers();
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Role assigned successfully.' });
      },
      error: err => {
        this.saving.set(false);
        this.showError('Failed to assign role', err);
      },
    });
  }

  removeRole(user: AdminUser, roleAssignmentId: string): void {
    this.busyUserId.set(user.id);
    this.adminService.removeRole(user.id, roleAssignmentId).subscribe({
      next: () => {
        this.busyUserId.set(null);
        this.loadUsers();
        this.messageService.add({ severity: 'success', summary: 'Removed', detail: 'Role removed successfully.' });
      },
      error: err => {
        this.busyUserId.set(null);
        this.showError('Failed to remove role', err);
      },
    });
  }

  openLockDialog(user: AdminUser): void {
    this.selectedUser = user;
    this.lockReason = '';
    this.showLockDialog = true;
  }

  lockUser(): void {
    if (!this.selectedUser || !this.lockReason.trim()) {
      return;
    }

    const userId = this.selectedUser.id;
    this.saving.set(true);
    this.adminService.lockUser(userId, this.lockReason.trim()).subscribe({
      next: () => {
        this.saving.set(false);
        this.showLockDialog = false;
        this.loadUsers();
        this.messageService.add({ severity: 'success', summary: 'Locked', detail: 'User locked successfully.' });
      },
      error: err => {
        this.saving.set(false);
        this.showError('Failed to lock user', err);
      },
    });
  }

  unlockUser(user: AdminUser): void {
    this.busyUserId.set(user.id);
    this.adminService.unlockUser(user.id).subscribe({
      next: () => {
        this.busyUserId.set(null);
        this.loadUsers();
        this.messageService.add({ severity: 'success', summary: 'Unlocked', detail: 'User unlocked successfully.' });
      },
      error: err => {
        this.busyUserId.set(null);
        this.showError('Failed to unlock user', err);
      },
    });
  }

  deactivateUser(user: AdminUser): void {
    this.busyUserId.set(user.id);
    this.adminService.deactivateUser(user.id).subscribe({
      next: () => {
        this.busyUserId.set(null);
        this.loadUsers();
        this.messageService.add({ severity: 'success', summary: 'Deactivated', detail: 'User deactivated successfully.' });
      },
      error: err => {
        this.busyUserId.set(null);
        this.showError('Failed to deactivate user', err);
      },
    });
  }

  canCreateUser(): boolean {
    return !!(
      this.userForm.username.trim() &&
      this.userForm.email.trim() &&
      this.userForm.fullName.trim() &&
      this.userForm.password &&
      this.userForm.initialRoleId.trim() &&
      this.userForm.warehouseScope.trim() &&
      this.userForm.language.trim()
    );
  }

  canManageUsers(): boolean {
    return this.authService.hasPermission('users:write');
  }

  canManageRoles(): boolean {
    return this.authService.hasPermission('roles:write');
  }

  getRolePermissions(roleId: string): string[] {
    return this.roles().find(role => role.id === roleId)?.permissions ?? [];
  }

  getRoleUserCount(role: AdminRole): number {
    return this.users().filter(user =>
      user.roles.some(assignment => assignment.roleId === role.id || assignment.roleName === role.name)
    ).length;
  }

  getUserPermissions(user: AdminUser): string[] {
    const permissions = new Set<string>();
    const roles = this.roles();

    user.roles.forEach(assignment => {
      const role = roles.find(item => item.id === assignment.roleId || item.name === assignment.roleName);
      role?.permissions.forEach(permission => permissions.add(permission));
    });

    return [...permissions].sort();
  }

  getWarehouseName(warehouseId: string): string {
    return this.warehouseNameById.get(warehouseId) ?? warehouseId;
  }

  getStatusSeverity(status: AdminUser['status']): 'success' | 'secondary' | 'info' | 'warning' | 'danger' {
    switch (status) {
      case 'active':
        return 'success';
      case 'locked':
        return 'warning';
      case 'inactive':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  private emptyUserForm(): UserForm {
    return {
      username: '',
      email: '',
      fullName: '',
      password: '',
      initialRoleId: '',
      warehouseScope: '',
      language: 'English',
    };
  }

  private emptyRoleForm(): RoleForm {
    return {
      userId: '',
      roleId: '',
      warehouseScope: '',
    };
  }

  private getWarehouseLabel(warehouse: Warehouse): string {
    const parts = [warehouse.code, warehouse.name].filter(Boolean);
    return parts.length ? parts.join(' - ') : warehouse.id;
  }

  private showError(fallback: string, err: unknown): void {
    const detail =
      (err as { error?: { message?: string; title?: string } })?.error?.message ||
      (err as { error?: { message?: string; title?: string } })?.error?.title ||
      (err as { message?: string })?.message ||
      fallback;

    this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 6000 });
  }
}
