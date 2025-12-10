import { overlayType } from "../../../../shared/models/dialog";
import { ColumnType, FormMode, TableConfig } from "../../../../shared/models/table";

export const employeeListConfig: TableConfig = {
    tableTitle: 'Employee List',
    detailsCardTitle: 'Employee Details',
    additionCardTitle: 'Add Employee',
    editCardTitle: 'Edit Employee',
    columns: [
        { key: 'name', header: 'Name', sortable: true, type: ColumnType.LINK, isSticky: true },
        { key: 'email', header: 'Email', sortable: true, type: ColumnType.EMAIL },
        { key: 'phone', header: 'Phone', sortable: true, type: ColumnType.TEXT },
        { key: 'address', header: 'Address', sortable: true, type: ColumnType.TEXT },
        { key: 'designation', header: 'Designation', sortable: true, type: ColumnType.TEXT },
        { key: 'salary', header: 'Salary', sortable: true, type: ColumnType.NUMBER },
        { key: 'joiningDate', header: 'Joining Date', sortable: true, type: ColumnType.DATE },
        { key: 'locationId', header: 'Location ID', sortable: true, type: ColumnType.TEXT },
        { key: 'performanceRating', header: 'Performance Rating', sortable: true, type: ColumnType.NUMBER },
        { key: 'managerId', header: 'Manager ID', sortable: true, type: ColumnType.TEXT },
        { key: 'departmentId', header: 'Department ID', sortable: true, type: ColumnType.TEXT },
        { key: 'workLocation', header: 'Work Location', sortable: true, type: ColumnType.TEXT },
        { key: 'experienceYears', header: 'Experience (Years)', sortable: true, type: ColumnType.NUMBER },
        { key: 'id', header: 'ID', sortable: true, type: ColumnType.TEXT },
    ],
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    displayActionButtons: true,
    viewController: overlayType.DISPLAYEMPLOYEE,
    additionController: overlayType.ADDEMPLOYEE,
    editController: overlayType.EDITEMPLOYEE,
    allowGenericButtons: true,
    allowExport: true,
    allowAddButton: true,
    allowCustomize: true,
    noDataInfo: {
        title: 'No Employee Data Found',
        description: 'No data available for the selected criteria',
        image: new URL('https://via.placeholder.com/150'),
    },
    mode: FormMode.VIEW
};