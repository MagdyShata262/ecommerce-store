import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Web Vitals - Performance metrics collection
 * Tracks Core Web Vitals: LCP, FID/INP, CLS
 * Reference: https://web.dev/vitals/
 */

interface WebVital {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Measure and report Web Vitals metrics
 * Only runs in the browser; safely skipped during SSR.
 * @param callback - Called with vital metric data
 */
export function initWebVitals(callback: (vital: WebVital) => void): void {
  const platformId = inject(PLATFORM_ID);

  // Only initialize in browser environment
  if (!isPlatformBrowser(platformId)) {
    return;
  }

  // Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        const lcp = (lastEntry.renderTime || lastEntry.loadTime) as number;

        const rating = lcp < 2500 ? 'good' : lcp < 4000 ? 'needs-improvement' : 'poor';

        callback({
          name: 'LCP',
          value: Math.round(lcp),
          rating,
        });
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let cls = 0;
        for (const entry of list.getEntries()) {
          const e = entry as any;
          if (e.hadRecentInput) continue;
          cls += e.value;
        }

        const rating = cls < 0.1 ? 'good' : cls < 0.25 ? 'needs-improvement' : 'poor';

        callback({
          name: 'CLS',
          value: Math.round(cls * 1000) / 1000,
          rating,
        });
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // First Input Delay (FID) / Interaction to Next Paint (INP)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fidEntry = entries[0] as any;
        const fid = (fidEntry.processingDuration || 0) as number;

        const rating = fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor';

        callback({
          name: 'FID/INP',
          value: Math.round(fid),
          rating,
        });
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('Web Vitals measurement not fully supported:', e);
    }
  }
}

/**
 * Simple performance logging utility
 */
export function logPerformanceMetric(name: string, value: number, unit = 'ms'): void {
  if (typeof console === 'undefined') return;

  const style = getMetricStyle(value);
  console.log(`%c${name}: ${value}${unit}`, `color: ${style.color}; font-weight: bold;`);
}

function getMetricStyle(value: number): { color: string } {
  // Generic heuristic: lower values are better
  if (value < 100) return { color: '#0cce6b' }; // green (good)
  if (value < 300) return { color: '#ffa400' }; // amber (needs improvement)
  return { color: '#ff4e42' }; // red (poor)
}
