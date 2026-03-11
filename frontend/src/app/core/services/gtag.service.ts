import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class GtagService {
  private gtag = (window as any).gtag;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object) {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeRouteTracking();
    }
  }

  private initializeRouteTracking(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const normalizedPath = this.normalizePathForTracking(
          event.urlAfterRedirects,
        );
        this.pageView(normalizedPath);
      });
  }

  private normalizePathForTracking(path: string): string {
    const cleanPath = path.split('?')[0];
    const segments = cleanPath.split('/').filter((segment) => {
      if (!segment) return false;
      const isNumericId = /^\d+$/.test(segment);
      const isUUID =
        /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
          segment,
        );
      return !isNumericId && !isUUID;
    });
    return '/' + segments.join('/');
  }

  pageView(path: string, title?: string): void {
    if (this.gtag) {
      this.gtag('config', 'G-0V4EVY1FJN', {
        page_path: path,
        page_title: title || document.title,
      });
    }
  }

  event(eventName: string, eventData?: any): void {
    if (this.gtag) {
      this.gtag('event', eventName, eventData);
    }
  }

  setUserId(userId: string): void {
    if (this.gtag) {
      this.gtag('config', 'G-0V4EVY1FJN', { user_id: userId });
    }
  }
}
