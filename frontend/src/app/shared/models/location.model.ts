export interface Location {
    id: string;
    name: string;
    address?: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
}

export interface LocationFormField {
    label: string;
    formControlName: string;
    placeholder: string;
    errorMessage: string;
    type?: string;
    required?: boolean;
}

