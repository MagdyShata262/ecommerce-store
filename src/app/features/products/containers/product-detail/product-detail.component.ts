import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductsService } from '../../../../core/services/products.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent {
  readonly #productsService = inject(ProductsService);
  readonly #route = inject(ActivatedRoute);

  // Service state proxies (read-only)
  readonly currentProduct = this.#productsService.currentProduct;
  readonly productLoading = this.#productsService.productLoading;
  readonly productError = this.#productsService.productError;

  constructor() {
    // Get product ID from route params and fetch
    const productId = this.#route.snapshot.paramMap.get('id');
    if (productId) {
      const id = parseInt(productId, 10);
      if (!isNaN(id)) {
        this.#productsService.getProductById(id);
      }
    }
  }
}
