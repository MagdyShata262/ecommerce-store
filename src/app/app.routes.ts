import { Routes } from '@angular/router';
import { ProductsListComponent } from './features/products/containers/products-list/products-list.component';

export const routes: Routes = [
  // Root redirect
  { path: '', redirectTo: '/products', pathMatch: 'full' },

  // ============================================
  // PRODUCTS ROUTES
  // ============================================
  {
    path: 'products',
    component: ProductsListComponent,
    data: { title: 'Products' },
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./features/products/containers/product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent
      ),
    data: { title: 'Product Details' },
  },

  // ============================================
  // CART ROUTES
  // ============================================
  {
    path: 'cart',
    loadComponent: () =>
      import('./features/cart/containers/cart/cart.component').then((m) => m.CartComponent),
    data: { title: 'Shopping Cart' },
  },

  // ============================================
  // WILDCARD REDIRECT (keep last)
  // ============================================
  { path: '**', redirectTo: '/products' },
];
