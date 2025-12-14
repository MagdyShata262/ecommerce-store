Absolutely! Below is the **full, updated, and production-ready** `.github/copilot-instructions.md` in **English**, incorporating all refinements for clarity, correctness, and AI-agent readiness.

---

````markdown
# AI Coding Agent Instructions – E-Commerce Store

## 📌 Project Overview

This is an **Angular 20.3+ standalone components** e-commerce application with **SSR**, **Firebase integration**, and **Angular Material UI**. The architecture is **feature-based** with lazy-loaded routes under `src/app/features/`.

**Key Tech Stack:**

- Angular 20.3, Angular Material, Bootstrap 5, Firebase 11
- Zod (schema validation), RxJS 7.8 (reactive streams)
- Signals-based state management (zoneless change detection)
- Angular SSR with Express server

**Essential Commands:**

```bash
npm start                     # Dev server (localhost:4200)
npm run build                 # Production build (AoT, tree-shaken)
npm run serve:ssr:ecommerce-store  # Run SSR server
npm test                      # Run unit tests (Karma + Jasmine)
```
````

---

## 🏗️ Architecture Patterns

### Feature-Based Structure

```
src/app/
├── core/           # Singleton services, guards, interceptors, models
├── features/       # Lazy-loaded features (auth, cart, products, etc.)
├── shared/         # Reusable dumb components, pipes, directives
├── layout/         # Main layout (header, footer, nav)
└── app.routes.ts   # Central routing (lazy-loaded)
```

**Rules:**

- Never instantiate `core/` services manually—always inject via `inject()`.
- Place reusable logic in `shared/utils/` if used in ≥2 features.
- Domain models live in `core/models/`—they are the single source of truth.

### State Management

- **Local state**: Use Angular Signals (`signal()`, `computed()`) in components.
- **Global state**: Use `BehaviorSubject` in `providedIn: 'root'` services + `toSignal()` for template consumption.
- **No NgRx**—keep state simple and service-driven.

**Example Service:**

```ts
@Injectable({ providedIn: 'root' })
export class ProductsService {
  readonly #http = inject(HttpClient);
  readonly #products$ = new BehaviorSubject<Product[]>([]);
  readonly products = toSignal(this.#products$);

  loadProducts() {
    this.#http
      .get<Product[]>('/api/products')
      .pipe(
        catchError((err) => {
          console.error('Failed to load products', err);
          return of([]); // Graceful fallback
        })
      )
      .subscribe((data) => this.#products$.next(data));
  }
}
```

### Component Hierarchy

- **Container components** (in `features/*/containers/`):  
  Handle data, side effects, and business logic. Inject services.
- **Presentational components** (in `shared/components/`):  
  Pure `input()`/`output()`, no service injection, `OnPush` change detection.

**Use modern syntax:**

- `input()` / `output()` instead of `@Input()` / `@Output`
- Control flow: `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`)
- Private fields: `#myField` (not `private myField`)

---

## 🔌 Critical Integration Points

### Firebase Setup

- Pre-configured in `app.config.ts` via `provideFirebaseApp(() => initializeApp(environment.firebase))`.
- **Do NOT re-initialize Firebase** anywhere.
- Inject `AngularFireAuth`, `Firestore`, etc., only in **services** (never in components).
- Auth state is exposed via `AuthService` (see below).

### Authentication Flow

- **`AuthService`** (`core/services/auth.service.ts`) provides:
  - `authStatus$`: `Observable<AuthStatus>` (with user or null)
  - `authStatus = toSignal(authStatus$)` for templates
- **`AuthGuard`** (`core/guards/auth.guard.ts`) protects routes (e.g., `/cart`, `/checkout`)
- **Never access `AngularFireAuth.currentUser` directly**—always go through `AuthService`.

### HTTP & API Layer

- All HTTP calls must use `HttpClient` injected via `inject(HttpClient)`.
- **Interceptors are active globally**:
  - `AuthInterceptor`: Attaches `Authorization` header if user is logged in.
  - `HttpErrorInterceptor`: Shows user-friendly error snackbars on 4xx/5xx.
- **Caching**: Use `CacheService` (`core/services/cache.service.ts`) for GET requests (LRU in-memory cache).
- Base URL is configured in `app.config.ts`.

### SSR & Platform Safety

- **Avoid direct DOM access**: No `window`, `document`, `localStorage`, or `sessionStorage`.
- Use Angular’s `PLATFORM_ID` and `isPlatformBrowser()` when needed:
  ```ts
  const platformId = inject(PLATFORM_ID);
  if (isPlatformBrowser(platformId)) {
    // browser-only code
  }
  ```

### Styling

- Global styles: `src/styles.css`
- Angular Material theme: `indigo-pink` (preloaded)
- Component styles: Use `.component.css` with `ViewEncapsulation.None` only if sharing styles across components.

---

## 🛠️ Common Development Workflows

### Adding a New Feature

1. Create `src/app/features/my-feature/`
2. Generate container: `ng g component features/my-feature/containers/my-feature --standalone`
3. Add lazy route in `app.routes.ts`:
   ```ts
   { path: 'my-feature', loadComponent: () => import('./features/my-feature/...').then(m => m.MyFeatureComponent) }
   ```
4. Create service in `core/services/` if needed (e.g., `my-feature.service.ts`)
5. Use `input()`/`output()` to communicate with shared presentational components.

### Testing

- **Mock data**: Use `core/models/*.mock.ts` (e.g., `mockProduct: Product`)
- **Service mocks**: Override via `TestBed.overrideProvider()`
- **Signal testing**: Wrap in `fakeAsync` and use `tick()`:
  ```ts
  it('should update state', fakeAsync(() => {
    component.loadData();
    tick();
    expect(component.items()).toBeTruthy();
  }));
  ```

### Deployment

- Production build: `ng build` → outputs to `dist/ecommerce-store/`
- SSR build: `ng run ecommerce-store:server` → outputs server bundle
- Bundle budgets: 500kB initial JS, 1MB max total, 4–8kB per component style

---

## 🧼 Code Quality & Conventions

### TypeScript Strictness

- `strict: true` (enforced in `tsconfig.json`)
- `noPropertyAccessFromIndexSignature`
- `noImplicitReturns`
- Prefer `satisfies` for typed literals when improving readability

### Naming

- Files: `kebab-case` (e.g., `product-list.component.ts`)
- Classes: `PascalCase` (e.g., `ProductService`)
- Selectors: `app-kebab-case` (enforced via `angular.json`)
- Private members: `#fieldName` (ES2022 private fields)

---

## ⚠️ AI Agent Gotchas

1. **No NgModule anywhere** – all components are `standalone: true`.
2. **Zone.js is disabled** – `provideZonelessChangeDetection()` is active.  
   → Do **not** call `ApplicationRef.tick()` or assume automatic change detection.
3. **No `HttpClientModule` import needed** – already provided globally.
4. **Template syntax**: Use `@if (condition) { ... }`, not `*ngIf`.
5. **SSR is enabled** – any direct browser API access will crash the server.
6. **Firebase is pre-configured** – never call `initializeApp()` again.
7. **Environment secrets** live in `src/environments/environment*.ts` – never hardcode API keys.

---

> ✅ **Golden Rule**: When in doubt, look at existing features (`products/`, `auth/`) and core services. Follow the pattern—don’t invent new ones.

```

---

This file is ready to be saved as `.github/copilot-instructions.md` in your repository root. It gives AI coding agents **precise, actionable, and context-aware guidance** while preventing common architectural violations.

Let me know if you'd like a **localized Arabic version** for your team as well!
```
