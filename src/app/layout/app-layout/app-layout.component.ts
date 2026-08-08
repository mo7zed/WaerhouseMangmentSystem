import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TranslateService } from '@ngx-translate/core';
import { applyDocumentLanguage } from '../../core/i18n/translate.initializer';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    TopbarComponent,
    ToastModule,
    ConfirmDialogModule,
  ],
  template: `
    <div class="wms-layout" [dir]="isRTL() ? 'rtl' : 'ltr'">
      <app-sidebar></app-sidebar>
      <button
        class="mobile-nav-backdrop"
        *ngIf="mobileMenuOpen()"
        (click)="closeMobileMenu()"
        aria-label="Close navigation menu"
      ></button>
      <div class="wms-content">
        <app-topbar></app-topbar>
        <main class="wms-main">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
    <p-toast position="top-right" id="global-toast"></p-toast>
    <p-confirmDialog></p-confirmDialog>
  `,
})
export class AppLayoutComponent implements OnInit {
  private translate = inject(TranslateService);
  private layout = inject(LayoutService);

  isRTL = () => this.translate.currentLang === 'ar';
  mobileMenuOpen = this.layout.mobileMenuOpen;

  closeMobileMenu(): void {
    this.layout.closeMobileMenu();
  }

  ngOnInit() {
    this.translate.onLangChange.subscribe((event) => {
      applyDocumentLanguage(event.lang);
    });

    const lang =
      this.translate.currentLang ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('wms_lang')) ||
      'en';
    applyDocumentLanguage(lang);
  }
}
