import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TranslateService } from '@ngx-translate/core';
import { applyDocumentLanguage } from '../../core/i18n/translate.initializer';

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

  isRTL = () => this.translate.currentLang === 'ar';

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
