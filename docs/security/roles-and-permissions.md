# Roles and Permissions - Access Control Design

## 1. Overview

The Employee Management System implements **Role-Based Access Control (RBAC)** to ensure that users can only access and modify data appropriate to their role. Each user is assigned one of four roles, each with specific permissions.

## 2. User Roles

### 2.1 System Admin
**Description**: Full system access with all administrative privileges.

**Permissions**:
- ✅ **Full Access**: All CRUD operations on all entities
- ✅ **User Management**: Create, update, delete users and assign roles
- ✅ **System Configuration**: Access to system settings and configuration
- ✅ **Audit Access**: View all audit logs and system events
- ✅ **Data Export**: Export all data in any format
- ✅ **Department Management**: Full access to all departments
- ✅ **Location Management**: Full access to all locations
- ✅ **Employee Management**: Full access to all employees
- ✅ **Project Management**: Full access to all projects
- ✅ **Task Management**: Full access to all tasks
- ✅ **Dashboard**: Access to all dashboard metrics and reports

**Use Cases**:
- System initialization and setup
- User account management
- Global system configuration
- Emergency data access and recovery

---

### 2.2 HR Manager
**Description**: Human Resources management with access to employee and organizational data.

**Permissions**:
- ✅ **Employee Management**: Full CRUD on all employees
  - Create, read, update, delete any employee
  - View all employee information including salary
  - Assign employees to departments and locations
  - Manage employee-manager relationships
- ✅ **Department Management**: Read and update departments
  - View all departments
  - Update department information
  - Assign department heads
  - View department budgets and metrics
- ✅ **Location Management**: Read and update locations
  - View all locations
  - Create and update locations
- ✅ **Project Management**: Read-only access
  - View all projects and project details
  - View project assignments
- ✅ **Task Management**: Read-only access
  - View all tasks
  - View task assignments
- ✅ **Dashboard**: Access to HR-related metrics
  - Employee statistics
  - Department distribution
  - Salary analytics
- ❌ **User Management**: Cannot create or modify users
- ❌ **System Configuration**: No access to system settings

**Use Cases**:
- Employee onboarding and offboarding
- Employee data updates
- Department restructuring
- HR reporting and analytics

---

### 2.3 Department Manager
**Description**: Department-specific management with access to own department's data.

**Permissions**:
- ✅ **Own Department Employees**: Full CRUD on employees in their department
  - View all employees in their department
  - Update employee information (limited fields)
  - Cannot delete employees
  - Cannot modify salary or sensitive information
- ✅ **Own Department**: Read and limited update
  - View own department details
  - Update department description and metrics
  - Cannot modify budget or department head
- ✅ **Own Department Projects**: Full CRUD on projects in their department
  - Create, read, update, delete projects in their department
  - Assign employees to projects
  - Manage project tasks
- ✅ **Own Department Tasks**: Full CRUD on tasks in their department's projects
  - Create, read, update, delete tasks
  - Assign tasks to employees
  - Update task status and priority
- ✅ **Dashboard**: Access to department-specific metrics
  - Own department statistics
  - Own department project status
  - Own department employee metrics
- ❌ **Other Departments**: Read-only access to other departments
- ❌ **Employee Management**: Cannot create or delete employees
- ❌ **Location Management**: Read-only access
- ❌ **User Management**: No access

**Use Cases**:
- Managing department projects and tasks
- Monitoring department performance
- Assigning employees to projects
- Department-level reporting

---

### 2.4 Employee
**Description**: Standard employee with limited read access to own data and assigned projects.

**Permissions**:
- ✅ **Own Profile**: Read and limited update
  - View own employee record
  - Update personal information (phone, address)
  - Cannot modify salary, designation, or department
- ✅ **Own Projects**: Read-only access
  - View projects they are assigned to
  - View project details and status
- ✅ **Own Tasks**: Read and update assigned tasks
  - View tasks assigned to them
  - Update task status and progress
  - Update task completion date
  - Cannot delete tasks
- ✅ **Own Department**: Read-only access
  - View own department information
  - View department employees (names and designations only)
- ✅ **Dashboard**: Limited access
  - View own task statistics
  - View own project assignments
- ❌ **Other Employees**: No access to other employee records
- ❌ **Project Management**: Cannot create or modify projects
- ❌ **Task Management**: Cannot create or assign tasks
- ❌ **Department Management**: No access
- ❌ **Location Management**: No access

**Use Cases**:
- Viewing own information
- Updating personal details
- Tracking assigned tasks
- Viewing project assignments

---

## 3. Permission Matrix

### 3.1 Employee Module

| Operation | System Admin | HR Manager | Department Manager | Employee |
|-----------|--------------|------------|-------------------|----------|
| **View All Employees** | ✅ | ✅ | ❌ | ❌ |
| **View Own Department Employees** | ✅ | ✅ | ✅ | ❌ |
| **View Own Profile** | ✅ | ✅ | ✅ | ✅ |
| **Create Employee** | ✅ | ✅ | ❌ | ❌ |
| **Update Any Employee** | ✅ | ✅ | ❌ | ❌ |
| **Update Own Department Employees** | ✅ | ✅ | ✅ (limited) | ❌ |
| **Update Own Profile** | ✅ | ✅ | ✅ | ✅ (limited) |
| **Delete Employee** | ✅ | ✅ | ❌ | ❌ |
| **View Salary** | ✅ | ✅ | ❌ | ❌ |

### 3.2 Department Module

