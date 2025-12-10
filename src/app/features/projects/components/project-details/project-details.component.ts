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
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { Task } from '../../../../shared/models/task.model';
import { ProjectSelectionService } from '../../services/project-selection.service';

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
    private projectSelectionService: ProjectSelectionService
  ) {}

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('projectId') || this.route.snapshot.paramMap.get('id');
    const taskId = this.route.snapshot.paramMap.get('taskId');
    this.type = this.route.snapshot.data['type'] || (taskId ? 'task' : 'project');

    if (this.type === 'project' && projectId) {
      this.loadProject(projectId);
      this.loadTasks(projectId);
    } else if (this.type === 'task' && projectId && taskId) {
      this.loadProject(projectId); // for breadcrumb
      this.loadTask(taskId);
    }
  }

  loadProject(id: string): void {
    this.projectService.getById(id).subscribe(project => {
      this.project = project;
    });
  }

  loadTasks(projectId: string): void {
    this.taskService.getAll().subscribe({
      next: tasks => {
        this.tasks = tasks.filter(task => task.projectId === projectId);
      },
      error: () => { this.tasks = []; }
    });
  }

  loadTask(taskId: string): void {
    this.taskService.getById(taskId).subscribe(task => {
      this.item = task;
    });
  }

  onTaskClick(task: Task): void {
    this.router.navigate(['/projects', this.project?.id, 'tasks', task.id]);
  }

  onAddTask(): void {
    this.router.navigate(['/projects', this.project?.id, 'tasks', 'new']);
  }

  onEditTask(task: Task): void {
    this.router.navigate(['/projects', this.project?.id, 'tasks', task.id, 'edit']);
  }

  onDeleteTask(task: Task): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.delete(task.id).subscribe(() => {
        this.loadTasks(this.project!.id);
      });
    }
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
} 