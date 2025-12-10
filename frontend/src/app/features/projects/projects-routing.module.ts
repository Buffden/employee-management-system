import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { ProjectDetailsComponent } from './components/project-details/project-details.component';

const routes: Routes = [
  {
    path: '',
    component: ProjectListComponent
  },
  {
    path: ':projectId',
    component: ProjectDetailsComponent,
    data: { type: 'project' }
  },
  {
    path: ':projectId/tasks/:taskId',
    component: ProjectDetailsComponent,
    data: { type: 'task' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProjectsRoutingModule { } 