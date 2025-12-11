import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { UserRole } from './shared/models/user-role.enum';

export const routes: Routes = [
  // Landing page (public)
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/components/landing-page/landing-page.component').then(
        (m) => m.LandingPageComponent
      ),
  },
  // Login route (public)
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/components/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  // Register route (System Admin only)
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/components/register/register.component').then(
        (m) => m.RegisterComponent
      ),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.SYSTEM_ADMIN] }
  },
  // Protected routes
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/home/components/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'employees',
    loadComponent: () =>
      import(
        './features/employees/components/employee-list/employee-list.component'
      ).then((m) => m.EmployeeListComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'departments',
    loadComponent: () =>
      import(
        './features/departments/components/department-list/department-list.component'
      ).then((m) => m.DepartmentListComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import(
        './features/profile/components/user-profile/user-profile.component'
      ).then((m) => m.UserProfileComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'projects',
    loadChildren: () => import('./features/projects/projects-routing.module').then(m => m.ProjectsRoutingModule),
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
