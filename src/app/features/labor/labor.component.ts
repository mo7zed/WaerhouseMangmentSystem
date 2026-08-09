import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { TabViewModule } from 'primeng/tabview';

@Component({
  selector: 'app-labor',
  standalone: true,
  imports: [CommonModule, TranslateModule, CardModule, TabViewModule],
  templateUrl: './labor.component.html',
  styleUrl: './labor.component.scss',
})
export class LaborComponent {}
