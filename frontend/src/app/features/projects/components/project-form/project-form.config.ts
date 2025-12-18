import { ProjectFormField } from '../../../../shared/models/project.model';

/**
 * Valid project statuses for dropdown
 */
export const projectStatuses = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'];

/**
 * Form field configuration for Project Form
 * Defines all form fields, their labels, placeholders, validation messages, and types
 */
export const projectFormFields: ProjectFormField[] = [
  {
    label: 'Project Name',
    formControlName: 'name',
    placeholder: 'Enter project name',
    errorMessage: 'Project name is required (max 100 characters)',
    required: true
  },
  {
    label: 'Description',
    formControlName: 'description',
    placeholder: 'Enter description',
    errorMessage: 'Description must not exceed 1000 characters',
  },
  {
    label: 'Department',
    formControlName: 'departmentId',
    placeholder: 'Search for department',
    errorMessage: 'Department is required',
    type: 'typeahead',
    required: true
  },
  {
    label: 'Project Manager',
    formControlName: 'projectManagerId',
    placeholder: 'Search for project manager',
    errorMessage: 'Project manager is required',
    type: 'typeahead',
    required: true
  },
  {
    label: 'Start Date',
    formControlName: 'startDate',
    placeholder: 'Select start date',
    errorMessage: 'Start date is required',
    type: 'date',
    required: true
  },
  {
    label: 'End Date',
    formControlName: 'endDate',
    placeholder: 'Select end date (optional)',
    errorMessage: 'End date must be after start date',
    type: 'date'
  },
  {
    label: 'Status',
    formControlName: 'status',
    placeholder: 'Select status',
    errorMessage: 'Status is required',
    type: 'select',
    options: projectStatuses,
    required: true
  },
  {
    label: 'Budget',
    formControlName: 'budget',
    placeholder: 'Enter budget (optional)',
    errorMessage: 'Budget must be a positive number',
    type: 'number'
  },
];

