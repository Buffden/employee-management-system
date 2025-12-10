import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {}
