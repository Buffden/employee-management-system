import { EmployeeFormField } from '../../../../shared/models/employee.model';

/**
 * Form field configuration for Employee Form
 * Defines all form fields, their labels, placeholders, validation messages, and types
 */
export const employeeFormFields: EmployeeFormField[] = [
  {
    label: 'First Name',
    formControlName: 'firstName',
    placeholder: 'Enter first name',
    errorMessage: 'First name is required (max 100 characters)',
    required: true
  },
  {
    label: 'Last Name',
    formControlName: 'lastName',
    placeholder: 'Enter last name',
    errorMessage: 'Last name is required (max 100 characters)',
    required: true
  },
  {
    label: 'Email',
    formControlName: 'email',
    placeholder: 'Enter email address',
    errorMessage: 'Valid email is required (max 255 characters)',
    type: 'email',
    required: true
  },
  {
    label: 'Phone',
    formControlName: 'phone',
    placeholder: 'Enter phone number (optional)',
    errorMessage: 'Phone must not exceed 20 characters',
    type: 'tel'
  },
  {
    label: 'Address',
    formControlName: 'address',
    placeholder: 'Enter address (optional)',
    errorMessage: 'Address must not exceed 500 characters',
    type: 'text'
  },
  {
    label: 'Designation',
    formControlName: 'designation',
    placeholder: 'Enter designation',
    errorMessage: 'Designation is required (max 100 characters)',
    required: true
  },
  {
    label: 'Salary',
    formControlName: 'salary',
    placeholder: 'Enter salary',
    errorMessage: 'Salary must be a positive number',
    type: 'number',
    required: true
  },
  {
    label: 'Joining Date',
    formControlName: 'joiningDate',
    placeholder: 'Select joining date',
    errorMessage: 'Joining date is required',
    type: 'date',
    required: true
  },
  {
    label: 'Department',
    formControlName: 'departmentId',
    placeholder: 'Select department',
    errorMessage: 'Department is required',
    type: 'select',
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
    label: 'Manager',
    formControlName: 'managerId',
    placeholder: 'Select manager (optional)',
    errorMessage: 'Manager must be in the same department',
    type: 'select'
  },
  {
    label: 'Performance Rating',
    formControlName: 'performanceRating',
    placeholder: 'Enter performance rating (optional)',
    errorMessage: 'Performance rating must be positive or zero',
    type: 'number'
  },
  {
    label: 'Work Location',
    formControlName: 'workLocation',
    placeholder: 'Enter work location (optional)',
    errorMessage: 'Work location must not exceed 200 characters',
    type: 'text'
  },
  {
    label: 'Experience (Years)',
    formControlName: 'experienceYears',
    placeholder: 'Enter years of experience (optional)',
    errorMessage: 'Experience years must be positive or zero',
    type: 'number'
  },
];

