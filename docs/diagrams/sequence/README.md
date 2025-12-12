# Sequence Diagrams

This directory contains sequence diagrams showing the flow of interactions between system components over time.

## What are Sequence Diagrams?

Sequence diagrams show **HOW** the system works - the step-by-step flow of messages between objects/components when executing a use case.

**Purpose**: 
- Show object interactions over time
- Document technical implementation details
- Identify design issues
- Understand message flow

## Diagrams

### Authentication & User Management

#### 1. Authentication Flow
**File**: `authentication-flow.puml`
- **Use Case**: UC-AU-001 (Login)
- **Shows**: JWT token generation, validation, role extraction, SecurityContext setup
- **Use When**: Implementing authentication, understanding JWT flow, debugging authorization issues

#### 2. Register/Add Admin Flow
**File**: `register-add-admin-flow.puml`
- **Use Case**: UC-AU-003 (Register/Add Admin)
- **Shows**: System Admin creating new users, username/email uniqueness validation, role restrictions, double-hashing
- **Use When**: Implementing user registration, understanding admin-only operations, password security

#### 3. Change Password Flow
**File**: `change-password-flow.puml`
- **Use Case**: UC-AU-004 (Change Password)
- **Shows**: Current password verification, new password validation, double-hashing, session management
- **Use When**: Implementing password change, understanding password security, debugging authentication issues

### Employee Management

#### 4. Employee Create Flow
**File**: `employee-create-flow.puml`
- **Use Case**: UC-EM-001 (Create Employee)
- **Shows**: Complete flow from user action to database, validation (manager in same department), Entity-DTO conversion, Repository interactions
- **Use When**: Implementing employee creation, understanding validation flow, debugging creation issues

#### 5. Employee Query Flow
**File**: `employee-query-flow.puml`
- **Use Case**: UC-EM-002 (View Employee List)
- **Shows**: Filtering, sorting, pagination flow, Strategy pattern, Factory pattern, Template method pattern
- **Use When**: Implementing table queries, understanding pattern applications, optimizing query performance

#### 6. Employee Details Flow
**File**: `employee-details-flow.puml`
- **Use Case**: UC-EM-003 (View Employee Details)
- **Shows**: Role-based access control, department-based filtering, employee self-view restriction, related data loading
- **Use When**: Implementing employee details view, understanding role-based filtering, debugging access issues

#### 7. Employee Update Flow
**File**: `employee-update-flow.puml`
- **Use Case**: UC-EM-004 (Update Employee)
- **Shows**: Employee update with validation, manager department validation, department/location changes, field immutability
- **Use When**: Implementing employee updates, understanding validation flow, debugging update issues

#### 8. Employee Delete Flow
**File**: `employee-delete-flow.puml`
- **Use Case**: UC-EM-005 (Delete Employee)
- **Shows**: Active assignment validation, cascade deletion handling, manager relationship updates
- **Use When**: Implementing employee deletion, understanding business rule validation, cascade operations

#### 9. Employee Assign Manager Flow
**File**: `employee-assign-manager-flow.puml`
- **Use Case**: UC-EM-006 (Assign Manager to Employee)
- **Shows**: Department validation (manager must be in same department), manager assignment/removal
- **Use When**: Implementing manager assignment, understanding department constraints, validation logic

#### 10. Employee Profile View Flow
**File**: `employee-profile-view-flow.puml`
- **Use Case**: UC-EM-007 (View My Profile)
- **Shows**: Self-profile viewing, employee ID validation from token, related data loading (projects, tasks)
- **Use When**: Implementing employee profile view, understanding self-access patterns

#### 11. Employee Profile Update Flow
**File**: `employee-profile-update-flow.puml`
- **Use Case**: UC-EM-008 (Update My Profile)
- **Shows**: Limited field editing (phone, address only), field-level permission checks, restricted field validation
- **Use When**: Implementing employee self-update, understanding field-level restrictions

### Department Management

#### 9. Department Create Flow
**File**: `department-create-flow.puml`
- **Use Case**: UC-DM-001 (Create Department)
- **Shows**: Department creation with location and department head validation
- **Use When**: Implementing department creation, understanding validation flow

#### 10. Department List Flow
**File**: `department-list-flow.puml`
- **Use Case**: UC-DM-002 (View Department List)
- **Shows**: Role-based filtering (System Admin/HR Manager see all, Department Manager sees own), employee count calculation, related data loading
- **Use When**: Implementing department list view, understanding role-based filtering

