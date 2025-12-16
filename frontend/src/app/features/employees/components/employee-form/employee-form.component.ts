import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { DialogData, overlayType } from '../../../../shared/models/dialog';
import { Employee, EmployeeFormField } from '../../../../shared/models/employee.model';
import { FormMode } from '../../../../shared/models/table';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentService } from '../../../departments/services/department.service';
import { LocationService } from '../../../locations/services/location.service';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { defaultTableConfig } from '../../../../shared/components/table/table.config';
import { Department } from '../../../../shared/models/department.model';
import { Location } from '../../../../shared/models/location.model';
import { FilterOption } from '../../../../shared/models/paginated-response.model';
import { finalize } from 'rxjs/operators';
import { TypeaheadComponent, TypeaheadConfig } from '../../../../shared/components/typeahead/typeahead.component';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, SharedModule, TypeaheadComponent],
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.css']
})
export class EmployeeFormComponent implements OnInit {
  @Input() employee: DialogData | undefined;
  @Output() employeeResponse: EventEmitter<DialogData> = new EventEmitter<DialogData>();

  FormFields: EmployeeFormField[] = [];
  initialFormValues = {};
  mode: FormMode = FormMode.ADD;
  FormMode = FormMode; // Expose FormMode enum to template
  isSubmitting = false;
  errorMessage: string | null = null;
  departments: Department[] = [];
  locations: Location[] = [];
  loadingDepartments = false;
  loadingLocations = false;
  
  employeeForm!: FormGroup;
  
