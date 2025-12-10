import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { projectListConfig } from './project-list.config';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { TableCellData } from '../../../../shared/models/table';
import { Project } from '../../../../shared/models/project.model';
import { ProjectSelectionService } from '../../services/project-selection.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css'],
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    TableComponent
  ]
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  tableData: TableCellData[] = [];
  tableConfig = projectListConfig;
  displayedColumns: string[] = [
    'name',
    'department',
    'projectManager',
    'taskStatus',
    'startDate',
    'endDate',
    'status',
    'actions'
  ];

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private projectSelectionService: ProjectSelectionService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.projectService.getAll().subscribe(projects => {
      this.projects = projects;
      this.tableData = this.projects.map(project => ({
        ...project,
        id: project.id,
        name: project.name,
        department: project.departmentId || '',
        projectManager: project.projectManagerId || '',
        taskStatus: '',
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
        locationName: '',
        locationId: '',
        createdAt: '',
        budgetUtilization: 0,
        performanceMetric: 0,
        departmentHeadId: '',
        totalEmployees: 0
      }));
    });
  }

  onProjectClick(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  onAddProject(): void {
    this.router.navigate(['/projects/new']);
  }

  onEditProject(project: Project): void {
    this.router.navigate(['/projects', project.id, 'edit']);
  }

  onDeleteProject(project: Project): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectService.delete(project.id).subscribe(() => {
        this.loadProjects();
      });
    }
  }

  getTaskStatusChips(project: Project) {
    return {
      open: project.taskCounts?.open || 0,
      inProgress: project.taskCounts?.inProgress || 0,
      closed: project.taskCounts?.closed || 0
    };
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'primary';
      case 'completed':
        return 'accent';
      case 'on hold':
        return 'warn';
      default:
        return 'primary';
    }
  }

  // Custom handler for project name click
  onProjectNameClick = (row: TableCellData, colKey: string) => {
    if (colKey === 'name') {
      this.projectSelectionService.setProject(row as unknown as Project);
      this.router.navigate(['/projects', row.id]);
    }
  };
} 