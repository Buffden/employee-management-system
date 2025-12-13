# Implementation Plan - Employee Management System

## Overview

This document outlines the **correct order of implementation** for all 36 use cases, considering dependencies and prerequisites. This plan assumes **zero implementation** - starting from scratch.

**Key Principle**: Dependencies must be implemented before dependent features.

---

## Dependency Chain

```
Authentication → Location → Department → Employee → Project → Task
     ↓              ↓           ↓           ↓          ↓        ↓
  (Foundation)  (Reference)  (Reference)  (Core)   (Business) (Business)
```

---

## Phase 1: Foundation - Authentication & Security 🔐

**Priority**: CRITICAL - Everything depends on this

**Why First**: 
- All other features require authentication
- RBAC (Role-Based Access Control) must be in place
- Users need to log in before accessing any features

### Use Cases

1. **UC-AU-001: Login**
   - **Use Case**: [`docs/use-cases/UC-AU-001.md`](./use-cases/UC-AU-001.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/authentication-flow.puml`](./diagrams/sequence/authentication-flow.puml)
   - **Dependencies**: None
   - **Why First**: Users must be able to authenticate to access the system

2. **UC-AU-003: Register/Add Admin**
   - **Use Case**: [`docs/use-cases/UC-AU-003.md`](./use-cases/UC-AU-003.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/register-add-admin-flow.puml`](./diagrams/sequence/register-add-admin-flow.puml)
   - **Dependencies**: UC-AU-001 (Login must work to verify admin creation)
   - **Why Second**: Need to create admin users who can then create other entities

3. **UC-AU-004: Change Password**
   - **Use Case**: [`docs/use-cases/UC-AU-004.md`](./use-cases/UC-AU-004.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/change-password-flow.puml`](./diagrams/sequence/change-password-flow.puml)
   - **Dependencies**: UC-AU-001 (User must be logged in)
   - **Why Third**: Security feature for authenticated users

4. **UC-AU-002: Logout**
   - **Use Case**: [`docs/use-cases/UC-AU-002.md`](./use-cases/UC-AU-002.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/logout-flow.puml`](./diagrams/sequence/logout-flow.puml)
   - **Dependencies**: UC-AU-001 (User must be logged in to log out)
   - **Why Fourth**: Complete the authentication cycle

**Phase 1 Checklist**:
- [ ] JWT token generation and validation
- [ ] Role extraction and SecurityContext setup
- [ ] User registration with role restrictions
- [ ] Password change functionality
- [ ] Session management and logout
- [ ] RBAC infrastructure ready

---

## Phase 2: Reference Data - Location Management 📍

**Priority**: HIGH - Required by Department and Employee

**Why Second**: 
- Departments require a Location (precondition in UC-DM-001)
- Employees require a Location (precondition in UC-EM-001)
- This is foundational reference data with no dependencies

### Use Cases

1. **UC-LM-001: Create Location**
   - **Use Case**: [`docs/use-cases/UC-LM-001.md`](./use-cases/UC-LM-001.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/location-create-flow.puml`](./diagrams/sequence/location-create-flow.puml)
   - **Dependencies**: Phase 1 (Authentication)
   - **Why First**: No dependencies - pure reference data

2. **UC-LM-002: View Location List**
   - **Use Case**: [`docs/use-cases/UC-LM-002.md`](./use-cases/UC-LM-002.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/location-list-flow.puml`](./diagrams/sequence/location-list-flow.puml)
   - **Dependencies**: UC-LM-001 (Need locations to view)
   - **Why Second**: Basic CRUD - view what you can create

3. **UC-LM-003: Update Location**
   - **Use Case**: [`docs/use-cases/UC-LM-003.md`](./use-cases/UC-LM-003.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/location-update-flow.puml`](./diagrams/sequence/location-update-flow.puml)
   - **Dependencies**: UC-LM-001 (Need locations to update)
   - **Why Third**: Complete CRUD operations

4. **UC-LM-004: Delete Location**
   - **Use Case**: [`docs/use-cases/UC-LM-004.md`](./use-cases/UC-LM-004.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/location-delete-flow.puml`](./diagrams/sequence/location-delete-flow.puml)
   - **Dependencies**: UC-LM-001 (Need locations to delete)
   - **Why Fourth**: Complete CRUD operations

