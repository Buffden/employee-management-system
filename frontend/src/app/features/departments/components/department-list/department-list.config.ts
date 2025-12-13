import { overlayType } from "../../../../shared/models/dialog";
import { ColumnType, FormMode, SortDirection, TableConfig } from "../../../../shared/models/table";

export const departmentListConfig: TableConfig = {
    detailsCardTitle: 'Departments Details',
    additionCardTitle: 'Add Department',
    tableTitle: 'Department List',
    editCardTitle: 'Edit Department',
    columns: [
        { key: 'name', header: 'Department Name', sortable: true, type: ColumnType.LINK, isSticky: true },
        { key: 'description', header: 'Description', sortable: false, type: ColumnType.TEXT },
        { key: 'id', header: 'ID', sortable: true, type: ColumnType.TEXT },
        { key: 'locationName', header: 'Location Name', sortable: true, type: ColumnType.TEXT },
        { key: 'locationId', header: 'Location ID', sortable: true, type: ColumnType.TEXT },
        { key: 'createdAt', header: 'Created At', sortable: true, type: ColumnType.DATE },
        { key: 'budget', header: 'Budget', sortable: true, type: ColumnType.NUMBER },
        { key: 'budgetUtilization', header: 'Budget Utilization', sortable: true, type: ColumnType.NUMBER },
        { key: 'performanceMetric', header: 'Performance Metric', sortable: true, type: ColumnType.NUMBER },
        { key: 'departmentHeadId', header: 'Department Head ID', sortable: true, type: ColumnType.TEXT },
    ],
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    viewController: overlayType.DISPLAYDEPARTMENT,
    additionController: overlayType.ADDDEPARTMENT,
    editController: overlayType.EDITDEPARTMENT,
    allowGenericButtons: true,
    allowAddButton: true,
    allowCustomize: true,
    allowExport: true,
    allowFiltering: true, // Allow filtering on department table
    defaultSortColumn: 'name', // Default sort by department name
    defaultSortDirection: SortDirection.ASC, // Default sort direction
    noDataInfo: {
        title: 'No Department Data Found',
        description: 'No data available for the selected criteria',
        image: new URL('https://via.placeholder.com/150'),
    },
    mode: FormMode.VIEW
};