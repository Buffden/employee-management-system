export interface Task {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  startDate: string;
  dueDate: string;
  completedDate: string | null;
  projectId: string;
  assignedToId: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
} 