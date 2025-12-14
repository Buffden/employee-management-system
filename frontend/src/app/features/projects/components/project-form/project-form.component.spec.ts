import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { ProjectFormComponent } from './project-form.component';
import { ProjectService } from '../../services/project.service';
import { DepartmentService } from '../../../departments/services/department.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { Project } from '../../../../shared/models/project.model';

describe('ProjectFormComponent', () => {
  let component: ProjectFormComponent;
  let fixture: ComponentFixture<ProjectFormComponent>;
  let projectService: jasmine.SpyObj<ProjectService>;
  let departmentService: jasmine.SpyObj<DepartmentService>;
  let employeeService: jasmine.SpyObj<EmployeeService>;
  let matDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    const projectServiceSpy = jasmine.createSpyObj('ProjectService', ['create', 'update', 'delete']);
    const departmentServiceSpy = jasmine.createSpyObj('DepartmentService', ['searchDepartments']);
    const employeeServiceSpy = jasmine.createSpyObj('EmployeeService', ['searchEmployees']);
    const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [ProjectFormComponent, ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        FormBuilder,
        { provide: ProjectService, useValue: projectServiceSpy },
        { provide: DepartmentService, useValue: departmentServiceSpy },
        { provide: EmployeeService, useValue: employeeServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectFormComponent);
    component = fixture.componentInstance;
    projectService = TestBed.inject(ProjectService) as jasmine.SpyObj<ProjectService>;
    departmentService = TestBed.inject(DepartmentService) as jasmine.SpyObj<DepartmentService>;
    employeeService = TestBed.inject(EmployeeService) as jasmine.SpyObj<EmployeeService>;
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with required fields', () => {
    fixture.detectChanges();

    expect(component.projectForm.get('name')).toBeTruthy();
    expect(component.projectForm.get('departmentId')).toBeTruthy();
    expect(component.projectForm.get('projectManagerId')).toBeTruthy();
  });

  it('should mark form as invalid when required fields are empty', () => {
    fixture.detectChanges();

    expect(component.projectForm.valid).toBeFalsy();
  });

  it('should validate form when all required fields are filled', () => {
    fixture.detectChanges();

    component.projectForm.patchValue({
      name: 'Test Project',
      departmentId: 'dept1',
      projectManagerId: 'emp1',
      startDate: '2024-01-01',
      status: 'Active'
    });

    expect(component.projectForm.valid).toBeTruthy();
  });

  it('should call create service on submit for new project', () => {
    fixture.detectChanges();

    const mockProject = { id: '1', name: 'New Project' } as Project;
    projectService.create.and.returnValue(of(mockProject));

    component.projectForm.patchValue({
      name: 'New Project',
      departmentId: 'dept1',
      projectManagerId: 'emp1',
      startDate: '2024-01-01',
      status: 'Active'
    });

    component.onSubmit();

    expect(projectService.create).toHaveBeenCalled();
  });

  it('should call update service on submit for existing project', () => {
    fixture.detectChanges();
    component.project = { id: '1', name: 'Existing Project' } as any;

    const mockProject = { id: '1', name: 'Updated Project' } as Project;
    projectService.update.and.returnValue(of(mockProject));

    component.projectForm.patchValue({
      name: 'Updated Project',
      departmentId: 'dept1',
      projectManagerId: 'emp1',
      startDate: '2024-01-01',
      status: 'Active'
    });

    component.onSubmit();

    expect(projectService.update).toHaveBeenCalled();
  });

  it('should handle error on submit', () => {
    fixture.detectChanges();

    const error = { status: 400, error: { message: 'Validation failed' } };
    projectService.create.and.returnValue(throwError(() => error));

    component.projectForm.patchValue({
      name: 'Test Project',
      departmentId: 'dept1',
      projectManagerId: 'emp1',
      startDate: '2024-01-01',
      status: 'Active'
    });

    component.onSubmit();

    expect(component.errorMessage).toBeTruthy();
  });

  it('should search departments for typeahead', () => {
    fixture.detectChanges();

    const mockDepartments = [{ id: '1', name: 'Engineering', description: '', locationName: '', locationId: '', createdAt: '', budget: 0, budgetUtilization: 0, performanceMetric: 0, departmentHeadId: '' }];
    departmentService.searchDepartments.and.returnValue(of(mockDepartments));

    const searchFn = component.departmentTypeaheadConfig?.searchFn;
    if (searchFn) {
      searchFn('eng', {}).subscribe((result) => {
        expect(result.length).toBe(1);
        expect(departmentService.searchDepartments).toHaveBeenCalled();
      });
    }
  });

  it('should search employees for project manager typeahead', () => {
    fixture.detectChanges();

    const mockEmployees = [{ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', designation: 'Manager', salary: 50000, joiningDate: '2024-01-01', departmentName: '', locationName: '', managerName: '', performanceRating: 0, workLocation: '', experienceYears: 0 }];
    employeeService.searchEmployees.and.returnValue(of(mockEmployees));

    component.projectForm.patchValue({ departmentId: 'dept1' });

    const searchFn = component.projectManagerTypeaheadConfig?.searchFn;
    if (searchFn) {
      searchFn('john', {}).subscribe((result) => {
        expect(employeeService.searchEmployees).toHaveBeenCalled();
      });
    }
  });
});