| Operation | System Admin | HR Manager | Department Manager | Employee |
|-----------|--------------|------------|-------------------|----------|
| **View All Departments** | ✅ | ✅ | ✅ | ❌ |
| **View Own Department** | ✅ | ✅ | ✅ | ✅ |
| **Create Department** | ✅ | ❌ | ❌ | ❌ |
| **Update Any Department** | ✅ | ✅ | ❌ | ❌ |
| **Update Own Department** | ✅ | ✅ | ✅ (limited) | ❌ |
| **Delete Department** | ✅ | ❌ | ❌ | ❌ |
| **View Budget** | ✅ | ✅ | ❌ | ❌ |

### 3.3 Location Module

| Operation | System Admin | HR Manager | Department Manager | Employee |
|-----------|--------------|------------|-------------------|----------|
| **View All Locations** | ✅ | ✅ | ✅ | ❌ |
| **Create Location** | ✅ | ✅ | ❌ | ❌ |
| **Update Location** | ✅ | ✅ | ❌ | ❌ |
| **Delete Location** | ✅ | ❌ | ❌ | ❌ |

### 3.4 Project Module

| Operation | System Admin | HR Manager | Department Manager | Employee |
|-----------|--------------|------------|-------------------|----------|
| **View All Projects** | ✅ | ✅ | ✅ | ❌ |
| **View Own Department Projects** | ✅ | ✅ | ✅ | ❌ |
| **View Assigned Projects** | ✅ | ✅ | ✅ | ✅ |
| **Create Project** | ✅ | ❌ | ✅ (own dept) | ❌ |
| **Update Any Project** | ✅ | ❌ | ❌ | ❌ |
| **Update Own Department Projects** | ✅ | ❌ | ✅ | ❌ |
| **Delete Project** | ✅ | ❌ | ✅ (own dept) | ❌ |

### 3.5 Task Module

| Operation | System Admin | HR Manager | Department Manager | Employee |
|-----------|--------------|------------|-------------------|----------|
| **View All Tasks** | ✅ | ✅ | ✅ | ❌ |
| **View Own Department Tasks** | ✅ | ✅ | ✅ | ❌ |
| **View Assigned Tasks** | ✅ | ✅ | ✅ | ✅ |
| **Create Task** | ✅ | ❌ | ✅ (own dept) | ❌ |
| **Update Any Task** | ✅ | ❌ | ❌ | ❌ |
| **Update Own Department Tasks** | ✅ | ❌ | ✅ | ❌ |
| **Update Assigned Tasks** | ✅ | ❌ | ✅ | ✅ (status only) |
| **Delete Task** | ✅ | ❌ | ✅ (own dept) | ❌ |

### 3.6 Dashboard Module

| Operation | System Admin | HR Manager | Department Manager | Employee |
|-----------|--------------|------------|-------------------|----------|
| **View All Metrics** | ✅ | ✅ | ❌ | ❌ |
| **View HR Metrics** | ✅ | ✅ | ❌ | ❌ |
| **View Department Metrics** | ✅ | ✅ | ✅ | ❌ |
| **View Own Metrics** | ✅ | ✅ | ✅ | ✅ |

### 3.7 User Management

| Operation | System Admin | HR Manager | Department Manager | Employee |
|-----------|--------------|------------|-------------------|----------|
| **View All Users** | ✅ | ❌ | ❌ | ❌ |
| **Create User** | ✅ | ❌ | ❌ | ❌ |
| **Update User** | ✅ | ❌ | ❌ | ❌ |
| **Delete User** | ✅ | ❌ | ❌ | ❌ |
| **Assign Roles** | ✅ | ❌ | ❌ | ❌ |

---

## 4. Implementation Details

### 4.1 Role Storage
- **Database**: `users` table with `role` column
- **Values**: `SYSTEM_ADMIN`, `HR_MANAGER`, `DEPARTMENT_MANAGER`, `EMPLOYEE`
- **JWT Token**: Role included in JWT claims for authorization

### 4.2 Authorization Checks
- **Method-Level Security**: `@PreAuthorize` annotations on service methods
- **Controller-Level Security**: Role-based endpoint access
- **Frontend Route Guards**: Angular route guards for UI access control

### 4.3 Department Manager Scope
- Department Manager's department is determined by:
  - `user.employee.department` relationship
  - Must have linked employee record
  - Department assignment validated on login

### 4.4 Permission Enforcement Points
1. **API Endpoints**: Spring Security interceptors
2. **Service Layer**: Method-level authorization
3. **Repository Layer**: Query filtering based on role
4. **Frontend**: Route guards and UI element visibility

---

## 5. Security Considerations

### 5.1 Principle of Least Privilege
- Each role has minimum required permissions
- No role has unnecessary access
- Escalation requires explicit role assignment

### 5.2 Data Isolation
- Department Managers can only access their department's data
- Employees can only access their own data
- Cross-department access requires higher privileges

### 5.3 Audit Trail
- All access attempts logged
- Role changes tracked
- Permission violations recorded

---

## 6. Future Enhancements

### 6.1 Fine-Grained Permissions
- Permission-based access control (PBAC) in addition to RBAC
- Custom permission sets per user
- Feature-level permissions

### 6.2 Department Hierarchy
- Support for nested departments
- Hierarchical permission inheritance
- Multi-level department management

### 6.3 Temporary Permissions
- Time-limited access grants
- Project-based temporary roles
- Delegation of authority

---

**Status**: Design Complete  
**Last Updated**: 2024-12-11  
**Version**: 1.0

