# TACHYON WMS — Setup & Implementation Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Angular CLI 18
- npm or yarn

### Installation Steps

```bash
# 1. Install dependencies
npm install

# 2. Update environment configuration
# Edit src/environments/environment.ts and environment.prod.ts
# Replace 'your-railway-app' with your actual Railway app URL

# 3. Serve the application
ng serve --port 4200

# 4. Open in browser
# Navigate to http://localhost:4200
```

---

## 📋 Project Structure

### Core Module (`src/app/core/`)
- **`auth/`** — Authentication service with JWT handling
- **`guards/`** — AuthGuard, RoleGuard for route protection
- **`interceptors/`** — JWT & Error interceptors
- **`models/`** — TypeScript interfaces (Auth, Inventory, Orders, etc.)
- **`services/`** — BaseApiService for HTTP communication

### Features (`src/app/features/`)
Each feature is lazy-loaded as a standalone component:

| Feature | Path | Status |
|---------|------|--------|
| Dashboard | `/features/dashboard/` | ✅ Complete |
| Inventory | `/features/inventory/` | 🔄 In Progress |
| Receiving & Putaway | `/features/receiving/` | 🔄 In Progress |
| Orders & Picking | `/features/orders/` | 🔄 In Progress |
| Shipping | `/features/shipping/` | 🔄 In Progress |
| Returns | `/features/returns/` | ✅ Scaffolded |
| Reports | `/features/reports/` | ✅ Scaffolded |
| Labor | `/features/labor/` | ✅ Scaffolded |
| Settings | `/features/settings/` | ✅ Scaffolded |
| Admin | `/features/admin/` | ✅ Scaffolded |

### Shared Module (`src/app/shared/`)
- **`directives/`** — `*hasPermission` for role-based UI rendering
- **`pipes/`** — `dateFormat`, `currencyFormat`, `uomFormat`, `truncate`, `fileSize`
- **Components** — Reusable UI components (data-table, dialogs, etc.)

### Layout (`src/app/layout/`)
- **`app-layout/`** — Main shell with sidebar + topbar
- **`sidebar/`** — Collapsible navigation menu
- **`topbar/`** — Language toggle, notifications, user menu

---

## 🔐 Authentication Flow

### 1. Login
```
User → Login Form → POST /auth/login → JWT Token → Store in localStorage → Redirect to Dashboard
```

### 2. Protected Routes
All routes under `/` are protected by `authGuard`:
```typescript
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [authGuard]
}
```

### 3. Role-Based Access
Routes can be restricted to specific roles using `roleGuard`:
```typescript
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [roleGuard],
  data: { roles: ['admin'] }
}
```

### 4. JWT Interceptor
All HTTP requests automatically include the Bearer token:
```
Authorization: Bearer <token>
```

### 5. Error Handling
- **401 Unauthorized** → Redirect to `/login`
- **403 Forbidden** → Show toast error message
- **5xx Server Error** → Log and show toast message

---

## 🌍 Internationalization (i18n)

### Supported Languages
- **EN** — English (LTR)
- **AR** — العربية (RTL)

### Translation Files
Located in `src/assets/i18n/`:
- `en.json` — English translations
- `ar.json` — Arabic translations

### Usage in Components

```html
<!-- Interpolation -->
<h1>{{ 'NAV.DASHBOARD' | translate }}</h1>

<!-- Attribute binding -->
<button [pTooltip]="'COMMON.SAVE' | translate"></button>

<!-- Programmatic -->
constructor(private translate: TranslateService) {
  this.translate.use('ar');
}
```

### RTL Support
- RTL is automatically applied when language is set to Arabic
- `document.documentElement.dir = 'rtl'`
- PrimeNG respects the `dir` attribute

---

## 📡 API Integration

### Base URL Configuration
Update `src/environments/environment.ts`:
```typescript
export const environment = {
  apiUrl: 'https://your-railway-app.railway.app/api/v1',
};
```

### API Endpoints Overview

#### Authentication
```
POST   /auth/login               → { token, refreshToken, user }
POST   /auth/logout              → {}
POST   /auth/refresh-token       → { token }
POST   /auth/forgot-password     → { message }
POST   /auth/reset-password      → { message }
```

