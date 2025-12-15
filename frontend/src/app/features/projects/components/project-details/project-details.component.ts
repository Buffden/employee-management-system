import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Project } from '../../../../shared/models/project.model';
import { ProjectService } from '../../services/project.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { Task } from '../../../../shared/models/task.model';
import { ProjectSelectionService } from '../../services/project-selection.service';
import { OverlayDialogComponent } from '../../../../shared/components/overlay-dialog/overlay-dialog.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DialogData, overlayType } from '../../../../shared/models/dialog';
import { TableCellData } from '../../../../shared/models/table';
import { FormMode } from '../../../../shared/models/table';
import { filter } from 'rxjs/operators';

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
    MatTabsModule
  ]
})
export class ProjectDetailsComponent implements OnInit {
  @Input() item: Project | Task | null = null;
  @Input() type: 'project' | 'task' = 'project';
  @Input() parentChain: { id: string; name: string; type: 'project' | 'task' }[] = [];

  project: Project | null = null;
  tasks: Task[] = [];
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
    private matDialog: MatDialog
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
    });
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
        content: { projectId: this.project.id } as any, // Pre-fill projectId
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