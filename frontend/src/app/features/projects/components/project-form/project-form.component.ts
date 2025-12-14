import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, AfterViewInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { DialogData, overlayType } from '../../../../shared/models/dialog';
import { Project, ProjectFormField } from '../../../../shared/models/project.model';
import { FormMode, TableCellData } from '../../../../shared/models/table';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { DepartmentService } from '../../../departments/services/department.service';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { defaultTableConfig } from '../../../../shared/components/table/table.config';
import { Department } from '../../../../shared/models/department.model';
import { finalize } from 'rxjs/operators';
import { TypeaheadComponent, TypeaheadConfig } from '../../../../shared/components/typeahead/typeahead.component';
import { EmployeeService } from '../../../employees/services/employee.service';
import { Employee } from '../../../../shared/models/employee.model';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, SharedModule, TypeaheadComponent],
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.css']
})
export class ProjectFormComponent implements OnInit, AfterViewInit {
  @Input() project: DialogData | undefined;
  @Output() projectResponse: EventEmitter<DialogData> = new EventEmitter<DialogData>();

  FormFields: ProjectFormField[] = [];
  initialFormValues = {};
  mode: FormMode = FormMode.ADD;
  isSubmitting = false;
  errorMessage: string | null = null;
  // Typeahead configuration for department selection
  departmentTypeaheadConfig!: TypeaheadConfig<Department>;
  
  // Typeahead configuration for project manager selection
  projectManagerTypeaheadConfig!: TypeaheadConfig<Employee>;
  
  projectForm = new FormGroup({
    name: new FormControl(''),
    description: new FormControl(''),
    startDate: new FormControl(''),
    endDate: new FormControl(''),
    status: new FormControl(''),
    budget: new FormControl(null as number | null),
    departmentId: new FormControl(''),
    projectManagerId: new FormControl(''),
  });

  // Valid project statuses
  projectStatuses = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'];

  constructor(
    private readonly fb: FormBuilder,
    private readonly projectService: ProjectService,
    private readonly departmentService: DepartmentService,
    private readonly employeeService: EmployeeService,
    private readonly matDialog: MatDialog,
    private readonly authService: AuthService
  ) { }

  ngOnInit() {
    this.initForm();
    this.initDepartmentTypeaheadConfig();
    this.initProjectManagerTypeaheadConfig();
    if (this.project?.config.mode === 'edit') {
      this.loadProjectDetails();
    }
  }


