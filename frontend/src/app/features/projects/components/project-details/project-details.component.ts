import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Project } from '../../../../shared/models/project.model';
import { ProjectService } from '../../services/project.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { Task } from '../../../../shared/models/task.model';
import { ProjectSelectionService } from '../../services/project-selection.service';
import { OverlayDialogComponent } from '../../../../shared/components/overlay-dialog/overlay-dialog.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DialogData, overlayType } from '../../../../shared/models/dialog';
import { TableCellData, FormMode } from '../../../../shared/models/table';
import { filter, catchError, map } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { DepartmentService } from '../../../departments/services/department.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { of } from 'rxjs';

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatTabsModule,
    MatTooltipModule
  ]
})
export class ProjectDetailsComponent implements OnInit {
  @Input() item: Project | Task | null = null;
  @Input() type: 'project' | 'task' = 'project';
  @Input() parentChain: { id: string; name: string; type: 'project' | 'task' }[] = [];

  project: Project | null = null;
  tasks: Task[] = [];
  canCreateTask = false;
  canEditProject = false;
  canDeleteProject = false;
  displayedColumns: string[] = [
    'name',
    'status',
    'priority',
    'assignedTo',
    'dueDate',
    'actions'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private taskService: TaskService,
    private projectSelectionService: ProjectSelectionService,
    private matDialog: MatDialog,
    private authService: AuthService,
    private departmentService: DepartmentService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('projectId') || this.route.snapshot.paramMap.get('id');
    const taskId = this.route.snapshot.paramMap.get('taskId');
    this.type = this.route.snapshot.data['type'] || (taskId ? 'task' : 'project');

    if (this.type === 'project' && projectId) {
      this.loadProject(projectId);
    } else if (this.type === 'task' && projectId && taskId) {
      this.loadTask(taskId);
    }
  }

  loadProject(id: string): void {
    this.projectService.getById(id).subscribe(project => {
      this.project = project;
      // Use tasks from project response if available, otherwise keep existing tasks
      if (project.tasks) {
        this.tasks = project.tasks;
      }
      // Check if user can create tasks for this project
      this.checkCanCreateTask(project);
      // Check if user can edit/delete this project
      this.checkProjectPermissions(project);
    });
  }

  checkCanCreateTask(project: Project): void {
    // Check if user is admin or HR manager
    if (this.authService.isAdmin() || this.authService.isHRManager()) {
      this.canCreateTask = true;
      return;
    }

    // Check if user is department head or assigned to project
    const user = this.authService.getCurrentUser();
    const employeeId = user?.employeeId;
    if (!employeeId) {
      this.canCreateTask = false;
      return;
    }

    // Check if user is department head
    const departmentId = project.departmentId;
    if (departmentId) {
      this.departmentService.getDepartmentById(departmentId).subscribe({
        next: (department) => {
          if (department.departmentHeadId === employeeId) {
            this.canCreateTask = true;
          } else {
            // Check if user is assigned to project
            this.checkIfAssignedToProject(project.id, employeeId);
          }
        },
        error: () => {
          // If department fetch fails, check project assignment
          this.checkIfAssignedToProject(project.id, employeeId);
        }
      });
    } else {
      // If no department, just check project assignment
      this.checkIfAssignedToProject(project.id, employeeId);
    }
  }

  checkIfAssignedToProject(projectId: string, employeeId: string): void {
    const apiUrl = `${environment.apibaseurl}/employee-projects/${employeeId}/${projectId}`;
    this.http.get(apiUrl, { observe: 'response' }).pipe(
      map(response => response.body !== null && response.status === 200),
      catchError(() => of(false))
    ).subscribe(isAssigned => {
      this.canCreateTask = isAssigned;
    });
  }

  getCreateTaskTooltip(): string {
    if (this.canCreateTask) {
      return '';
    }
    return 'Creating tasks is only available for admins, HR managers, department heads, and project assignees.';
  }

  checkProjectPermissions(project: Project): void {
    // Check if user is admin (SYSTEM_ADMIN or HR_MANAGER)
    if (this.authService.isAdmin()) {
      this.canEditProject = true;
      this.canDeleteProject = true;
      return;
    }

    // Check if user is department manager and project is in their department
    const user = this.authService.getCurrentUser();
    const employeeId = user?.employeeId;
    if (!employeeId || !project.departmentId) {
      this.canEditProject = false;
      this.canDeleteProject = false;
      return;
    }

    // Check if user is department head of the project's department
    this.departmentService.getDepartmentById(project.departmentId).subscribe({
      next: (department) => {
        this.canEditProject = department.departmentHeadId === employeeId;
        this.canDeleteProject = department.departmentHeadId === employeeId;
      },
      error: () => {
        this.canEditProject = false;
        this.canDeleteProject = false;
      }
    });
  }

