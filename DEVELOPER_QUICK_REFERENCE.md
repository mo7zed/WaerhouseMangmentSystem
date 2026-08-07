# TACHYON WMS — Developer Quick Reference

## 🚀 Quick Commands

```bash
# Development
npm start              # Start dev server at :4200
npm test              # Run unit tests
npm run build         # Build for dev
npm run lint          # Run ESLint

# Production
npm run build -- --configuration=production   # Prod build
npm run serve:ssr:wms                        # Serve with SSR

# Code Generation
ng generate component features/new-feature --standalone
ng generate service features/new-feature/new-feature.service
ng generate guard features/my-guard
```

---

## 📋 Common Tasks

### Create a New Feature

1. **Generate component**
   ```bash
   ng generate component features/my-feature --standalone
   ```

2. **Create routes** (`src/app/features/my-feature/my-feature.routes.ts`)
   ```typescript
   import { Routes } from '@angular/router';
   import { MyFeatureComponent } from './my-feature.component';

   export const myFeatureRoutes: Routes = [
     { path: '', component: MyFeatureComponent }
   ];
   ```

3. **Add to app.routes.ts**
   ```typescript
   {
     path: 'my-feature',
     loadChildren: () => import('./features/my-feature/my-feature.routes')
       .then(m => m.myFeatureRoutes),
     canActivate: [roleGuard],
     data: { roles: ['admin'] }
   }
   ```

4. **Create service** (`src/app/features/my-feature/my-feature.service.ts`)
   ```typescript
   import { Injectable, inject } from '@angular/core';
   import { BaseApiService } from '../../core/services/base-api.service';

   @Injectable({ providedIn: 'root' })
   export class MyFeatureService {
     private api = inject(BaseApiService);
   }
   ```

5. **Add translations**
   ```json
   // en.json
   "MY_FEATURE": { "TITLE": "My Feature" }
   
   // ar.json
   "MY_FEATURE": { "TITLE": "ميزتي" }
   ```

---

### Make API Calls

```typescript
// In your service
import { inject } from '@angular/core';
import { BaseApiService } from '../../core/services/base-api.service';

export class MyService {
  private api = inject(BaseApiService);

  // GET with filters
  getItems(page: number) {
    return this.api.get('endpoint', { page, limit: 10 });
  }

  // POST
  createItem(data: any) {
    return this.api.post('endpoint', data);
  }

  // PUT
  updateItem(id: string, data: any) {
    return this.api.put(`endpoint/${id}`, data);
  }

  // DELETE
  deleteItem(id: string) {
    return this.api.delete(`endpoint/${id}`);
  }
}
```

---

### Use State Management (Signals)

```typescript
import { signal, computed } from '@angular/core';

export class MyStore {
  private items = signal<Item[]>([]);
  private loading = signal(false);
  private error = signal<string | null>(null);

  readonly items$ = computed(() => this.items());
  readonly loading$ = computed(() => this.loading());
  readonly hasError$ = computed(() => !!this.error());

  loadItems() {
    this.loading.set(true);
    this.service.getItems().subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }
}

// In component
export class MyComponent {
  private store = inject(MyStore);
  items = this.store.items$;
  loading = this.store.loading$;
}
```

---

### Show Toast Messages

```typescript
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';

export class MyComponent {
  private messageService = inject(MessageService);

  saveSuccess() {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Item saved!',
      life: 3000
    });
  }

  showError(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 5000
    });
  }
}
```

---

### Confirm Action Dialog

```typescript
import { inject } from '@angular/core';
import { ConfirmationService } from 'primeng/api';

export class MyComponent {
  private confirmService = inject(ConfirmationService);

  delete Item(item: Item) {
    this.confirmService.confirm({
      message: `Delete ${item.name}?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // Delete logic
      },
      reject: () => {
        // Cancelled
      }
    });
  }
}
```

---

### Use Translations

**In templates**:
```html
<h1>{{ 'MY_FEATURE.TITLE' | translate }}</h1>
<button [pTooltip]="'COMMON.SAVE' | translate"></button>
```

**In components**:
```typescript
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export class MyComponent {
  private translate = inject(TranslateService);

  switchLanguage(lang: string) {
    this.translate.use(lang);
  }
}
```

---

### Role-Based UI

```html
<!-- Show only if user has permission -->
<button *hasPermission="'inventory.write'">Edit</button>

<!-- Combine with other directives -->
<div *ngIf="item" *hasPermission="'inventory.delete'">
  <button (click)="deleteItem(item)">Delete</button>
