import { Task } from './task.model';

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  budget: number;
  departmentId: string;
  projectManagerId: string;
  departmentName?: string; // Denormalized department name from backend
  projectManagerName?: string; // Denormalized project manager name from backend
  tasks?: Task[]; // Tasks associated with the project
  taskCounts?: {
    open: number;
    inProgress: number;
    closed: number;
  };
  department?: {
    id: string;
    name: string;
  };
  projectManager?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ProjectFormField {
  label: string;
  formControlName: string;
  placeholder: string;
  errorMessage: string;
  type?: string;
  options?: string[];
  required?: boolean;
} 