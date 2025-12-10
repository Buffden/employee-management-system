import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { EmployeeListComponent } from './components/employee-list/employee-list.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  { path: '', component: EmployeeListComponent },
];

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes), EmployeeListComponent], // Import necessary modules including EmployeeListComponent
})
export class EmployeesModule {}
