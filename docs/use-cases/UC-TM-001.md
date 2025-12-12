# UC-TM-001: Create Task

## Use Case Information

- **Use Case ID**: UC-TM-001
- **Title**: Create Task
- **Category**: Task Management
- **Priority**: High
- **Status**: Active

---

## Actor(s)

- **Department Manager** (`DEPARTMENT_MANAGER`)
- **Project Manager** (`PROJECT_MANAGER` - employee assigned as project manager)
- **System Administrator** (`SYSTEM_ADMIN`)

**Role Requirements**:
- User must be authenticated
- User must have appropriate role
- Authorization enforced via `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('DEPARTMENT_MANAGER'))`

---

## Preconditions

1. User must be authenticated and logged in
2. User must have appropriate role
3. **Project must exist** in the system
4. If assigning task to employee, the employee must exist

---

## Main Flow

1. **Navigate to Project Details**: Actor navigates to project details page
   - Actor views project list (UC-PM-002)
   - Actor clicks on project to view details
   - System displays project details

2. **Initiate Task Creation**: Actor clicks "Add Task" button
   - System displays task creation form
   - Form includes fields: name, description, priority, dueDate, assignedEmployeeId (optional)

3. **Fill Task Details**: Actor fills in task information
   - **Required Fields**:
     - Name (String, 1-100 characters)
     - Description (String, max 500 characters)
     - Priority (Enum: LOW, MEDIUM, HIGH, CRITICAL)
     - Due Date (LocalDate, not null)
   - **Optional Fields**:
     - Assigned Employee (UUID, employee ID)

4. **Assign Employee (Optional)**: Actor optionally assigns task to employee
   - Actor selects employee from dropdown
   - System validates employee exists

5. **Submit Form**: Actor clicks "Create Task" button
   - System validates input
   - System creates task record
   - System displays success message

---

## Postconditions

### Success Postconditions
- Task record is created in the database
- Task is associated with the project
- If employee was assigned, task is assigned to employee
- Task appears in project's task list

---

## Business Rules

1. **Project Requirement**: Task must be associated with a project
2. **Priority Levels**: Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL
3. **Due Date**: Due date must be in the future (validation rule)

---

## Related Use Cases

- **UC-PM-002**: View Project List (to navigate to project)
- **UC-TM-002**: Update Task Status (to update task after creation)

---

## Technical Notes

### API Endpoint
- **Method**: `POST`
- **Path**: `/api/projects/{projectId}/tasks`
- **Request Body**: `TaskRequestDTO`
- **Response**: `TaskResponseDTO` (HTTP 201 Created)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('DEPARTMENT_MANAGER'))`

---

**Last Updated**: 2024-12-12  
**Status**: Active

