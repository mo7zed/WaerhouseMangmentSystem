import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService } from '../../../core/auth/auth.service';
import { applyDocumentLanguage } from '../../../core/i18n/translate.initializer';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, TranslateModule,
    InputTextModule, PasswordModule, ButtonModule, CheckboxModule,
    MessageModule, ProgressSpinnerModule
  ],
  template: `
    <div class="login-page">
      <!-- Background Particles -->
      <div class="login-bg">
        <div class="bg-orb orb-1"></div>
        <div class="bg-orb orb-2"></div>
        <div class="bg-orb orb-3"></div>
        <div class="bg-grid"></div>
      </div>

      <!-- Login Card -->
      <div class="login-container animate-fade-in-up">
        <!-- Logo -->
        <div class="login-logo">
          <div class="logo-icon-lg">
            <i class="pi pi-box"></i>
          </div>
          <div>
            <h1 class="brand-name">TACHYON</h1>
            <p class="brand-sub">Warehouse Management System</p>
          </div>
        </div>

        <!-- Language Switcher -->
        <div class="lang-switcher">
          <button
            class="lang-btn"
            [class.active]="currentLang() === 'en'"
            (click)="setLang('en')"
            id="lang-en-btn"
          >🇬🇧 EN</button>
          <button
            class="lang-btn"
            [class.active]="currentLang() === 'ar'"
            (click)="setLang('ar')"
            id="lang-ar-btn"
          >🇸🇦 AR</button>
        </div>

        <!-- Heading -->
        <div class="login-heading">
          <h2>{{ 'AUTH.WELCOME' | translate }}</h2>
          <p>{{ 'AUTH.WELCOME_SUB' | translate }}</p>
        </div>

        <!-- Error Message -->
        <div class="login-error" *ngIf="errorMsg()">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ errorMsg() }}</span>
        </div>

        <!-- Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form" id="login-form">
          <!-- Username or email -->
          <div class="form-group">
            <label for="username-input">{{ 'AUTH.USERNAME_OR_EMAIL' | translate }}</label>
            <div class="input-wrapper">
              <input
                id="username-input"
                pInputText
                type="text"
                formControlName="usernameOrEmail"
                [placeholder]="'AUTH.USERNAME_OR_EMAIL' | translate"
                class="w-full"
                autocomplete="username"
              />
            </div>
            <span class="field-error" *ngIf="loginForm.get('usernameOrEmail')?.invalid && loginForm.get('usernameOrEmail')?.touched">
              {{ 'AUTH.USERNAME_OR_EMAIL_REQUIRED' | translate }}
            </span>
          </div>

          <!-- Password -->
          <div class="form-group">
            <label for="password-input">{{ 'AUTH.PASSWORD' | translate }}</label>
            <div class="input-wrapper">
              <p-password
                id="password-input"
                formControlName="password"
                [placeholder]="'AUTH.PASSWORD' | translate"
                [feedback]="false"
                [toggleMask]="true"
                styleClass="w-full"
                inputStyleClass="w-full"
              ></p-password>
            </div>
            <span class="field-error" *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
              {{ 'AUTH.PASSWORD_REQUIRED' | translate }}
            </span>
          </div>

          <!-- Remember + Forgot -->
          <div class="form-row">
            <label class="remember-label">
              <p-checkbox formControlName="remember" [binary]="true" inputId="remember-checkbox"></p-checkbox>
              <span>{{ 'AUTH.REMEMBER_ME' | translate }}</span>
            </label>
            <a routerLink="/forgot-password" class="forgot-link" id="forgot-password-link">
              {{ 'AUTH.FORGOT_PASSWORD' | translate }}
            </a>
          </div>

          <!-- Submit Button -->
          <button
            pButton
            type="submit"
            [label]="loading() ? '' : ('AUTH.LOGIN' | translate)"
            [loading]="loading()"
            [disabled]="loginForm.invalid || loading()"
            class="login-submit-btn w-full"
            id="login-submit-btn"
          ></button>
        </form>

        <!-- Footer -->
        <p class="login-footer">
          © {{ year }} Tachyon WMS · All rights reserved
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(160deg, #f1f5f9 0%, #e0f2fe 50%, #f8fafc 100%);
      overflow: hidden;
      position: relative;
      padding: 2rem;
    }

    /* Background */
    .login-bg {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }

    .bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.15;
    }

    .orb-1 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(0, 180, 216, 0.2), transparent 70%);
      top: -150px; left: -100px;
      animation: float1 8s ease-in-out infinite;
    }

    .orb-2 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, var(--brand-primary-light), transparent 70%);
      bottom: -100px; right: -80px;
      animation: float2 10s ease-in-out infinite;
    }

    .orb-3 {
      width: 250px; height: 250px;
      background: radial-gradient(circle, var(--brand-accent-light), transparent 70%);
      top: 50%; right: 20%;
      animation: float1 12s ease-in-out infinite reverse;
    }

    .bg-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(30, 58, 95, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(30, 58, 95, 0.04) 1px, transparent 1px);
      background-size: 40px 40px;
    }

    @keyframes float1 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -20px) scale(1.05); }
      66% { transform: translate(-20px, 15px) scale(0.95); }
    }

    @keyframes float2 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-25px, 20px) scale(1.08); }
    }

    /* Login Card */
    .login-container {
  width: 100%;
  max-width: 520px; /* زيادة عرض الفورم */
  min-height: 560px;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-xl);
  padding: 3.5rem; /* مساحة داخلية أكبر */
  position: relative;
  z-index: 1;
  box-shadow: var(--shadow-lg), 0 0 60px rgba(0,180,216,0.08);
    }

    /* Logo */
    .login-logo {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .logo-icon-lg {
        width: 65px;
  height: 65px;
  font-size: 1.8rem;
      background: linear-gradient(135deg, var(--brand-accent), var(--brand-primary-light));
      border-radius: var(--radius-lg);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem;
      color: #fff;
      box-shadow: 0 6px 20px rgba(0,180,216,0.4);
      flex-shrink: 0;
    }

    .brand-name {
      font-size: 1.5rem;
      font-weight: 900;
      color: var(--text-primary);
      letter-spacing: 0.12em;
      line-height: 1;
    }

    .brand-sub {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 400;
      margin-top: 0.2rem;
    }

    /* Language Switcher */
    .lang-switcher {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      background: var(--surface-overlay);
      border-radius: var(--radius-md);
      padding: 0.25rem;
    }

    .lang-btn {
      flex: 1;
      padding: 0.65rem;
  font-size: 0.9rem;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-muted);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .lang-btn.active {
      background: var(--surface-card);
      color: var(--brand-accent);
      box-shadow: var(--shadow-sm);
    }

    /* Heading */
    .login-heading {
      margin-bottom: 1.5rem;
    }

    .login-heading h2 {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .login-heading p {
      font-size: 1rem;
      color: var(--text-secondary);
    }

    /* Error */
    .login-error {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--color-danger-bg);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
      color: var(--color-danger);
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }

    /* Form */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.8rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
        font-size: 0.95rem;
  font-weight: 600;
      color: var(--text-secondary);
    }

    .input-wrapper {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 0.875rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 0.875rem;
      z-index: 1;
    }

    :host-context(body[dir="rtl"]) .input-icon {
      left: auto;
      right: 0.875rem;
    }

    .input-wrapper :deep(.p-inputtext),
    .input-wrapper :deep(input) {
      padding-left: 2.5rem !important;
        height: 50px !important;
  font-size: 1rem !important;
  border-radius: 10px !important;

    }

    :host-context(body[dir="rtl"]) .input-wrapper :deep(.p-inputtext),
    :host-context(body[dir="rtl"]) .input-wrapper :deep(input) {
      padding-left: 0.875rem !important;
      padding-right: 2.5rem !important;
    }
    .input-wrapper :deep(.p-password),
.input-wrapper :deep(.p-password-input) {
  width: 100% !important;
}

.input-wrapper :deep(.p-password-input) {
  height: 50px !important;
  font-size: 1rem !important;
}

    .field-error {
      font-size: 0.75rem;
      color: var(--color-danger);
    }

    /* Row */
    .form-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .remember-label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
      cursor: pointer;
    }

    .forgot-link {
      font-size: 0.8rem;
      color: var(--brand-accent);
      text-decoration: none;
      transition: opacity var(--transition-fast);
    }

    .forgot-link:hover { opacity: 0.8; }

    /* Submit */
    .login-submit-btn {
        height: 52px !important;
  font-size: 1rem !important;
  font-weight: 700 !important;
  border-radius: 10px !important;
      letter-spacing: 0.04em;
      margin-top: 0.5rem;
    }

    /* Demo Hint */
    .demo-hint {
      text-align: center;
      margin-top: 1rem;
      padding: 0.6rem;
      background: rgba(0,180,216,0.06);
      border: 1px dashed rgba(0,180,216,0.2);
      border-radius: var(--radius-md);
    }

    .demo-label {
      font-size: 0.75rem;
      color: var(--brand-accent);
      opacity: 0.8;
    }

    /* Footer */
    .login-footer {
      text-align: center;
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-top: 1.5rem;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);

  loading = signal(false);
  errorMsg = signal<string | null>(null);
  currentLang = signal('en');
  year = new Date().getFullYear();

  loginForm = this.fb.group({
    usernameOrEmail: ['', [Validators.required]],
    password: ['', [Validators.required]],
    remember: [false],
  });

  constructor() {
    const saved =
      (typeof localStorage !== 'undefined' && localStorage.getItem('wms_lang')) || 'en';
    this.currentLang.set(saved);
    applyDocumentLanguage(saved);
  }

  setLang(lang: string): void {
    this.currentLang.set(lang);
    this.translate.use(lang).subscribe(() => {
      applyDocumentLanguage(lang);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('wms_lang', lang);
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMsg.set(null);

    const { usernameOrEmail, password } = this.loginForm.value;

    this.authService.login(usernameOrEmail!, password!).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 401) {
          this.errorMsg.set(this.translate.instant('AUTH.INVALID_CREDENTIALS'));
        } else {
          this.errorMsg.set(
            getApiErrorMessage(err, this.translate.instant('AUTH.LOGIN_FAILED'))
          );
        }
      }
    });
  }
}
