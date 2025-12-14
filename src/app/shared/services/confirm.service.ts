import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  /**
   * Shows a confirmation prompt. In browser it uses window.confirm.
   * In server-side rendering it resolves true to avoid blocking.
   */
  confirm(message = 'Are you sure?'): Promise<boolean> {
    if (typeof window === 'undefined') return Promise.resolve(true);
    return Promise.resolve(window.confirm(message));
  }
}