**Phase 2 Checklist**:
- [x] Location entity and repository
- [x] Create, Read, Update, Delete operations
- [x] Validation: name uniqueness
- [x] RBAC: System Admin and HR Manager only

---

## Phase 3: Reference Data - Department Management 🏢

**Priority**: HIGH - Required by Employee and Project

**Why Third**: 
- Employees require a Department (precondition in UC-EM-001)
- Projects require a Department (precondition in UC-PM-001)
- Departments require a Location (precondition in UC-DM-001) ✅ Already done in Phase 2

### Use Cases

1. **UC-DM-001: Create Department**
   - **Use Case**: [`docs/use-cases/UC-DM-001.md`](./use-cases/UC-DM-001.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/department-create-flow.puml`](./diagrams/sequence/department-create-flow.puml)
   - **Dependencies**: 
     - Phase 1 (Authentication)
     - Phase 2 (Location must exist - precondition 3)
   - **Why First**: Can now create departments since locations exist

2. **UC-DM-002: View Department List**
   - **Use Case**: [`docs/use-cases/UC-DM-002.md`](./use-cases/UC-DM-002.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/department-list-flow.puml`](./diagrams/sequence/department-list-flow.puml)
   - **Dependencies**: UC-DM-001 (Need departments to view)
   - **Why Second**: Basic CRUD - view what you can create

3. **UC-DM-003: Update Department**
   - **Use Case**: [`docs/use-cases/UC-DM-003.md`](./use-cases/UC-DM-003.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/department-update-flow.puml`](./diagrams/sequence/department-update-flow.puml)
   - **Dependencies**: UC-DM-001 (Need departments to update)
   - **Why Third**: Complete CRUD operations

4. **UC-DM-004: Delete Department**
   - **Use Case**: [`docs/use-cases/UC-DM-004.md`](./use-cases/UC-DM-004.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/department-delete-flow.puml`](./diagrams/sequence/department-delete-flow.puml)
   - **Dependencies**: UC-DM-001 (Need departments to delete)
   - **Why Fourth**: Complete CRUD operations

**Phase 3 Checklist**:
- [ ] Department entity and repository
- [ ] Create, Read, Update, Delete operations
- [ ] Validation: location must exist, name uniqueness
- [ ] RBAC: System Admin and HR Manager only
- [ ] Department head assignment (optional, requires employee - can be done later)

---

## Phase 4: Core Entity - Employee Management 👥

**Priority**: HIGH - Required by Projects, Tasks, and Assignments

**Why Fourth**: 
- Employees require Department and Location (preconditions in UC-EM-001) ✅ Already done in Phases 2 & 3
- Projects require employees (project manager, assigned employees)
- Tasks require employees (assigned employees)
- Manager assignments require employees

### Use Cases

1. **UC-EM-001: Create Employee**
   - **Use Case**: [`docs/use-cases/UC-EM-001.md`](./use-cases/UC-EM-001.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/employee-create-flow.puml`](./diagrams/sequence/employee-create-flow.puml)
   - **Dependencies**: 
     - Phase 1 (Authentication)
     - Phase 2 (Location must exist - precondition 4)
     - Phase 3 (Department must exist - precondition 3)
   - **Why First**: Can now create employees since all prerequisites exist

2. **UC-EM-002: View Employee List**
   - **Use Case**: [`docs/use-cases/UC-EM-002.md`](./use-cases/UC-EM-002.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/employee-query-flow.puml`](./diagrams/sequence/employee-query-flow.puml)
   - **Dependencies**: UC-EM-001 (Need employees to view)
   - **Why Second**: Basic CRUD - view what you can create