</div>
```

---

## 🏗️ Component Template Structure

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MyService } from './my.service';

@Component({
  selector: 'app-my-feature',
  standalone: true,
  imports: [CommonModule, TranslateModule, CardModule, TableModule, ButtonModule],
  template: `
    <div class="my-page">
      <h1>{{ 'MY_FEATURE.TITLE' | translate }}</h1>
      
      <p-table [value]="items()" [loading]="loading()">
        <ng-template pTemplate="header">
          <tr>
            <th>Column 1</th>
            <th>Column 2</th>
            <th>Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-item>
          <tr>
            <td>{{ item.col1 }}</td>
            <td>{{ item.col2 }}</td>
            <td>
              <button pButton icon="pi pi-edit" class="p-button-sm p-button-warning"></button>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    .my-page {
      padding: 1rem;
    }
  `]
})
export class MyFeatureComponent {
  private service = inject(MyService);

  items = this.service.items$;
  loading = this.service.loading$;

  ngOnInit() {
    this.service.loadItems();
  }
}
```

---

## 📁 File Locations

| File | Location |
|------|----------|
| Routes | `src/app/app.routes.ts` |
| Auth Service | `src/app/core/auth/auth.service.ts` |
| API Service | `src/app/core/services/base-api.service.ts` |
| Guards | `src/app/core/guards/` |
| Interceptors | `src/app/core/interceptors/` |
| Pipes | `src/app/shared/pipes/` |
| Directives | `src/app/shared/directives/` |
| Translations (EN) | `src/assets/i18n/en.json` |
| Translations (AR) | `src/assets/i18n/ar.json` |
| Global Styles | `src/styles.scss` |
| Theme | PrimeNG CSS (in styles.scss) |
| Environment | `src/environments/environment.ts` |

---

## 🔐 Authentication

### Check if Authenticated
```typescript
import { AuthService } from '../../core/auth/auth.service';

export class MyComponent {
  private auth = inject(AuthService);

  isLoggedIn = this.auth.isAuthenticated;
  currentUser = this.auth.currentUser;
  userRole = this.auth.userRole;
}
```

### Check Permissions
```typescript
if (this.auth.hasPermission('inventory.write')) {
  // User can write to inventory
}

if (this.auth.hasRole(['admin', 'manager'])) {
  // User is admin or manager
}
```

### Logout
```typescript
this.auth.logout();  // Clears token and redirects to /login
```

---

## 🎨 PrimeNG Components Cheat Sheet

```typescript
// Import modules
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TabViewModule } from 'primeng/tabview';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';

// Common components
<p-card [header]="'Title'"></p-card>
<p-table [value]="items"></p-table>
<p-button label="Click" (click)="action()"></p-button>
<p-inputText [(ngModel)]="value"></p-inputText>
<p-dropdown [options]="list" [(ngModel)]="selected"></p-dropdown>
<p-dialog [(visible)]="show"></p-dialog>
<p-tabView></p-tabView>
<p-skeleton></p-skeleton>
<p-tag value="active" severity="success"></p-tag>
<p-messages severity="error" text="Error message"></p-messages>
<p-toast position="top-right"></p-toast>
```

---

## 🧪 Testing Template

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyFeatureComponent } from './my-feature.component';
import { MyService } from './my.service';

describe('MyFeatureComponent', () => {
  let component: MyFeatureComponent;
  let fixture: ComponentFixture<MyFeatureComponent>;
  let service: MyService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyFeatureComponent],
      providers: [MyService]
    }).compileComponents();

    fixture = TestBed.createComponent(MyFeatureComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(MyService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load items on init', () => {
    spyOn(service, 'loadItems');
    fixture.detectChanges();
    expect(service.loadItems).toHaveBeenCalled();
  });
});
```

---

## 🐛 Debugging Tips

```typescript
// Log to console
console.log('Value:', value);
console.error('Error:', error);

// Inspect signal value
console.log('Items:', this.items());

// Check localStorage
console.log('Token:', localStorage.getItem('wms_token'));
console.log('User:', localStorage.getItem('wms_user'));

// Network debugging
// Open browser DevTools → Network tab
// Check request headers include Authorization: Bearer token
// Check response status codes
```

---

## 📚 Documentation Links

- **Complete Setup**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Roadmap**: [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)
- **Summary**: [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
- **Main README**: [README.md](./README.md)

---

## 🆘 Common Issues & Solutions

### Build Error: "Cannot find module"
✅ Check file path is correct and component is exported

### Token not sending with requests
✅ Verify JWT interceptor registered in app.config.ts

### RTL not working
✅ Check `document.documentElement.dir = 'rtl'` in AppLayout

### Form validation not working
✅ Ensure FormBuilder is injected: `private fb = inject(FormBuilder)`

### Table not loading data
✅ Ensure `[value]="items()"` uses signal or computed value

---

**Last Updated**: May 31, 2026  
**Version**: 1.0  
**Framework**: Angular 18  
**UI**: PrimeNG 17

