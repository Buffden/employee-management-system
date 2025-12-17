import { DepartmentFormField } from '../../../../shared/models/department.model';

/**
 * Form field configuration for Department Form
 * Defines all form fields, their labels, placeholders, validation messages, and types
 */
export const departmentFormFields: DepartmentFormField[] = [
  {
    label: 'Department Name',
    formControlName: 'name',
    placeholder: 'Enter department name',
    errorMessage: 'Department name is required (max 100 characters)',
    required: true
  },
  {
    label: 'Description',
    formControlName: 'description',
    placeholder: 'Enter description',
    errorMessage: 'Description is required (max 1000 characters)',
    required: true
  },
  {
    label: 'Location',
    formControlName: 'locationId',
    placeholder: 'Select location',
    errorMessage: 'Location is required',
    type: 'select',
    required: true
  },
  {
    label: 'Budget',
    formControlName: 'budget',
    placeholder: 'Enter budget (optional)',
    errorMessage: 'Budget must be a positive number',
    type: 'number'
  },
  {
    label: 'Budget Utilization',
    formControlName: 'budgetUtilization',
    placeholder: 'Enter budget utilization (optional)',
    errorMessage: 'Budget utilization must be a positive number',
    type: 'number'
  },
  {
    label: 'Performance Metric',
    formControlName: 'performanceMetric',
    placeholder: 'Enter performance metric (optional)',
    errorMessage: 'Performance metric must be a positive number',
    type: 'number'
  },
  {
    label: 'Department Head',
    formControlName: 'departmentHeadId',
    placeholder: 'Search for department head (optional)',
    errorMessage: 'Please select a valid employee',
    type: 'typeahead',
  },
];

