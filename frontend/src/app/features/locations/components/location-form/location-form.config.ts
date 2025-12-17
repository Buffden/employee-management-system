import { LocationFormField } from '../../../../shared/models/location.model';

/**
 * Form field configuration for Location Form
 * Defines all form fields, their labels, placeholders, validation messages, and types
 */
export const locationFormFields: LocationFormField[] = [
  {
    label: 'Location Name',
    formControlName: 'name',
    placeholder: 'Enter location name',
    errorMessage: 'Location name is required (max 100 characters)',
    required: true
  },
  {
    label: 'Address',
    formControlName: 'address',
    placeholder: 'Enter address (optional)',
    errorMessage: 'Address must not exceed 255 characters',
  },
  {
    label: 'City',
    formControlName: 'city',
    placeholder: 'Enter city',
    errorMessage: 'City is required (max 100 characters)',
    required: true
  },
  {
    label: 'State',
    formControlName: 'state',
    placeholder: 'Enter state',
    errorMessage: 'State is required (max 100 characters)',
    required: true
  },
  {
    label: 'Country',
    formControlName: 'country',
    placeholder: 'Enter country',
    errorMessage: 'Country is required (max 100 characters)',
    required: true
  },
  {
    label: 'Postal Code',
    formControlName: 'postalCode',
    placeholder: 'Enter postal code (optional)',
    errorMessage: 'Postal code must not exceed 20 characters',
  },
];