3. **UC-EM-003: View Employee Details**
   - **Use Case**: [`docs/use-cases/UC-EM-003.md`](./use-cases/UC-EM-003.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/employee-details-flow.puml`](./diagrams/sequence/employee-details-flow.puml)
   - **Dependencies**: UC-EM-001 (Need employees to view)
   - **Why Third**: Detailed view operation

4. **UC-EM-004: Update Employee**
   - **Use Case**: [`docs/use-cases/UC-EM-004.md`](./use-cases/UC-EM-004.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/employee-update-flow.puml`](./diagrams/sequence/employee-update-flow.puml)
   - **Dependencies**: UC-EM-001 (Need employees to update)
   - **Why Fourth**: Complete CRUD operations

5. **UC-EM-005: Delete Employee**
   - **Use Case**: [`docs/use-cases/UC-EM-005.md`](./use-cases/UC-EM-005.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/employee-delete-flow.puml`](./diagrams/sequence/employee-delete-flow.puml)
   - **Dependencies**: UC-EM-001 (Need employees to delete)
   - **Why Fifth**: Complete CRUD operations

6. **UC-EM-006: Assign Manager to Employee**
   - **Use Case**: [`docs/use-cases/UC-EM-006.md`](./use-cases/UC-EM-006.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/employee-assign-manager-flow.puml`](./diagrams/sequence/employee-assign-manager-flow.puml)
   - **Dependencies**: UC-EM-001 (Need employees to assign managers)
   - **Why Sixth**: Relationship management - requires employees to exist

7. **UC-EM-007: View My Profile**
   - **Use Case**: [`docs/use-cases/UC-EM-007.md`](./use-cases/UC-EM-007.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/employee-profile-view-flow.puml`](./diagrams/sequence/employee-profile-view-flow.puml)
   - **Dependencies**: UC-EM-001 (Employee must exist to view profile)
   - **Why Seventh**: Self-service feature

8. **UC-EM-008: Update My Profile**
   - **Use Case**: [`docs/use-cases/UC-EM-008.md`](./use-cases/UC-EM-008.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/employee-profile-update-flow.puml`](./diagrams/sequence/employee-profile-update-flow.puml)
   - **Dependencies**: UC-EM-001 (Employee must exist to update profile)
   - **Why Eighth**: Self-service feature

**Phase 4 Checklist**:
- [ ] Employee entity and repository
- [ ] Create, Read, Update, Delete operations
- [ ] Validation: department must exist, location must exist, manager in same department
- [ ] RBAC: Role-based access control
- [ ] Manager assignment functionality
- [ ] Self-service profile operations

---

### Implementation Details

#### Step 1: Backend Foundation

**1.1 DTOs and Models**
- `EmployeeQueryRequestDTO` - Pagination, sorting, filtering parameters
- `EmployeeRequestDTO` - Create/update with validation annotations
- `EmployeeResponseDTO` - Response with denormalized department/location names
- Update `FilterOptionDTO` usage for employee filters (departments, locations, designations)

**1.2 Repository Layer**
- `EmployeeRepository` with:
  - `findAllFilteredByRole(role, departmentId, pageable)` - Role-based filtering
  - `findByEmail(String email)` - Email uniqueness validation
  - `findByDepartmentId(UUID departmentId)` - For manager dropdown filtering
  - `countByDepartmentId(UUID departmentId)` - For delete validation
  - `countDirectReports(UUID managerId)` - Check if employee has direct reports

**1.3 Service Layer**
- `EmployeeService` with:
  - `getAll(Pageable)` - Paginated queries with role filtering
  - `getById(UUID)` - Single employee retrieval
  - `save(Employee)` - Create/update with business logic validation
  - `delete(UUID)` - Delete with business rule checks (no active projects, no direct reports)
  - `getAll()` - For dropdowns (all employees or filtered by department)
  - `getEmployeesByDepartment(UUID departmentId)` - For manager dropdown

