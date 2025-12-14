import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

export type CreateProductPayload = Omit<Product, 'id' | 'rating'>;
export type UpdateProductPayload = Partial<CreateProductPayload>;

@Injectable({ providedIn: 'root' })
export class ProductsService {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = 'https://fakestoreapi.com/products';

  // Signals for list operations
  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Signals for single product operations
  readonly currentProduct = signal<Product | null>(null);
  readonly productLoading = signal(false);
  readonly productError = signal<string | null>(null);

  /**
   * GET /products - Load all products
   */
  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.#http
      .get<Product[]>(this.#apiUrl)
      .pipe(
        catchError((err) => {
          const errorMessage = this.#getErrorMessage(err, 'Failed to load products');
          this.error.set(errorMessage);
          console.error('Error loading products:', err);
          return of([]);
        })
      )
      .subscribe((data) => {
        this.products.set(data);
        this.loading.set(false);
      });
  }

  /**
   * GET /products/:id - Get a single product by ID
   */
  getProductById(id: number): void {
    this.productLoading.set(true);
    this.productError.set(null);
    this.currentProduct.set(null);

    this.#http
      .get<Product>(`${this.#apiUrl}/${id}`)
      .pipe(
        catchError((err) => {
          const errorMessage = this.#getErrorMessage(err, `Failed to load product ${id}`);
          this.productError.set(errorMessage);
          console.error(`Error loading product ${id}:`, err);
          return of(null);
        })
      )
      .subscribe((data) => {
        if (data) {
          this.currentProduct.set(data);
        }
        this.productLoading.set(false);
      });
  }

  /**
   * POST /products - Create a new product
   */
  addProduct(payload: CreateProductPayload): void {
    this.productLoading.set(true);
    this.productError.set(null);

    this.#http
      .post<Product>(this.#apiUrl, payload)
      .pipe(
        catchError((err) => {
          const errorMessage = this.#getErrorMessage(err, 'Failed to create product');
          this.productError.set(errorMessage);
          console.error('Error creating product:', err);
          return of(null);
        })
      )
      .subscribe((data) => {
        if (data) {
          // Add to products list
          const currentProducts = this.products();
          this.products.set([...currentProducts, data]);
          this.currentProduct.set(data);
        }
        this.productLoading.set(false);
      });
  }

  /**
   * PUT /products/:id - Update an existing product
   */
  updateProduct(id: number, payload: UpdateProductPayload): void {
    this.productLoading.set(true);
    this.productError.set(null);

    this.#http
      .put<Product>(`${this.#apiUrl}/${id}`, payload)
      .pipe(
        catchError((err) => {
          const errorMessage = this.#getErrorMessage(err, `Failed to update product ${id}`);
          this.productError.set(errorMessage);
          console.error(`Error updating product ${id}:`, err);
          return of(null);
        })
      )
      .subscribe((data) => {
        if (data) {
          // Update in products list
          const currentProducts = this.products();
          const updatedProducts = currentProducts.map((p) => (p.id === id ? data : p));
          this.products.set(updatedProducts);
          this.currentProduct.set(data);
        }
        this.productLoading.set(false);
      });
  }

  /**
   * DELETE /products/:id - Delete a product
   */
  deleteProduct(id: number): void {
    this.productLoading.set(true);
    this.productError.set(null);

    this.#http
      .delete<void>(`${this.#apiUrl}/${id}`)
      .pipe(
        catchError((err) => {
          const errorMessage = this.#getErrorMessage(err, `Failed to delete product ${id}`);
          this.productError.set(errorMessage);
          console.error(`Error deleting product ${id}:`, err);
          return of(null);
        })
      )
      .subscribe(() => {
        // Remove from products list
        const currentProducts = this.products();
        const filteredProducts = currentProducts.filter((p) => p.id !== id);
        this.products.set(filteredProducts);
        this.currentProduct.set(null);
        this.productLoading.set(false);
      });
  }

  /**
   * Clear the current product and reset errors
   */
  clearCurrentProduct(): void {
    this.currentProduct.set(null);
    this.productError.set(null);
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
