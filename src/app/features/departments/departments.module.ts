import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DepartmentListComponent } from './components/department-list/department-list.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  { path: '', component: DepartmentListComponent },
];

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes), DepartmentListComponent], // Import necessary Angular modules
})
export class DepartmentsModule {}
