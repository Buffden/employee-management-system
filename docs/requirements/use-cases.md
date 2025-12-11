# Use Cases - Employee Management System

This document describes all use cases for the Employee Management System, organized by actor and functional area.

## Actors

1. **System Administrator** (`SYSTEM_ADMIN`) - Full system access, manages all entities
2. **HR Manager** (`HR_MANAGER`) - Manages employees and departments
3. **Department Manager** (`DEPARTMENT_MANAGER`) - Manages own department's projects, tasks, and employees
4. **Employee** (`EMPLOYEE`) - Views own profile and assigned tasks/projects
5. **System** - Automated processes (CI/CD, notifications)

**Note**: Detailed role permissions and access control matrix available in `docs/security/roles-and-permissions.md`

---

## Employee Management Use Cases

### UC-EM-001: Create Employee
- **Actor**: HR Manager, System Administrator
- **Preconditions**: Department and Location must exist
- **Main Flow**:
  1. Actor navigates to Employee Management
  2. Actor clicks "Add Employee"
  3. Actor fills in employee details (name, email, designation, salary, etc.)
  4. Actor selects department and location
  5. Actor optionally assigns a manager (must be in same department)
  6. System validates input
  7. System creates employee record
  8. System displays success message
- **Postconditions**: Employee record created in database
- **Alternative Flows**:
  - 6a. Validation fails → Display error message
  - 5a. Manager not in same department → Display validation error

### UC-EM-002: View Employee List
- **Actor**: HR Manager, Department Manager, System Administrator
- **Preconditions**: None
- **Main Flow**:
  1. Actor navigates to Employee List
  2. System displays paginated list of employees
  3. Actor can sort by column (name, salary, department, etc.)
  4. Actor can filter by department, designation, location
  5. Actor can search by name or email
- **Postconditions**: Employee list displayed

### UC-EM-003: View Employee Details
- **Actor**: HR Manager, Department Manager, Employee, System Administrator
- **Preconditions**: Employee must exist
- **Main Flow**:
  1. Actor clicks on employee in list
  2. System displays employee details in overlay/modal
  3. Actor views employee information (profile, department, manager, projects)
- **Postconditions**: Employee details displayed

### UC-EM-004: Update Employee
- **Actor**: HR Manager, System Administrator
- **Preconditions**: Employee must exist
- **Main Flow**:
  1. Actor navigates to employee details
  2. Actor clicks "Edit"
  3. Actor modifies employee information
  4. System validates changes
  5. System updates employee record
  6. System displays success message
- **Postconditions**: Employee record updated
- **Alternative Flows**:
  - 4a. Validation fails → Display error message

### UC-EM-005: Delete Employee
- **Actor**: HR Manager, System Administrator
- **Preconditions**: Employee must exist, no active project assignments
- **Main Flow**:
  1. Actor navigates to employee details
  2. Actor clicks "Delete"
  3. System confirms deletion
  4. Actor confirms
  5. System deletes employee record
  6. System displays success message
- **Postconditions**: Employee record deleted
- **Alternative Flows**:
  - 3a. Employee has active assignments → Display error, prevent deletion

### UC-EM-006: Assign Manager to Employee
- **Actor**: HR Manager, System Administrator
- **Preconditions**: Employee and Manager must exist, both in same department
- **Main Flow**:
  1. Actor edits employee
  2. Actor selects manager from dropdown
  3. System validates manager is in same department
  4. System updates employee record
  5. System displays success message
- **Postconditions**: Manager assigned to employee
- **Alternative Flows**:
  - 3a. Manager in different department → Display validation error

---

## Department Management Use Cases

### UC-DM-001: Create Department
- **Actor**: HR Manager, System Administrator
- **Preconditions**: Location must exist
- **Main Flow**:
  1. Actor navigates to Department Management
  2. Actor clicks "Add Department"
  3. Actor fills in department details (name, description, budget)
  4. Actor selects location
  5. Actor optionally assigns department head
  6. System validates input
  7. System creates department record
  8. System displays success message
- **Postconditions**: Department record created

### UC-DM-002: View Department List
- **Actor**: HR Manager, Department Manager, System Administrator
- **Preconditions**: None
- **Main Flow**:
  1. Actor navigates to Department List
  2. System displays list of departments with employee counts
  3. Actor can view department details
- **Postconditions**: Department list displayed

### UC-DM-003: Update Department
- **Actor**: HR Manager, System Administrator
- **Preconditions**: Department must exist
- **Main Flow**:
  1. Actor navigates to department details
  2. Actor clicks "Edit"
  3. Actor modifies department information
  4. System validates changes
  5. System updates department record
  6. System displays success message
- **Postconditions**: Department record updated

### UC-DM-004: Delete Department
- **Actor**: System Administrator
- **Preconditions**: Department must exist, no employees assigned
- **Main Flow**:
  1. Actor navigates to department details
  2. Actor clicks "Delete"
  3. System confirms deletion
  4. Actor confirms
  5. System deletes department record
  6. System displays success message
