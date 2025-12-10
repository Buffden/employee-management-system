import { Department } from "./department.model";
import { overlayType } from "./dialog";
import { Employee, EmployeeFormField } from "./employee.model";

export type TableCellData = Employee | Department | TableData;

export enum FormMode {
    ADD = 'add',
    EDIT = 'edit',
    VIEW = 'view',
}

export enum SortDirection {
    ASC = 'asc',
    DESC = 'desc',
};

export interface TableData {
    name: string;
    id: number;
    address: string;
    email: string;
    phone: string;
};

export interface TableConfig {
    tableTitle: string;
    columns: Column[];
    pageSize?: number;
    pageSizeOptions?: number[];
    displayActionButtons?: boolean;
    detailsCardTitle: string;
    additionCardTitle: string;
    editCardTitle: string;
    viewController: overlayType;
    additionController: overlayType;
    editController: overlayType;
    allowGenericButtons?: boolean;
    allowExport?: boolean;
    allowAddButton?: boolean;
    allowCustomize?: boolean;
    noDataInfo: NoDataInfo;
    mode: FormMode;
};

export interface Column {
    key: string;
    header: string;
    type: ColumnType;
    sortable?: boolean;
    sortDirection?: SortDirection;
    isSticky?: boolean;
    formField?: EmployeeFormField;
}
export enum ColumnType {
    TEXT = 'text',
    NUMBER = 'number',
    DATE = 'date',
    ACTION_BUTTONS = 'actionButtons',
    EMAIL = 'email',
    LINK = 'link',
    DEPARTMENT = 'department',
}

export const ActionButtonObject: Column = {
    key: 'actions',
    header: 'Actions',
    type: ColumnType.ACTION_BUTTONS,
    sortable: false,
    isSticky: true,
}

export interface NoDataInfo {
    title: string;
    description: string;
    image: URL;
}