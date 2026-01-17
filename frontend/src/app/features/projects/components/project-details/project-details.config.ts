import { overlayType } from '../../../../shared/models/dialog';
import { ColumnType, FormMode, SortDirection, TableConfig } from '../../../../shared/models/table';

export const projectDetailsConfig: TableConfig = {
    tableTitle: 'Project Details',
    detailsCardTitle: 'Project Details',
    additionCardTitle: 'Add Project',
    editCardTitle: 'Edit Project',
    columns: [
        { key: 'name', header: 'Project Name', sortable: true, type: ColumnType.LINK, isSticky: true, navigationTarget: 'project', navigationIdKey: 'id' },
        { key: 'department', header: 'Department', sortable: true, type: ColumnType.LINK, navigationTarget: 'department', navigationIdKey: 'departmentId' },
        { key: 'projectManager', header: 'Project Manager', sortable: true, type: ColumnType.LINK, navigationTarget: 'employee', navigationIdKey: 'projectManagerId' },
        { key: 'startDate', header: 'Start Date', sortable: true, type: ColumnType.DATE },
        { key: 'endDate', header: 'End Date', sortable: true, type: ColumnType.DATE },
        { key: 'status', header: 'Status', sortable: true, type: ColumnType.TEXT },
    ],
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    displayActionButtons: false,
    viewController: overlayType.DISPLAYPROJECT,
    additionController: overlayType.ADDPROJECT,
    editController: overlayType.EDITPROJECT,
    allowGenericButtons: true,
    allowExport: true,
    allowAddButton: true,
    allowedRolesForAdd: ['SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'],
    addButtonTooltip: 'This feature is only available for System Admins, HR Managers, and Department Managers',
    allowCustomize: true,
    allowFiltering: true,
    defaultSortColumn: 'name',
    defaultSortDirection: SortDirection.ASC,
    noDataInfo: {
        title: 'No Project Data Found',
        description: 'No data available for the selected criteria',
        image: new URL('https://via.placeholder.com/150'),
    },
    mode: FormMode.VIEW
};
