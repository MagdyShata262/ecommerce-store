import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

// ============================================
// INTERFACES
// ============================================

export interface CartItem {
  productId: number;
  quantity: number;
}

export interface Cart {
  id: number;
  userId: number;
  date: string;
  products: CartItem[];
}

export type CreateCartPayload = Omit<Cart, 'id' | 'date'>;
export type UpdateCartPayload = Partial<CreateCartPayload>;

// ============================================
// SERVICE
// ============================================

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = 'https://fakestoreapi.com/carts';

  // ============================================
  // CARTS & LOADING STATE
  // ============================================
  readonly carts = signal<Cart[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // ============================================
  // SINGLE CART OPERATIONS
  // ============================================
  readonly currentCart = signal<Cart | null>(null);
  readonly cartLoading = signal(false);
  readonly cartError = signal<string | null>(null);

  // ============================================
  // COMPUTED DERIVED STATE
  // ============================================

  /**
   * Count of items in current cart
   */
  readonly cartItemCount = computed(() => {
    const cart = this.currentCart();
    if (!cart) return 0;
    return cart.products.reduce((sum, item) => sum + item.quantity, 0);
  });

  /**
   * Total price of items in current cart (requires product data, so mock for now)
   */
  readonly cartTotal = computed(() => {
    const cart = this.currentCart();
    if (!cart) return 0;
    // In a real app, you'd fetch product prices and calculate total
    return cart.products.length * 29.99; // Mock calculation
  });

  // ============================================
  // CART ENDPOINTS
  // ============================================

  /**
   * GET /carts - Load all carts (for current user/system)
   */
  loadCarts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.#http
      .get<Cart[]>(this.#apiUrl)
      .pipe(
        catchError((err) => {
          const errorMessage = this.#getErrorMessage(err, 'Failed to load carts');
          this.error.set(errorMessage);
          console.error('Error loading carts:', err);
          return of([]);
        })
      )
      .subscribe((data) => {
        this.carts.set(data);
        this.loading.set(false);
      });
  }

  /**
   * GET /carts/:id - Get a single cart by ID
   */
  getCartById(id: number): void {
    this.cartLoading.set(true);
    this.cartError.set(null);
    this.currentCart.set(null);

    this.#http
      .get<Cart>(`${this.#apiUrl}/${id}`)
      .pipe(
        catchError((err) => {
          const errorMessage = this.#getErrorMessage(err, `Failed to load cart ${id}`);
          this.cartError.set(errorMessage);
          console.error(`Error loading cart ${id}:`, err);
          return of(null);
        })
      )
      .subscribe((data) => {
        if (data) {
          this.currentCart.set(data);
        }
        this.cartLoading.set(false);
      });
  }

  /**
   * POST /carts - Create a new cart
   */
  addCart(payload: CreateCartPayload): void {
    this.cartLoading.set(true);
    this.cartError.set(null);

    this.#http
      .post<Cart>(this.#apiUrl, payload)
      .pipe(
        catchError((err) => {
          const errorMessage = this.#getErrorMessage(err, 'Failed to create cart');
          this.cartError.set(errorMessage);
          console.error('Error creating cart:', err);
          return of(null);
        })
      )
      .subscribe((data) => {
        if (data) {
          // Add to carts list
          const currentCarts = this.carts();
          this.carts.set([...currentCarts, data]);
          this.currentCart.set(data);
        }
        this.cartLoading.set(false);
      });
  }

  /**
   * PUT /carts/:id - Update an existing cart
   */
  updateCart(id: number, payload: UpdateCartPayload): void {
    this.cartLoading.set(true);
    this.cartError.set(null);

    this.#http
      .put<Cart>(`${this.#apiUrl}/${id}`, payload)
      .pipe(
        catchError((err) => {
          const errorMessage = this.#getErrorMessage(err, `Failed to update cart ${id}`);
          this.cartError.set(errorMessage);
          console.error(`Error updating cart ${id}:`, err);
          return of(null);
        })
      )
      .subscribe((data) => {
        if (data) {
          // Update in carts list
          const currentCarts = this.carts();
          const updatedCarts = currentCarts.map((c) => (c.id === id ? data : c));
          this.carts.set(updatedCarts);
          this.currentCart.set(data);
        }
        this.cartLoading.set(false);
      });
  }

  /**
   * DELETE /carts/:id - Delete a cart
   */
  deleteCart(id: number): void {
    this.cartLoading.set(true);
    this.cartError.set(null);

    this.#http
      .delete<void>(`${this.#apiUrl}/${id}`)
      .pipe(
        catchError((err) => {
          const errorMessage = this.#getErrorMessage(err, `Failed to delete cart ${id}`);
          this.cartError.set(errorMessage);
          console.error(`Error deleting cart ${id}:`, err);
          return of(null);
        })
      )
      .subscribe(() => {
        // Remove from carts list
        const currentCarts = this.carts();
        const filteredCarts = currentCarts.filter((c) => c.id !== id);
        this.carts.set(filteredCarts);
        this.currentCart.set(null);
        this.cartLoading.set(false);
      });
  }

  /**
   * Add or update a product in the current cart
   */
  addProductToCart(productId: number, quantity: number = 1): void {
    const cart = this.currentCart();
    if (!cart) {
      this.cartError.set('No cart selected');
      return;
    }

    const existingProduct = cart.products.find((item) => item.productId === productId);

    if (existingProduct) {
      // Update quantity
      existingProduct.quantity += quantity;
    } else {
      // Add new product
      cart.products.push({ productId, quantity });
    }

    // Trigger update
    this.updateCart(cart.id, { products: cart.products });
  }

  /**
   * Remove a product from the current cart
   */
  removeProductFromCart(productId: number): void {
    const cart = this.currentCart();
    if (!cart) {
      this.cartError.set('No cart selected');
      return;
    }

    const updatedProducts = cart.products.filter((item) => item.productId !== productId);
    this.updateCart(cart.id, { products: updatedProducts });
  }

  /**
   * Update quantity of a product in the current cart
   */
  updateProductQuantity(productId: number, quantity: number): void {
    const cart = this.currentCart();
    if (!cart) {
      this.cartError.set('No cart selected');
      return;
    }

    const product = cart.products.find((item) => item.productId === productId);
    if (product) {
      product.quantity = Math.max(1, quantity);
      this.updateCart(cart.id, { products: cart.products });
    }
  }

  /**
   * Clear the current cart and reset errors
   */
  clearCurrentCart(): void {
    this.currentCart.set(null);
    this.cartError.set(null);
  }

  /**
   * Refresh carts (reload from API)
   */
  refresh(): void {
    this.loadCarts();
  }

  /**
   * Private helper method to format error messages
   */
  #getErrorMessage(err: unknown, defaultMsg: string): string {
    if (typeof err === 'object' && err !== null && 'status' in err) {
      const httpErr = err as { status: number };
      if (httpErr.status === 0) {
        return 'Network error. Please check your connection.';
      }
      return `${defaultMsg} (Status: ${httpErr.status})`;
    }
    return defaultMsg;
  }
}
