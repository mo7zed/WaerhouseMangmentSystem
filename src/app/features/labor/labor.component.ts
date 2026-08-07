import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { TabViewModule } from 'primeng/tabview';

@Component({
  selector: 'app-labor',
  standalone: true,
  imports: [CommonModule, TranslateModule, CardModule, TabViewModule],
  template: `
    <div class="labor-page">
      <h1>{{ 'NAV.LABOR' | translate }}</h1>
      <p-tabView styleClass="settings-tabs">
        <p-tabPanel [header]="'LABOR.TASK_ASSIGNMENT' | translate">
          <p>Task assignment here</p>
        </p-tabPanel>
        <p-tabPanel [header]="'LABOR.OPERATOR_PERFORMANCE' | translate">
          <p>Operator performance here</p>
        </p-tabPanel>
        <p-tabPanel [header]="'LABOR.WORKLOAD' | translate">
          <p>Workload balancing here</p>
        </p-tabPanel>
        <p-tabPanel [header]="'LABOR.SHIFTS' | translate">
          <p>Shift overview here</p>
        </p-tabPanel>
      </p-tabView>
    </div>
  `,
  styles: [
    `
      .labor-page {
        padding: 1rem;
      }
    `,
  ],
})
export class LaborComponent {}
