import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';

@Component({
  selector: 'app-department-detail',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './department-detail.component.html',
  styleUrls: ['./department-detail.component.css']
})
export class DepartmentDetailComponent {

}
