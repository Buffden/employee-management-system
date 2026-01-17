
export interface FilterValue {
  id: string | number;
  label: string;
}

export interface ActiveFilters {
  field: string;
  values: unknown[];
  displayField?: string;
}

export interface FilterEvent {
  field: string;
  values: unknown[];
  displayField: string;
}

export interface RemoveFilterEvent {
  field: string;
  value?: unknown;
}

export interface AppliedFilters {
  filters: ActiveFilters[];
  count: number;
}

export interface FilterFieldOptions {
  field: string;
  options: FilterValue[];
}