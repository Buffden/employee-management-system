import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { DialogData, overlayType } from '../../../../shared/models/dialog';
import { Task } from '../../../../shared/models/task.model';
import { FormMode, TableCellData } from '../../../../shared/models/table';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { defaultTableConfig } from '../../../../shared/components/table/table.config';
import { finalize } from 'rxjs/operators';
import { TypeaheadComponent, TypeaheadConfig } from '../../../../shared/components/typeahead/typeahead.component';
import { Employee } from '../../../../shared/models/employee.model';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, SharedModule, TypeaheadComponent],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css']
})
export class TaskFormComponent implements OnInit {
  @Input() task: DialogData | undefined;
  @Output() taskResponse: EventEmitter<DialogData> = new EventEmitter<DialogData>();

  mode: FormMode = FormMode.ADD;
  isSubmitting = false;
  errorMessage: string | null = null;

  // Typeahead configuration for employee assignment
  employeeTypeaheadConfig!: TypeaheadConfig<Employee>;

  taskForm = new FormGroup({
    name: new FormControl(''),
    description: new FormControl(''),
    status: new FormControl(''),
    priority: new FormControl(''),
    startDate: new FormControl(''),
    dueDate: new FormControl(''),
    projectId: new FormControl(''),
    assignedToId: new FormControl(''),
  });

  // Valid task statuses (matching backend constants)
  taskStatuses = ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];
  
  // Valid task priorities (matching backend constants)
  // Note: Backend uses 'Urgent' but documentation mentions 'Critical' - using 'Urgent' to match backend
  taskPriorities = ['Low', 'Medium', 'High', 'Urgent'];

  constructor(
    private readonly fb: FormBuilder,
    private readonly taskService: TaskService,
    private readonly employeeService: EmployeeService,
    private readonly matDialog: MatDialog,
    private readonly authService: AuthService
  ) { }

  ngOnInit() {
    // Set mode from config or default to ADD
    this.mode = this.task?.config?.mode || FormMode.ADD;
    
    this.initForm();
    this.initEmployeeTypeaheadConfig();
    
    if (this.mode === FormMode.EDIT) {
      this.loadTaskDetails();
    } else {
      // For new tasks, pre-fill projectId if provided in task.content
      const projectId = (this.task?.content as any)?.projectId;
      if (projectId) {
        this.taskForm.patchValue({ projectId });
      }
    }
  }

  initForm() {
    this.taskForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      status: ['Not Started', Validators.required],
      priority: ['Medium', Validators.required],
      startDate: ['', Validators.required],
      dueDate: [''],
      projectId: ['', Validators.required],
      assignedToId: [''],
    });
  }

  initEmployeeTypeaheadConfig(): void {
    this.employeeTypeaheadConfig = {
      searchFn: (searchTerm: string) => {
        return this.employeeService.searchEmployees(searchTerm, undefined, undefined);
      },
      displayFn: (employee: Employee | null) => {
        if (!employee) return '';
        return `${employee.firstName} ${employee.lastName}`.trim();
      },
      getIdFn: (employee: Employee) => employee.id,
      minSearchLength: 0
    };
  }

  loadTaskDetails() {
    const content = this.task!.content as unknown as Task;
    this.taskForm?.patchValue({
      name: content.name,
      description: content.description || '',
      status: content.status || 'Not Started',
      priority: content.priority || 'Medium',
      startDate: content.startDate || '',
      dueDate: content.dueDate || '',
      projectId: content.projectId || '',
      assignedToId: content.assignedToId || '',
    });
  }

  onSubmit() {
    if (this.taskForm.invalid) {
      this.markFormGroupTouched(this.taskForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const taskData: Partial<Task> = {
      name: this.taskForm.value.name || undefined,
      description: this.taskForm.value.description || undefined,
      status: this.taskForm.value.status || undefined,
      priority: this.taskForm.value.priority || undefined,
      startDate: this.taskForm.value.startDate || undefined,
      dueDate: this.taskForm.value.dueDate || undefined,
      projectId: this.taskForm.value.projectId || undefined,
      assignedToId: this.taskForm.value.assignedToId || undefined,
    };

    const isEdit = this.mode === FormMode.EDIT && (this.task?.content as any)?.id;
    const operation = isEdit
      ? this.taskService.update((this.task!.content as any).id, taskData)
      : this.taskService.create(taskData);

    operation.pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: (response) => {
        this.errorMessage = null;
        this.taskResponse.emit({
          title: this.task?.title || '',
          content: response as unknown as TableCellData,
          viewController: overlayType.NODATA,
          config: this.task?.config || defaultTableConfig,
          returnToPage: this.task?.returnToPage
        } as DialogData);
      },
      error: (error) => {
        console.error('Error saving task:', error);
        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Failed to save task. Please try again.';
        }
      }
    });
  }

  dialogClose() {
    this.taskResponse.emit({
      title: '',
      content: {} as TableCellData,
      viewController: overlayType.NODATA,
      config: defaultTableConfig,
      returnToPage: this.task?.returnToPage
    } as DialogData);
  }

  onDeleteClick() {
    const task = this.task?.content as unknown as Task;
    if (!task?.id) return;

    const dialogRef = this.matDialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Task',
        message: `Are you sure you want to delete task "${task.name}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.deleteTask();
      }
    });
  }

  deleteTask() {
    const task = this.task?.content as unknown as Task;
    if (!task?.id) return;

    this.isSubmitting = true;
    this.taskService.delete(task.id).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => {
        this.taskResponse.emit({
          title: '',
          content: { ...task, deleted: true } as unknown as TableCellData,
          viewController: overlayType.NODATA,
          config: this.task?.config || defaultTableConfig,
          returnToPage: this.task?.returnToPage
        } as DialogData);
      },
      error: (error) => {
        console.error('Error deleting task:', error);
        let errorMsg = 'Failed to delete task. ';
        if (error.error && error.error.message) {
          errorMsg += error.error.message;
        }
        this.errorMessage = errorMsg;
      }
    });
  }

  canDeleteTask(): boolean {
    return this.authService.isAdmin() || this.authService.isDepartmentManager();
  }

  isSubmitDisabled(): boolean {
    return this.taskForm.invalid || this.isSubmitting;
  }

  submitButtonText(): string {
    return this.mode === FormMode.EDIT ? 'Update Task' : 'Create Task';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.taskForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
