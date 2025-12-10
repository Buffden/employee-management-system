import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

export const routes: Routes = [
  // landing page route to home with full path match
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/components/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'employees',
    loadComponent: () =>
      import(
        './features/employees/components/employee-list/employee-list.component'
      ).then((m) => m.EmployeeListComponent),
  },
  {
    path: 'departments',
    loadComponent: () =>
      import(
        './features/departments/components/department-list/department-list.component'
      ).then((m) => m.DepartmentListComponent),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import(
        './features/profile/components/user-profile/user-profile.component'
      ).then((m) => m.UserProfileComponent),
  },
  {
    path: 'projects',
    loadChildren: () => import('./features/projects/projects-routing.module').then(m => m.ProjectsRoutingModule)
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
