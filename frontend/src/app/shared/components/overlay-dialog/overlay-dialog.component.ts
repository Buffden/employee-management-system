import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DialogData, EmployeeDisplayData, overlayType } from '../../models/dialog';
import { TableCellData } from '../table/table.component';
import { SharedModule } from '../../shared.module';
import { DepartmentFormComponent } from '../../../features/departments/components/department-form/department-form.component';
import { EmployeeFormComponent } from '../../../features/employees/components/employee-form/employee-form.component';
import { defaultTableConfig } from '../table/table.config';
import { SampleDisplayData } from '../../consts/employee.consts';
import { FormMode } from '../../models/table';
import { Employee } from '../../models/employee.model';

@Component({
  selector: 'app-overlay-dialog',
  imports: [SharedModule, DepartmentFormComponent, EmployeeFormComponent],
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
        config: this.dialogData.config
      }
    });
    this.dialogRef.afterClosed().subscribe(result => {
      console.log('edit afterClosed', result);
      this.updateTableData();
    });
  }

  employeeFormResponse(response: DialogData): void {
    this.dialogClose(response);
  }

  departmentFormResponse(response: DialogData): void {
    this.dialogClose(response);
  }

  getDepartmentName(): string {
    return (this.dialogData.content as Employee).departmentId || 'NA';
  }
}
