import { Component, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { initWebVitals } from './shared/utils/web-vitals.util';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('ecommerce-store');
  readonly #doc = inject(DOCUMENT);

  constructor() {
    // Initialize Web Vitals monitoring in development
    if (!this.isProduction()) {
      initWebVitals((vital) => {
        console.debug(`Web Vital: ${vital.name} = ${vital.value} (${vital.rating})`);
      });
    }
  }

  private isProduction(): boolean {
    return (
      this.#doc.location.hostname !== 'localhost' &&
      !this.#doc.location.hostname.includes('127.0.0.1')
    );
  }
}
