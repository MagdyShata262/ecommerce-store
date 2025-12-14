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
  styleUrls: ['./products-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsListComponent implements OnInit {
  readonly #productsService = inject(ProductsService);
  readonly #fb = inject(FormBuilder);
  readonly #confirm = inject(ConfirmService);

  // ============================================
  // SERVICE SIGNALS (Read-only proxies)
  // ============================================
  readonly products = this.#productsService.products;
  readonly loading = this.#productsService.loading;
  readonly error = this.#productsService.error;

  readonly currentProduct = this.#productsService.currentProduct;
  readonly productLoading = this.#productsService.productLoading;
  readonly productError = this.#productsService.productError;

  // Filter signals
  readonly searchTerm = this.#productsService.searchTerm;
  readonly selectedCategory = this.#productsService.selectedCategory;
  readonly minPrice = this.#productsService.minPrice;
  readonly maxPrice = this.#productsService.maxPrice;
  readonly sortBy = this.#productsService.sortBy;
  readonly sortOrder = this.#productsService.sortOrder;

  // Computed signals from service
  readonly categories = this.#productsService.categories;
  readonly filteredProducts = this.#productsService.filteredProducts;
  readonly filteredCount = this.#productsService.filteredCount;

  // ============================================
  // LOCAL UI STATE (Component only)
  // ============================================
  readonly isEditMode = signal(false);
  readonly isCreating = signal(false);
  readonly skeletonIndices = computed(() => Array.from({ length: 6 }, (_, i) => i));

  editForm: FormGroup;
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

  // ============================================
  // USER INTERACTION HANDLERS
  // ============================================

  onSearchChange(term: string): void {
    // Debounce search input
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => this.#productsService.setSearchTerm(term), 250);
  }

  onCategoryChange(category: string): void {
    this.#productsService.setCategory(category);
  }

  onPriceRangeChange(min: number, max: number): void {
    this.#productsService.setPriceRange(min, max);
  }

  onSortChange(field: 'name' | 'price' | 'rating'): void {
    this.#productsService.setSort(field);
  }

  onClearFilters(): void {
    this.#productsService.clearFilters();
  }

  onRefresh(): void {
    this.#productsService.refresh();
  }

  getSortIndicator(field: 'name' | 'price' | 'rating'): string {
    return this.#productsService.getSortIndicator(field);
  }

  // ============================================
  // PRODUCT CRUD HANDLERS
  // ============================================

  onAddProduct(): void {
    this.isEditMode.set(true);
    this.isCreating.set(true);
    this.editForm.reset();
    this.#productsService.clearCurrentProduct();
  }

  onEditProduct(id: number): void {
    this.isEditMode.set(true);
    this.isCreating.set(false);
    this.#productsService.getProductById(id);
  }

  async onDeleteProduct(id: number): Promise<void> {
    const confirmed = await this.#confirm.confirm('Are you sure you want to delete this product?');
    if (confirmed) {
      this.#productsService.deleteProduct(id);
    }
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

  // ============================================
  // UTILITY METHODS
  // ============================================

  trackByProduct(_: number, p: Product): number {
    return p.id;
  }

  toNumber(val: string | number): number {
    return typeof val === 'string' ? parseFloat(val) : val;
  }
}
