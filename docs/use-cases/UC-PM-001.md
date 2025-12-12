# UC-PM-001: Create Project

## Use Case Information

- **Use Case ID**: UC-PM-001
- **Title**: Create Project
- **Category**: Project Management
- **Priority**: High
- **Status**: Active

---

## Actor(s)

- **Department Manager** (`DEPARTMENT_MANAGER`)
- **System Administrator** (`SYSTEM_ADMIN`)

**Role Requirements**:
- User must be authenticated
- User must have `DEPARTMENT_MANAGER` or `SYSTEM_ADMIN` role
- Authorization enforced via `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('DEPARTMENT_MANAGER'))`

---

## Preconditions

1. User must be authenticated and logged in
2. User must have appropriate role
3. **Department must exist** in the system
4. **Project Manager must exist** in the system (must be an employee)

---

## Main Flow

1. **Navigation**: Actor navigates to Project Management page
   - Actor clicks on "Projects" in navigation menu
   - System displays Project Management page

2. **Initiate Creation**: Actor clicks "Add Project" button
   - System displays project creation form
   - Form includes fields: name, description, startDate, budget, departmentId, projectManagerId

3. **Fill Project Details**: Actor fills in project information
   - **Required Fields**:
     - Name (String, 1-100 characters)
     - Description (String, max 500 characters)
     - Start Date (LocalDate, not null)
     - Budget (Double, >= 0)
     - Department (UUID, must exist)
     - Project Manager (UUID, employee ID, must exist)

4. **Select Department**: Actor selects department from dropdown
   - System validates department exists
   - **Department Manager**: Can only select their own department
   - **System Admin**: Can select any department

5. **Select Project Manager**: Actor selects project manager from dropdown
   - System validates employee exists
   - System displays employee details

6. **Submit Form**: Actor clicks "Create Project" button
   - System validates input
   - System creates project record
   - System displays success message

---

## Alternative Flows

### 5a. Validation Fails
- **Trigger**: Validation fails
- **Flow**:
  1. System validates input data
  2. System detects validation errors
  3. System returns HTTP 400 Bad Request
  4. Frontend displays error messages
  5. Actor corrects errors

### 5b. Department Not Found
- **Trigger**: Department does not exist
- **Flow**:
  1. System validates department
  2. System finds no department with given ID
  3. System returns HTTP 404 Not Found
  4. Frontend displays "Department not found" message

---

## Postconditions

### Success Postconditions
- Project record is created in the database
- Project is associated with department and project manager
- Project appears in project list

---

## Business Rules

1. **Department Requirement**: Project must be assigned to a department
2. **Project Manager Requirement**: Project must have a project manager (employee)
3. **Budget Validation**: Budget must be non-negative
4. **Department Manager Constraint**: Department Managers can only create projects in their own department

---

## Related Use Cases

- **UC-PM-002**: View Project List (to see newly created project)
- **UC-PM-003**: Assign Employee to Project (to assign employees after creation)

---

## Technical Notes

### API Endpoint
- **Method**: `POST`
- **Path**: `/api/projects`
- **Request Body**: `ProjectRequestDTO`
- **Response**: `ProjectResponseDTO` (HTTP 201 Created)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('DEPARTMENT_MANAGER'))`

---

**Last Updated**: 2024-12-12  
**Status**: Active

