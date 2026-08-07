// src/app/features/settings/settings.component.ts

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TabViewModule } from 'primeng/tabview';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SettingsService } from './settings.service';
import { Warehouse } from './warehouse.model';
import { WarehouseSetupWizardComponent } from './warehouse-setup-wizard.component';
import {
  PageShellComponent,
  PageHeaderComponent,
  FiltersBarComponent,
  SectionCardComponent,
} from '../../shared/ui';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    TabViewModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    DialogModule,
    SkeletonModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    DividerModule,
    WarehouseSetupWizardComponent,
    PageShellComponent,
    PageHeaderComponent,
    FiltersBarComponent,
    SectionCardComponent,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <app-page-shell>
      <app-page-header
        [title]="'SETTINGS.TITLE' | translate"
        [subtitle]="'SETTINGS.SUBTITLE' | translate">
        <div actions class="page-header__actions">
          <button
            pButton
            type="button"
            icon="pi pi-refresh"
            class="p-button-outlined p-button-sm"
            [label]="'SETTINGS.REFRESH' | translate"
            [loading]="loading()"
            (click)="loadWarehouses()"></button>
        </div>
      </app-page-header>

      <p-tabView styleClass="settings-tabs">
        <p-tabPanel [header]="'SETTINGS.WAREHOUSE_SETUP' | translate">
          <div class="settings-stat-grid">
            <div class="settings-stat">
              <div class="settings-stat__icon settings-stat__icon--total">
                <i class="pi pi-building"></i>
              </div>
              <div>
                <div class="settings-stat__value">{{ warehouseStats().total }}</div>
                <div class="settings-stat__label">{{ 'SETTINGS.STAT_TOTAL' | translate }}</div>
              </div>
            </div>
            <div class="settings-stat">
              <div class="settings-stat__icon settings-stat__icon--active">
                <i class="pi pi-check-circle"></i>
              </div>
              <div>
                <div class="settings-stat__value">{{ warehouseStats().active }}</div>
                <div class="settings-stat__label">{{ 'SETTINGS.STAT_ACTIVE' | translate }}</div>
              </div>
            </div>
            <div class="settings-stat">
              <div class="settings-stat__icon settings-stat__icon--setup">
                <i class="pi pi-cog"></i>
              </div>
              <div>
                <div class="settings-stat__value">{{ warehouseStats().underSetup }}</div>
                <div class="settings-stat__label">{{ 'SETTINGS.STAT_SETUP' | translate }}</div>
              </div>
            </div>
          </div>

          <app-filters-bar>
            <span class="p-input-icon-left search-field">
              <i class="pi pi-search"></i>
              <input
                pInputText
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                [placeholder]="'SETTINGS.SEARCH_WAREHOUSES' | translate"
                style="width: 100%" />
            </span>
            <button
              pButton
              type="button"
              icon="pi pi-filter-slash"
              class="p-button-text p-button-sm"
              [label]="'COMMON.CLEAR' | translate"
              (click)="searchQuery.set('')"
              [disabled]="!searchQuery()"></button>
          </app-filters-bar>

          <app-section-card [title]="'SETTINGS.WAREHOUSE_LIST' | translate" [tableBody]="true">
            <div headerActions>
              <button
                pButton
                type="button"
                icon="pi pi-plus"
                class="p-button-sm"
                [label]="'SETTINGS.ADD_WAREHOUSE' | translate"
                (click)="openAddWarehouseDialog()"></button>
            </div>

            <p-table
              [value]="filteredWarehouses()"
              [loading]="loading()"
              styleClass="p-datatable-sm"
              responsiveLayout="stack"
              breakpoint="960px"
              [paginator]="true"
              [rows]="10"
              [rowsPerPageOptions]="[10, 25, 50]"
              [showCurrentPageReport]="true"
              currentPageReportTemplate="{first}–{last} / {totalRecords}"
              [scrollable]="filteredWarehouses().length > 8"
              [scrollHeight]="filteredWarehouses().length > 8 ? 'min(420px, 50vh)' : undefined">
              <ng-template pTemplate="header">
                <tr>
                  <th style="min-width: 100px">{{ 'SETTINGS.CODE' | translate }}</th>
                  <th style="min-width: 160px">{{ 'SETTINGS.NAME' | translate }}</th>
                  <th style="min-width: 120px">{{ 'SETTINGS.CITY' | translate }}</th>
                  <th style="min-width: 100px">{{ 'SETTINGS.AREA_M2' | translate }}</th>
                  <th style="min-width: 110px">{{ 'SETTINGS.STATUS' | translate }}</th>
                  <th style="min-width: 140px; text-align: right">{{ 'COMMON.ACTIONS' | translate }}</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-warehouse>
                <tr>
                  <td>
                    <span class="p-column-title">{{ 'SETTINGS.CODE' | translate }}</span>
                    <span class="code-text">{{ warehouse.code }}</span>
                  </td>
                  <td>
                    <span class="p-column-title">{{ 'SETTINGS.NAME' | translate }}</span>
                    <div class="warehouse-name-cell">
                      <strong>{{ warehouse.name }}</strong>
                      <small>{{ warehouse.timezone }}</small>
                    </div>
                  </td>
                  <td>
                    <span class="p-column-title">{{ 'SETTINGS.CITY' | translate }}</span>
                    {{ warehouse.address?.city }}
                  </td>
                  <td>
                    <span class="p-column-title">{{ 'SETTINGS.AREA_M2' | translate }}</span>
                    {{ warehouse.dimensions?.totalAreaM2 | number }} m²
                  </td>
                  <td>
                    <span class="p-column-title">{{ 'SETTINGS.STATUS' | translate }}</span>
                    <p-tag
                      [value]="warehouse.operationalStatus"
                      [severity]="getStatusSeverity(warehouse.operationalStatus)"></p-tag>
                  </td>
                  <td>
                    <span class="p-column-title">{{ 'COMMON.ACTIONS' | translate }}</span>
                    <div class="warehouse-actions">
  @if (canActivate(warehouse)) {
    <button
      pButton
      type="button"
      icon="pi pi-check-circle"
      severity="success"
      rounded="true"
      outlined="true"
      class="p-button-sm"
      [pTooltip]="'SETTINGS.ACTIVATE_WAREHOUSE' | translate"
      [loading]="activatingId() === warehouse.id"
      (click)="confirmActivateWarehouse(warehouse)">
    </button>
  }

  <button
    pButton
    type="button"
    icon="pi pi-sitemap"
    severity="info"
    rounded="true"
    outlined="true"
    class="p-button-sm"
    [pTooltip]="'SETTINGS.SETUP_LAYOUT' | translate"
    (click)="openSetupWizard(warehouse)">
  </button>

  <button
    pButton
    type="button"
    icon="pi pi-pencil"
    severity="warning"
    rounded="true"
    outlined="true"
    class="p-button-sm"
    [pTooltip]="'COMMON.EDIT' | translate"
    (click)="editWarehouse(warehouse)">
  </button>

  <button
    pButton
    type="button"
    icon="pi pi-trash"
    severity="danger"
    rounded="true"
    outlined="true"
    class="p-button-sm"
    [pTooltip]="'COMMON.DELETE' | translate"
    (click)="deleteWarehouse(warehouse)">
  </button>
