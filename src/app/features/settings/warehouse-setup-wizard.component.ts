import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { StepsModule } from 'primeng/steps';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { MessageModule } from 'primeng/message';
import { MenuItem, MessageService } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { getApiErrorMessage } from '../../core/utils/api-error.util';
import { WarehouseLayoutService } from './warehouse-layout.service';
import { Warehouse } from './warehouse.model';
import { WarehouseLayoutContext } from './warehouse-layout.model';
import { ZONE_TYPE_OPTIONS, STORAGE_TYPE_OPTIONS } from './warehouse-layout.constants';

function minLessThanMax(minKey: string, maxKey: string) {
  return (group: AbstractControl): ValidationErrors | null => {
    const min = Number(group.get(minKey)?.value);
    const max = Number(group.get(maxKey)?.value);
    if (!Number.isNaN(min) && !Number.isNaN(max) && min >= max) {
      return { rangeInvalid: { minKey, maxKey } };
    }
    return null;
  };
}

@Component({
  selector: 'app-warehouse-setup-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    StepsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    ProgressBarModule,
    TagModule,
    DropdownModule,
    MessageModule,
  ],
  template: `
    <div class="setup-wizard">
      <div class="setup-wizard__hero">
        <div class="setup-wizard__icon" aria-hidden="true">
          <i class="pi pi-building"></i>
        </div>
        <div class="setup-wizard__meta">
          <h3>{{ warehouse.name }}</h3>
          <p>
            <span class="code-text">{{ warehouse.code }}</span>
            · {{ 'SETTINGS.SETUP_INTRO_SHORT' | translate }}
          </p>
          <div class="setup-wizard__progress">
            <div class="setup-wizard__progress-label">
              <span>{{ 'SETTINGS.SETUP_PROGRESS' | translate }}</span>
              <span>{{ progressPercent() }}%</span>
            </div>
            <p-progressBar [value]="progressPercent()" [showValue]="false" styleClass="h-1rem"></p-progressBar>
          </div>
        </div>
        <p-tag
          [value]="warehouse.operationalStatus"
          [severity]="statusSeverity(warehouse.operationalStatus)"
          styleClass="flex-shrink-0" />
      </div>

      <div class="setup-steps">
        <p-steps [model]="steps" [activeIndex]="activeStep()" [readonly]="true"></p-steps>
      </div>

      @if (warehouse.operationalStatus === 'Active') {
        <p-message severity="warn" [text]="'SETTINGS.SETUP_ACTIVE_BLOCKED' | translate" styleClass="w-full"></p-message>
      }

      @if (lastApiError()) {
        <div class="setup-error-banner" role="alert">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ lastApiError() }}</span>
        </div>
      }

      <div class="setup-step-panel">
        <h4 class="setup-step-panel__heading">{{ currentStepTitle() }}</h4>

        @switch (activeStep()) {
          @case (0) {
            <form [formGroup]="zoneForm">
              <div class="form-row">
                <div class="form-field">
                  <label for="zone-code">{{ 'SETTINGS.ZONE_CODE' | translate }} *</label>
                  <input pInputText id="zone-code" formControlName="code" />
                </div>
                <div class="form-field">
                  <label for="zone-name">{{ 'SETTINGS.ZONE_NAME' | translate }} *</label>
                  <input pInputText id="zone-name" formControlName="name" />
                </div>
              </div>
              <div class="form-subsection">
                <p class="form-subsection__title">{{ 'SETTINGS.ZONE_CLASSIFICATION' | translate }}</p>
                <div class="form-row">
                  <div class="form-field">
                    <label for="zone-type">{{ 'SETTINGS.ZONE_TYPE' | translate }} *</label>
                    <p-dropdown
                      id="zone-type"
                      formControlName="zoneType"
                      [options]="zoneTypeOptions"
                      optionLabel="label"
                      optionValue="value"
                      [placeholder]="'SETTINGS.SELECT_ZONE_TYPE' | translate"
                      styleClass="w-full"
                      appendTo="body"></p-dropdown>
                  </div>
                  <div class="form-field">
                    <label for="storage-type">{{ 'SETTINGS.STORAGE_TYPE' | translate }} *</label>
                    <p-dropdown
                      id="storage-type"
                      formControlName="storageType"
                      [options]="storageTypeOptions"
                      optionLabel="label"
                      optionValue="value"
                      [placeholder]="'SETTINGS.SELECT_STORAGE_TYPE' | translate"
                      styleClass="w-full"
                      appendTo="body"></p-dropdown>
                  </div>
                </div>
              </div>
              <div class="form-subsection">
                <p class="form-subsection__title">{{ 'SETTINGS.ZONE_ENVIRONMENT' | translate }}</p>
                <div class="form-row">
                  <div class="form-field">
                    <label>{{ 'SETTINGS.TEMP_MIN' | translate }}</label>
                    <p-inputNumber formControlName="tempMinCelsius" [showButtons]="true" styleClass="w-full"></p-inputNumber>
                  </div>
                  <div class="form-field">
                    <label>{{ 'SETTINGS.TEMP_MAX' | translate }}</label>
                    <p-inputNumber formControlName="tempMaxCelsius" [showButtons]="true" styleClass="w-full"></p-inputNumber>
                  </div>
                  <div class="form-field">
                    <label>{{ 'SETTINGS.HUMIDITY_MIN' | translate }}</label>
                    <p-inputNumber formControlName="humidityMinPercent" [showButtons]="true" styleClass="w-full"></p-inputNumber>
                  </div>
                  <div class="form-field">
                    <label>{{ 'SETTINGS.HUMIDITY_MAX' | translate }}</label>
                    <p-inputNumber formControlName="humidityMaxPercent" [showButtons]="true" styleClass="w-full"></p-inputNumber>
                  </div>
                </div>
                @if (zoneForm.errors?.['rangeInvalid']) {
                  <small class="field-error">{{ 'SETTINGS.RANGE_INVALID' | translate }}</small>
                }
              </div>
            </form>
          }
          @case (1) {
            <p class="setup-step-hint">{{ 'SETTINGS.AISLE_HINT' | translate }}</p>
            <form [formGroup]="aisleForm">
              <div class="form-field" style="max-width: 320px;">
                <label for="aisle-code">{{ 'SETTINGS.AISLE_CODE' | translate }} *</label>
                <input pInputText id="aisle-code" formControlName="code" />
              </div>
            </form>
            @if (ctx().zoneId) {
              <div class="setup-ctx-chips">
                <span class="setup-ctx-chip">Zone: {{ ctx().zoneId }}</span>
              </div>
            }
          }
          @case (2) {
            <p class="setup-step-hint">{{ 'SETTINGS.RACK_HINT' | translate }}</p>
            <form [formGroup]="rackForm">
              <div class="form-field" style="max-width: 320px;">
                <label for="rack-code">{{ 'SETTINGS.RACK_CODE' | translate }} *</label>
                <input pInputText id="rack-code" formControlName="code" />
              </div>
            </form>
            @if (ctx().aisleId) {
              <div class="setup-ctx-chips">
                <span class="setup-ctx-chip">Zone: {{ ctx().zoneId }}</span>
                <span class="setup-ctx-chip">Aisle: {{ ctx().aisleId }}</span>
              </div>
            }
          }
          @case (3) {
            <p class="setup-step-hint">{{ 'SETTINGS.SHELF_HINT' | translate }}</p>
            <form [formGroup]="shelfForm">
              <div class="form-row">
                <div class="form-field">
                  <label for="shelf-code">{{ 'SETTINGS.SHELF_CODE' | translate }} *</label>
                  <input pInputText id="shelf-code" formControlName="code" />
                </div>
                <div class="form-field">
                  <label for="shelf-level">{{ 'SETTINGS.SHELF_LEVEL' | translate }} *</label>
                  <p-inputNumber id="shelf-level" formControlName="level" [showButtons]="true" [min]="1" styleClass="w-full"></p-inputNumber>
                </div>
              </div>
            </form>
            @if (ctx().rackId) {
              <div class="setup-ctx-chips">
                <span class="setup-ctx-chip">Rack: {{ ctx().rackId }}</span>
              </div>
            }
          }
        }

        @if (lastCreatedSummary()) {
          <div class="setup-success-banner">
            <i class="pi pi-check-circle"></i>
            <span>{{ lastCreatedSummary() }}</span>
          </div>
        }
      </div>

      <footer class="setup-wizard__footer">
        <button
          pButton
          type="button"
          class="p-button-outlined p-button-sm"
          [label]="'COMMON.CANCEL' | translate"
          (click)="onCancel()"
          [disabled]="saving()"></button>
        <div class="setup-wizard__footer-main">
          @if (activeStep() > 0) {
            <button
              pButton
              type="button"
              class="p-button-secondary p-button-sm"
              icon="pi pi-arrow-left"
              [label]="'COMMON.BACK' | translate"
              (click)="goBack()"
              [disabled]="saving()"></button>
          }
          <button
            pButton
            type="button"
            class="p-button-success p-button-sm"
            [label]="activeStep() === 3 ? ('SETTINGS.FINISH_SETUP' | translate) : ('COMMON.NEXT' | translate)"
            [icon]="saving() ? 'pi pi-spin pi-spinner' : 'pi pi-arrow-right'"
            iconPos="right"
            (click)="onNext()"
            [disabled]="saving() || !canSubmitStep()"></button>
        </div>
      </footer>
    </div>
  `,
})
export class WarehouseSetupWizardComponent implements OnInit {
  @Input({ required: true }) warehouse!: Warehouse;
  @Output() completed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private layoutService = inject(WarehouseLayoutService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);

