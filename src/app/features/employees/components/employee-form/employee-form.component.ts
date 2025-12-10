import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { DialogData, overlayType } from '../../../../shared/models/dialog';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FormMode } from '../../../../shared/models/table';
import { Employee, EmployeeFormField } from '../../../../shared/models/employee.model';
import { defaultTableConfig } from '../../../../shared/components/table/table.config';

function isManagerObject(value: unknown): value is { id: string } {
  return typeof value === 'object' && value !== null && 'id' in value && typeof (value as { id?: unknown }).id === 'string';
}

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.css']
})
export class EmployeeFormComponent implements OnInit {
  @Input() employee: DialogData | undefined;
  @Output() employeeResponse: EventEmitter<DialogData> = new EventEmitter<DialogData>();

  FormFields: EmployeeFormField[] = [];
  initialFormValues = {};
  mode: FormMode = FormMode.ADD;
  employeeForm = new FormGroup({
    name: new FormControl(''),
    email: new FormControl(''),
    address: new FormControl(''),
    department: new FormControl(''),
    designation: new FormControl(''),
    phone: new FormControl(''),
    manager: new FormControl(''),
    salary: new FormControl(0),
    employmentType: new FormControl(''),
    workLocation: new FormControl(''),
    experienceYears: new FormControl(null as number | null),
    performanceRating: new FormControl(null as number | null),
    lastAppraisalDate: new FormControl(''),
    isActive: new FormControl(true),
  });

  constructor(
    private fb: FormBuilder,
  ) { }

  ngOnInit() {
    this.initForm();
    if (this.employee?.config.mode === 'edit') {
      this.loadEmployeeDetails(this.employee);
    }
  }

