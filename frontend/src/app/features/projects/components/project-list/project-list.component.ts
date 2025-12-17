import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared/shared.module';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { TableCellData, FormMode, TableConfig } from '../../../../shared/models/table';
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
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

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
  tableConfig: TableConfig = { ...projectListConfig }; // Create a copy to avoid mutating the original config
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  currentSortColumn = '';
  currentSortDirection = 'ASC';
  filters: Record<string, FilterOption[]> = {}; // Store filters from paginated response
  loading = false; // Loading state for table spinner
  private isRefreshing = false; // Guard to prevent duplicate refresh calls
  private projectAddedHandler?: () => void; // Store handler reference for cleanup

  // Custom handler for project name click - navigates to project details page
  onProjectNameClick = (row: TableCellData, colKey: string) => {
    if (colKey === 'name') {
      const project = row as unknown as Project;
      if (project?.id) {
        // Navigate to project details page
        this.router.navigate(['/projects', project.id]);
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
    return this.authService.isAdmin() || this.authService.isHRManager() || this.authService.isDepartmentManager();
  }

  ngOnInit(): void {
    // Enable action buttons ONLY for admins, HR managers, and department managers
    // Employees should NOT see action buttons
    this.tableConfig.displayActionButtons = this.canEditProject();
    
    // Load with default sort from config
    if (this.tableConfig.defaultSortColumn) {
      this.currentSortColumn = this.tableConfig.defaultSortColumn;
      this.currentSortDirection = this.tableConfig.defaultSortDirection === 'desc' ? 'DESC' : 'ASC';
    }
    this.loadProjects(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
    
    // Listen only for add operations from table component (edit/delete handled by afterClosed())
    // Store handler reference so we can remove it later
    this.projectAddedHandler = () => {
      this.loadProjects(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
    };
    
    globalThis.window.addEventListener('projectAdded', this.projectAddedHandler);
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
      this.loadProjects(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
      
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


  ngOnDestroy(): void {
    // Clean up event listener to prevent memory leaks and duplicate calls
    if (this.projectAddedHandler) {
      globalThis.window.removeEventListener('projectAdded', this.projectAddedHandler);
      this.projectAddedHandler = undefined;
    }
  }

  loadProjects(page = 0, size = 10, sortBy?: string, sortDir = 'ASC'): void {
    this.loading = true;
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
          // Map additional fields for table display
          department: project.department?.name || 'Not specified',
          projectManager: project.projectManager 
            ? `${project.projectManager.firstName} ${project.projectManager.lastName}`.trim()
            : 'Not assigned',
          // Fill in required TableCellData fields
          locationName: '',
          locationId: '',
          createdAt: '',
          budgetUtilization: 0,
          performanceMetric: 0,
          departmentHeadId: '',
          totalEmployees: 0
        }));
        this.loading = false;
      },
      error: () => {
        // Error handled by global error handler or service
        this.loading = false;
      }
    });
  }

  onSortChange(event: { active: string; direction: string }): void {
    this.currentSortColumn = event.active;
    this.currentSortDirection = event.direction === 'ASC' || event.direction === 'asc' ? 'ASC' : 'DESC';
    // Reset to first page when sorting changes
    this.currentPage = 0;
    this.loadProjects(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    // Reset to first page if page size changed
    const pageSizeChanged = this.pageSize !== event.pageSize;
    this.currentPage = pageSizeChanged ? 0 : event.pageIndex;
    this.pageSize = event.pageSize;
    // Use current sort settings when loading
    this.loadProjects(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
  }

  openDeleteDialog(project: Project): void {
    const projectName = project.name || 'this project';
    const dialogRef = this.matDialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Project',
        message: `Are you sure you want to delete "${projectName}"?`,
        warning: 'This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe(result => {
      if (result && project.id) {
        this.projectService.delete(project.id).subscribe({
          next: () => {
            this.loadProjects(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
          },
          error: (error: unknown) => {
            console.error('Error deleting project:', error);
            alert('Failed to delete project. Please try again.');
          }
        });
      }
    });
  }

  // Handler methods for table component
  onEditAction = (row: TableCellData): void => {
    const project = row as unknown as Project;
    this.openEditDialog(project);
  }

  onDeleteAction = (row: TableCellData): void => {
    const project = row as unknown as Project;
    this.openDeleteDialog(project);
  }
}