  // Typeahead configuration for manager selection
  managerTypeaheadConfig!: TypeaheadConfig<Employee>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly employeeService: EmployeeService,
    private readonly departmentService: DepartmentService,
    private readonly locationService: LocationService,
    private readonly matDialog: MatDialog,
    private readonly authService: AuthService
  ) { }

  ngOnInit() {
    // Set mode from dialog data
    if (this.employee?.config?.mode) {
      this.mode = this.employee.config.mode;
    }
    
    this.initForm();
    this.initManagerTypeaheadConfig();
    
    // Load departments and locations from filters (passed via DialogData)
    if (this.employee?.filters) {
      // Load departments from filters
      if (this.employee.filters['departments'] && this.employee.filters['departments'].length > 0) {
        const departmentFilters = this.employee.filters['departments'];
        this.departments = departmentFilters.map((dept: FilterOption) => ({
          id: dept.id,
          name: dept.label,
          description: '',
          locationId: '',
          locationName: '',
          createdAt: '',
          budget: 0,
          budgetUtilization: 0,
          performanceMetric: 0
        } as Department));
      } else {
        this.loadDepartments();
      }
      
      // Load locations from filters
      if (this.employee.filters['locations'] && this.employee.filters['locations'].length > 0) {
        const locationFilters = this.employee.filters['locations'];
        this.locations = locationFilters.map((loc: FilterOption) => {
          const valueParts = loc.value ? loc.value.split(',').map((s: string) => s.trim()) : [];
          return {
            id: loc.id,
            name: loc.label,
            city: valueParts[0] || '',
            state: valueParts[1] || '',
            country: 'USA',
            address: '',
            postalCode: ''
          } as Location;
        });
      } else {
        this.loadLocations();
      }
    } else {
      // Fallback: load from API if filters not available
      this.loadDepartments();
      this.loadLocations();
    }
    
    // Subscribe to department changes to clear manager if department changes
    this.employeeForm.get('departmentId')?.valueChanges.subscribe((departmentId) => {
      // Clear manager selection when department changes
      // The typeahead will automatically filter by the new department
      const currentManagerId = this.employeeForm.get('managerId')?.value;
      if (currentManagerId && !departmentId) {
        this.employeeForm.get('managerId')?.setValue('');
      }
    });
    
    if (this.employee?.config.mode === FormMode.EDIT) {
      this.loadEmployeeDetails();
    }
  }

  loadDepartments(): void {
    this.loadingDepartments = true;
    this.departmentService.getAllDepartments().pipe(
      finalize(() => this.loadingDepartments = false)
    ).subscribe({
      next: (departments: Department[]) => {
        this.departments = departments || [];
      },
      error: () => {
        this.errorMessage = 'Failed to load departments. Please refresh and try again.';
      }
    });
  }

  loadLocations(): void {
    this.loadingLocations = true;
    this.locationService.getAllLocations().pipe(
      finalize(() => this.loadingLocations = false)
    ).subscribe({
      next: (locations) => {
        this.locations = locations || [];
      },
      error: () => {
        this.errorMessage = 'Failed to load locations. Please refresh and try again.';
      }
    });
  }

  initManagerTypeaheadConfig(): void {
    this.managerTypeaheadConfig = {
      searchFn: (searchTerm: string, filters?: Record<string, unknown>) => {
        return this.employeeService.searchEmployees(
          searchTerm,
          filters?.['departmentId'] as string | undefined,
          filters?.['excludeEmployeeId'] as string | undefined
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

  onManagerSelected(manager: Employee | null): void {
    // Manager selection is handled by the typeahead component
    // This method can be used for additional logic if needed
    if (manager) {
      // Validate manager is in the same department (handled by typeahead filtering)
    }
  }
  
  getManagerTypeaheadFilters(): Record<string, unknown> {
    const filters: Record<string, unknown> = {};
    const departmentId = this.employeeForm.get('departmentId')?.value;
    if (departmentId) {
      filters['departmentId'] = departmentId;
    }
    if (this.mode === FormMode.EDIT && this.employee?.content) {
      const employeeId = (this.employee.content as Employee)?.id;
      if (employeeId) {
        filters['excludeEmployeeId'] = employeeId;
      }
    }
    return filters;
  }

  initForm() {
    this.FormFields = this.createFormFields();
    this.employeeForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      phone: ['', Validators.maxLength(20)],
      address: ['', Validators.maxLength(500)],
      designation: ['', [Validators.required, Validators.maxLength(100)]],
      salary: [null as number | null, [Validators.required, Validators.min(0.01)]],
      joiningDate: ['', Validators.required],
      locationId: ['', Validators.required],
      departmentId: ['', Validators.required],
      grantAccess: [false],
      managerId: [''],
      performanceRating: [null as number | null, Validators.min(0)],
      workLocation: ['', Validators.maxLength(200)],
      experienceYears: [null as number | null, Validators.min(0)],
    });
  }

  loadEmployeeDetails() {
    const content = this.employee!.content as Employee;
    this.employeeForm?.patchValue({
      firstName: content.firstName || '',
      lastName: content.lastName || '',
      email: content.email || '',
      phone: content.phone || '',
      address: content.address || '',
      designation: content.designation || '',
      salary: content.salary ?? null,
      joiningDate: content.joiningDate || '',
      locationId: content.locationId || '',
      departmentId: content.departmentId || '',
      managerId: content.managerId || '',
      performanceRating: content.performanceRating ?? null,
      workLocation: content.workLocation || '',
      experienceYears: content.experienceYears ?? null,
    });
    this.initialFormValues = this.employeeForm.getRawValue();
    // Manager will be loaded by typeahead component when department is set
  }

  onSubmit() {
    if (this.employeeForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    if (this.employee?.config.mode === 'add') {
      this.addEmployee();
    } else {
      this.updateEmployee();
    }
  }

  addEmployee(): void {
    const formValue = this.employeeForm.getRawValue();
    const employeeData: Record<string, string | number | null> = {
      firstName: (formValue['firstName'] || '').trim(),
      lastName: (formValue['lastName'] || '').trim(),
      email: (formValue['email'] || '').trim(),
      designation: (formValue['designation'] || '').trim(),
      salary: formValue['salary'] ? Number(formValue['salary']) : null,
      joiningDate: (formValue['joiningDate'] || '').trim(),
      locationId: (formValue['locationId'] || '').trim() || null,
      departmentId: (formValue['departmentId'] || '').trim() || null,
      grantAccess: formValue['grantAccess'] || false,
    };

    // Optional fields
    if (formValue['phone'] && (formValue['phone'] as string).trim()) {
      employeeData['phone'] = (formValue['phone'] as string).trim();
    }
    if (formValue['address'] && (formValue['address'] as string).trim()) {
      employeeData['address'] = (formValue['address'] as string).trim();
    }
    // workLocation is required in database, so always send it (backend will set default if empty)
    employeeData['workLocation'] = (formValue['workLocation'] || '').trim();
    
    // Numeric optional fields
    const performanceRating = formValue['performanceRating'];
    if (performanceRating !== null && performanceRating !== undefined) {
      const perfRatingNum = Number(performanceRating);
      if (!Number.isNaN(perfRatingNum)) {
        employeeData['performanceRating'] = perfRatingNum;
      }
    }
    
    const experienceYears = formValue['experienceYears'];
    if (experienceYears !== null && experienceYears !== undefined) {
      const expYearsNum = Number(experienceYears);
      if (!Number.isNaN(expYearsNum)) {
        employeeData['experienceYears'] = expYearsNum;
      }
    }
    
    // Manager ID (optional) - explicitly set to null if cleared
    const managerId = formValue['managerId'];
    if (managerId && typeof managerId === 'string' && managerId.trim() !== '' && managerId !== 'null') {
      employeeData['managerId'] = managerId.trim();
    } else {
      // Explicitly set to null if empty/cleared to allow backend to clear the manager
      employeeData['managerId'] = null;
    }

    this.employeeService.addEmployee(employeeData).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: (response) => {
        this.errorMessage = null;
        this.employeeResponse.emit({
          title: this.employee?.title || '',
          content: response,
          viewController: overlayType.NODATA,
          config: this.employee?.config || defaultTableConfig,
          returnToPage: this.employee?.returnToPage
        } as DialogData);
        // No need to dispatch event - afterClosed() in list/table component handles refresh
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  updateEmployee(): void {
    const employeeId = (this.employee?.content as Employee)?.id;
    if (!employeeId) {
      this.errorMessage = 'Employee ID is missing for update.';
      return;
    }

    const formValue = this.employeeForm.getRawValue();
    const employeeData: Record<string, string | number | null> = {
      firstName: (formValue['firstName'] || '').trim(),
      lastName: (formValue['lastName'] || '').trim(),
      email: (formValue['email'] || '').trim(),
      designation: (formValue['designation'] || '').trim(),
      salary: formValue['salary'] ? Number(formValue['salary']) : null,
      joiningDate: (formValue['joiningDate'] || '').trim(),
      locationId: (formValue['locationId'] || '').trim() || null,
      departmentId: (formValue['departmentId'] || '').trim() || null,
      grantAccess: formValue['grantAccess'] || false,
    };

    // Optional fields
    if (formValue['phone'] && (formValue['phone'] as string).trim()) {
      employeeData['phone'] = (formValue['phone'] as string).trim();
    }
    if (formValue['address'] && (formValue['address'] as string).trim()) {
      employeeData['address'] = (formValue['address'] as string).trim();
    }
    // workLocation is required in database, so always send it (backend will set default if empty)
    employeeData['workLocation'] = (formValue['workLocation'] || '').trim();
    
    // Numeric optional fields
    const performanceRating = formValue['performanceRating'];
    if (performanceRating !== null && performanceRating !== undefined) {
      const perfRatingNum = Number(performanceRating);
      if (!Number.isNaN(perfRatingNum)) {
        employeeData['performanceRating'] = perfRatingNum;
      }
    }
    
    const experienceYears = formValue['experienceYears'];
    if (experienceYears !== null && experienceYears !== undefined) {
      const expYearsNum = Number(experienceYears);
      if (!Number.isNaN(expYearsNum)) {
        employeeData['experienceYears'] = expYearsNum;
      }
    }
    
    // Manager ID (optional) - explicitly set to null if cleared
    const managerId = formValue['managerId'];
    if (managerId && typeof managerId === 'string' && managerId.trim() !== '' && managerId !== 'null') {
      employeeData['managerId'] = managerId.trim();
    } else {
      // Explicitly set to null if empty/cleared to allow backend to clear the manager
      employeeData['managerId'] = null;
    }

    this.employeeService.updateEmployee(employeeId, employeeData).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: (response) => {
        this.errorMessage = null;
        this.employeeResponse.emit({
          title: this.employee?.title || '',
          content: response,
          viewController: overlayType.NODATA,
          config: this.employee?.config || defaultTableConfig,
          returnToPage: this.employee?.returnToPage
        } as DialogData);
        // No need to dispatch event - afterClosed() in list component handles refresh
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  handleError(error: { error?: { fieldErrors?: { field: string; message: string; rejectedValue?: unknown }[]; message?: string } }): void {
    let errorMsg = '';
    
    if (error.error) {
      // Handle validation errors with field-level details
      if (error.error.fieldErrors && error.error.fieldErrors.length > 0) {
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
        // Handle business rule errors (like duplicate email, manager validation)
        errorMsg = error.error.message;
      } else {
        errorMsg = 'Failed to save employee. Please check the console for details.';
      }
    } else {
      errorMsg = 'Failed to save employee. Unknown error occurred.';
    }
    
    this.errorMessage = errorMsg;
  }

  submitButtonText() {
    return this.employee?.config.mode === 'add' ? 'Add Employee' : 'Update Employee';
  }

  canDeleteEmployee(): boolean {
    return this.employee?.config.mode === 'edit' && (this.authService.isAdmin() || this.authService.isHRManager());
  }

  onDeleteClick(): void {
    const content = this.employee?.content as Employee;
    const employeeName = content ? `${content.firstName} ${content.lastName}` : 'this employee';
    const dialogRef = this.matDialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Employee',
        message: `Are you sure you want to delete '${employeeName}'?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        warning: 'This action is irreversible and cannot be undone. The employee must have no active project assignments and no direct reports.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.deleteEmployee();
      }
    });
  }

  deleteEmployee(): void {
    const employeeId = (this.employee?.content as Employee)?.id;
    if (!employeeId) {
      this.errorMessage = 'Employee ID is missing for deletion.';
      return;
    }

    this.isSubmitting = true;
    this.employeeService.deleteEmployee(employeeId).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => {
        this.errorMessage = null;
        this.employeeResponse.emit({
          title: this.employee?.title || '',
          content: { id: employeeId, deleted: true } as Employee & { deleted: boolean },
          viewController: overlayType.NODATA,
          config: this.employee?.config || defaultTableConfig,
          returnToPage: this.employee?.returnToPage
        } as DialogData);
        // No need to dispatch event - afterClosed() in list component handles refresh
      },
      error: (error) => {
        let errorMsg = 'Failed to delete employee. ';
        if (error.error && error.error.message) {
          errorMsg += error.error.message;
        } else {
          errorMsg += 'An unknown error occurred.';
        }
        this.errorMessage = errorMsg;
      }
    });
  }

  dialogClose() {
    this.employeeResponse.emit({
      title: this.employee?.title || '',
      content: {},
      viewController: this.employee?.viewController || overlayType.NODATA,
      config: this.employee?.config || defaultTableConfig
    } as DialogData);
  }

  isFieldInvalid(field: EmployeeFormField): boolean {
    const control = this.employeeForm.get(field.formControlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isSubmitDisabled(): boolean {
    return this.employeeForm.invalid || this.isSubmitting;
  }

  createFormFields(): EmployeeFormField[] {
    return [
      {
        label: 'First Name',
        formControlName: 'firstName',
        placeholder: 'Enter first name',
        errorMessage: 'First name is required (max 100 characters)',
        required: true
      },
      {
        label: 'Last Name',
        formControlName: 'lastName',
        placeholder: 'Enter last name',
        errorMessage: 'Last name is required (max 100 characters)',
        required: true
      },
      {
        label: 'Email',
        formControlName: 'email',
        placeholder: 'Enter email address',
        errorMessage: 'Valid email is required (max 255 characters)',
        type: 'email',
        required: true
      },
      {
        label: 'Phone',
        formControlName: 'phone',
        placeholder: 'Enter phone number (optional)',
        errorMessage: 'Phone must not exceed 20 characters',
        type: 'tel'
      },
      {
        label: 'Address',
        formControlName: 'address',
        placeholder: 'Enter address (optional)',
        errorMessage: 'Address must not exceed 500 characters',
        type: 'text'
      },
      {
        label: 'Designation',
        formControlName: 'designation',
        placeholder: 'Enter designation',
        errorMessage: 'Designation is required (max 100 characters)',
        required: true
      },
      {
        label: 'Salary',
        formControlName: 'salary',
        placeholder: 'Enter salary',
        errorMessage: 'Salary must be a positive number',
        type: 'number',
        required: true
      },
      {
        label: 'Joining Date',
        formControlName: 'joiningDate',
        placeholder: 'Select joining date',
        errorMessage: 'Joining date is required',
        type: 'date',
        required: true
      },
      {
        label: 'Department',
        formControlName: 'departmentId',
        placeholder: 'Select department',
        errorMessage: 'Department is required',
        type: 'select',
        required: true
      },
      {
        label: 'Location',
        formControlName: 'locationId',
        placeholder: 'Select location',
        errorMessage: 'Location is required',
        type: 'select',
        required: true
      },
      {
        label: 'Manager',
        formControlName: 'managerId',
        placeholder: 'Select manager (optional)',
        errorMessage: 'Manager must be in the same department',
        type: 'select'
      },
      {
        label: 'Performance Rating',
        formControlName: 'performanceRating',
        placeholder: 'Enter performance rating (optional)',
        errorMessage: 'Performance rating must be positive or zero',
        type: 'number'
      },
      {
        label: 'Work Location',
        formControlName: 'workLocation',
        placeholder: 'Enter work location (optional)',
        errorMessage: 'Work location must not exceed 200 characters',
        type: 'text'
      },
      {
        label: 'Experience (Years)',
        formControlName: 'experienceYears',
        placeholder: 'Enter years of experience (optional)',
        errorMessage: 'Experience years must be positive or zero',
        type: 'number'
      },
    ];
  }
}
