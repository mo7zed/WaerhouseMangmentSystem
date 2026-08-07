import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    TranslateModule,
    InputTextModule,
    ButtonModule,
    MessageModule,
  ],
  template: `
    <div class="forgot-password-page">
      <div class="forgot-password-container">
        <h2>{{ 'AUTH.FORGOT_PASSWORD' | translate }}</h2>
        <p>{{ 'AUTH.WELCOME_SUB' | translate }}</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>{{ 'AUTH.EMAIL' | translate }}</label>
            <input pInputText formControlName="email" type="email" />
          </div>

          <button pButton type="submit" [disabled]="!form.valid">
            {{ 'AUTH.SEND_RESET' | translate }}
          </button>
        </form>

        <a routerLink="/login">{{ 'AUTH.BACK_TO_LOGIN' | translate }}</a>
      </div>
    </div>
  `,
  styles: [
    `
      .forgot-password-page {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .forgot-password-container {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      }
    `,
  ],
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit() {
    if (this.form.valid) {
      // Call API to send reset email
      this.router.navigate(['/login']);
    }
  }
}