**1.4 Controller Layer**
- `EmployeeController` with:
  - `POST /api/employees` - Query with pagination, sorting, filtering
  - `POST /api/employees/create` - Create employee
  - `GET /api/employees/{id}` - Get by ID (with role-based access)
  - `PUT /api/employees/{id}` - Update employee
  - `DELETE /api/employees/{id}` - Delete employee
  - RBAC: `@PreAuthorize` annotations for each endpoint
  - Include filters in paginated response (departments, locations, designations)

**1.5 Mapper Layer**
- `EmployeeMapper` with:
  - `toResponseDTO(Employee)` - Include denormalized department/location names
  - `toEntity(EmployeeRequestDTO, Department, Location, Employee manager)` - Relationship resolution

#### Step 2: Additional Complexity (Beyond Location/Department)

**2.1 Manager Assignment Validation**
- Validate manager exists
- Validate manager is in same department as employee
- Handle self-referential relationship (employee → manager)
- Prevent circular manager assignments

**2.2 Email Uniqueness Validation**
- Check email uniqueness on create
- Check email uniqueness on update (excluding current employee)
- Return clear error messages for duplicate emails

**2.3 Delete Validation**
- Check for active project assignments (prevent deletion if assigned)
- Check for direct reports (prevent deletion if manager has direct reports)
- Return clear error messages explaining why deletion is blocked

**2.4 Role-Based Data Filtering**
- `DEPARTMENT_MANAGER`: Only see employees in their department
- `EMPLOYEE`: Only see themselves
- `HR_MANAGER`/`SYSTEM_ADMIN`: See all employees
- Implement in repository query methods

#### Step 3: Frontend Implementation

**3.1 Employee Service**
- `queryEmployees(page, size, sortBy, sortDir, filters?)` - POST query with pagination
- `addEmployee(employeeData)` - Create employee
- `updateEmployee(id, employeeData)` - Update employee
- `deleteEmployee(id)` - Delete employee
- `getEmployeeById(id)` - Get single employee
- `getEmployeesByDepartment(departmentId)` - For manager dropdown

**3.2 Employee List Component**
- Table with pagination, sorting, filtering
- Edit/Delete actions (RBAC-based visibility)
- Click on name to edit/view (based on permissions)
- Filter by department, location, designation
- Default sort by name (ascending)

**3.3 Employee Form Component**
- **Required Fields**: firstName, lastName, email, designation, salary, joiningDate
- **Dropdowns**: 
  - Department (from filters or API)
  - Location (from filters or API)
  - Manager (filtered by selected department, excludes self)
- **Optional Fields**: phone, address, performanceRating, experienceYears
- **Validation**: 
  - Email format and uniqueness
  - Salary > 0
  - JoiningDate not in future
  - Manager in same department
- **Error Handling**: Display field-level validation errors

**3.4 Employee Config**
- Table columns configuration
- Default sorting (e.g., by name, ascending)
- Filter options (departments, locations, designations from API response)
- RBAC-based action button visibility

#### Step 4: Self-Service Features (UC-EM-007, UC-EM-008)

**4.1 Profile View Component**
- Read-only view of own profile
- Accessible to all authenticated employees
- Display: personal info, department, location, manager, projects (future)

**4.2 Profile Update Component**
- Limited fields (phone, address, etc.)
- Cannot change: salary, designation, department, manager
- RBAC: Only own profile
- Validation: Same as employee form for editable fields

---

### Key Differences from Location/Department

1. **More Relationships**
   - Department (required) - ManyToOne
   - Location (required) - ManyToOne
   - Manager (optional, self-referential) - ManyToOne to Employee
   - Projects (future, many-to-many)

2. **More Validation**
   - Email uniqueness (unique constraint)
   - Manager in same department (business rule)
   - Delete constraints (projects, direct reports)

3. **Role-Based Data Filtering**
   - Department managers see only their department
   - Employees see only themselves
   - More complex than Location/Department (which all roles can view)

4. **Self-Service Features**
   - Profile view/update
   - Not present in Location/Department

