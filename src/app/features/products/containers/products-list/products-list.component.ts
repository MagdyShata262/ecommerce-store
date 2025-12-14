import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  ProductsService,
  CreateProductPayload,
  Product,
} from '../../../../core/services/products.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { ProductCardComponent } from '../../components/product-card/product-card.component';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProductCardComponent],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsListComponent implements OnInit {
  readonly #productsService = inject(ProductsService);
  readonly #fb = inject(FormBuilder);

  readonly products = this.#productsService.products;
  readonly loading = this.#productsService.loading;
  readonly error = this.#productsService.error;

  readonly currentProduct = this.#productsService.currentProduct;
  readonly productLoading = this.#productsService.productLoading;
  readonly productError = this.#productsService.productError;

  // UI state
  readonly isEditMode = signal(false);
  readonly isCreating = signal(false);

  // Search and filter state
  readonly searchTerm = signal('');
  readonly selectedCategory = signal('');
  readonly sortBy = signal<'name' | 'price' | 'rating'>('name');
  readonly sortOrder = signal<'asc' | 'desc'>('asc');
  readonly minPrice = signal(0);
  readonly maxPrice = signal(10000);

  // Computed filtered and sorted products
  readonly categories = computed(() => {
    const cats = new Set(this.products().map((p) => p.category));
    return Array.from(cats).sort();
  });

  readonly filteredProducts = computed(() => {
    let filtered = this.products();

    // Search filter
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

  readonly filteredCount = computed(() => this.filteredProducts().length);

  // For skeleton loading placeholders
  readonly skeletonIndices = computed(() => Array.from({ length: 6 }, (_, i) => i));

  editForm: FormGroup;

  readonly #confirm = inject(ConfirmService);

  private _searchTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.editForm = this.#fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      price: [0, [Validators.required, Validators.min(0)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', Validators.required],
    });

    // Patch the edit form when a product is loaded asynchronously
    effect(() => {
      const p = this.currentProduct();
      if (p) {
        this.editForm.patchValue({
          title: p.title,
          price: p.price,
          description: p.description,
          category: p.category,
        });
      }
    });

    // Close/reset form when loading flags indicate an operation finished
    effect(() => {
      // only act when edit modal is open
      if (!this.isEditMode()) return;

      const loading = this.loading();
      const pLoading = this.productLoading();
      const pError = this.productError();

      // if no loading in progress and no product error, consider operation complete
      if (!loading && !pLoading && !pError) {
        this.editForm.reset();
        this.isEditMode.set(false);
        this.isCreating.set(false);
        this.#productsService.clearCurrentProduct();
      }
    });
  }

  ngOnInit(): void {
    this.#productsService.loadProducts();
  }

  onEditProduct(id: number): void {
    this.isEditMode.set(true);
    this.isCreating.set(false);
    // load product; form will be patched by the effect when available
    this.#productsService.getProductById(id);
  }

  async onDeleteProduct(id: number): Promise<void> {
    const confirmed = await this.#confirm.confirm('Are you sure you want to delete this product?');
    if (confirmed) {
      this.#productsService.deleteProduct(id);
    }
  }

  onAddProduct(): void {
    this.isEditMode.set(true);
    this.isCreating.set(true);
    this.editForm.reset();
    this.#productsService.clearCurrentProduct();
  }

  onSaveProduct(): void {
    if (!this.editForm.valid) return;

    const formData = this.editForm.value as CreateProductPayload;

    if (this.isCreating()) {
      this.#productsService.addProduct(formData);
    } else if (this.currentProduct()) {
      this.#productsService.updateProduct(this.currentProduct()!.id, formData);
    }
  }

  onCancelEdit(): void {
    this.editForm.reset();
    this.isEditMode.set(false);
    this.isCreating.set(false);
    this.#productsService.clearCurrentProduct();
  }

  // Search functions
  onSearchChange(term: string): void {
    // debounce to avoid recomputing on every keystroke
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => this.searchTerm.set(term.trim()), 250);
  }

  onCategoryChange(category: string): void {
    this.selectedCategory.set(category);
  }

  onSortChange(sortField: 'name' | 'price' | 'rating'): void {
    if (this.sortBy() === sortField) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(sortField);
      this.sortOrder.set('asc');
    }
  }

  onPriceRangeChange(min: number, max: number): void {
    this.minPrice.set(Math.max(0, min));
    this.maxPrice.set(Math.max(min, max));
  }

  onClearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategory.set('');
    this.sortBy.set('name');
    this.sortOrder.set('asc');
    this.minPrice.set(0);
    this.maxPrice.set(10000);
  }

  onRefresh(): void {
    this.#productsService.loadProducts();
  }

  getSortIndicator(field: 'name' | 'price' | 'rating'): string {
    if (this.sortBy() !== field) return '';
    return this.sortOrder() === 'asc' ? ' ▲' : ' ▼';
  }

  // trackBy for performance when rendering lists
  trackByProduct(_: number, p: Product) {
    return p.id;
  }

  // Helper to convert string to number in templates
  toNumber(val: string | number): number {
    return typeof val === 'string' ? parseFloat(val) : val;
  }
}