  canEditTask(task: Task): boolean {
    // Admin can edit any task
    if (this.authService.isAdmin()) {
      return true;
    }

    // Check if user is assigned to the task
    const user = this.authService.getCurrentUser();
    const employeeId = user?.employeeId;
    if (employeeId && task.assignedToId) {
      return task.assignedToId === employeeId;
    }

    // Department manager can edit tasks in their department's projects
    // Backend will handle this authorization check
    if (this.authService.isDepartmentManager()) {
      // We allow the attempt, backend will validate if project is in their department
      return true;
    }

    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canDeleteTask(_task: Task): boolean {
    // Admin can delete any task
    if (this.authService.isAdmin()) {
      return true;
    }

    // Department manager can delete tasks in their department's projects
    // Backend will handle this authorization check
    if (this.authService.isDepartmentManager()) {
      // We allow the attempt, backend will validate if project is in their department
      return true;
    }

    return false;
  }

  getEditProjectTooltip(): string {
    if (this.canEditProject) {
      return '';
    }
    return 'Editing projects is only available for admins and department heads.';
  }

  getDeleteProjectTooltip(): string {
    if (this.canDeleteProject) {
      return '';
    }
    return 'Deleting projects is only available for admins and department heads.';
  }

  getEditTaskTooltip(task: Task): string {
    if (this.canEditTask(task)) {
      return '';
    }
    return 'Editing tasks is only available for admins, department managers, and the assigned employee.';
  }

  getDeleteTaskTooltip(task: Task): string {
    if (this.canDeleteTask(task)) {
      return '';
    }
    return 'Deleting tasks is only available for admins and department managers.';
  }

  loadTask(taskId: string): void {
    this.taskService.getById(taskId).subscribe(task => {
      this.item = task;
      // No need to fetch full project details - task already includes projectId and projectName
    });
  }

  onTaskClick(task: Task): void {
    this.router.navigate(['/projects', this.project?.id, 'tasks', task.id]);
  }

  onAddTask(): void {
    if (!this.project?.id) return;

    const dialogRef: MatDialogRef<OverlayDialogComponent> = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      maxHeight: '90vh',
      data: {
        title: 'Create Task',
        content: { projectId: this.project.id } as unknown as TableCellData, // Pre-fill projectId
        viewController: overlayType.ADDTASK,
        config: {
          mode: FormMode.ADD
        },
        returnToPage: 'projects'
      } as DialogData
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result && result?.content && ('id' in result.content || result.content.deleted))
    ).subscribe(() => {
      // Reload project (which includes tasks) after create/delete
      if (this.project?.id) {
        this.loadProject(this.project.id);
      }
    });
  }

  onEditTask(task: Task): void {
    if (!task?.id) return;

    const dialogRef: MatDialogRef<OverlayDialogComponent> = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      maxHeight: '90vh',
      data: {
        title: 'Edit Task',
        content: task as unknown as TableCellData,
        viewController: overlayType.EDITTASK,
        config: {
          mode: FormMode.EDIT
        },
        returnToPage: 'projects'
      } as DialogData
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result && result?.content && ('id' in result.content || result.content.deleted))
    ).subscribe((result) => {
      // If task was deleted, navigate back to project details
      if (result?.content?.deleted) {
        if (task.projectId) {
          this.router.navigate(['/projects', task.projectId]);
        }
      } else {
        // Reload task if we're on task details page, otherwise reload project
        if (this.type === 'task' && task.id) {
          this.loadTask(task.id);
        } else if (this.project?.id) {
          this.loadProject(this.project.id);
        }
      }
    });
  }

  onDeleteTask(task: Task): void {
    const taskName = task.name || 'this task';
    const dialogRef = this.matDialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Task',
        message: `Are you sure you want to delete '${taskName}'?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.taskService.delete(task.id).subscribe({
          next: () => {
            // If we're on task details page, navigate back to project details
            if (this.type === 'task' && task.projectId) {
              this.router.navigate(['/projects', task.projectId]);
            } else if (this.project?.id) {
              // Otherwise reload project (which includes tasks) after delete
              this.loadProject(this.project.id);
            }
          },
          error: (error) => {
            console.error('Error deleting task:', error);
            alert('Failed to delete task. Please try again.');
    }
        });
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
      case 'open':
        return 'primary';
      case 'completed':
      case 'closed':
        return 'accent';
      case 'on hold':
      case 'in progress':
        return 'warn';
      default:
        return 'primary';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'warn';
      case 'medium':
        return 'accent';
      case 'low':
        return 'primary';
      default:
        return 'primary';
    }
  }

  get displayName(): string {
    if (this.type === 'project') {
      return this.project?.name || '';
    } else {
      return this.item?.name || '';
    }
  }

  isTask(item: Project | Task | null): item is Task {
    return !!item && 'priority' in item;
  }

  onEditProject(): void {
    if (!this.project) return;

    const dialogRef: MatDialogRef<OverlayDialogComponent> = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      maxHeight: '90vh',
      data: {
        title: 'Edit Project',
        content: this.project as unknown as TableCellData,
        viewController: overlayType.EDITPROJECT,
        config: {
          mode: FormMode.EDIT
        },
        returnToPage: 'projects'
      } as DialogData
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result && result?.content && 'id' in result.content)
    ).subscribe(() => {
      // Reload project data after edit
      if (this.project?.id) {
        this.loadProject(this.project.id);
      }
    });
  }

  onDeleteProject(): void {
    if (!this.project) return;

    if (confirm(`Are you sure you want to delete project "${this.project.name}"? This will also delete all associated tasks.`)) {
      this.projectService.delete(this.project.id).subscribe({
        next: () => {
          this.router.navigate(['/projects']);
        },
        error: (error) => {
          console.error('Error deleting project:', error);
          alert('Failed to delete project. Please try again.');
        }
      });
    }
  }
} 