---

### Suggested Commit Strategy

1. Add employee query DTO and filter options
2. Implement employee repository with role filtering
3. Add employee service with validation logic
4. Create employee CRUD endpoints
5. Update employee DTOs with denormalized names
6. Add employee list component
7. Add employee form with manager dropdown
8. Integrate employee form into overlay dialog
9. Add profile view component
10. Add profile update component

---

## Phase 5: Business Logic - Project Management 📊

**Priority**: MEDIUM - Depends on Employees and Departments

**Why Fifth**: 
- Projects require Department (precondition in UC-PM-001) ✅ Already done in Phase 3
- Projects require Employee as Project Manager (precondition in UC-PM-001) ✅ Already done in Phase 4
- Project assignments require Employees ✅ Already done in Phase 4

### Use Cases

1. **UC-PM-001: Create Project**
   - **Use Case**: [`docs/use-cases/UC-PM-001.md`](./use-cases/UC-PM-001.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/project-create-flow.puml`](./diagrams/sequence/project-create-flow.puml)
   - **Dependencies**: 
     - Phase 1 (Authentication)
     - Phase 3 (Department must exist)
     - Phase 4 (Employee/Project Manager must exist)
   - **Why First**: Can now create projects since all prerequisites exist

2. **UC-PM-002: View Project List**
   - **Use Case**: [`docs/use-cases/UC-PM-002.md`](./use-cases/UC-PM-002.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/project-list-flow.puml`](./diagrams/sequence/project-list-flow.puml)
   - **Dependencies**: UC-PM-001 (Need projects to view)
   - **Why Second**: Basic CRUD - view what you can create

3. **UC-PM-006: View Project Details**
   - **Use Case**: [`docs/use-cases/UC-PM-006.md`](./use-cases/UC-PM-006.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/project-details-flow.puml`](./diagrams/sequence/project-details-flow.puml)
   - **Dependencies**: UC-PM-001 (Need projects to view)
   - **Why Third**: Detailed view operation

4. **UC-PM-004: Update Project**
   - **Use Case**: [`docs/use-cases/UC-PM-004.md`](./use-cases/UC-PM-004.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/project-update-flow.puml`](./diagrams/sequence/project-update-flow.puml)
   - **Dependencies**: UC-PM-001 (Need projects to update)
   - **Why Fourth**: Complete CRUD operations

5. **UC-PM-003: Assign Employee to Project**
   - **Use Case**: [`docs/use-cases/UC-PM-003.md`](./use-cases/UC-PM-003.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/project-assign-employee-flow.puml`](./diagrams/sequence/project-assign-employee-flow.puml)
   - **Dependencies**: 
     - UC-PM-001 (Need projects to assign employees to)
     - Phase 4 (Need employees to assign)
   - **Why Fifth**: Relationship management

6. **UC-PM-007: Remove Employee from Project**
   - **Use Case**: [`docs/use-cases/UC-PM-007.md`](./use-cases/UC-PM-007.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/project-remove-employee-flow.puml`](./diagrams/sequence/project-remove-employee-flow.puml)
   - **Dependencies**: UC-PM-003 (Need assigned employees to remove)
   - **Why Sixth**: Relationship management - requires assignments to exist

