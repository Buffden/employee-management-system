import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { DialogData, overlayType } from '../../../../shared/models/dialog';
import { Department, DepartmentFormField } from '../../../../shared/models/department.model';
import { FormMode } from '../../../../shared/models/table';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DepartmentService } from '../../services/department.service';
import { LocationService } from '../../../locations/services/location.service';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { defaultTableConfig } from '../../../../shared/components/table/table.config';
import { Location } from '../../../../shared/models/location.model';
import { FilterOption } from '../../../../shared/models/paginated-response.model';
import { finalize } from 'rxjs/operators';
import { TypeaheadComponent, TypeaheadConfig } from '../../../../shared/components/typeahead/typeahead.component';
import { departmentFormFields } from './department-form.config';
import { EmployeeService } from '../../../employees/services/employee.service';
import { Employee } from '../../../../shared/models/employee.model';

@Component({
  selector: 'app-department-form',
  standalone: true,
  imports: [CommonModule, SharedModule, TypeaheadComponent],
  templateUrl: './department-form.component.html',
  styleUrls: ['./department-form.component.css']
})
export class DepartmentFormComponent implements OnInit {
  @Input() department: DialogData | undefined;
  @Output() departmentResponse: EventEmitter<DialogData> = new EventEmitter<DialogData>();

  FormFields: DepartmentFormField[] = [];
  initialFormValues = {};
  mode: FormMode = FormMode.ADD;
  isSubmitting = false;
  errorMessage: string | null = null;
  locations: Location[] = [];
  loadingLocations = false;
  
  // Typeahead configuration for department manager selection
  departmentHeadTypeaheadConfig!: TypeaheadConfig<Employee>;
  
