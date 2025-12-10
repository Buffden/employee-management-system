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