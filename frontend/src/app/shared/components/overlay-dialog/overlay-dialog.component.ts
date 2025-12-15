import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DialogData, EmployeeDisplayData, overlayType } from '../../models/dialog';
import { TableCellData } from '../table/table.component';
import { SharedModule } from '../../shared.module';
import { DepartmentFormComponent } from '../../../features/departments/components/department-form/department-form.component';
import { EmployeeFormComponent } from '../../../features/employees/components/employee-form/employee-form.component';
import { LocationFormComponent } from '../../../features/locations/components/location-form/location-form.component';
import { ProjectFormComponent } from '../../../features/projects/components/project-form/project-form.component';
import { TaskFormComponent } from '../../../features/projects/components/task-form/task-form.component';
import { defaultTableConfig } from '../table/table.config';
import { SampleDisplayData } from '../../consts/employee.consts';
import { FormMode } from '../../models/table';
import { Employee } from '../../models/employee.model';
import { Department } from '../../models/department.model';
import { Project } from '../../models/project.model';

@Component({
  selector: 'app-overlay-dialog',
  imports: [SharedModule, DepartmentFormComponent, EmployeeFormComponent, LocationFormComponent, ProjectFormComponent, TaskFormComponent],
  templateUrl: './overlay-dialog.component.html',
  styleUrl: './overlay-dialog.component.css'
})
export class OverlayDialogComponent {
  overlayType = overlayType;
  textFields: { label: string, value: string | number }[] = [];
  dialogData: DialogData = {
    title: 'Default Title',
    viewController: overlayType.NODATA,
    config: defaultTableConfig,
    content: {} as TableCellData
  };

  constructor(public dialogRef: MatDialogRef<OverlayDialogComponent>,
    public matDialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {
    this.dialogData = data;
    console.log('OverlayDialogComponent.constructor() data', data);
    this.textFields = this.getFilteredTextFields();
  }

  getFilteredTextFields(): { label: string, value: string | number }[] {
    // For employee display, extract actual employee data
    if (this.dialogData.viewController === overlayType.DISPLAYEMPLOYEE) {
      const employee = this.dialogData.content as Employee;
      return [
        { label: 'First Name', value: employee.firstName || 'N/A' },
        { label: 'Last Name', value: employee.lastName || 'N/A' },
        { label: 'Email', value: employee.email || 'N/A' },
        { label: 'Phone', value: employee.phone || 'N/A' },
        { label: 'Address', value: employee.address || 'N/A' },
        { label: 'Designation', value: employee.designation || 'N/A' },
        { label: 'Salary', value: employee.salary ? `$${employee.salary.toLocaleString()}` : 'N/A' },
        { label: 'Joining Date', value: employee.joiningDate || 'N/A' },
        { label: 'Department', value: employee.departmentName || 'N/A' },
        { label: 'Location', value: employee.locationName || 'N/A' },
        { label: 'Manager', value: employee.managerName || 'N/A' },
        { label: 'Performance Rating', value: employee.performanceRating ? employee.performanceRating.toString() : 'N/A' },
        { label: 'Work Location', value: employee.workLocation || 'N/A' },
        { label: 'Experience (Years)', value: employee.experienceYears ? employee.experienceYears.toString() : 'N/A' },
      ];
    }
    
    // Fallback for other display types
    const sampleDisplayData: EmployeeDisplayData = SampleDisplayData;
    return Object.keys(sampleDisplayData).map((key: string) => {
      return { label: key.toUpperCase(), value: this.dialogData.content[key as keyof TableCellData] || 'NA' };
    });
  }

  updateTableData(): void {
    console.log('Update table data triggered');
  }

  dialogClose(response?: DialogData): void {
    if (this.dialogRef) {
      this.dialogRef.close(response);
    }
  }

  triggerEdit(): void {
    this.dialogClose();
    this.dialogData.config.mode = FormMode.EDIT;
    console.log('Edit triggered', this.dialogData);
    this.dialogRef = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      data: {
        title: this.dialogData.config.editCardTitle,
        viewController: this.dialogData.config.editController,
        content: this.dialogData.content,
        config: this.dialogData.config,
        filters: this.dialogData.filters // Pass filters to edit dialog
      }
    });
  }

  employeeFormResponse(response: DialogData): void {
    this.dialogClose(response);
  }

  departmentFormResponse(response: DialogData): void {
    // Check if department was deleted
    const dept = response.content as Department & { deleted?: boolean };
    if (dept && dept.deleted) {
      console.log('Department deleted:', dept.id);
    } else {
      console.log('Department form response:', response);
    }
    this.dialogClose(response);
  }

  locationFormResponse(response: DialogData): void {
    this.dialogClose(response);
  }

  projectFormResponse(response: DialogData): void {
    // Check if project was deleted
    const project = response.content as unknown as Project & { deleted?: boolean };
    if (project && project.deleted) {
      console.log('Project deleted:', project.id);
    } else {
      console.log('Project form response:', response);
    }
    this.dialogClose(response);
  }

  taskFormResponse(response: DialogData): void {
    // Check if task was deleted
    const task = response.content as unknown as any & { deleted?: boolean };
    if (task && task.deleted) {
      console.log('Task deleted:', task.id);
    } else {
      console.log('Task form response:', response);
    }
    this.dialogClose(response);
  }

  getDepartmentName(): string {
    const employee = this.dialogData.content as Employee;
    return employee.departmentName || employee.departmentId || 'N/A';
  }

  getManagerName(): string {
    const employee = this.dialogData.content as Employee;
    return employee.managerName || 'N/A';
  }

  getEmployeeName(): string {
    const employee = this.dialogData.content as Employee;
    return `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A';
  }

  getEmployeeDesignation(): string {
    const employee = this.dialogData.content as Employee;
    return employee.designation || 'N/A';
  }
}
