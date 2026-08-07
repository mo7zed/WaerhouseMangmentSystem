import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { TabViewModule } from 'primeng/tabview';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    CardModule,
    TabViewModule,
    ButtonModule,
  ],
  template: `
    <div class="inventory-page">
      <h1>{{ 'NAV.INVENTORY' | translate }}</h1>

      <p-tabView>
        <p-tabPanel [header]="'INVENTORY.STOCK_OVERVIEW' | translate">
          <div class="tab-content">
            <p>Stock overview content will be rendered here</p>
          </div>
        </p-tabPanel>

        <p-tabPanel [header]="'INVENTORY.ITEM_MASTER' | translate">
          <div class="tab-content">
            <p>Item master content will be rendered here</p>
          </div>
        </p-tabPanel>

        <p-tabPanel [header]="'INVENTORY.BIN_MANAGEMENT' | translate">
          <div class="tab-content">
            <p>Bin management content will be rendered here</p>
          </div>
        </p-tabPanel>

        <p-tabPanel [header]="'INVENTORY.CYCLE_COUNTING' | translate">
          <div class="tab-content">
            <p>Cycle counting content will be rendered here</p>
          </div>
        </p-tabPanel>
      </p-tabView>
    </div>
  `,
  styles: [
    `
      .inventory-page {
        padding: 1rem;
      }

      .tab-content {
        padding: 1.5rem;
      }
    `,
  ],
})
export class InventoryComponent {}