  initForm() {
    this.FormFields = this.createFormFields();
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      startDate: ['', Validators.required],
      endDate: [''],
      status: ['Planning', Validators.required],
      budget: [null as number | null],
      departmentId: ['', Validators.required],
      projectManagerId: ['', Validators.required],
    });
  }

  loadProjectDetails() {
    const content = this.project!.content as unknown as Project;
    this.projectForm?.patchValue({
      name: content.name,
      description: content.description || '',
      startDate: content.startDate || '',
      endDate: content.endDate || '',
      status: content.status || 'Planning',
      budget: content.budget ?? null,
      departmentId: content.departmentId || '',
      projectManagerId: content.projectManagerId ? String(content.projectManagerId) : '',
    });
    this.initialFormValues = this.projectForm.getRawValue();
  }

  onSubmit() {
    if (this.project?.config.mode === 'add') {
      this.addProject();
    } else {
      this.updateProject();
    }
  }

  addProject(): void {
    if (this.projectForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    // Clean data: only include non-empty values for optional fields
    const formValue = this.projectForm.getRawValue();
    const projectData: Record<string, string | number | null> = {
      name: (formValue['name'] || '').trim(),
      description: (formValue['description'] || '').trim() || null,
      startDate: (formValue['startDate'] || '').trim(),
      departmentId: (formValue['departmentId'] || '').trim(),
      status: (formValue['status'] || 'Planning').trim(),
    };

    // Optional fields
    if (formValue['endDate'] && (formValue['endDate'] as string).trim()) {
      projectData['endDate'] = (formValue['endDate'] as string).trim();
    }

    const budget = formValue['budget'];
    if (budget !== null && budget !== undefined) {
      if (typeof budget === 'number') {
        projectData['budget'] = budget;
      } else {
        const budgetStr = String(budget);
        if (budgetStr.trim() !== '') {
          const budgetNum = Number(budgetStr);
          if (!Number.isNaN(budgetNum)) {
            projectData['budget'] = budgetNum;
          }
        }
      }
    }

    // Project manager is required
    const projectManagerId = formValue['projectManagerId'];
    if (projectManagerId && typeof projectManagerId === 'string' && projectManagerId.trim() !== '' && projectManagerId !== 'null') {
      projectData['projectManagerId'] = projectManagerId.trim();
    } else {
      // This should not happen due to form validation, but handle gracefully
      console.error('Project manager ID is required but not provided');
      this.errorMessage = 'Project manager is required';
      return;
    }

    this.projectService.create(projectData).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: (response) => {
        console.log('Project added successfully:', response);
        this.errorMessage = null;
        this.projectResponse.emit({
          title: this.project?.title || '',
          content: response as unknown as TableCellData,
          viewController: overlayType.NODATA,
          config: this.project?.config || defaultTableConfig,
          returnToPage: this.project?.returnToPage
        } as DialogData);
      },
      error: (error) => {
        console.error('Error adding project:', error);
        console.error('Error status:', error.status);
        console.error('Error response:', error.error);
        
        // Extract error message for display
        let errorMsg = '';
        
        if (error.error) {
          console.error('Error message:', error.error.message);
          console.error('Error details:', JSON.stringify(error.error, null, 2));
          
          // Handle validation errors with field-level details
          if (error.error.fieldErrors && error.error.fieldErrors.length > 0) {
            console.error('Validation errors:', error.error.fieldErrors);
            const fieldErrors = error.error.fieldErrors.map((fe: { field: string; message: string; rejectedValue?: unknown }) => {
              const fieldName = fe.field.charAt(0).toUpperCase() + fe.field.slice(1).replaceAll(/([A-Z])/g, ' $1');
              let msg = `${fieldName}: ${fe.message}`;
              if (fe.rejectedValue !== null && fe.rejectedValue !== undefined) {
                const rejectedValueStr = typeof fe.rejectedValue === 'object' ? JSON.stringify(fe.rejectedValue) : String(fe.rejectedValue);
                msg += ` (received: ${rejectedValueStr})`;
              }
              return msg;
            }).join('; ');
            errorMsg = `Validation failed: ${fieldErrors}`;
          } else if (error.error.message) {
            // Handle business rule errors (like duplicate name)
            errorMsg = error.error.message;
          } else {
            errorMsg = 'Failed to add project. Please check the console for details.';
          }
        } else {
          errorMsg = 'Failed to add project. Unknown error occurred.';
        }
        
        this.errorMessage = errorMsg;
      }
    });
  }

  updateProject(): void {
    if (this.projectForm.invalid) {
      return;
    }

    const projectId = (this.project?.content as unknown as Project)?.id;
    if (!projectId) {
      console.error('Project ID is required for update');
      this.errorMessage = 'Project ID is missing for update.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    // Clean data: only include non-empty values for optional fields
    const formValue = this.projectForm.getRawValue();
    const projectData: Record<string, string | number | null> = {
      name: (formValue['name'] || '').trim(),
      description: (formValue['description'] || '').trim() || null,
      startDate: (formValue['startDate'] || '').trim(),
      departmentId: (formValue['departmentId'] || '').trim(),
      status: (formValue['status'] || 'Planning').trim(),
    };

    // Optional fields
    if (formValue['endDate'] && (formValue['endDate'] as string).trim()) {
      projectData['endDate'] = (formValue['endDate'] as string).trim();
    }

    const budget = formValue['budget'];
    if (budget !== null && budget !== undefined) {
      if (typeof budget === 'number') {
        projectData['budget'] = budget;
      } else {
        const budgetStr = String(budget);
        if (budgetStr.trim() !== '') {
          const budgetNum = Number(budgetStr);
          if (!Number.isNaN(budgetNum)) {
            projectData['budget'] = budgetNum;
          }
        }
      }
    }

    // Project manager is required
    const projectManagerId = formValue['projectManagerId'];
    if (projectManagerId && typeof projectManagerId === 'string' && projectManagerId.trim() !== '' && projectManagerId !== 'null') {
      projectData['projectManagerId'] = projectManagerId.trim();
    } else {
      // This should not happen due to form validation, but handle gracefully
      console.error('Project manager ID is required but not provided');
      this.errorMessage = 'Project manager is required';
      return;
    }

    this.projectService.update(projectId, projectData).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: (response) => {
        console.log('Project updated successfully:', response);
        this.errorMessage = null;
        this.projectResponse.emit({
          title: this.project?.title || '',
          content: response as unknown as TableCellData,
          viewController: overlayType.NODATA,
          config: this.project?.config || defaultTableConfig,
          returnToPage: this.project?.returnToPage
        } as DialogData);
      },
      error: (error) => {
        console.error('Error updating project:', error);
        console.error('Error status:', error.status);
        console.error('Error response:', error.error);
        
        // Extract error message for display
        let errorMsg = '';
        
        if (error.error) {
          console.error('Error message:', error.error.message);
          console.error('Error details:', JSON.stringify(error.error, null, 2));
          
          // Handle validation errors with field-level details
          if (error.error.fieldErrors && error.error.fieldErrors.length > 0) {
            console.error('Validation errors:', error.error.fieldErrors);
            const fieldErrors = error.error.fieldErrors.map((fe: { field: string; message: string; rejectedValue?: unknown }) => {
              const fieldName = fe.field.charAt(0).toUpperCase() + fe.field.slice(1).replaceAll(/([A-Z])/g, ' $1');
              let msg = `${fieldName}: ${fe.message}`;
              if (fe.rejectedValue !== null && fe.rejectedValue !== undefined) {
                const rejectedValueStr = typeof fe.rejectedValue === 'object' ? JSON.stringify(fe.rejectedValue) : String(fe.rejectedValue);
                msg += ` (received: ${rejectedValueStr})`;
              }
              return msg;
            }).join('; ');
            errorMsg = `Validation failed: ${fieldErrors}`;
          } else if (error.error.message) {
            // Handle business rule errors
            errorMsg = error.error.message;
          } else {
            errorMsg = 'Failed to update project. Please check the console for details.';
          }
        } else {
          errorMsg = 'Failed to update project. Unknown error occurred.';
        }
        
        this.errorMessage = errorMsg;
      }
    });
  }

  submitButtonText() {
    return this.project?.config.mode === 'add' ? 'Add Project' : 'Update Project';
  }

  canDeleteProject(): boolean {
    return this.project?.config.mode === 'edit' && (this.authService.isAdmin() || this.authService.isDepartmentManager());
  }

  onDeleteClick(): void {
    const projectName = (this.project?.content as unknown as Project)?.name || 'this project';
    const dialogRef = this.matDialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Project',
        message: `Are you sure you want to delete '${projectName}'?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        warning: 'This action is irreversible and cannot be undone.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.deleteProject();
      }
    });
  }

  deleteProject(): void {
    const projectId = (this.project?.content as unknown as Project)?.id;
    if (!projectId) {
      console.error('Project ID is required for deletion');
      this.errorMessage = 'Project ID is missing for deletion.';
      return;
    }

    this.isSubmitting = true;
    this.projectService.delete(projectId).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => {
        this.errorMessage = null;
        // Emit a response to close the dialog and notify the parent to refresh
        this.projectResponse.emit({
          title: this.project?.title || '',
          content: { id: projectId, deleted: true } as unknown as TableCellData,
          viewController: overlayType.NODATA,
          config: this.project?.config || defaultTableConfig,
          returnToPage: this.project?.returnToPage
        } as DialogData);
      },
      error: (error) => {
        console.error('Error deleting project:', error);
        let errorMsg = 'Failed to delete project. ';
        if (error.error && error.error.message) {
          errorMsg += error.error.message;
        } else {
          errorMsg += 'An unknown error occurred.';
        }
        this.errorMessage = errorMsg;
      }
    });
  }

  isSubmitDisabled(): boolean {
    return this.projectForm.invalid || this.isSubmitting;
  }

  isFieldInvalid(field: ProjectFormField): boolean {
    return (this.projectForm.get(field.formControlName)?.invalid && this.projectForm.get(field.formControlName)?.touched) || false;
  }

  dialogClose() {
    this.projectResponse.emit({ 
      title: this.project?.title || '',
      content: {},
      viewController: this.project?.viewController || overlayType.NODATA,
      config: this.project?.config || defaultTableConfig
    } as DialogData);
  }

  initDepartmentTypeaheadConfig(): void {
    this.departmentTypeaheadConfig = {
      searchFn: (searchTerm: string) => {
        return this.departmentService.searchDepartments(searchTerm);
      },
      getByIdFn: (id: string) => this.departmentService.getDepartmentById(id),
      displayFn: (department: Department | null) => {
        if (!department) return '';
        return department.name || '';
      },
      getIdFn: (department: Department) => department.id,
      itemTemplate: (department: Department) => {
        return `
          <div style="display: flex; flex-direction: column; padding: 4px 0;">
            <div style="font-weight: 500; font-size: 14px; color: rgba(0, 0, 0, 0.87);">
              ${department.name}
            </div>
            ${department.description ? `
              <div style="font-size: 12px; color: rgba(0, 0, 0, 0.54); margin-top: 2px;">
                ${department.description}
              </div>
            ` : ''}
          </div>
        `;
      },
      minSearchLength: 2,
      debounceTime: 300,
      noResultsMessage: 'No departments found'
    };
  }

  initProjectManagerTypeaheadConfig(): void {
    this.projectManagerTypeaheadConfig = {
      searchFn: (searchTerm: string, filters?: Record<string, unknown>) => {
        // Always read departmentId directly from form to ensure we get the latest value
        const formDepartmentId = this.projectForm.get('departmentId')?.value;
        const filterDepartmentId = filters?.['departmentId'] as string | undefined;
        // Only use departmentId if it's a valid non-empty string
        const departmentId = (formDepartmentId && formDepartmentId.trim() !== '') 
          ? formDepartmentId.trim() 
          : (filterDepartmentId && filterDepartmentId.trim() !== '') 
            ? filterDepartmentId.trim() 
            : undefined;
        console.log('Project Manager search - term:', searchTerm, 'departmentId:', departmentId);
        return this.employeeService.searchEmployees(
          searchTerm,
          departmentId,
          undefined // No exclude employee ID needed for project manager
        );
      },
      getByIdFn: (id: string) => this.employeeService.getEmployeeById(id),
      displayFn: (employee: Employee | null) => {
        if (!employee) return '';
        const firstName = employee.firstName || '';
        const lastName = employee.lastName || '';
        const email = employee.email || '';
        return `${firstName} ${lastName} (${email})`.trim();
      },
      getIdFn: (employee: Employee) => employee.id,
      itemTemplate: (employee: Employee) => {
        return `
          <div style="display: flex; flex-direction: column; padding: 4px 0;">
            <div style="font-weight: 500; font-size: 14px; color: rgba(0, 0, 0, 0.87);">
              ${employee.firstName} ${employee.lastName}
            </div>
            <div style="display: flex; gap: 12px; font-size: 12px; color: rgba(0, 0, 0, 0.54); margin-top: 2px;">
              <span style="flex: 1;">${employee.email}</span>
              ${employee.designation ? `<span style="font-style: italic;">${employee.designation}</span>` : ''}
            </div>
          </div>
        `;
      },
      minSearchLength: 2,
      debounceTime: 300,
      noResultsMessage: 'No employees found'
    };
  }

  getProjectManagerTypeaheadFilters(): Record<string, unknown> {
    const departmentId = this.projectForm.get('departmentId')?.value;
    return departmentId ? { departmentId } : {};
  }

  // Watch for department changes to update project manager filter
  ngAfterViewInit(): void {
    // Subscribe to department changes to clear project manager when department changes
    this.projectForm.get('departmentId')?.valueChanges.subscribe((newDepartmentId) => {
      // Clear project manager when department changes
      if (this.projectForm.get('projectManagerId')?.value) {
        this.projectForm.get('projectManagerId')?.setValue('');
      }
    });
  }

  createFormFields(): ProjectFormField[] {
    return [
      {
        label: 'Project Name',
        formControlName: 'name',
        placeholder: 'Enter project name',
        errorMessage: 'Project name is required (max 100 characters)',
        required: true
      },
      {
        label: 'Description',
        formControlName: 'description',
        placeholder: 'Enter description',
        errorMessage: 'Description must not exceed 1000 characters',
      },
      {
        label: 'Department',
        formControlName: 'departmentId',
        placeholder: 'Search for department',
        errorMessage: 'Department is required',
        type: 'typeahead',
        required: true
      },
      {
        label: 'Project Manager',
        formControlName: 'projectManagerId',
        placeholder: 'Search for project manager',
        errorMessage: 'Project manager is required',
        type: 'typeahead',
        required: true
      },
      {
        label: 'Start Date',
        formControlName: 'startDate',
        placeholder: 'Select start date',
        errorMessage: 'Start date is required',
        type: 'date',
        required: true
      },
      {
        label: 'End Date',
        formControlName: 'endDate',
        placeholder: 'Select end date (optional)',
        errorMessage: 'End date must be after start date',
        type: 'date'
      },
      {
        label: 'Status',
        formControlName: 'status',
        placeholder: 'Select status',
        errorMessage: 'Status is required',
        type: 'select',
        options: this.projectStatuses,
        required: true
      },
      {
        label: 'Budget',
        formControlName: 'budget',
        placeholder: 'Enter budget (optional)',
        errorMessage: 'Budget must be a positive number',
        type: 'number'
      },
    ];
  }
}