#### 11. Department Update Flow
**File**: `department-update-flow.puml`
- **Use Case**: UC-DM-003 (Update Department)
- **Shows**: Department update with validation, name uniqueness check, location/department head changes
- **Use When**: Implementing department updates, understanding validation flow

#### 12. Department Delete Flow
**File**: `department-delete-flow.puml`
- **Use Case**: UC-DM-004 (Delete Department)
- **Shows**: Employee assignment validation, System Admin only operation, business rule enforcement
- **Use When**: Implementing department deletion, understanding constraint validation

#### 13. Department Search Flow
**File**: `department-search-flow.puml`
- **Use Case**: UC-SR-002 (Search Departments)
- **Shows**: Full-text search across department names and descriptions, case-insensitive matching, employee count calculation
- **Use When**: Implementing department search, understanding search functionality

### Project Management

#### 13. Project Create Flow
**File**: `project-create-flow.puml`
- **Use Case**: UC-PM-001 (Create Project)
- **Shows**: Project creation with department and project manager validation, department manager constraint
- **Use When**: Implementing project creation, understanding validation flow

#### 14. Project List Flow
**File**: `project-list-flow.puml`
- **Use Case**: UC-PM-002 (View Project List)
- **Shows**: Role-based filtering (System Admin/Department Manager/Employee), pagination, filtering by department/status
- **Use When**: Implementing project list view, understanding role-based repository filtering

#### 15. Project Assign Employee Flow
**File**: `project-assign-employee-flow.puml`
- **Use Case**: UC-PM-003 (Assign Employee to Project)
- **Shows**: Employee-project assignment, role assignment, duplicate assignment prevention, department manager constraint
- **Use When**: Implementing project assignments, understanding many-to-many relationships

#### 16. Project Details Flow
**File**: `project-details-flow.puml`
- **Use Case**: UC-PM-006 (View Project Details)
- **Shows**: Role-based access (System Admin/Department Manager/Employee), department-based filtering, assigned employees and tasks loading
- **Use When**: Implementing project details view, understanding role-based filtering

#### 17. Project Update Flow
**File**: `project-update-flow.puml`
- **Use Case**: UC-PM-004 (Update Project)
- **Shows**: Project update with validation, department manager constraint, department/project manager changes
- **Use When**: Implementing project updates, understanding validation flow

#### 18. Project Delete Flow
**File**: `project-delete-flow.puml`
- **Use Case**: UC-PM-005 (Delete Project)
- **Shows**: Active task validation, cascade deletion of tasks and assignments, department manager constraint
- **Use When**: Implementing project deletion, understanding cascade operations

#### 19. Project Remove Employee Flow
**File**: `project-remove-employee-flow.puml`
- **Use Case**: UC-PM-007 (Remove Employee from Project)
- **Shows**: Employee-project assignment removal, department manager constraint, assignment validation
- **Use When**: Implementing employee removal from projects

### Task Management

#### 20. Task Create Flow
**File**: `task-create-flow.puml`
- **Use Case**: UC-TM-001 (Create Task)
- **Shows**: Task creation with project validation, department manager constraint, optional employee assignment
- **Use When**: Implementing task creation, understanding validation flow

#### 21. Task Update Status Flow
**File**: `task-update-status-flow.puml`
- **Use Case**: UC-TM-002 (Update Task Status)
- **Shows**: Custom permission check (assigned employee OR manager), role-based access, status transition validation
- **Use When**: Implementing task status updates, understanding custom permission logic

#### 22. Task Details Flow
**File**: `task-details-flow.puml`
- **Use Case**: UC-TM-003 (View Task Details)
- **Shows**: Role-based access control, department-based filtering, employee assignment check, related data loading
- **Use When**: Implementing task details view, understanding role-based filtering

#### 23. Task Update Flow
**File**: `task-update-flow.puml`
- **Use Case**: UC-TM-004 (Update Task)
- **Shows**: Task update with validation, department manager constraint, assigned employee changes
- **Use When**: Implementing task updates, understanding validation flow

#### 24. Task Delete Flow
**File**: `task-delete-flow.puml`
- **Use Case**: UC-TM-005 (Delete Task)
- **Shows**: Task deletion with department manager constraint, straightforward deletion (no dependencies)
- **Use When**: Implementing task deletion