  activeStep = signal(0);
  saving = signal(false);
  ctx = signal<WarehouseLayoutContext>({ warehouseId: '' });
  lastCreatedSummary = signal<string | null>(null);
  lastApiError = signal<string | null>(null);
  steps: MenuItem[] = [];

  readonly zoneTypeOptions = [...ZONE_TYPE_OPTIONS];
  readonly storageTypeOptions = [...STORAGE_TYPE_OPTIONS];

  zoneForm = this.fb.group(
    {
      code: ['', [Validators.required, Validators.pattern(/\S+/)]],
      name: ['', [Validators.required, Validators.pattern(/\S+/)]],
      zoneType: ['Storage', Validators.required],
      storageType: ['Ambient', Validators.required],
      tempMinCelsius: [15, Validators.required],
      tempMaxCelsius: [25, Validators.required],
      humidityMinPercent: [40, Validators.required],
      humidityMaxPercent: [60, Validators.required],
    },
    {
      validators: [
        minLessThanMax('tempMinCelsius', 'tempMaxCelsius'),
        minLessThanMax('humidityMinPercent', 'humidityMaxPercent'),
      ],
    }
  );

  aisleForm = this.fb.group({
    code: ['', Validators.required],
  });

  rackForm = this.fb.group({
    code: ['', Validators.required],
  });

