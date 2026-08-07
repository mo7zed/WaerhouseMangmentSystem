import { Component } from '@angular/core';

@Component({
  selector: 'app-filters-bar',
  standalone: true,
  template: `
    <div class="filters-bar">
      <ng-content></ng-content>
    </div>
  `,
})
export class FiltersBarComponent {}
