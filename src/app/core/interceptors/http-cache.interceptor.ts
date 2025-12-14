import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpCacheService } from '../services/http-cache.service';

/**
 * HttpCacheInterceptor automatically caches GET requests
 * to reduce redundant API calls and improve performance.
 */
export const httpCacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cache = inject(HttpCacheService);

  // Only cache GET requests
  if (req.method !== 'GET') {
    return next(req);
  }

  // Check if response is in cache
  const cachedResponse = cache.get<any>(req.url);
  if (cachedResponse) {
    return of(new HttpResponse({ body: cachedResponse, status: 200, url: req.url }));
  }

  // If not in cache, make the request and cache the response
  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.status === 200) {
        cache.set(req.url, event.body);
      }
    })
  );
};
