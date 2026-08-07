import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="section-card" [class.section-card--flush]="flush">
      @if (title) {
        <div class="section-card-header">
          <h3>{{ title }}</h3>
          <ng-content select="[headerActions]"></ng-content>
        </div>
      }
      <div
        class="section-card-body"
        [class.section-card-body--flush]="flush"
        [class.section-card-body--table]="tableBody"
      >
        <ng-content></ng-content>
      </div>
    </section>
  `,
})
export class SectionCardComponent {
  @Input() title?: string;
  @Input() flush = false;
  @Input() tableBody = false;
}
