import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles: string[] = route.data?.['roles'] ?? [];

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (requiredRoles.length === 0 || authService.hasRole(requiredRoles)) {
    return true;
  }

  // Access denied — navigate to dashboard
  router.navigate(['/dashboard']);
  return false;
};