  departmentForm = new FormGroup({
    name: new FormControl(''),
    description: new FormControl(''),
    locationId: new FormControl(''),
    budget: new FormControl(null as number | null),
    budgetUtilization: new FormControl(null as number | null),
    performanceMetric: new FormControl(null as number | null),
    departmentHeadId: new FormControl(''),
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly departmentService: DepartmentService,
    private readonly locationService: LocationService,
    private readonly employeeService: EmployeeService,
    private readonly matDialog: MatDialog,
    private readonly authService: AuthService
  ) { }

  ngOnInit() {
    this.initForm();
    this.initDepartmentHeadTypeaheadConfig();
    // Use locations from filters (passed via DialogData) instead of making redundant API call
    if (this.department?.filters && this.department.filters['locations'] && this.department.filters['locations'].length > 0) {
      const locationFilters = this.department.filters['locations'];
      this.locations = locationFilters.map((loc: FilterOption) => {
        const valueParts = loc.value ? loc.value.split(',').map((s: string) => s.trim()) : [];
        return {
          id: loc.id,
          name: loc.label,
          city: valueParts[0] || '',
          state: valueParts[1] || '',
          country: 'USA', // Default country (filters don't include country)
          address: '',
          postalCode: ''
        } as Location;
      });
      console.log('Loaded locations from filters:', this.locations.length);
    } else {
      // Fallback: if locations not available in dialog data, load from API
      // This should rarely happen, but provides a safety net
      console.warn('Locations not found in filters, falling back to API call');
      this.loadLocations();
    }
    if (this.department?.config.mode === 'edit') {
      this.loadDepartmentDetails();
    }
  }

  loadLocations(): void {
    // Fallback method: only used if locations not available in dialog data
    this.loadingLocations = true;
    this.locationService.getAllLocations().pipe(
      finalize(() => this.loadingLocations = false)
    ).subscribe({
      next: (locations) => {
        this.locations = locations || [];
        console.log('Loaded locations from API (fallback):', this.locations.length);
      },
      error: (error) => {
        console.error('Error loading locations:', error);
        this.errorMessage = 'Failed to load locations. Please refresh and try again.';
      }
    });
  }

  initForm() {
    this.FormFields = this.createFormFields();
    this.departmentForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      locationId: [''],
      budget: [null as number | null],
      budgetUtilization: [null as number | null],
      performanceMetric: [null as number | null],
      departmentHeadId: [''],
    });
  }

  loadDepartmentDetails() {
    const content = this.department!.content as Department;
    this.departmentForm?.patchValue({
      name: content.name,
      description: content.description,
      locationId: content.locationId,
      budget: content.budget ?? null,
      budgetUtilization: content.budgetUtilization ?? null,
      performanceMetric: content.performanceMetric ?? null,
      departmentHeadId: content.departmentHeadId ? String(content.departmentHeadId) : '',
    });
    this.initialFormValues = this.departmentForm.getRawValue();
  }

  onSubmit() {
    if (this.department?.config.mode === 'add') {
      this.addDepartment();
    } else {
      this.updateDepartment();
    }
  }

  addDepartment(): void {
    if (this.departmentForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    // Clean data: only include non-empty values for optional fields
    const formValue = this.departmentForm.getRawValue();
    const departmentData: Record<string, string | number | null> = {
      name: (formValue['name'] || '').trim(),
      description: (formValue['description'] || '').trim(),
      locationId: (formValue['locationId'] || '').trim() || null,
    };

    // Only include numeric fields if they have values
    const budget = formValue['budget'];
    if (budget !== null && budget !== undefined) {
      if (typeof budget === 'number') {
        departmentData['budget'] = budget;
      } else {
        const budgetStr = String(budget);
        if (budgetStr.trim() !== '') {
          const budgetNum = Number(budgetStr);
          if (!Number.isNaN(budgetNum)) {
            departmentData['budget'] = budgetNum;
          }
        }
      }
    }
    const budgetUtilization = formValue['budgetUtilization'];
    if (budgetUtilization !== null && budgetUtilization !== undefined) {
      if (typeof budgetUtilization === 'number') {
        departmentData['budgetUtilization'] = budgetUtilization;
      } else {
        const budgetUtilStr = String(budgetUtilization);
        if (budgetUtilStr.trim() !== '') {
          const budgetUtilNum = Number(budgetUtilStr);
          if (!Number.isNaN(budgetUtilNum)) {
            departmentData['budgetUtilization'] = budgetUtilNum;
          }
        }
      }
    }
    const performanceMetric = formValue['performanceMetric'];
    if (performanceMetric !== null && performanceMetric !== undefined) {
      if (typeof performanceMetric === 'number') {
        departmentData['performanceMetric'] = performanceMetric;
      } else {
        const perfMetricStr = String(performanceMetric);
        if (perfMetricStr.trim() !== '') {
          const perfMetricNum = Number(perfMetricStr);
          if (!Number.isNaN(perfMetricNum)) {
            departmentData['performanceMetric'] = perfMetricNum;
          }
        }
      }
    }
    const departmentHeadId = formValue['departmentHeadId'];
    if (departmentHeadId && typeof departmentHeadId === 'string' && departmentHeadId.trim() !== '' && departmentHeadId !== 'null') {
      departmentData['departmentHeadId'] = departmentHeadId.trim();
    } else {
      // Explicitly set to null if empty/cleared to allow backend to clear the department manager
      departmentData['departmentHeadId'] = null;
    }

    this.departmentService.addDepartment(departmentData).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: (response) => {
        console.log('Department added successfully:', response);
        this.errorMessage = null;
        this.departmentResponse.emit({
          title: this.department?.title || '',
          content: response,
          viewController: overlayType.NODATA,
          config: this.department?.config || defaultTableConfig,
          returnToPage: this.department?.returnToPage
        } as DialogData);
        // No need to dispatch event - afterClosed() in list/table component handles refresh
      },
      error: (error) => {
        console.error('Error adding department:', error);
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
            error.error.fieldErrors.forEach((fieldError: { field: string; rejectedValue: unknown; message: string }) => {
              console.error(`Field: ${fieldError.field}, Value: ${fieldError.rejectedValue}, Message: ${fieldError.message}`);
            });
          } else if (error.error.message) {
            // Handle business rule errors (like duplicate name)
            errorMsg = error.error.message;
          } else {
            errorMsg = 'Failed to add department. Please check the console for details.';
          }
        } else {
          errorMsg = 'Failed to add department. Unknown error occurred.';
        }
        
        this.errorMessage = errorMsg;
      }
    });
  }

  updateDepartment(): void {
    if (this.departmentForm.invalid) {
      return;
    }

    const departmentId = (this.department?.content as Department)?.id;
    if (!departmentId) {
      console.error('Department ID is required for update');
      this.errorMessage = 'Department ID is missing for update.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    // Clean data: only include non-empty values for optional fields
    const formValue = this.departmentForm.getRawValue();
    const departmentData: Record<string, string | number | null> = {
      name: (formValue['name'] || '').trim(),
      description: (formValue['description'] || '').trim(),
      locationId: (formValue['locationId'] || '').trim() || null,
    };

    // Only include numeric fields if they have values
    const budget = formValue['budget'];
    if (budget !== null && budget !== undefined) {
      if (typeof budget === 'number') {
        departmentData['budget'] = budget;
      } else {
        const budgetStr = String(budget);
        if (budgetStr.trim() !== '') {
          const budgetNum = Number(budgetStr);
          if (!Number.isNaN(budgetNum)) {
            departmentData['budget'] = budgetNum;
          }
        }
      }
    }
    const budgetUtilization = formValue['budgetUtilization'];
    if (budgetUtilization !== null && budgetUtilization !== undefined) {
      if (typeof budgetUtilization === 'number') {
        departmentData['budgetUtilization'] = budgetUtilization;
      } else {
        const budgetUtilStr = String(budgetUtilization);
        if (budgetUtilStr.trim() !== '') {
          const budgetUtilNum = Number(budgetUtilStr);
          if (!Number.isNaN(budgetUtilNum)) {
            departmentData['budgetUtilization'] = budgetUtilNum;
          }
        }
      }
    }
    const performanceMetric = formValue['performanceMetric'];
    if (performanceMetric !== null && performanceMetric !== undefined) {
      if (typeof performanceMetric === 'number') {
        departmentData['performanceMetric'] = performanceMetric;
      } else {
        const perfMetricStr = String(performanceMetric);
        if (perfMetricStr.trim() !== '') {
          const perfMetricNum = Number(perfMetricStr);
          if (!Number.isNaN(perfMetricNum)) {
            departmentData['performanceMetric'] = perfMetricNum;
          }
        }
      }
    }
    const departmentHeadId = formValue['departmentHeadId'];
    if (departmentHeadId && typeof departmentHeadId === 'string' && departmentHeadId.trim() !== '' && departmentHeadId !== 'null') {
      departmentData['departmentHeadId'] = departmentHeadId.trim();
    } else {
      // Explicitly set to null if empty/cleared to allow backend to clear the department manager
      departmentData['departmentHeadId'] = null;
    }

    this.departmentService.updateDepartment(departmentId, departmentData).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: (response) => {
        console.log('Department updated successfully:', response);
        this.errorMessage = null;
        this.departmentResponse.emit({
          title: this.department?.title || '',
          content: response,
          viewController: overlayType.NODATA,
          config: this.department?.config || defaultTableConfig,
          returnToPage: this.department?.returnToPage
        } as DialogData);
      },
      error: (error) => {
        console.error('Error updating department:', error);
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
            error.error.fieldErrors.forEach((fieldError: { field: string; rejectedValue: unknown; message: string }) => {
              console.error(`Field: ${fieldError.field}, Value: ${fieldError.rejectedValue}, Message: ${fieldError.message}`);
            });
          } else if (error.error.message) {
            // Handle business rule errors
            errorMsg = error.error.message;
          } else {
            errorMsg = 'Failed to update department. Please check the console for details.';
          }
        } else {
          errorMsg = 'Failed to update department. Unknown error occurred.';
        }
        
        this.errorMessage = errorMsg;
      }
    });
  }

  submitButtonText() {
    return this.department?.config.mode === 'add' ? 'Add Department' : 'Update Department';
  }

  canDeleteDepartment(): boolean {
    return this.department?.config.mode === 'edit' && (this.authService.isAdmin() || this.authService.isHRManager());
  }

  onDeleteClick(): void {
    const departmentName = (this.department?.content as Department)?.name || 'this department';
    const dialogRef = this.matDialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Department',
        message: `Are you sure you want to delete '${departmentName}'?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        warning: 'This action is irreversible and cannot be undone.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.deleteDepartment();
      }
    });
  }

  deleteDepartment(): void {
    const departmentId = (this.department?.content as Department)?.id;
    if (!departmentId) {
      console.error('Department ID is required for deletion');
      this.errorMessage = 'Department ID is missing for deletion.';
      return;
    }

    this.isSubmitting = true;
    this.departmentService.deleteDepartment(departmentId).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => {
        this.errorMessage = null;
        // Emit a response to close the dialog and notify the parent to refresh
        this.departmentResponse.emit({
          title: this.department?.title || '',
          content: { id: departmentId, deleted: true } as Department & { deleted: boolean },
          viewController: overlayType.NODATA,
          config: this.department?.config || defaultTableConfig,
          returnToPage: this.department?.returnToPage
        } as DialogData);
        // No need to dispatch event - afterClosed() in list component handles refresh
      },
      error: (error) => {
        console.error('Error deleting department:', error);
        let errorMsg = 'Failed to delete department. ';
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
    return this.departmentForm.invalid || this.isSubmitting;
  }

  isFieldInvalid(field: DepartmentFormField): boolean {
    return (this.departmentForm.get(field.formControlName)?.invalid && this.departmentForm.get(field.formControlName)?.touched) || false;
  }

  dialogClose() {
    this.departmentResponse.emit({ 
      title: this.department?.title || '',
      content: {},
      viewController: this.department?.viewController || overlayType.NODATA,
      config: this.department?.config || defaultTableConfig
    } as DialogData);
  }

  initDepartmentHeadTypeaheadConfig(): void {
    this.departmentHeadTypeaheadConfig = {
      searchFn: (searchTerm: string) => {
        return this.employeeService.searchEmployees(searchTerm);
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

  createFormFields(): DepartmentFormField[] {
    return departmentFormFields;
  }
}
