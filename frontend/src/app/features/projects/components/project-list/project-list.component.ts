import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared/shared.module';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { TableCellData, FormMode } from '../../../../shared/models/table';
import { Project } from '../../../../shared/models/project.model';
import { ProjectService } from '../../services/project.service';
import { projectListConfig } from './project-list.config';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { PaginatedResponse, FilterOption } from '../../../../shared/models/paginated-response.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { OverlayDialogComponent } from '../../../../shared/components/overlay-dialog/overlay-dialog.component';
import { DialogData, overlayType } from '../../../../shared/models/dialog';
import { AuthService } from '../../../../core/services/auth.service';
import { filter, take } from 'rxjs/operators';
import { ProjectSelectionService } from '../../services/project-selection.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, SharedModule, TableComponent],
  providers: [ProjectService, HttpClient],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css'],
})
export class ProjectListComponent implements OnInit, OnDestroy {
  projects: Project[] = [];
  tableData: TableCellData[] = [];
  tableConfig = projectListConfig;
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  filters: Record<string, FilterOption[]> = {}; // Store filters from paginated response
  private isRefreshing = false; // Guard to prevent duplicate refresh calls
  private projectAddedHandler?: () => void; // Store handler reference for cleanup

  // Custom handler for project name click - opens edit dialog
  onProjectNameClick = (row: TableCellData, colKey: string) => {
    if (colKey === 'name') {
      // Check if user has permission to edit (Admin or Department Manager)
      if (this.canEditProject()) {
        this.openEditDialog(row as unknown as Project);
      } else {
        // If no edit permission, just show details view
        this.openViewDialog(row as unknown as Project);
      }
    }
  };

  constructor(
    private readonly projectService: ProjectService,
    private readonly router: Router,
    private readonly matDialog: MatDialog,
    private readonly authService: AuthService,
    private readonly projectSelectionService: ProjectSelectionService
  ) {}

  canEditProject(): boolean {
    return this.authService.isAdmin() || this.authService.isDepartmentManager();
  }

  openEditDialog(project: Project): void {
    const dialogRef: MatDialogRef<OverlayDialogComponent> = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      data: {
        title: this.tableConfig.editCardTitle,
        content: project as unknown as TableCellData,
        viewController: overlayType.EDITPROJECT,
        config: {
          ...this.tableConfig,
          mode: FormMode.EDIT
        },
        returnToPage: 'projects',
        filters: this.filters // Pass filters to form component (e.g., departments for project form)
      } as DialogData
    });

    // Use take(1) to ensure the subscription only fires once
    dialogRef.afterClosed().pipe(
      filter(result => !!result && result?.content && 'id' in result.content),
      take(1)
    ).subscribe(() => {
      // Guard to prevent duplicate refresh calls
      if (this.isRefreshing) {
        return;
      }
      this.isRefreshing = true;
      
      // Refresh the project list after update or delete
      this.loadProjects(this.currentPage, this.pageSize);
      
      // Reset flag after a short delay to allow the refresh to complete
      setTimeout(() => {
        this.isRefreshing = false;
      }, 500);
    });
  }

  openViewDialog(project: Project): void {
    this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      data: {
        title: this.tableConfig.detailsCardTitle,
        content: project as unknown as TableCellData,
        viewController: overlayType.DISPLAYPROJECT,
        config: this.tableConfig
      } as DialogData
    });
  }

  ngOnInit(): void {
    // Load with default sort from config
    const defaultSortColumn = this.tableConfig.defaultSortColumn;
    const defaultSortDir = this.tableConfig.defaultSortDirection === 'desc' ? 'DESC' : 'ASC';
    this.loadProjects(0, this.pageSize, defaultSortColumn, defaultSortDir);
    
    // Listen only for add operations from table component (edit/delete handled by afterClosed())
    // Store handler reference so we can remove it later
    this.projectAddedHandler = () => {
      // Guard to prevent duplicate refresh calls
      if (this.isRefreshing) {
        return;
      }
      this.isRefreshing = true;
      
      // Refresh the project list after create operation
      // Use current sort settings if available
      const defaultSortColumn = this.tableConfig.defaultSortColumn;
      const defaultSortDir = this.tableConfig.defaultSortDirection === 'desc' ? 'DESC' : 'ASC';
      this.loadProjects(this.currentPage, this.pageSize, defaultSortColumn, defaultSortDir);
      
      // Reset flag after a short delay to allow the refresh to complete
      setTimeout(() => {
        this.isRefreshing = false;
      }, 500);
    };
    
    globalThis.window.addEventListener('projectAdded', this.projectAddedHandler);
  }

  ngOnDestroy(): void {
    // Clean up event listener to prevent memory leaks and duplicate calls
    if (this.projectAddedHandler) {
      globalThis.window.removeEventListener('projectAdded', this.projectAddedHandler);
      this.projectAddedHandler = undefined;
    }
  }

  loadProjects(page = 0, size = 10, sortBy?: string, sortDir = 'ASC'): void {
    this.projectService.queryProjects(page, size, sortBy, sortDir).subscribe({
      next: (response: PaginatedResponse<Project>) => {
        console.log('Project query response:', response);
        this.projects = response.content || [];
        this.currentPage = response.page || 0;
        this.pageSize = response.size || 10;
        this.totalElements = response.totalElements || 0;
        this.totalPages = response.totalPages || 0;
        
        // Extract filters from response (e.g., departments, statuses for dropdown/filtering)
        if (response.filters) {
          this.filters = response.filters;
          // Store filters to pass to form component (avoids redundant API calls)
        }
        
        this.tableData = this.projects?.map(project => ({
          ...project,
          id: project.id,
          name: project.name,
          description: project.description || '',
          startDate: project.startDate || '',
          endDate: project.endDate || '',
          status: project.status || '',
          budget: project.budget || 0,
          departmentId: project.departmentId || '',
          projectManagerId: project.projectManagerId || '',
          // Map additional fields for table display
          department: project.department?.name || project.departmentId || '',
          projectManager: project.projectManager 
            ? `${project.projectManager.firstName} ${project.projectManager.lastName}`.trim()
            : project.projectManagerId || '',
          // Fill in required TableCellData fields
          locationName: '',
          locationId: '',
          createdAt: '',
          budgetUtilization: 0,
          performanceMetric: 0,
          departmentHeadId: '',
          totalEmployees: 0
        }));
      },
      error: () => {
        // Error handled by global error handler or service
      }
    });
  }

  onSortChange(event: { active: string; direction: string }): void {
    const sortDir = event.direction === 'ASC' || event.direction === 'asc' ? 'ASC' : 'DESC';
    this.loadProjects(this.currentPage, this.pageSize, event.active, sortDir);
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProjects(this.currentPage, this.pageSize);
  }
}
