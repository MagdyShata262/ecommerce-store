import { Injectable, inject, signal, computed } from '@angular/core';
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

export type SortField = 'name' | 'price' | 'rating';
export type SortOrder = 'asc' | 'desc';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = 'https://fakestoreapi.com/products';

  // ============================================
  // PRODUCTS & LOADING STATE
  // ============================================
  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // ============================================
  // SINGLE PRODUCT OPERATIONS
  // ============================================
  readonly currentProduct = signal<Product | null>(null);
  readonly productLoading = signal(false);
  readonly productError = signal<string | null>(null);

  // ============================================
  // FILTER & SEARCH STATE (Signals)
  // ============================================
  readonly searchTerm = signal('');
  readonly selectedCategory = signal('');
  readonly minPrice = signal(0);
  readonly maxPrice = signal(10000);
  readonly sortBy = signal<SortField>('name');
  readonly sortOrder = signal<SortOrder>('asc');

  // ============================================
  // COMPUTED DERIVED STATE
  // ============================================
  /**
   * Extract unique categories from all products
   */
  readonly categories = computed(() => {
    const cats = new Set(this.products().map((p) => p.category));
    return Array.from(cats).sort();
  });

  /**
   * Filter, search, and sort products based on current filter signals
   */
  readonly filteredProducts = computed(() => {
    let filtered = this.products();

    // Search filter (title, description, category)
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (this.selectedCategory()) {
      filtered = filtered.filter((p) => p.category === this.selectedCategory());
    }

    // Price range filter
    filtered = filtered.filter((p) => p.price >= this.minPrice() && p.price <= this.maxPrice());

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy()) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'rating':
          comparison = a.rating.rate - b.rating.rate;
          break;
      }

      return this.sortOrder() === 'asc' ? comparison : -comparison;
    });

    return filtered;
  });

  /**
   * Count of filtered products
   */
  readonly filteredCount = computed(() => this.filteredProducts().length);

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

  // ============================================
  // FILTER & SEARCH METHODS
  // ============================================

  /**
   * Update search term (called with debouncing in component)
   */
  setSearchTerm(term: string): void {
    this.searchTerm.set(term.trim());
  }

  /**
   * Update selected category filter
   */
  setCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  /**
   * Update price range filter
   */
  setPriceRange(min: number, max: number): void {
    this.minPrice.set(Math.max(0, min));
    this.maxPrice.set(Math.max(min, max));
  }

  /**
   * Update sort field and toggle order if same field is clicked
   */
  setSort(field: SortField): void {
    if (this.sortBy() === field) {
      // Toggle sort order if same field clicked
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      // New sort field, reset to ascending
      this.sortBy.set(field);
      this.sortOrder.set('asc');
    }
  }

  /**
   * Clear all filters and reset to defaults
   */
  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategory.set('');
    this.minPrice.set(0);
    this.maxPrice.set(10000);
    this.sortBy.set('name');
    this.sortOrder.set('asc');
  }

  /**
   * Refresh products (reload from API)
   */
  refresh(): void {
    this.loadProducts();
  }

  /**
   * Get sort indicator string for UI display
   */
  getSortIndicator(field: SortField): string {
    if (this.sortBy() !== field) return '';
    return this.sortOrder() === 'asc' ? ' ▲' : ' ▼';
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
