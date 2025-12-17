import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DepartmentListComponent } from './components/department-list/department-list.component';
import { DepartmentDetailsComponent } from './components/department-details/department-details.component';

const routes: Routes = [
  {
    path: '',
    component: DepartmentListComponent
  },
  {
    path: ':departmentId',
    component: DepartmentDetailsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DepartmentsRoutingModule { }

