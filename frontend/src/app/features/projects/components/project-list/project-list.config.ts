import { overlayType } from '../../../../shared/models/dialog';
import { ColumnType, FormMode, TableConfig } from '../../../../shared/models/table';

export const projectListConfig: TableConfig = {
  tableTitle: 'Project List',
  detailsCardTitle: 'Project Details',
  additionCardTitle: 'Add Project',
  editCardTitle: 'Edit Project',
  columns: [
    { key: 'name', header: 'Project Name', sortable: true, type: ColumnType.LINK, isSticky: true },
    { key: 'department', header: 'Department', sortable: true, type: ColumnType.TEXT },
    { key: 'projectManager', header: 'Project Manager', sortable: true, type: ColumnType.TEXT },
    { key: 'taskStatus', header: 'Tasks', sortable: false, type: ColumnType.TEXT },
    { key: 'startDate', header: 'Start Date', sortable: true, type: ColumnType.DATE },
    { key: 'endDate', header: 'End Date', sortable: true, type: ColumnType.DATE },
    { key: 'status', header: 'Status', sortable: true, type: ColumnType.TEXT },
    // The action column will be appended automatically and made sticky by the table component
  ],
  pageSize: 10,
  pageSizeOptions: [5, 10, 25, 50, 100],
  displayActionButtons: true,
  viewController: overlayType.NODATA, // Custom linkClickHandler in ProjectListComponent will take precedence for project name
  additionController: overlayType.NODATA,
  editController: overlayType.NODATA,
  allowGenericButtons: true,
  allowExport: true,
  allowAddButton: true,
  allowCustomize: true,
  noDataInfo: {
    title: 'No Project Data Found',
    description: 'No data available for the selected criteria',
    image: new URL('https://via.placeholder.com/150'),
  },
  mode: FormMode.VIEW
}; 