### Dashboard

#### 28. Dashboard Metrics Flow
**File**: `dashboard-metrics-flow.puml`
- **Use Case**: UC-DB-001 (View Dashboard Metrics)
- **Shows**: Facade pattern, Factory Method pattern, Strategy pattern, role-based metric filtering
- **Use When**: Implementing dashboard features, understanding pattern combinations, optimizing metric calculations

#### 29. Employee Growth Chart Flow
**File**: `employee-growth-chart-flow.puml`
- **Use Case**: UC-DB-002 (View Employee Growth Chart)
- **Shows**: Time series data aggregation (monthly/quarterly/yearly), cumulative count calculation, growth rate calculation, chart data preparation
- **Use When**: Implementing growth charts, understanding time series aggregation, dashboard analytics

### Search

#### 29. Employee Search Flow
**File**: `employee-search-flow.puml`
- **Use Case**: UC-SR-001 (Search Employees)
- **Shows**: Full-text search across names, emails, designations, case-insensitive matching, role-based filtering
- **Use When**: Implementing employee search, understanding search functionality

### Location Management

#### 25. Location Create Flow
**File**: `location-create-flow.puml`
- **Use Case**: UC-LM-001 (Create Location)
- **Shows**: Location creation with name uniqueness validation, default country setting, required field validation
- **Use When**: Implementing location creation, understanding validation flow

#### 26. Location List Flow
**File**: `location-list-flow.puml`
- **Use Case**: UC-LM-002 (View Location List)
- **Shows**: Simple list retrieval, no role-based filtering (all authorized users see all locations), location details display
- **Use When**: Implementing location list view, understanding shared resource access

#### 27. Location Update Flow
**File**: `location-update-flow.puml`
- **Use Case**: UC-LM-003 (Update Location)
- **Shows**: Location update with name uniqueness check, required field validation, cascade impact awareness
- **Use When**: Implementing location updates, understanding validation flow

#### 28. Location Delete Flow
**File**: `location-delete-flow.puml`
- **Use Case**: UC-LM-004 (Delete Location)
- **Shows**: Usage validation (departments and employees), System Admin only operation, business rule enforcement
- **Use When**: Implementing location deletion, understanding constraint validation

### Generic Patterns

#### 30. Table Pagination Flow
**File**: `table-pagination-flow.puml`
- **Use Case**: Generic (used by multiple use cases)
- **Shows**: Pagination state management, Observer pattern, Template method, role-based data filtering
- **Use When**: Implementing table pagination, understanding state management

## RBAC in Sequence Diagrams

All sequence diagrams now include:
- **JwtAuthenticationFilter**: Intercepts requests, validates JWT, extracts role
- **SecurityService**: Provides role-based helper methods
- **@PreAuthorize**: Method-level authorization checks
- **Repository Filtering**: Role-based query filtering

**See**: `docs/security/roles-and-permissions.md` for complete permission matrix

## How to View

See main diagrams README for viewing instructions.

---

## Phase Status

### ✅ Phase 1: High-Priority Sequence Diagrams (Complete)
**12 diagrams created** covering:
- Complex authorization/authentication flows (Register, Change Password)
- Multi-step validation with business rules (Delete operations with constraint checks)
- Role-based filtering/complex permissions (View Details operations)
- Complex business logic (Assign Manager, Assign Employee to Project)

### ✅ Phase 2: Medium-Priority Sequence Diagrams (Complete)
**5 diagrams created** covering:
- Update operations with validation (Employee, Project, Task)
- View operations with filtering (Project List, Task Details)

### ✅ Phase 3: Remaining Important Use Cases (Complete)
**10 diagrams created** covering:
- Create operations (Project, Task, Location)
- Update operations (Department, Location)
- Delete operations (Task)
- Search operations (Employee, Department)
- Profile operations (View My Profile, Update My Profile)

### ✅ Phase 4: Final Missing Use Cases (Complete)
**4 diagrams created** covering:
- Logout flow (UC-AU-002)
- Department List view (UC-DM-002)
- Location List view (UC-LM-002)
- Employee Growth Chart (UC-DB-002)

**Total Sequence Diagrams: 37** (6 original + 31 new across 4 phases)

**Coverage: 100%** - All 36 use cases now have corresponding sequence diagrams!

---

**Last Updated**: 2024-12-12

