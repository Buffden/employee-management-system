import { overlayType } from '../../../../shared/models/dialog';
import { ColumnType, FormMode, SortDirection, TableConfig } from '../../../../shared/models/table';

export const projectListConfig: TableConfig = {
  tableTitle: 'Project List',
  detailsCardTitle: 'Project Details',
  additionCardTitle: 'Add Project',
  editCardTitle: 'Edit Project',
  columns: [
    { key: 'name', header: 'Project Name', sortable: true, type: ColumnType.LINK, isSticky: true },
    { key: 'department', header: 'Department', sortable: true, type: ColumnType.TEXT },
    { key: 'projectManager', header: 'Project Manager', sortable: true, type: ColumnType.TEXT },
    { key: 'startDate', header: 'Start Date', sortable: true, type: ColumnType.DATE },
    { key: 'endDate', header: 'End Date', sortable: true, type: ColumnType.DATE },
    { key: 'status', header: 'Status', sortable: true, type: ColumnType.TEXT },
    // The action column will be appended automatically and made sticky by the table component
  ],
  pageSize: 10,
  pageSizeOptions: [5, 10, 25, 50, 100],
  displayActionButtons: true,
  viewController: overlayType.DISPLAYPROJECT,
  additionController: overlayType.ADDPROJECT,
  editController: overlayType.EDITPROJECT,
  allowGenericButtons: true,
  allowExport: true,
  allowAddButton: true,
  allowedRolesForAdd: ['SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'],
  addButtonTooltip: 'This feature is only available for System Admins, HR Managers, and Department Managers',
  allowCustomize: true,
  allowFiltering: true, // Allow filtering on project table
  defaultSortColumn: 'name', // Default sort by project name
  defaultSortDirection: SortDirection.ASC, // Default sort direction
  noDataInfo: {
    title: 'No Project Data Found',
    description: 'No data available for the selected criteria',
    image: new URL('https://via.placeholder.com/150'),
  },
  mode: FormMode.VIEW
}; 