- **Postconditions**: Department record deleted
- **Alternative Flows**:
  - 3a. Department has employees → Display error, prevent deletion

---

## Project Management Use Cases

### UC-PM-001: Create Project
- **Actor**: Department Manager, System Administrator
- **Preconditions**: Department and Project Manager must exist
- **Main Flow**:
  1. Actor navigates to Project Management
  2. Actor clicks "Add Project"
  3. Actor fills in project details (name, description, start date, budget)
  4. Actor selects department and project manager
  5. System validates input
  6. System creates project record
  7. System displays success message
- **Postconditions**: Project record created

### UC-PM-002: View Project List
- **Actor**: Department Manager, Employee, System Administrator
- **Preconditions**: None
- **Main Flow**:
  1. Actor navigates to Project List
  2. System displays list of projects
  3. Actor can filter by department, status
  4. Actor can view project details
- **Postconditions**: Project list displayed

### UC-PM-003: Assign Employee to Project
- **Actor**: Department Manager, System Administrator
- **Preconditions**: Employee and Project must exist
- **Main Flow**:
  1. Actor navigates to project details
  2. Actor clicks "Assign Employee"
  3. Actor selects employee and role
  4. System creates employee-project assignment
  5. System displays success message
- **Postconditions**: Employee assigned to project

---

## Task Management Use Cases

### UC-TM-001: Create Task
- **Actor**: Department Manager, Project Manager, System Administrator
- **Preconditions**: Project must exist
- **Main Flow**:
  1. Actor navigates to project details
  2. Actor clicks "Add Task"
  3. Actor fills in task details (name, description, priority, due date)
  4. Actor optionally assigns task to employee
  5. System validates input
  6. System creates task record
  7. System displays success message
- **Postconditions**: Task record created

### UC-TM-002: Update Task Status
- **Actor**: Employee, Department Manager, System Administrator
- **Preconditions**: Task must exist, actor must be assigned or manager
- **Main Flow**:
  1. Actor navigates to task details
  2. Actor updates task status (In Progress, Completed, etc.)
  3. System validates permission
  4. System updates task record
  5. System displays success message
- **Postconditions**: Task status updated

---

## Dashboard Use Cases

### UC-DB-001: View Dashboard Metrics
- **Actor**: HR Manager, Department Manager, System Administrator
- **Preconditions**: None
- **Main Flow**:
  1. Actor navigates to Dashboard
  2. System calculates and displays metrics:
     - Total employees
     - Total departments
     - Average salary
     - Employee growth chart
     - Department distribution chart
  3. Actor views metrics and charts
- **Postconditions**: Dashboard metrics displayed

### UC-DB-002: View Employee Growth Chart
- **Actor**: HR Manager, System Administrator
- **Preconditions**: None
- **Main Flow**:
  1. Actor navigates to Dashboard
  2. Actor clicks on "Employee Growth" chart
  3. System displays employee count over time
  4. Actor analyzes growth trends
- **Postconditions**: Growth chart displayed

---

## Authentication Use Cases

### UC-AU-001: Login
- **Actor**: All Users
- **Preconditions**: User account must exist
- **Main Flow**:
  1. Actor navigates to login page
  2. Actor enters username and password
  3. System validates credentials
  4. System generates JWT token
  5. System redirects to dashboard
- **Postconditions**: User authenticated, session created
- **Alternative Flows**:
  - 3a. Invalid credentials → Display error message

### UC-AU-002: Logout
- **Actor**: Authenticated Users
- **Preconditions**: User must be logged in
- **Main Flow**:
  1. Actor clicks "Logout"
  2. System invalidates session
  3. System redirects to login page
- **Postconditions**: User logged out, session terminated

---

## Search Use Cases

### UC-SR-001: Search Employees
- **Actor**: HR Manager, Department Manager, System Administrator
- **Preconditions**: None
- **Main Flow**:
  1. Actor enters search query in search bar
  2. System searches across employee names, emails, designations
  3. System displays matching results
  4. Actor clicks on result to view details
- **Postconditions**: Search results displayed

### UC-SR-002: Search Departments
- **Actor**: HR Manager, System Administrator
- **Preconditions**: None
- **Main Flow**:
  1. Actor enters search query
  2. System searches department names and descriptions
  3. System displays matching results
- **Postconditions**: Search results displayed

---

## Use Case Summary

| Category | Use Cases | Primary Actors |
|----------|-----------|----------------|
| Employee Management | 6 | HR Manager, System Admin |
| Department Management | 4 | HR Manager, System Admin |
| Project Management | 3 | Department Manager, System Admin |
| Task Management | 2 | Employee, Department Manager |
| Dashboard | 2 | HR Manager, Department Manager |
| Authentication | 2 | All Users |
| Search | 2 | HR Manager, Department Manager |
| **Total** | **21** | |

---

**Last Updated**: 2024-12-10  
**Status**: Active

