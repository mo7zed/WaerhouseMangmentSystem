import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { applyDocumentLanguage } from '../../core/i18n/translate.initializer';
import { ButtonModule } from 'primeng/button';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule, RouterLink, TranslateModule,
    ButtonModule, OverlayPanelModule, BadgeModule, AvatarModule,
  ],
  template: `
    <header class="wms-topbar">
      <!-- Left: Breadcrumb / Page Title -->
      <div class="topbar-left">
        <div class="topbar-brand">
          <span class="topbar-greeting">{{ greeting() }},</span>
          <span class="topbar-username">{{ user()?.name }}</span>
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="topbar-right">

  <!-- Language Toggle -->
  <button
    pRipple
    class="topbar-btn lang-toggle"
    (click)="toggleLanguage()"
    id="lang-toggle-btn"
    [title]="currentLang() === 'en' ? 'Switch to Arabic' : 'Switch to English'">

    <span class="lang-flag">
      {{ currentLang() === 'en' ? '🇸🇦' : '🇬🇧' }}
    </span>

    <span class="lang-label">
      {{ currentLang() === 'en' ? 'العربية' : 'English' }}
    </span>
  </button>

  <!-- Notifications -->
  <button
    pRipple
    class="topbar-btn notif-btn"
    (click)="notifPanel.toggle($event)"
    id="notifications-btn">

    <i class="pi pi-bell"></i>

    <span
      class="notif-badge"
      *ngIf="notifCount() > 0">
      {{ notifCount() }}
    </span>

  </button>

 <p-overlayPanel
  #notifPanel
  styleClass="notif-panel">

  <!-- Header -->
  <div class="notif-panel-header">
    <div>
      <h4>{{ 'TOPBAR.NOTIFICATIONS' | translate }}</h4>
      <small>{{ notifications().length }} Notifications</small>
    </div>

    <button
      pButton
      text
      icon="pi pi-check"
      class="mark-all-btn"
      (click)="markAllRead()"
      [label]="'TOPBAR.MARK_ALL_READ' | translate">
    </button>
  </div>

  <!-- Empty State -->
  <div
    class="notif-empty"
    *ngIf="notifications().length === 0">

    <i class="pi pi-bell-slash"></i>
    <p>No notifications</p>

  </div>

  <!-- Notifications -->
  <div
    class="notif-list"
    *ngIf="notifications().length">

    <div
      class="notif-item"
      *ngFor="let n of notifications()"
      [class.unread]="!n.read">

      <div class="notif-icon">

        <i
          class="pi"
          [ngClass]="{
            'pi-check-circle text-green-500': n.type === 'success',
            'pi-info-circle text-blue-500': n.type === 'info',
            'pi-exclamation-triangle text-orange-500': n.type === 'warning',
            'pi-times-circle text-red-500': n.type === 'danger'
          }">
        </i>

      </div>

      <div class="notif-content">

        <div class="notif-title-row">
          <span class="notif-title">
            {{ n.title }}
          </span>

          <span
            class="notif-time">
            {{ n.timestamp | date:'shortTime' }}
          </span>
        </div>

        <p class="notif-msg">
          {{ n.message }}
        </p>

      </div>

    </div>

  </div>

</p-overlayPanel>

  <!-- User -->
  <button
    pRipple
    class="topbar-user"
    (click)="userMenu.toggle($event)"
    id="user-menu-btn">

    <div class="user-avatar">
      {{ userInitials() }}
    </div>

    <div class="user-info">
      <span class="user-name">
        {{ user()?.name }}
      </span>

      <span class="user-role">
        {{ user()?.role | titlecase }}
      </span>
    </div>

    <i class="pi pi-chevron-down user-chevron"></i>

  </button>

<p-overlayPanel
    #userMenu
    styleClass="user-menu-panel">

    <!-- Header -->
    <div class="user-menu-header">

        <div class="user-avatar large">
            {{ userInitials() }}
        </div>

        <div class="user-details">
            <div class="user-name">
                {{ user()?.name }}
            </div>

            <div class="user-role">
                {{ user()?.role | titlecase }}
            </div>
        </div>

    </div>

    <div class="user-menu-items">

        <button
            class="user-menu-item"
            (click)="goToProfile(userMenu)">

            <div class="menu-icon profile">
                <i class="pi pi-user"></i>
            </div>

            <div class="menu-content">
                <span>{{ 'TOPBAR.MY_PROFILE' | translate }}</span>
                <small>View your account</small>
            </div>

        </button>

        <button
            class="user-menu-item"
            (click)="changePassword(userMenu)">

            <div class="menu-icon password">
                <i class="pi pi-lock"></i>
            </div>

            <div class="menu-content">
                <span>{{ 'TOPBAR.CHANGE_PASSWORD' | translate }}</span>
                <small>Update your password</small>
            </div>

        </button>

        <div class="menu-divider"></div>

        <button
            class="user-menu-item logout"
            (click)="logout(userMenu)">

            <div class="menu-icon logout">
                <i class="pi pi-sign-out"></i>
            </div>

            <div class="menu-content">
                <span>{{ 'AUTH.LOGOUT' | translate }}</span>
                <small>Sign out safely</small>
            </div>

        </button>

    </div>

</p-overlayPanel>

</div>
    </header>
  `,
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent implements OnInit {
  private authService = inject(AuthService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  user = this.authService.currentUser;
  currentLang = signal<string>('en');

  notifCount = signal(3);
  notifications = signal([
    { id: '1', type: 'warning', title: 'Low Stock Alert', message: 'Item SKU-001 is below minimum threshold', timestamp: new Date(), read: false },
    { id: '2', type: 'danger',  title: 'Expiry Warning', message: '5 items expiring within 30 days', timestamp: new Date(Date.now() - 3600000), read: false },
    { id: '3', type: 'info',    title: 'Sync Complete', message: 'TMS sync completed successfully', timestamp: new Date(Date.now() - 7200000), read: true },
  ]);


  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return this.translate.instant('TOPBAR.GOOD_MORNING');
    if (h < 17) return this.translate.instant('TOPBAR.GOOD_AFTERNOON');
    return this.translate.instant('TOPBAR.GOOD_EVENING');
  }

  userInitials(): string {
    const name = this.user()?.name ?? 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  ngOnInit(): void {
    const saved =
      (typeof localStorage !== 'undefined' && localStorage.getItem('wms_lang')) ||
      this.translate.currentLang ||
      'en';
    this.currentLang.set(saved);
  
  }

  toggleLanguage(): void {
    const newLang = this.currentLang() === 'en' ? 'ar' : 'en';
    this.currentLang.set(newLang);
    this.translate.use(newLang).subscribe(() => {
      applyDocumentLanguage(newLang);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('wms_lang', newLang);
      }

    });
  }

  markAllRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    this.notifCount.set(0);
  }
  goToProfile(userMenu: any): void {
  userMenu.hide();
  this.router.navigate(['/admin']);
}

changePassword(userMenu: any): void {
  userMenu.hide();

  // TODO
  // this.router.navigate(['/change-password']);
}

logout(userMenu: any): void {
  userMenu.hide();
  this.authService.logout();
}
}