7. **UC-PM-005: Delete Project**
   - **Use Case**: [`docs/use-cases/UC-PM-005.md`](./use-cases/UC-PM-005.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/project-delete-flow.puml`](./diagrams/sequence/project-delete-flow.puml)
   - **Dependencies**: UC-PM-001 (Need projects to delete)
   - **Why Seventh**: Complete CRUD operations (check for active tasks first)

**Phase 5 Checklist**:
- [ ] Project entity and repository
- [ ] Create, Read, Update, Delete operations
- [ ] Validation: department must exist, project manager must exist
- [ ] Employee-project assignment (many-to-many)
- [ ] RBAC: Role-based filtering
- [ ] Cascade deletion handling

---

## Phase 6: Business Logic - Task Management ✅

**Priority**: MEDIUM - Depends on Projects and Employees

**Why Sixth**: 
- Tasks require Project (precondition in UC-TM-001) ✅ Already done in Phase 5
- Tasks can assign Employees ✅ Already done in Phase 4

### Use Cases

1. **UC-TM-001: Create Task**
   - **Use Case**: [`docs/use-cases/UC-TM-001.md`](./use-cases/UC-TM-001.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/task-create-flow.puml`](./diagrams/sequence/task-create-flow.puml)
   - **Dependencies**: 
     - Phase 1 (Authentication)
     - Phase 5 (Project must exist - precondition)
     - Phase 4 (Employee for assignment - optional)
   - **Why First**: Can now create tasks since all prerequisites exist

2. **UC-TM-003: View Task Details**
   - **Use Case**: [`docs/use-cases/UC-TM-003.md`](./use-cases/UC-TM-003.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/task-details-flow.puml`](./diagrams/sequence/task-details-flow.puml)
   - **Dependencies**: UC-TM-001 (Need tasks to view)
   - **Why Second**: Detailed view operation

3. **UC-TM-002: Update Task Status**
   - **Use Case**: [`docs/use-cases/UC-TM-002.md`](./use-cases/UC-TM-002.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/task-update-status-flow.puml`](./diagrams/sequence/task-update-status-flow.puml)
   - **Dependencies**: UC-TM-001 (Need tasks to update status)
   - **Why Third**: Status management (custom permission logic)

4. **UC-TM-004: Update Task**
   - **Use Case**: [`docs/use-cases/UC-TM-004.md`](./use-cases/UC-TM-004.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/task-update-flow.puml`](./diagrams/sequence/task-update-flow.puml)
   - **Dependencies**: UC-TM-001 (Need tasks to update)
   - **Why Fourth**: Complete CRUD operations

5. **UC-TM-005: Delete Task**
   - **Use Case**: [`docs/use-cases/UC-TM-005.md`](./use-cases/UC-TM-005.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/task-delete-flow.puml`](./diagrams/sequence/task-delete-flow.puml)
   - **Dependencies**: UC-TM-001 (Need tasks to delete)
   - **Why Fifth**: Complete CRUD operations

**Phase 6 Checklist**:
- [ ] Task entity and repository
- [ ] Create, Read, Update, Delete operations
- [ ] Validation: project must exist, assigned employee validation
- [ ] Status transition validation
- [ ] Custom permission: assigned employee OR manager
- [ ] RBAC: Role-based filtering

---

## Phase 7: Search & Discovery 🔍

**Priority**: LOW - Enhances existing features

**Why Seventh**: 
- Search requires entities to exist (employees, departments)
- This is an enhancement feature, not core functionality

### Use Cases

1. **UC-SR-001: Search Employees**
   - **Use Case**: [`docs/use-cases/UC-SR-001.md`](./use-cases/UC-SR-001.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/employee-search-flow.puml`](./diagrams/sequence/employee-search-flow.puml)
   - **Dependencies**: Phase 4 (Need employees to search)
   - **Why First**: Search employees once they exist

2. **UC-SR-002: Search Departments**
   - **Use Case**: [`docs/use-cases/UC-SR-002.md`](./use-cases/UC-SR-002.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/department-search-flow.puml`](./diagrams/sequence/department-search-flow.puml)
   - **Dependencies**: Phase 3 (Need departments to search)
   - **Why Second**: Search departments once they exist

**Phase 7 Checklist**:
- [ ] Full-text search implementation
- [ ] Case-insensitive matching
- [ ] Role-based filtering in search results
- [ ] Search across multiple fields

---

## Phase 8: Analytics & Reporting 📈

**Priority**: LOW - Requires data to be meaningful

**Why Last**: 
- Dashboard needs data from employees, projects, tasks
- Analytics are only useful when there's data to analyze

### Use Cases