  shelfForm = this.fb.group({
    code: ['', Validators.required],
    level: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.ctx.set({ warehouseId: this.warehouse.id });
    this.steps = [
      { label: this.translate.instant('SETTINGS.STEP_ZONE') },
      { label: this.translate.instant('SETTINGS.STEP_AISLE') },
      { label: this.translate.instant('SETTINGS.STEP_RACK') },
      { label: this.translate.instant('SETTINGS.STEP_SHELF') },
    ];
  }

  progressPercent(): number {
    return Math.round(((this.activeStep() + 1) / 4) * 100);
  }

  currentStepTitle(): string {
    const keys = [
      'SETTINGS.STEP_ZONE_TITLE',
      'SETTINGS.STEP_AISLE_TITLE',
      'SETTINGS.STEP_RACK_TITLE',
      'SETTINGS.STEP_SHELF_TITLE',
    ];
    return this.translate.instant(keys[this.activeStep()] ?? keys[0]);
  }

  statusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' {
    switch (status) {
      case 'Active':
        return 'success';
      case 'UnderSetup':
        return 'warning';
      case 'Maintenance':
        return 'info';
      case 'Inactive':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  canSubmitStep(): boolean {
    if (this.warehouse.operationalStatus === 'Active') {
      return false;
    }
    switch (this.activeStep()) {
      case 0:
        return this.zoneForm.valid;
      case 1:
        return this.aisleForm.valid;
      case 2:
        return this.rackForm.valid;
      case 3:
        return this.shelfForm.valid;
      default:
        return false;
    }
  }

  goBack(): void {
    if (this.activeStep() > 0) {
      this.activeStep.update((s) => s - 1);
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onNext(): void {
    const step = this.activeStep();
    if (step === 0) this.submitZone();
    else if (step === 1) this.submitAisle();
    else if (step === 2) this.submitRack();
    else if (step === 3) this.submitShelf();
  }

  private submitZone(): void {
    if (!this.canSubmitStep() || this.zoneForm.invalid) {
      this.zoneForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.lastApiError.set(null);
    const body = this.buildZonePayload();
    this.layoutService.createZone(this.warehouse.id, body).subscribe({
      next: (res) => {
        this.ctx.update((c) => ({ ...c, zoneId: res.zoneId }));
        this.lastCreatedSummary.set(this.translate.instant('SETTINGS.ZONE_CREATED_DETAIL', { id: res.zoneId }));
        this.toastSuccess('SETTINGS.ZONE_CREATED');
        this.activeStep.set(1);
        this.saving.set(false);
      },
      error: (err) => this.handleError(err, 'SETTINGS.ZONE_CREATE_FAILED'),
    });
  }

  private buildZonePayload() {
    const raw = this.zoneForm.getRawValue();
    return {
      code: raw.code!.trim(),
      name: raw.name!.trim(),
      zoneType: String(raw.zoneType).trim(),
      storageType: String(raw.storageType).trim(),
      tempMinCelsius: Number(raw.tempMinCelsius),
      tempMaxCelsius: Number(raw.tempMaxCelsius),
      humidityMinPercent: Number(raw.humidityMinPercent),
      humidityMaxPercent: Number(raw.humidityMaxPercent),
    };
  }

  private submitAisle(): void {
    if (this.aisleForm.invalid || !this.ctx().zoneId) return;
    this.saving.set(true);
    const { zoneId, warehouseId } = this.ctx();
    this.lastApiError.set(null);
    const aisleBody = { code: this.aisleForm.getRawValue().code!.trim() };
    this.layoutService.createAisle(warehouseId, zoneId!, aisleBody).subscribe({
      next: (res) => {
        this.ctx.update((c) => ({ ...c, aisleId: res.aisleId }));
        this.lastCreatedSummary.set(this.translate.instant('SETTINGS.AISLE_CREATED_DETAIL', { id: res.aisleId }));
        this.toastSuccess('SETTINGS.AISLE_CREATED');
        this.activeStep.set(2);
        this.saving.set(false);
      },
      error: (err) => this.handleError(err, 'SETTINGS.AISLE_CREATE_FAILED'),
    });
  }

  private submitRack(): void {
    if (this.rackForm.invalid || !this.ctx().zoneId || !this.ctx().aisleId) return;
    this.saving.set(true);
    this.lastApiError.set(null);
    const { warehouseId, zoneId, aisleId } = this.ctx();
    this.layoutService
      .createRack(warehouseId, zoneId!, aisleId!, {
        code: this.rackForm.getRawValue().code!.trim(),
      })
      .subscribe({
        next: (res) => {
          this.ctx.update((c) => ({ ...c, rackId: res.rackId }));
          this.lastCreatedSummary.set(this.translate.instant('SETTINGS.RACK_CREATED_DETAIL', { id: res.rackId }));
          this.toastSuccess('SETTINGS.RACK_CREATED');
          this.activeStep.set(3);
          this.saving.set(false);
        },
        error: (err) => this.handleError(err, 'SETTINGS.RACK_CREATE_FAILED'),
      });
  }

  private submitShelf(): void {
    if (this.shelfForm.invalid || !this.ctx().rackId) return;
    this.saving.set(true);
    this.lastApiError.set(null);
    const { warehouseId, zoneId, aisleId, rackId } = this.ctx();
    this.layoutService
      .createShelf(warehouseId, zoneId!, aisleId!, rackId!, {
        code: this.shelfForm.getRawValue().code!.trim(),
        level: Number(this.shelfForm.getRawValue().level ?? 1),
      })
      .subscribe({
        next: (res) => {
          this.ctx.update((c) => ({ ...c, shelfId: res.shelfId }));
          this.lastCreatedSummary.set(
            this.translate.instant('SETTINGS.SETUP_COMPLETE_DETAIL', { id: res.shelfId })
          );
          this.toastSuccess('SETTINGS.SETUP_COMPLETE');
          this.saving.set(false);
          this.completed.emit();
        },
        error: (err) => this.handleError(err, 'SETTINGS.SHELF_CREATE_FAILED'),
      });
  }

  private toastSuccess(key: string): void {
    this.messageService.add({
      severity: 'success',
      summary: this.translate.instant('COMMON.SUCCESS'),
      detail: this.translate.instant(key),
      life: 4000,
    });
  }

  private handleError(err: unknown, key: string): void {
    this.saving.set(false);
    this.lastApiError.set(getApiErrorMessage(err, this.translate.instant(key)));
  }
}
