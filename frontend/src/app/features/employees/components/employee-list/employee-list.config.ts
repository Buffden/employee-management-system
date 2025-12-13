import { overlayType } from "../../../../shared/models/dialog";
import { ColumnType, FormMode, TableConfig, SortDirection } from "../../../../shared/models/table";

export const employeeListConfig: TableConfig = {
    tableTitle: 'Employee List',
    detailsCardTitle: 'Employee Details',
    additionCardTitle: 'Add Employee',
    editCardTitle: 'Edit Employee',
    columns: [
        { key: 'name', header: 'Name', sortable: true, type: ColumnType.LINK, isSticky: true },
        { key: 'email', header: 'Email', sortable: true, type: ColumnType.EMAIL },
        { key: 'phone', header: 'Phone', sortable: true, type: ColumnType.TEXT },
        { key: 'designation', header: 'Designation', sortable: true, type: ColumnType.TEXT },
        { key: 'departmentName', header: 'Department', sortable: true, type: ColumnType.TEXT },
        { key: 'locationName', header: 'Location', sortable: true, type: ColumnType.TEXT },
        { key: 'managerName', header: 'Manager', sortable: true, type: ColumnType.TEXT },
        { key: 'salary', header: 'Salary', sortable: true, type: ColumnType.NUMBER },
        { key: 'joiningDate', header: 'Joining Date', sortable: true, type: ColumnType.DATE },
        { key: 'performanceRating', header: 'Performance Rating', sortable: true, type: ColumnType.NUMBER },
    ],
    pageSize: 20,
    pageSizeOptions: [5, 10, 20, 50, 100],
    displayActionButtons: false,
    viewController: overlayType.DISPLAYEMPLOYEE,
    additionController: overlayType.ADDEMPLOYEE,
    editController: overlayType.EDITEMPLOYEE,
    allowGenericButtons: true,
    allowExport: true,
    allowAddButton: true,
    allowCustomize: true,
    allowFiltering: true,
    defaultSortColumn: 'firstName',
    defaultSortDirection: SortDirection.ASC,
    noDataInfo: {
        title: 'No Employee Data Found',
        description: 'No data available for the selected criteria',
        image: new URL('https://via.placeholder.com/150'),
    },
    mode: FormMode.VIEW
};