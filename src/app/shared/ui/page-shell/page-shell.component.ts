import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-shell animate-fade-in" [class]="extraClass">
      <ng-content></ng-content>
    </div>
  `,
})
export class PageShellComponent {
  @Input() extraClass = '';
}