  initForm() {
    this.FormFields = this.createFormFields();
    this.employeeForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
      department: ['', Validators.required],
      designation: ['', Validators.required],
      phone: ['', Validators.required],
      manager: ['', Validators.required],
      salary: [0, Validators.required],
      employmentType: [''],
      workLocation: [''],
      experienceYears: [null as number | null],
      performanceRating: [null as number | null],
      lastAppraisalDate: [''],
      isActive: [true],
    });
  }

  loadEmployeeDetails(employee: DialogData) {
    const content = employee.content as Employee;
    this.employeeForm?.patchValue({
      name: content.firstName + ' ' + content.lastName,
      email: content.email,
      address: content.address,
      department: 'department' in content && typeof content.department === 'object' && content.department !== null ? String((content.department as { name?: string }).name) : undefined,
      designation: 'designation' in content ? String(content.designation) : undefined,
      phone: content.phone,
      salary: content.salary,
      workLocation: content.workLocation,
      performanceRating: content.performanceRating,
      experienceYears: content.experienceYears,
      employmentType: undefined,
      lastAppraisalDate: undefined,
      isActive: undefined
    });
    this.initialFormValues = this.employeeForm.getRawValue();
  }

  onSubmit() {
    if (this.employee?.config.mode === 'add') {
      this.addEmployee();
    } else {
      this.updateEmployee();
    }
  }

  addEmployee() {
    let employeeData = this.employeeForm!.value;
    const managerValue: unknown = employeeData.manager;
    let managerId: string | null = null;
    if (isManagerObject(managerValue)) {
      managerId = managerValue.id;
    } else if (typeof managerValue === 'string' && managerValue !== '' && managerValue !== 'null') {
      managerId = managerValue;
    }
    employeeData = {
      ...employeeData,
      experienceYears: typeof employeeData.experienceYears === 'string' && employeeData.experienceYears !== '' ? Number(employeeData.experienceYears) : employeeData.experienceYears,
      performanceRating: typeof employeeData.performanceRating === 'string' && employeeData.performanceRating !== '' ? Number(employeeData.performanceRating) : employeeData.performanceRating,
      isActive: typeof employeeData.isActive === 'string' ? employeeData.isActive === 'true' : employeeData.isActive
    };
    const outgoingData = {
      id: 0,
      name: employeeData.name ?? '',
      designation: employeeData.designation ?? '',
      salary: employeeData.salary ?? 0,
      department: { id: employeeData.department ?? '' },
      manager: managerId ? { id: managerId } : null,
      address: employeeData.address ?? '',
      email: employeeData.email ?? '',
      phone: employeeData.phone ?? '',
      employmentType: employeeData.employmentType ?? '',
      workLocation: employeeData.workLocation ?? '',
      experienceYears: employeeData.experienceYears ?? 0,
      performanceRating: employeeData.performanceRating ?? 0,
      lastAppraisalDate: employeeData.lastAppraisalDate ?? '',
      isActive: typeof employeeData.isActive === 'boolean' ? employeeData.isActive : true
    };
    this.employeeResponse.emit({
      title: this.employee?.title || 'Employee',
      content: {
        id: String(outgoingData.id),
        firstName: outgoingData.name.split(' ')[0],
        lastName: outgoingData.name.split(' ')[1],
        email: outgoingData.email,
        phone: outgoingData.phone,
        address: outgoingData.address,
        designation: outgoingData.designation,
        salary: outgoingData.salary,
        joiningDate: '',
        locationId: outgoingData.workLocation,
        performanceRating: outgoingData.performanceRating,
        managerId: outgoingData.manager ? outgoingData.manager.id : null,
        departmentId: outgoingData.department.id,
        workLocation: outgoingData.workLocation,
        experienceYears: outgoingData.experienceYears
      },
      viewController: this.employee?.viewController || overlayType.ADDEMPLOYEE,
      config: this.employee?.config || defaultTableConfig
    });
  }

  updateEmployee() {
    let employeeData = this.employeeForm!.value;
    const managerValue: unknown = employeeData.manager;
    let managerId: string | null = null;
    if (isManagerObject(managerValue)) {
      managerId = managerValue.id;
    } else if (typeof managerValue === 'string' && managerValue !== '' && managerValue !== 'null') {
      managerId = managerValue;
    }
    employeeData = {
      ...employeeData,
      experienceYears: typeof employeeData.experienceYears === 'string' && employeeData.experienceYears !== '' ? Number(employeeData.experienceYears) : employeeData.experienceYears,
      performanceRating: typeof employeeData.performanceRating === 'string' && employeeData.performanceRating !== '' ? Number(employeeData.performanceRating) : employeeData.performanceRating,
      isActive: typeof employeeData.isActive === 'string' ? employeeData.isActive === 'true' : employeeData.isActive
    };
    const outgoingData = {
      id: this.employee?.content.id ?? 0,
      name: employeeData.name ?? '',
      designation: employeeData.designation ?? '',
      salary: employeeData.salary ?? 0,
      department: { id: employeeData.department ?? '' },
      manager: managerId ? { id: managerId } : null,
      address: employeeData.address ?? '',
      email: employeeData.email ?? '',
      phone: employeeData.phone ?? '',
      employmentType: employeeData.employmentType ?? '',
      workLocation: employeeData.workLocation ?? '',
      experienceYears: employeeData.experienceYears ?? 0,
      performanceRating: employeeData.performanceRating ?? 0,
      lastAppraisalDate: employeeData.lastAppraisalDate ?? '',
      isActive: typeof employeeData.isActive === 'boolean' ? employeeData.isActive : true
    };
    this.employeeResponse.emit({
      title: this.employee?.title || 'Employee',
      content: {
        id: String(outgoingData.id),
        firstName: outgoingData.name.split(' ')[0],
        lastName: outgoingData.name.split(' ')[1],
        email: outgoingData.email,
        phone: outgoingData.phone,
        address: outgoingData.address,
        designation: outgoingData.designation,
        salary: outgoingData.salary,
        joiningDate: '',
        locationId: outgoingData.workLocation,
        performanceRating: outgoingData.performanceRating,
        managerId: outgoingData.manager ? outgoingData.manager.id : null,
        departmentId: outgoingData.department.id,
        workLocation: outgoingData.workLocation,
        experienceYears: outgoingData.experienceYears
      },
      viewController: this.employee?.viewController || overlayType.EDITEMPLOYEE,
      config: this.employee?.config || defaultTableConfig
    });
  }

  submitButtonText() {
    return this.employee?.config.mode === 'add' ? 'Add Employee' : 'Update Employee';
  }

  isSubmitDisabled(): boolean {
    if (this.mode === 'add') {
      return this.employeeForm.invalid;
    } else if (this.mode === 'edit') {
      return (
        this.employeeForm.invalid ||
        JSON.stringify(this.initialFormValues) ===
        JSON.stringify(this.employeeForm.getRawValue())
      );
    }
    return true;
  }

  isFieldInvalid(field: EmployeeFormField): boolean {
    return (this.employeeForm.get(field.formControlName)?.invalid && this.employeeForm.get(field.formControlName)?.touched) || false;
  }

  dialogClose() {
    console.log('dialog close');
    this.employeeResponse.emit({} as DialogData);
  }

  createFormFields(): EmployeeFormField[] {
    return this.employee?.config.columns?.map((column) => column.formField).filter((field): field is EmployeeFormField => field !== undefined) || [];
  }
}
