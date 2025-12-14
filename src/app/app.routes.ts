import { Routes } from '@angular/router';
import { ProductsListComponent } from './features/products/containers/products-list/products-list.component';

export const routes: Routes = [
  { path: '', redirectTo: '/products', pathMatch: 'full' },
  {
    path: 'products',
    component: ProductsListComponent,
    data: { title: 'Products' },
  },
  // Lazy-loaded feature routes for better initial load performance
  // {
  //   path: 'auth',
  //   loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  // },
  // {
  //   path: 'cart',
  //   loadChildren: () => import('./features/cart/cart.routes').then((m) => m.CART_ROUTES),
  // },
  // {
  //   path: 'admin',
  //   loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  // },
  // Wildcard route - must be last
  { path: '**', redirectTo: '/products' },
];
