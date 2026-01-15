
export interface FilterValue {
  id: string | number;
  label: string;
}

export interface ActiveFilters {
  field: string;
  operator?: string;
  values: unknown[];
  displayField?: string;
}

export interface FilterEvent {
  field: string;
  operator: string;
  values: unknown[];
  displayField: string;
}

export interface AppliedFilters {
  filters: ActiveFilters[];
  count: number;
}

export interface FilterFieldOptions {
  field: string;
  options: FilterValue[];
}