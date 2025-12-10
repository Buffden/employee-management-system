import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), DashboardComponent], // Import Angular modules and DashboardComponent
})
export class HomeModule {}
