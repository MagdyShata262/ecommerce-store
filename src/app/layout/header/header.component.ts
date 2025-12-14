import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  // User authentication state (placeholder - can be integrated with AuthService)
  readonly isLoggedIn = computed(() => {
    // In a real app, inject AuthService and use: return this.authService.authStatus().user !== null
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return !!token;
  });

  // Cart item count (placeholder - can be integrated with CartService)
  readonly cartItemCount = computed(() => {
    // In a real app, inject CartService and use: return this.cartService.itemCount()
    const count = typeof localStorage !== 'undefined' ? localStorage.getItem('cart_count') : '0';
    return parseInt(count || '0', 10);
  });

  // Mobile menu toggle state
  readonly mobileMenuOpen = computed(() => false); // In a real app, use a signal for this

  onLogout(): void {
    // Placeholder logout logic
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    // In a real app: inject AuthService and call logout()
  }
}
