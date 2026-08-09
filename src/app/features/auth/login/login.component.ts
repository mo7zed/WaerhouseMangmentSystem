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
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',})
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
