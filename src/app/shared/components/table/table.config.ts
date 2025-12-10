import { overlayType } from "../../models/dialog";
import { ColumnType, TableConfig, FormMode } from "../../models/table";

// TBE later in feature as a feature

export const defaultTableConfig: TableConfig = {
    tableTitle: 'Default Table Title',
    columns: [
        { key: 'Col1', header: 'col1', sortable: true, type: ColumnType.TEXT },
        { key: 'Col2', header: 'col2', sortable: true, type: ColumnType.TEXT },
        { key: 'Col3', header: 'col3', sortable: false, type: ColumnType.TEXT },
        { key: 'Col4', header: 'col4', sortable: true, type: ColumnType.NUMBER },
        { key: 'Col5', header: 'col5', sortable: true, type: ColumnType.NUMBER },
    ],
    noDataInfo: {
        title: 'No Data Found',
        description: 'No data available for the selected criteria',
        image: new URL('https://via.placeholder.com/150'),
    },
    detailsCardTitle: "",
    additionCardTitle: "",
    editCardTitle: "",
    mode: FormMode.VIEW,
    viewController: overlayType.NODATA,
    additionController: overlayType.NODATA,
    editController: overlayType.NODATA
};