</div>
                  </td>
                </tr>
              </ng-template>

              <ng-template pTemplate="loading">
                @for (i of [1, 2, 3, 4, 5]; track i) {
                  <tr>
                    <td colspan="6"><p-skeleton height="2rem"></p-skeleton></td>
                  </tr>
                }
              </ng-template>

              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="6" class="text-center p-4">
                    @if (searchQuery()) {
                      {{ 'SETTINGS.NO_SEARCH_RESULTS' | translate }}
                    } @else {
                      {{ 'SETTINGS.NO_WAREHOUSES' | translate }}
                    }
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </app-section-card>
        </p-tabPanel>

        <p-tabPanel [header]="'SETTINGS.UOM_CONFIG' | translate">
          <div class="coming-soon-panel">
            <i class="pi pi-box"></i>
            <p>{{ 'SETTINGS.COMING_SOON' | translate }}</p>
          </div>
        </p-tabPanel>

        <p-tabPanel [header]="'SETTINGS.STRATEGIES' | translate">
          <div class="coming-soon-panel">
            <i class="pi pi-sliders-h"></i>
            <p>{{ 'SETTINGS.COMING_SOON' | translate }}</p>
          </div>
        </p-tabPanel>

        <p-tabPanel [header]="'SETTINGS.NOTIFICATIONS' | translate">
          <div class="coming-soon-panel">
            <i class="pi pi-bell"></i>
            <p>{{ 'SETTINGS.COMING_SOON' | translate }}</p>
          </div>
        </p-tabPanel>

        <p-tabPanel [header]="'SETTINGS.INTEGRATIONS' | translate">
          <div class="coming-soon-panel">
            <i class="pi pi-link"></i>
            <p>{{ 'SETTINGS.COMING_SOON' | translate }}</p>
          </div>
        </p-tabPanel>
      </p-tabView>
    </app-page-shell>

    <p-dialog
      styleClass="wms-dialog"
      [visible]="displayWarehouseDialog()"
      (visibleChange)="displayWarehouseDialog.set($event)"
      [header]="(isEditMode() ? 'SETTINGS.EDIT_WAREHOUSE' : 'SETTINGS.CREATE_WAREHOUSE') | translate"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: 'min(840px, 96vw)' }"
      [breakpoints]="{ '768px': '96vw' }"
      [maximizable]="true">
      <form [formGroup]="warehouseForm">
        <section class="form-section">
          <h4 class="form-section__title">
            <i class="pi pi-id-card"></i>
            {{ 'SETTINGS.SECTION_IDENTITY' | translate }}
          </h4>
          <div class="form-row">
            <div class="form-field">
              <label>{{ 'SETTINGS.CODE' | translate }} *</label>
              <input pInputText formControlName="code" [readonly]="isEditMode()" />
            </div>
            <div class="form-field">
              <label>{{ 'SETTINGS.NAME' | translate }} *</label>
              <input pInputText formControlName="name" />
            </div>
            <div class="form-field">
              <label>{{ 'SETTINGS.TIMEZONE' | translate }} *</label>
              <input pInputText formControlName="timezone" />
            </div>
          </div>
        </section>

        <p-divider></p-divider>

        <section class="form-section">
          <h4 class="form-section__title">
            <i class="pi pi-map-marker"></i>
            {{ 'SETTINGS.SECTION_ADDRESS' | translate }}
          </h4>
          <div class="form-row">
            <div class="form-field">
              <label>{{ 'SETTINGS.STREET' | translate }} *</label>
              <input pInputText formControlName="street" />
            </div>
            <div class="form-field">
              <label>{{ 'SETTINGS.CITY' | translate }} *</label>
              <input pInputText formControlName="city" />
            </div>
            <div class="form-field">
              <label>{{ 'SETTINGS.REGION' | translate }} *</label>
              <input pInputText formControlName="region" />
            </div>
            <div class="form-field">
              <label>{{ 'SETTINGS.POSTAL_CODE' | translate }} *</label>
              <input pInputText formControlName="postalCode" />
            </div>
            <div class="form-field">
              <label>{{ 'SETTINGS.COUNTRY' | translate }} *</label>
              <input pInputText formControlName="country" />
            </div>
            <div class="form-field">
              <label>{{ 'SETTINGS.LATITUDE' | translate }} *</label>
              <p-inputNumber formControlName="latitude" [showButtons]="true" styleClass="w-full"></p-inputNumber>
            </div>
            <div class="form-field">
              <label>{{ 'SETTINGS.LONGITUDE' | translate }} *</label>
              <p-inputNumber formControlName="longitude" [showButtons]="true" styleClass="w-full"></p-inputNumber>
            </div>
          </div>
        </section>

        <p-divider></p-divider>

        <section class="form-section">
          <h4 class="form-section__title">
            <i class="pi pi-expand"></i>
            {{ 'SETTINGS.SECTION_DIMENSIONS' | translate }}
          </h4>
          <div class="form-row">
            <div class="form-field">
              <label>{{ 'SETTINGS.TOTAL_AREA' | translate }} *</label>
              <p-inputNumber formControlName="totalAreaM2" [showButtons]="true" styleClass="w-full"></p-inputNumber>
            </div>
            <div class="form-field">
              <label>{{ 'SETTINGS.USABLE_AREA' | translate }} *</label>
              <p-inputNumber formControlName="usableAreaM2" [showButtons]="true" styleClass="w-full"></p-inputNumber>
            </div>
            <div class="form-field">
              <label>{{ 'SETTINGS.CEILING_HEIGHT' | translate }} *</label>
              <p-inputNumber formControlName="ceilingHeightM" [showButtons]="true" styleClass="w-full"></p-inputNumber>
            </div>
          </div>
        </section>
      </form>

      <ng-template pTemplate="footer">
        <div class="wms-dialog-footer">
          <button
            pButton
            type="button"
            class="p-button-outlined"
            [label]="'COMMON.CANCEL' | translate"
            (click)="displayWarehouseDialog.set(false)"></button>
          <button
            pButton
            type="button"
            class="p-button-success"
            icon="pi pi-check"
            [label]="'COMMON.SAVE' | translate"
            (click)="saveWarehouse()"
            [disabled]="warehouseForm.invalid"></button>
        </div>
      </ng-template>
    </p-dialog>

    <p-dialog
      styleClass="wms-dialog setup-dialog"
      [visible]="displaySetupWizard()"
      (visibleChange)="displaySetupWizard.set($event)"
      [header]="'SETTINGS.SETUP_LAYOUT' | translate"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: 'min(800px, 96vw)' }"
      [breakpoints]="{ '768px': '96vw', '576px': '100vw' }"
      [contentStyle]="{ overflow: 'auto', maxHeight: 'calc(100vh - 12rem)' }">
      @if (setupWarehouse(); as wh) {
        <app-warehouse-setup-wizard
          [warehouse]="wh"
          (completed)="onSetupCompleted()"
          (cancelled)="closeSetupWizard()" />
      }
    </p-dialog>
  `,
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmService = inject(ConfirmationService);
  private translate = inject(TranslateService);

  warehouses = signal<Warehouse[]>([]);
  searchQuery = signal('');
  loading = signal(false);

  warehouseStats = computed(() => {
    const list = this.warehouses();
    return {
      total: list.length,
      active: list.filter((w) => w.operationalStatus === 'Active').length,
      underSetup: list.filter((w) => w.operationalStatus === 'UnderSetup').length,
    };
  });

  filteredWarehouses = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.warehouses();
    if (!q) return list;
    return list.filter(
      (w) =>
        w.code?.toLowerCase().includes(q) ||
        w.name?.toLowerCase().includes(q) ||
        w.address?.city?.toLowerCase().includes(q)
    );
  });
  displayWarehouseDialog = signal(false);
  displaySetupWizard = signal(false);
  setupWarehouse = signal<Warehouse | null>(null);
  setupSaving = signal(false);
  activatingId = signal<string | null>(null);
  isEditMode = signal(false);
  currentWarehouseId: string | null = null;

  warehouseForm = this.fb.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    street: ['', Validators.required],
    city: ['', Validators.required],
    region: ['', Validators.required],
    postalCode: ['', Validators.required],
    country: ['', Validators.required],
    latitude: [0, Validators.required],
    longitude: [0, Validators.required],
    totalAreaM2: [0, Validators.required],
    usableAreaM2: [0, Validators.required],
    ceilingHeightM: [0, Validators.required],
    timezone: ['UTC', Validators.required],
  });

  ngOnInit() {
    this.loadWarehouses();
  }

  loadWarehouses() {
    this.loading.set(true);
    this.settingsService.getWarehouses().subscribe({
      next: (data) => {
        this.warehouses.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading warehouses:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load warehouses',
          life: 5000
        });
        this.loading.set(false);
      }
    });
  }

  openSetupWizard(warehouse: Warehouse) {
    this.setupWarehouse.set(warehouse);
    this.displaySetupWizard.set(true);
  }

  closeSetupWizard() {
    this.displaySetupWizard.set(false);
    this.setupWarehouse.set(null);
  }

  onSetupCompleted() {
    const warehouse = this.setupWarehouse();
    this.closeSetupWizard();
    this.loadWarehouses();

    if (warehouse && this.canActivate(warehouse)) {
      this.confirmService.confirm({
        message: this.translate.instant('SETTINGS.ACTIVATE_AFTER_SETUP_MSG', {
          name: warehouse.name,
        }),
        header: this.translate.instant('SETTINGS.ACTIVATE_WAREHOUSE'),
        icon: 'pi pi-check-circle',
        acceptLabel: this.translate.instant('SETTINGS.ACTIVATE_WAREHOUSE'),
        rejectLabel: this.translate.instant('COMMON.CANCEL'),
        accept: () => this.activateWarehouse(warehouse),
      });
    }
  }

  canActivate(warehouse: Warehouse): boolean {
    return warehouse.operationalStatus === 'UnderSetup';
  }

  confirmActivateWarehouse(warehouse: Warehouse) {
    this.confirmService.confirm({
      message: this.translate.instant('SETTINGS.ACTIVATE_CONFIRM_MSG', {
        name: warehouse.name,
        code: warehouse.code,
      }),
      header: this.translate.instant('SETTINGS.ACTIVATE_WAREHOUSE'),
      icon: 'pi pi-check-circle',
      acceptLabel: this.translate.instant('SETTINGS.ACTIVATE_WAREHOUSE'),
      rejectLabel: this.translate.instant('COMMON.CANCEL'),
      accept: () => this.activateWarehouse(warehouse),
    });
  }

  activateWarehouse(warehouse: Warehouse) {
    this.activatingId.set(warehouse.id);
    this.settingsService.activateWarehouse(warehouse.id).subscribe({
      next: () => {
        this.activatingId.set(null);
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('COMMON.SUCCESS'),
          detail: this.translate.instant('SETTINGS.ACTIVATE_SUCCESS', { name: warehouse.name }),
          life: 5000,
        });
        this.loadWarehouses();
      },
      error: (err) => {
        this.activatingId.set(null);
        console.error('Error activating warehouse:', err);
        const apiMsg =
          (err as { error?: { message?: string; title?: string } })?.error?.message ||
          (err as { message?: string })?.message;
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('COMMON.ERROR'),
          detail: apiMsg || this.translate.instant('SETTINGS.ACTIVATE_FAILED'),
          life: 6000,
        });
      },
    });
  }

  openAddWarehouseDialog() {
    this.isEditMode.set(false);
    this.currentWarehouseId = null;
    this.warehouseForm.reset({ timezone: 'UTC', latitude: 0, longitude: 0, totalAreaM2: 0, usableAreaM2: 0, ceilingHeightM: 0 });
    this.displayWarehouseDialog.set(true);
  }

  editWarehouse(warehouse: Warehouse) {
    this.isEditMode.set(true);
    this.currentWarehouseId = warehouse.id;
    this.warehouseForm.patchValue({
      code: warehouse.code,
      name: warehouse.name,
      street: warehouse.address.street,
      city: warehouse.address.city,
      region: warehouse.address.region,
      postalCode: warehouse.address.postalCode,
      country: warehouse.address.country,
      latitude: warehouse.address.coordinates.latitude,
      longitude: warehouse.address.coordinates.longitude,
      totalAreaM2: warehouse.dimensions.totalAreaM2,
      usableAreaM2: warehouse.dimensions.usableAreaM2,
      ceilingHeightM: warehouse.dimensions.ceilingHeightM,
      timezone: warehouse.timezone,
    });
    this.displayWarehouseDialog.set(true);
  }

  saveWarehouse() {
    if (this.warehouseForm.invalid) return;

    const formData = this.warehouseForm.value as any;

    if (this.isEditMode() && this.currentWarehouseId) {
      this.settingsService.updateWarehouse(this.currentWarehouseId, formData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Warehouse updated successfully',
          });
          this.displayWarehouseDialog.set(false);
          this.loadWarehouses();
        },
        error: (err) => {
          console.error('Error updating warehouse:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update warehouse',
            life: 5000
          });
        }
      });
    } else {
      this.settingsService.createWarehouse(formData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Warehouse created successfully',
          });
          this.displayWarehouseDialog.set(false);
          this.loadWarehouses();
        },
        error: (err) => {
          console.error('Error creating warehouse:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create warehouse',
            life: 5000
          });
        }
      });
    }
  }

  deleteWarehouse(warehouse: Warehouse) {
    this.confirmService.confirm({
      message: `Delete warehouse "${warehouse.name}"?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.settingsService.deleteWarehouse(warehouse.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Warehouse deleted successfully',
            });
            this.loadWarehouses();
          },
          error: (err) => {
            console.error('Error deleting warehouse:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete warehouse',
              life: 5000
            });
          }
        });
      }
    });
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' {
    switch (status) {
      case 'Active': return 'success';
      case 'UnderSetup': return 'warning';
      case 'Maintenance': return 'info';
      case 'Inactive': return 'danger';
      default: return 'secondary';
    }
  }
}
