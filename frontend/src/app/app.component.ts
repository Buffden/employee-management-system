import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { HeaderComponent } from "./features/header/header.component";
import { AuthService } from './core/services/auth.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  ngOnInit(): void {
    // Fix for router URL mismatch on initial load (e.g., /activate or /reset not recognized)
    // This handles cases where the browser URL doesn't match the router's initial state
    if (isPlatformBrowser(this.platformId)) {
      const browserPath = globalThis.location.pathname;
      const browserSearch = globalThis.location.search;
      if ((browserPath === '/activate' || browserPath === '/reset') && this.router.url === '/') {
        // Router didn't recognize the route on initial load, manually navigate
        this.router.navigateByUrl(browserPath + browserSearch);
      }
    }
  }
}
