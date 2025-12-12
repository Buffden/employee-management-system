import { overlayType } from "../../../../shared/models/dialog";
import { ColumnType, FormMode, SortDirection, TableConfig } from "../../../../shared/models/table";

export const locationListConfig: TableConfig = {
    detailsCardTitle: 'Location Details',
    additionCardTitle: 'Add Location',
    tableTitle: 'Location List',
    editCardTitle: 'Edit Location',
    columns: [
        { key: 'name', header: 'Location Name', sortable: true, type: ColumnType.LINK, isSticky: true },
        { key: 'city', header: 'City', sortable: true, type: ColumnType.TEXT },
        { key: 'state', header: 'State', sortable: true, type: ColumnType.TEXT },
        { key: 'country', header: 'Country', sortable: true, type: ColumnType.TEXT },
        { key: 'address', header: 'Address', sortable: false, type: ColumnType.TEXT },
        { key: 'postalCode', header: 'Postal Code', sortable: true, type: ColumnType.TEXT },
        { key: 'id', header: 'ID', sortable: true, type: ColumnType.TEXT },
    ],
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    viewController: overlayType.DISPLAYLOCATION,
    additionController: overlayType.ADDLOCATION,
    editController: overlayType.EDITLOCATION,
    allowGenericButtons: true,
    allowAddButton: true,
    allowCustomize: true,
    allowExport: true,
    allowFiltering: true, // Allow filtering on location table
    defaultSortColumn: 'name', // Default sort by location name
    defaultSortDirection: SortDirection.ASC, // Default sort direction
    noDataInfo: {
        title: 'No Location Data Found',
        description: 'No data available for the selected criteria',
        image: new URL('https://via.placeholder.com/150'),
    },
    mode: FormMode.VIEW
};

