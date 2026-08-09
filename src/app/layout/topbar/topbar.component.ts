import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { applyDocumentLanguage } from '../../core/i18n/translate.initializer';
import { ButtonModule } from 'primeng/button';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { AuthService } from '../../core/auth/auth.service';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule, RouterLink, TranslateModule,
    ButtonModule, OverlayPanelModule, BadgeModule, AvatarModule,
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent implements OnInit {
  private authService = inject(AuthService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private layout = inject(LayoutService);

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

  languageFlag(): string {
    return this.currentLang() === 'en' ? '\u{1F1F8}\u{1F1E6}' : '\u{1F1EC}\u{1F1E7}';
  }

  languageLabel(): string {
    return this.currentLang() === 'en'
      ? '\u0627\u0644\u0639\u0631\u0628\u064A\u0629'
      : 'English';
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

  toggleMobileMenu(): void {
    this.layout.toggleMobileMenu();
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
