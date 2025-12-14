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
  // FEATURE ROUTES (Lazy-Loaded)
  // ============================================

  // Auth routes
  // {
  //   path: 'auth',
  //   loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  //   data: { title: 'Authentication' },
  // },

  // Cart routes
  // {
  //   path: 'cart',
  //   loadChildren: () => import('./features/cart/cart.routes').then((m) => m.CART_ROUTES),
  //   data: { title: 'Shopping Cart' },
  // },

  // Admin routes
  // {
  //   path: 'admin',
  //   loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  //   data: { title: 'Admin Dashboard' },
  // },

  // ============================================
  // WILDCARD REDIRECT (keep last)
  // ============================================
  { path: '**', redirectTo: '/products' },
];