#### Dashboard
```
GET    /dashboard/kpis           → KpiCard[]
GET    /dashboard/charts?range=7d → ChartData
GET    /dashboard/alerts         → Alert[]
GET    /dashboard/recent-activity → ActivityLog[]
```

#### Inventory
```
GET    /inventory/items?page=&limit=&search=   → PagedResponse<InventoryItem>
POST   /inventory/items                        → InventoryItem
PUT    /inventory/items/:id                    → InventoryItem
DELETE /inventory/items/:id                    → {}
GET    /inventory/bins?warehouseId=            → Bin[]
POST   /inventory/transfers                    → TransferResult
GET    /inventory/cycle-counts                 → CycleCount[]
POST   /inventory/cycle-counts                 → CycleCount
```

#### Receiving
```
GET    /receiving/asns?status=&from=&to=       → PagedResponse<ASN>
POST   /receiving/asns                         → ASN
PUT    /receiving/asns/:id/receive             → ASN
GET    /receiving/putaway-tasks                → PutawayTask[]
PUT    /receiving/putaway-tasks/:id/complete   → {}
```

#### Orders
```
GET    /orders?status=&channel=&from=&to=      → PagedResponse<Order>
POST   /orders                                 → Order
GET    /orders/:id                             → Order
PUT    /orders/:id/allocate                    → {}
GET    /orders/pick-tasks                      → PickTask[]
PUT    /orders/pick-tasks/:id/complete         → {}
```

### Using BaseApiService

```typescript
export class InventoryService {
  private api = inject(BaseApiService);

  // GET request
  getItems(filter): Observable<PagedResponse<InventoryItem>> {
    return this.api.get('inventory/items', filter);
  }

  // POST request
  createItem(item: CreateItemDto): Observable<InventoryItem> {
    return this.api.post('inventory/items', item);
  }

  // PUT request
  updateItem(id: string, item: UpdateItemDto): Observable<InventoryItem> {
    return this.api.put(`inventory/items/${id}`, item);
  }

  // DELETE request
  deleteItem(id: string): Observable<void> {
    return this.api.delete(`inventory/items/${id}`);
  }
}
```

---

## 🎨 PrimeNG Theme Configuration

### Current Theme
- **Lara Dark Blue** with Tachyon branding

### Color Palette
```scss
--brand-primary: #1E3A5F        // Deep blue
--brand-accent: #00B4D8         // Teal
--color-success: #10b981        // Green
--color-warning: #f59e0b        // Amber
--color-danger: #ef4444         // Red
--color-info: #3b82f6           // Blue
```

### Switching Themes
To use a different PrimeNG theme, update `src/styles.scss`:
```scss
// Change this line:
@import "primeng/resources/themes/lara-dark-blue/theme.css";

// To one of:
@import "primeng/resources/themes/lara-light-blue/theme.css";
@import "primeng/resources/themes/aura-light-blue/theme.css";
@import "primeng/resources/themes/aura-dark-blue/theme.css";
```

---

## 📊 State Management with Signals

Use Angular Signals for reactive state:

```typescript
import { signal, computed } from '@angular/core';

export class InventoryStore {
  private items = signal<InventoryItem[]>([]);
  private loading = signal(false);
  private error = signal<string | null>(null);

  // Readable computed signals
  readonly items$ = computed(() => this.items());
  readonly loading$ = computed(() => this.loading());

  loadItems(filter: InventoryFilter) {
    this.loading.set(true);
    this.service.getItems(filter).subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }
}

// In component:
export class InventoryComponent {
  private store = inject(InventoryStore);
  items = this.store.items$;
  loading = this.store.loading$;
}
```

---

## 🔐 Permission-Based UI Rendering

### Using *hasPermission Directive

```html
<!-- Show button only if user has 'inventory.write' permission -->
<button *hasPermission="'inventory.write'">
  {{ 'COMMON.EDIT' | translate }}
</button>

<!-- Combine with other directives -->
<div *ngIf="item.id" *hasPermission="'inventory.delete'">
  <button (click)="deleteItem(item)">Delete</button>
</div>
```

### User Permissions Structure
```typescript
interface UserProfile {
  id: string;
  email: string;
  role: string;
  permissions: string[];  // e.g., ['inventory.read', 'inventory.write', 'orders.read']
  warehouseId?: string;
}
```

