import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./features/header/header.component";
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title: string = 'Employee Management System GUI';

  constructor(private readonly authService: AuthService) {}

  ngOnInit(): void {
    // Initialize auth service - this will check token expiration and refresh if needed
    // The service handles initialization in its constructor
  }
}
