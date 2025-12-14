import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent implements OnInit {
  readonly #cartService = inject(CartService);

  // ============================================
  // SERVICE STATE PROXIES
  // ============================================
  readonly carts = this.#cartService.carts;
  readonly loading = this.#cartService.loading;
  readonly error = this.#cartService.error;
  readonly currentCart = this.#cartService.currentCart;
  readonly cartLoading = this.#cartService.cartLoading;
  readonly cartError = this.#cartService.cartError;
  readonly cartItemCount = this.#cartService.cartItemCount;
  readonly cartTotal = this.#cartService.cartTotal;

  // ============================================
  // LOCAL UI STATE
  // ============================================
  readonly selectedCartId = signal<number | null>(null);
  readonly skeletonIndices = signal(Array.from({ length: 5 }, (_, i) => i));

  ngOnInit(): void {
    this.#cartService.loadCarts();
    // Load first available cart as default
    if (this.carts().length > 0) {
      const firstCart = this.carts()[0];
      this.selectedCartId.set(firstCart.id);
      this.#cartService.getCartById(firstCart.id);
    }
  }

  // ============================================
  // USER INTERACTION HANDLERS
  // ============================================

  onSelectCart(cartId: number): void {
    this.selectedCartId.set(cartId);
    this.#cartService.getCartById(cartId);
  }

  onAddNewCart(): void {
    const newCart = {
      userId: 1, // Default user ID (in real app, get from AuthService)
      products: [] as any,
    };
    this.#cartService.addCart(newCart);
  }

  onDeleteCart(cartId: number): void {
    if (confirm('Are you sure you want to delete this cart?')) {
      this.#cartService.deleteCart(cartId);
      this.selectedCartId.set(null);
    }
  }

  onAddProduct(productId: number): void {
    this.#cartService.addProductToCart(productId, 1);
  }

  onRemoveProduct(productId: number): void {
    if (confirm('Remove this item from cart?')) {
      this.#cartService.removeProductFromCart(productId);
    }
  }

  onUpdateQuantity(productId: number, quantity: string | number): void {
    const q = typeof quantity === 'string' ? parseInt(quantity, 10) : quantity;
    if (!isNaN(q) && q > 0) {
      this.#cartService.updateProductQuantity(productId, q);
    }
  }

  onClearCart(): void {
    const cart = this.currentCart();
    if (cart && confirm('Clear all items from cart?')) {
      this.#cartService.updateCart(cart.id, { products: [] });
    }
  }

  onRefresh(): void {
    this.#cartService.refresh();
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  toNumber(val: string | number): number {
    return typeof val === 'string' ? parseInt(val, 10) : val;
  }

  trackByCartId(_: number, cart: any): number {
    return cart.id;
  }

  trackByProductId(_: number, product: any): number {
    return product.productId;
  }
}