### Permission Categories
- `inventory.*` — Stock management
- `orders.*` — Order management
- `receiving.*` — Receiving operations
- `shipping.*` — Shipping operations
- `returns.*` — Returns processing
- `reports.*` — Reporting access
- `labor.*` — Labor management
- `settings.*` — Configuration
- `admin.*` — System administration

---

## 📝 Common Tasks

### Adding a New Feature

1. **Create feature component:**
   ```bash
   ng generate component features/new-feature --standalone
   ```

2. **Add route to `app.routes.ts`:**
   ```typescript
   {
     path: 'new-feature',
     loadComponent: () => import('./features/new-feature/new-feature.component'),
     canActivate: [roleGuard],
     data: { roles: ['admin', 'manager'] }
   }
   ```

3. **Create service:**
   ```bash
   ng generate service features/new-feature/new-feature.service
   ```

4. **Add translations:**
   - Add keys to `src/assets/i18n/en.json`
   - Add keys to `src/assets/i18n/ar.json`

### Calling API with Loading State

```typescript
export class MyComponent {
  private api = inject(BaseApiService);
  loading = signal(false);
  data = signal<Item[]>([]);

  load() {
    this.loading.set(true);
    this.api.get('endpoint').subscribe({
      next: (response) => {
        this.data.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error(error);
        this.loading.set(false);
      }
    });
  }
}

// In template:
<p-skeleton *ngIf="loading()"></p-skeleton>
<p-table *ngIf="!loading()" [value]="data()"></p-table>
```

### Showing Toast Messages

```typescript
export class MyComponent {
  private messageService = inject(MessageService);

  saveItem() {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Item saved successfully',
      life: 3000
    });
  }

  handleError() {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occurred',
      life: 5000
    });
  }
}
```

### Confirm Action

```typescript
export class MyComponent {
  private confirmService = inject(ConfirmationService);

  deleteItem(item: Item) {
    this.confirmService.confirm({
      message: `Delete ${item.name}?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // Delete logic here
      },
      reject: () => {
        // Cancelled
      }
    });
  }
}
```

---

## 🧪 Testing

### Running Tests
```bash
# Run unit tests
ng test

# Run tests with coverage
ng test --code-coverage
```

### Test Example
```typescript
describe('InventoryComponent', () => {
  let component: InventoryComponent;
  let fixture: ComponentFixture<InventoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [InventoryService]
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryComponent);
    component = fixture.componentInstance;
  });

  it('should load items on init', () => {
    fixture.detectChanges();
    expect(component.items().length).toBeGreaterThan(0);
  });
});
```

---

## 🚀 Building for Production

```bash
# Build for production
ng build --configuration=production

# Optimize build
ng build --configuration=production --optimization --build-optimizer

# Analyze bundle
ng build --stats-json
webpack-bundle-analyzer dist/wms/stats.json
```

---

## 📚 Additional Resources

- [Angular Documentation](https://angular.io/docs)
- [PrimeNG Documentation](https://primeng.org/)
- [ngx-translate Documentation](https://github.com/ngx-translate/core)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🐛 Troubleshooting

### Issue: "Cannot find module" error

**Solution:** Ensure all routes are properly lazy-loaded and components are exported:
```typescript
// component.ts
export class MyComponent { }

// routes.ts
{
  path: 'my-feature',
  loadComponent: () => import('./my-feature/my-feature.component').then(m => m.MyComponent)
}
```

### Issue: RTL not working

**Solution:** Ensure TranslateService is initialized in AppLayoutComponent:
```typescript
ngOnInit() {
  this.translate.onLangChange.subscribe(() => {
    const isArabic = this.translate.currentLang === 'ar';
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
  });
}
```

### Issue: API call fails with 401

**Solution:** Check that JWT token is properly stored and Bearer header is sent:
```typescript
// Check token
console.log(localStorage.getItem('wms_token'));

// Verify interceptor is registered
// In app.config.ts:
provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor]))
```

---

## 📞 Support

For issues or questions, refer to:
1. Component documentation in each feature folder
2. API endpoint documentation from backend team
3. Angular & PrimeNG official documentation
4. Project CHANGELOG.md for recent updates

