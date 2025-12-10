import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { DialogData } from '../../../../shared/models/dialog';
import { Department, DepartmentFormField } from '../../../../shared/models/department.model';
import { FormMode } from '../../../../shared/models/table';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-department-form',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './department-form.component.html',
  styleUrls: ['./department-form.component.css']
})
export class DepartmentFormComponent implements OnInit {
  @Input() department: DialogData | undefined;
  @Output() departmentResponse: EventEmitter<DialogData> = new EventEmitter<DialogData>();

  FormFields: DepartmentFormField[] = [];
  initialFormValues = {};
  mode: FormMode = FormMode.ADD;
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
    private fb: FormBuilder,
  ) { }

  ngOnInit() {
    this.initForm();
    if (this.department?.config.mode === 'edit') {
      this.loadDepartmentDetails();
    }
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
      this.updateDepartment(this.department as DialogData);
    }
  }

  addDepartment() {
    let departmentData = this.departmentForm!.value;
    departmentData = {
      ...departmentData,
      budget: typeof departmentData.budget === 'string' && departmentData.budget !== '' ? Number(departmentData.budget) : departmentData.budget,
      budgetUtilization: typeof departmentData.budgetUtilization === 'string' && departmentData.budgetUtilization !== '' ? Number(departmentData.budgetUtilization) : departmentData.budgetUtilization,
      performanceMetric: typeof departmentData.performanceMetric === 'string' && departmentData.performanceMetric !== '' ? Number(departmentData.performanceMetric) : departmentData.performanceMetric,
      departmentHeadId: departmentData.departmentHeadId === '' || departmentData.departmentHeadId === 'null' ? null : departmentData.departmentHeadId
    };
    this.departmentResponse.emit({ content: departmentData } as DialogData);
  }

  updateDepartment(department: DialogData) {
    let departmentData = this.departmentForm!.value;
    departmentData = {
      ...departmentData,
      budget: typeof departmentData.budget === 'string' && departmentData.budget !== '' ? Number(departmentData.budget) : departmentData.budget,
      budgetUtilization: typeof departmentData.budgetUtilization === 'string' && departmentData.budgetUtilization !== '' ? Number(departmentData.budgetUtilization) : departmentData.budgetUtilization,
      performanceMetric: typeof departmentData.performanceMetric === 'string' && departmentData.performanceMetric !== '' ? Number(departmentData.performanceMetric) : departmentData.performanceMetric,
      departmentHeadId: departmentData.departmentHeadId === '' || departmentData.departmentHeadId === 'null' ? null : departmentData.departmentHeadId
    };
    this.departmentResponse.emit({ content: departmentData } as DialogData);
  }

  submitButtonText() {
    return this.department?.config.mode === 'add' ? 'Add Department' : 'Update Department';
  }

  isSubmitDisabled(): boolean {
    if (this.mode === 'add') {
      return this.departmentForm.invalid;
    } else if (this.mode === 'edit') {
      return (
        this.departmentForm.invalid ||
        JSON.stringify(this.initialFormValues) ===
        JSON.stringify(this.departmentForm.getRawValue())
      );
    }
    return true;
  }

  isFieldInvalid(field: DepartmentFormField): boolean {
    return (this.departmentForm.get(field.formControlName)?.invalid && this.departmentForm.get(field.formControlName)?.touched) || false;
  }

  dialogClose() {
    console.log('dialog close');
    this.departmentResponse.emit({} as DialogData);
  }

  createFormFields(): DepartmentFormField[] {
    return this.department?.config.columns?.map((column) => column.formField).filter((field): field is DepartmentFormField => field !== undefined) || [];
  }
}