1. **UC-DB-001: View Dashboard Metrics**
   - **Use Case**: [`docs/use-cases/UC-DB-001.md`](./use-cases/UC-DB-001.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/dashboard-metrics-flow.puml`](./diagrams/sequence/dashboard-metrics-flow.puml)
   - **Dependencies**: 
     - Phase 4 (Employee data)
     - Phase 5 (Project data)
     - Phase 6 (Task data)
   - **Why First**: Aggregate metrics from all entities

2. **UC-DB-002: View Employee Growth Chart**
   - **Use Case**: [`docs/use-cases/UC-DB-002.md`](./use-cases/UC-DB-002.md)
   - **Sequence Diagram**: [`docs/diagrams/sequence/employee-growth-chart-flow.puml`](./diagrams/sequence/employee-growth-chart-flow.puml)
   - **Dependencies**: Phase 4 (Need employee data with dates)
   - **Why Second**: Time series analysis of employee data

**Phase 8 Checklist**:
- [ ] Dashboard facade pattern
- [ ] Metric calculation strategies
- [ ] Role-based metric filtering
- [ ] Time series aggregation
- [ ] Growth rate calculations
- [ ] Chart data preparation

---

## Implementation Summary

### Quick Reference Table

| Phase | Category | Use Cases | Dependencies |
|-------|----------|-----------|--------------|
| 1 | Authentication | 4 | None |
| 2 | Location | 4 | Phase 1 |
| 3 | Department | 4 | Phase 1, Phase 2 |
| 4 | Employee | 8 | Phase 1, Phase 2, Phase 3 |
| 5 | Project | 7 | Phase 1, Phase 3, Phase 4 |
| 6 | Task | 5 | Phase 1, Phase 4, Phase 5 |
| 7 | Search | 2 | Phase 3, Phase 4 |
| 8 | Dashboard | 2 | Phase 4, Phase 5, Phase 6 |

**Total**: 36 use cases across 8 phases

---

## Critical Path

The **minimum viable path** to create an employee:

```
Phase 1: Authentication (UC-AU-001, UC-AU-003)
    ↓
Phase 2: Location (UC-LM-001)
    ↓
Phase 3: Department (UC-DM-001)
    ↓
Phase 4: Employee (UC-EM-001)
```

**This is the absolute minimum** - you cannot create an employee without:
1. Being able to log in
2. Having at least one location
3. Having at least one department

---

## Notes

### Optional Dependencies (Can be implemented later)

- **Department Head Assignment** (UC-DM-001): Optional - can create department without head, assign later
- **Employee Manager Assignment** (UC-EM-001): Optional - can create employee without manager, assign later
- **Task Employee Assignment** (UC-TM-001): Optional - can create task without assignment, assign later

### Circular Dependencies (Handle Carefully)

- **Department Head**: Department can have an employee as head, but employee needs department
  - **Solution**: Create department without head first, then assign head after employee exists

- **Employee Manager**: Employee can have a manager, but manager is also an employee
  - **Solution**: Create employee without manager first, then assign manager after

---

## Testing Strategy

For each phase, test:
1. **Happy Path**: All main flows work correctly
2. **Dependencies**: Preconditions are enforced
3. **RBAC**: Role-based access control works
4. **Validation**: Business rules are enforced
5. **Error Handling**: Error conditions are handled gracefully

---

## Progress Tracking

Use this checklist to track implementation:

- [ ] **Phase 1**: Authentication & Security (4/4)
- [ ] **Phase 2**: Location Management (4/4)
- [ ] **Phase 3**: Department Management (4/4)
- [ ] **Phase 4**: Employee Management (8/8)
- [ ] **Phase 5**: Project Management (7/7)
- [ ] **Phase 6**: Task Management (5/5)
- [ ] **Phase 7**: Search & Discovery (2/2)
- [ ] **Phase 8**: Analytics & Reporting (2/2)

**Total Progress**: 0/36 use cases

---

**Last Updated**: 2024-12-12  
**Status**: Ready for Implementation

